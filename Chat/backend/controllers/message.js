const asyncHandler = require("express-async-handler");
const Message = require("../models/message");
const User = require("../models/user");
const Chat = require("../models/chat");
const axios = require('axios');
var fs = require('fs');
const { uploadFileToCloudinary } = require("../utils/utils");
//@description     Get all Messages
//@route           GET /api/Message/:chatId
//@access          Protected
const allMessages = asyncHandler(async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "name pic email")
      .populate("chat");
    res.json(messages);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

//@description     Create New Message
//@route           POST /api/Message/
//@access          Protected
const sendMessage = asyncHandler(async (req, res) => {
  const { content, type, chatId } = req.body;
  if (!content || !chatId) {
    return res.sendStatus(400);
  }

  let newMessage = { sender: req.user._id, type, chat: chatId }

  if (["pdf", "image", "doc"].includes(type)) {
    if (content.size > 10485760) {
      res.status(400);
      throw new Error("Maximum allowed file size is 10MB");
    }

    let options = { use_filename: true, folder: "ChatApp/msgFiles", resource_type: "raw" }
    if (!content.mimetype.includes("image/")) {
      options.resource_type = "raw"
    }

    const { status, url } = await uploadFileToCloudinary(content.filepath, options)
    if (!status) {
      res.status(500);
      throw new Error("Unable to send file");
    }
    newMessage.content = { file: { filename: content.originalFilename, filesize: content.size, url } };
  } else {
    newMessage.content = { message: content };
  }

  try {
    let message = await Message.create(newMessage);

    message = await message.populate("sender", "name pic").execPopulate();
    message = await message.populate("chat").execPopulate();
    message = await User.populate(message, {
      path: "chat.users",
      select: "name pic email",
    });

    await Chat.findByIdAndUpdate(req.body.chatId, { latestMessage: message });

    res.json(message);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

const sendFile = asyncHandler(async (req, res) => {
  const { fileId } = req.params;

  if (!fileId) {
    res.status(400);
    throw new Error("Invalid Request");
  }

  try {
    const { content } = await Message.findById(fileId);
    res.json({ url: content.file.url, filename: content.file.filename });

  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

module.exports = { allMessages, sendMessage, sendFile };
