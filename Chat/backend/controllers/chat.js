const asyncHandler = require("express-async-handler");
const Chat = require("../models/chat");
const User = require("../models/user");
const { uploadFileToCloudinary } = require("../utils/utils");

const accessChat = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.sendStatus(400);
  }

  var isChat = await Chat.find({
    isGroupChat: false,
    $and: [
      { users: { $elemMatch: { $eq: req.user._id } } },
      { users: { $elemMatch: { $eq: userId } } },
    ],
  })
    .populate("users", "-password")
    .populate("latestMessage");

  isChat = await User.populate(isChat, {
    path: "latestMessage.sender",
    select: "name pic email description",
  });

  if (isChat.length > 0) {
    res.send(isChat[0]);
  } else {
    const chatData = {
      chatName: "sender",
      isGroupChat: false,
      users: [req.user._id, userId],
      groupPic: null
    };

    try {
      const createdChat = await Chat.create(chatData);
      const FullChat = await Chat.findOne({ _id: createdChat._id }).populate(
        "users",
        "-password"
      );
      res.status(200).json(FullChat);
    } catch (error) {
      res.status(400);
      throw new Error(error.message);
    }
  }
});

//@description     Fetch all chats for a user
//@route           GET /api/chat/
//@access          Protected
const fetchChats = asyncHandler(async (req, res) => {

  try {
    Chat.find({ users: { $elemMatch: { $eq: req.user._id } } })
      .select("-groupPassword")
      .populate("users", "name email pic isAdmin description")
      .populate("groupAdmin", "name email pic isAdmin description")
      .populate("latestMessage")
      .sort({ updatedAt: -1 })
      .then(async (results) => {
        results = await User.populate(results, {
          path: "latestMessage.sender",
          select: "name pic email",
        });
        res.status(200).send(results);
      });
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

//@description     Create New Group Chat
//@route           POST /api/chat/group
//@access          Protected
const createGroupChat = asyncHandler(async (req, res) => {
  let { groupChatName, users, groupPic, description } = req.body
  users = JSON.parse(users)
  if (users.length === 0 || !groupChatName) {
    res.status(400);
    throw new Error("Please Fill all the feilds");
  }
  users.push(req.user);
  if (users.length < 2) {
    return res
      .status(400)
      .send("More than 2 users are required to form a group chat");
  }

  let uploadedFile = { url: "https://cdn2.iconfinder.com/data/icons/people-groups/512/Group_Woman-512.png" }
  if (groupPic) {
    uploadedFile = await uploadFileToCloudinary(groupPic.filepath, { folder: "ChatApp/profiles", use_filename: true })
  }
  try {
    const groupChat = await Chat.create({
      chatName: groupChatName,
      users: users,
      isGroupChat: true,
      description: description,
      groupAdmin: req.user,
      groupPic: uploadedFile.url
    });

    const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    res.status(200).json(fullGroupChat);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

// @desc    Rename Group
// @route   PUT /api/chat/rename
// @access  Protected
const renameGroup = asyncHandler(async (req, res) => {
  const { chatId, groupChatName, description, groupPic } = req.body;
  let uploadedFile = { url: "https://cdn2.iconfinder.com/data/icons/people-groups/512/Group_Woman-512.png" }

  const newValues = { chatName: groupChatName, description: description }
  if (groupPic) {
    uploadedFile = await uploadFileToCloudinary(groupPic.filepath, { folder: "ChatApp/profiles", use_filename: true })
    newValues.groupPic = uploadedFile.url
  }
  const updatedChat = await Chat.findByIdAndUpdate(
    chatId,
    newValues,
    {
      new: true,
    }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!updatedChat) {
    res.status(404);
    throw new Error("Chat Not Found");
  } else {
    res.json(updatedChat);
  }
});

// @desc    Remove user from Group
// @route   PUT /api/chat/groupremove
// @access  Protected
const removeFromGroup = asyncHandler(async (req, res) => {
  const { chatId, userId, type } = req.body;

  // check if the requester is admin
  let removed
  if (type === "leave") {
    removed = await Chat.findByIdAndUpdate(
      chatId,
      {
        $pull: { users: userId },
      },
      {
        new: true,
      }
    )
      .populate("users", "-password")
      .populate("groupAdmin", "-password");
  } else if (type === "delete") {
    removed = await Chat.findByIdAndDelete(chatId)
      .populate("users", "-password")
      .populate("groupAdmin", "-password");
  }


  if (!removed) {
    res.status(404);
    throw new Error("Chat Not Found");
  } else {
    res.json(removed);
  }
});

// @desc    Add user to Group / Leave
// @route   PUT /api/chat/groupadd
// @access  Protected
const addToGroup = asyncHandler(async (req, res) => {
  const { chatId, users } = req.body;

  // check if the requester is admin

  const added = await Chat.findByIdAndUpdate(
    chatId,
    {
      $push: { users },
    },
    {
      new: true,
    }
  )
    .select("-groupPassword")
    .populate("users", "_id name email description isAdmin pic")
    .populate("groupAdmin", "_id name email description isAdmin pic");
  if (!added) {
    res.status(404);
    throw new Error("Chat Not Found");
  } else {
    res.json(added);
  }
});

module.exports = { accessChat, fetchChats, createGroupChat, renameGroup, addToGroup, removeFromGroup };
