const { check, validationResult } = require("express-validator")
const User = require("../models/user")
const { isFileValid } = require("../utils/utils")

const fileValidationRules = (name, message, isRequired, isFileValid, supportedFormat, fileSize) => {
    return check(name)
        .custom(file => {
            if (isRequired && !file) return false
            return true
        })
        .withMessage(message)
        .bail()
        .customSanitizer(file => {
            if (Array.isArray(file)) return file[0]
            return file
        })
        .custom(file => {
            if (file) {
                const isValid = isFileValid(file, supportedFormat, fileSize);
                if (isValid && !isValid.status) throw new Error(isValid.error)
            }
            return true
        })
}
exports.emailValidationRules = () => {
    return [
        check("email")
            .trim()
            .notEmpty()
            .withMessage("Email is required")
            .bail()
            .normalizeEmail()
            .isEmail()
            .withMessage("Invalid Email")
            .custom(async (value, { req }) => {
                let user = await User.findOne({ email: value }).exec()
                if (user === null) {
                    return Promise.reject();
                }
                req.user = user
            })
            .withMessage("Email id doesn't exist")
    ]
}
exports.signUpValidationRules = () => {
    return [
        fileValidationRules("file", "", false, isFileValid, ["jpeg", "jpg", "png"], 2097152),
        check("name")
            .trim()
            .isLength({ min: 3, max: 20 })
            .withMessage("Should be between 3 to 20 alphabets")
            .bail()
            .isAlpha()
            .withMessage("Should contain only alphabets"),
        check("email")
            .trim()
            .notEmpty()
            .withMessage("Email is required")
            .bail()
            .normalizeEmail()
            .isEmail()
            .withMessage("Invalid Email")
            .custom(async value => {
                const user = await User.findOne({ where: { email: value } })
                if (user) {
                    return Promise.reject();
                }
            })
            .withMessage("Email id already exist"),
        check("password")
            .notEmpty()
            .withMessage("Should not be empty")
            .bail()
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
            .withMessage("Should contain minimum eight characters, at least one uppercase letter, one lowercase letter, one number and one special character"),
        check("confirm_password")
            .notEmpty()
            .withMessage("Should not be empty")
            .bail()
            .custom((val, { req }) => {
                if (val !== req.body.password) {
                    throw new Error("Password confirmation does not match password");
                }
                return true
            })
    ]
}
exports.signInValidationRules = (emailValidationRules) => {
    return [
        ...emailValidationRules(),
        check("password")
            .notEmpty()
            .withMessage("Password is required")
    ]
}
exports.otpValidationRules = () => {
    return [
        check("otp")
            .trim()
            .notEmpty()
            .withMessage("Please enter OTP")
            .bail()
            .isNumeric()
            .withMessage("Should contain only digits"),
    ]
}
exports.validate = (req, res, next) => {
    const errors = validationResult(req)
    if (errors.isEmpty()) {
        return next()
    }
    const extractedErrors = [{}];
    errors.array().forEach(err => extractedErrors[0][err.param] = err.msg);

    return res.status(422).json({
        status: false,
        error: extractedErrors,
    })
}