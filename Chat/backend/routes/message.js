const express = require("express");
const { allMessages, sendMessage, sendFile } = require("../controllers/message");
const { protect } = require("../middleware/authMiddleware");
const { handleFormData } = require("../middleware/fileMiddleware");

const router = express.Router();

router.route("/:chatId").get(protect, allMessages);
router.route("/").post(handleFormData, protect, sendMessage);
router.route("/file/:fileId").get(protect, sendFile);

module.exports = router;
