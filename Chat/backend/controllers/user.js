const asyncHandler = require("express-async-handler");
const User = require("../models/user");
const otpGenerator = require('otp-generator')
const { uploadFileToCloudinary, generateToken, addMinutesToDate, sendMail } = require("../utils/utils");
const { config } = require("../utils/config");

exports.signup = asyncHandler(async (req, res) => {
  const { name, email, password, pic } = req.body;
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  let uploadedFile = { url: "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg" }
  if (pic) {
    uploadedFile = await uploadFileToCloudinary(pic.filepath, { folder: "ChatApp/profiles", use_filename: true })
  }
  const user = await User.create({
    name,
    email,
    password,
    pic: uploadedFile.url,
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      pic: user.pic,
      token: generateToken(user._id),
      isAccountVerified: user.isAccountVerified
    });
  } else {
    res.status(400);
    throw new Error("User not found");
  }
  const subject = "Welcome to Chat"
  const body = `Hi, ${user.name}. Welcome to Chat. You're now a family member of Chat community`
  const html = `
  <h4>Hi, ${user.name}</h4>
  <h4>Welcome to Chat. You're now a family member of Chat community.</h4>
  `
  await sendMail(user.email, subject, body, html)
});
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      name: user.name,
      description: user.description,
      email: user.email,
      isAdmin: user.isAdmin,
      pic: user.pic,
      token: generateToken(user._id),
      isAccountVerified: user.isAccountVerified
    });
  } else {
    res.status(401);
    throw new Error("Invalid Email or Password");
  }
  const subject = "Security Alert"
  const body = `Hi, ${user.name}. We noticed a new sign-in to your Account. If this was you, you don’t need to do anything. If not, we’ll help you secure your account.`
  const html = `
  <h4>Hi, ${user.name}</h4>
  <h4>We noticed a new sign-in to your Account. If this was you, you don’t need to do anything. If not, we’ll help you secure your account.</h4>
  `
  //await sendMail(user.email, subject, body, html)
});
exports.sendOTP = asyncHandler(async (req, res) => {
  const { user } = req
  if (user.isAccountVerified) {
    return res.status(200).json({
      status: true,
      message: "Account already verified",
    })
  }
  const otp = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false });
  const expirationTime = addMinutesToDate(new Date())
  user.otp = otp
  user.otpExpiryTime = expirationTime
  await user.save()
  const subject = "Verify your account"
  const body = `Hi, ${user.name}. Your OTP to verify your account is ${otp} .`
  const html = `
  <h4>Hi, ${user.name}</h4>
  <h4>Your OTP to verify your account is <strong>${otp}</strong>.</h4>
  `
  const status = await sendMail(user.email, subject, body, html)
  if (status[0].statusCode === 202) {
    return res.status(200).json({
      status: true,
      message: "Enter OTP sent to your email.",
    })
  }
  res.status(500);
  throw new Error("Unable to send OTP to Email. Try again later");
});
exports.verifyOTP = asyncHandler(async (req, res) => {
  const { user } = req
  const { otp } = req.body
  if (parseInt(otp) !== user.otp) {
    res.status(400);
    throw new Error("Invalid OTP");
  }
  if (new Date() > new Date(user.otpExpiryTime)) {
    res.status(400);
    throw new Error("OTP expired");
  }
  user.otp = null
  user.otpExpiryTime = null
  user.isAccountVerified = true
  await user.save()
  return res.status(200).json({
    status: true,
    message: "Email verified successfully",
  })
});
exports.updateProfile = asyncHandler(async (req, res) => {
  const { name, description, pic } = req.body;
  const user = await User.findOne({ _id: req.user._id });

  if (!user) {
    res.status(400);
    throw new Error("User doesn't exists");
  }

  let uploadedFile = { url: user.pic }
  if (pic) {
    uploadedFile = await uploadFileToCloudinary(pic.filepath, { folder: "ChatApp/profiles", use_filename: true })
  }
  user.name = name;
  user.description = description;
  user.pic = uploadedFile.url;
  await user.save();
  res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    description: user.description,
    isAdmin: user.isAdmin,
    pic: user.pic,
    token: generateToken(user._id),
    isAccountVerified: user.isAccountVerified
  });
});
exports.changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const { user } = req;
  if (!user.matchPassword(oldPassword)) {
    res.status(401);
    throw new Error("Invalid old password");
  }
  user.password = newPassword
  await user.save();
  const subject = "Password changed"
  const body = `Hi, ${user.name}. Your password has been changed. If not done by you please contact us.`
  const html = `
  <h4>Hi, ${user.name}</h4>
  <h4>Your password has been changed. If not done by you please contact us.</h4>
  `
  await sendMail(user.email, subject, body, html)
  res.status(200).json({
    status: true,
    message: "Password changed successfully"
  });
});
exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email }).select("-password");
  if (!user) {
    res.status(404);
    throw new Error("Email id doesn't exist");
  }
  const otp = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false });
  const expirationTime = addMinutesToDate(new Date())
  user.otp = otp
  user.otpExpiryTime = expirationTime
  await user.save()
  const subject = "Reset Password"
  const body = `Hi, ${user.name}. You have requested to reset your password. Your OTP is ${otp}`
  const html = `
  <h4>Hi, ${user.name}</h4>
  <h4>You have requested to reset your password. Your OTP is <strong>${otp}</strong></h4>
  `
  const status = await sendMail(user.email, subject, body, html)
  if (status[0].statusCode === 202) {
    return res.status(200).json({
      status: true,
      message: "Enter OTP sent to your email.",
    })
  }
  res.status(500);
  throw new Error("Unable to send OTP to Email. Try again later");
});
exports.resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;
  const user = await User.findOne({ email }).select("-password");
  if (!user) {
    res.status(404);
    throw new Error("Email id doesn't exist");
  }
  if (parseInt(otp) !== user.otp) {
    res.status(400);
    throw new Error("Invalid OTP");
  }
  if (new Date() > new Date(user.otpExpiryTime)) {
    res.status(400);
    throw new Error("OTP expired");
  }
  user.otp = null
  user.otpExpiryTime = null
  user.password = newPassword
  await user.save()
  const subject = "Password resetted successfully"
  const body = `Hi, ${user.name}. Your password has been resetted successfully.`
  const html = `
  <h4>Hi, ${user.name}</h4>
  <h4>Your password has been resetted successfully.</h4>
  `
  await sendMail(user.email, subject, body, html)
  return res.status(200).json({
    status: true,
    message: "Password resetted successfully",
  })
});
exports.getUsers = asyncHandler(async (req, res) => {
  const keyword = req.query.search
    ? {
      $or: [
        { name: { $regex: req.query.search, $options: "i" } },
        { email: { $regex: req.query.search, $options: "i" } },
      ],
    }
    : {};

  const users = await User.find(keyword).find({ _id: { $ne: req.user._id } }).select("id name email pic");
  res.send(users);
});
