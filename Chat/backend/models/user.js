const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    description: { type: String, default: "Hey! I am using Chat." },
    encryptedPassword: { type: String, required: true },
    pic: {
      type: String,
      required: true
    },
    isAdmin: {
      type: Boolean,
      required: true,
      default: false,
    },
    isAccountVerified: {
      type: Boolean,
      default: false,
    },
    otp: Number,
    otpExpiryTime: Date,
  },
  { timestaps: true }
);

userSchema.virtual("password")
  .set(function (password) {
    this._password = password
    this.encryptedPassword = this.securePassword(this._password)
  })

userSchema.methods = {
  securePassword: function (plainPassword) {
    if (!plainPassword) return ""
    try {
      const salt = bcrypt.genSaltSync(10);
      return bcrypt.hashSync(plainPassword, salt);
    } catch (err) {
      return ""
    }
  },
  matchPassword: function (enteredPassword) {
    return bcrypt.compareSync(enteredPassword, this.encryptedPassword);
  }
}


const User = mongoose.model("User", userSchema);

module.exports = User;
