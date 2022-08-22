const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const chatModel = mongoose.Schema(
  {
    chatName: { type: String, trim: true },
    isGroupChat: { type: Boolean, default: false },
    description: { type: String, default: "" },
    // groupPassword: { type: String, default: null },
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    latestMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    groupPic: {
      type: "String",
    },
    groupAdmin: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// chatModel.virtual("password")
//   .set(function (password) {
//     this._password = password
//     this.groupPassword = this.securePassword(this._password)
//   })

// chatModel.methods = {
//   securePassword: function (plainPassword) {
//     if (!plainPassword) return ""
//     try {
//       const salt = bcrypt.genSaltSync(10);
//       return bcrypt.hashSync(plainPassword, salt);
//     } catch (err) {
//       return ""
//     }
//   },
//   matchPassword: function (enteredPassword) {
//     return bcrypt.compareSync(enteredPassword, this.groupPassword);
//   }
// }

const Chat = mongoose.model("Chat", chatModel);

module.exports = Chat;
