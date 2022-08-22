const express = require("express");
const { signup, login, sendOTP, verifyOTP, updateProfile, changePassword, forgotPassword, resetPassword, getUsers } = require("../controllers/user");
const { validate, signUpValidationRules, signInValidationRules, emailValidationRules } = require("../controllers/validator");
const { handleFormData } = require("../middleware/fileMiddleware");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();


router.route("/signup").post(handleFormData, signUpValidationRules(), validate, signup);
router.post("/login", signInValidationRules(emailValidationRules), validate, login);
router.post("/changePassword", protect, changePassword);
router.post("/forgotPassword", forgotPassword);
router.post("/resetPassword", resetPassword);
router.get("/send/email/otp", protect, sendOTP)
router.get("/", protect, getUsers)
router.post("/verify/email", protect, verifyOTP)
router.put("/profile", handleFormData, protect, updateProfile);
module.exports = router;
