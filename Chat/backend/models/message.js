const mongoose = require("mongoose");

const messageSchema = mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    type: { type: String, trim: true },
    content: {
      message: { type: String, default: null },
      file: {
        filename: { type: String, default: null },
        filesize: { type: String, default: null },
        url: { type: String, default: null }
      },
    },
    chat: { type: mongoose.Schema.Types.ObjectId, ref: "Chat" },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);
module.exports = Message;
