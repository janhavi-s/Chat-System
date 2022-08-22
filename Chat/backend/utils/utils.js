const path = require('path')
const mime = require('mime-types')
const { v4: uuidv4 } = require("uuid");
const sgMail = require('@sendgrid/mail')
const Cryptr = require('cryptr');
const { config } = require('../utils/config')
const axios = require('axios');
const fs = require('fs/promises');
const cloudinary = require('cloudinary').v2
const jwt = require("jsonwebtoken");

const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
exports.sendMail = async (to, subject, body, html) => {
    try {
        sgMail.setApiKey(process.env.SENDGRID_API_KEY)
        const msg = { to, from: 'grocer0604@gmail.com', subject, body, html }
        const status = await sgMail.send(msg)
        return status
    } catch (err) {
        return false
    }
}
exports.sendMessage = async (number, message) => {
    try {
        const status = await axios.get("https://www.fast2sms.com/dev/bulkV2", {
            params: {
                "authorization": process.env.FAST2SMS_API_KEY,
                "message": message,
                "language": "english",
                "route": "q",
                "numbers": number,
            }
        })
        return status
    } catch (err) {
        return false
    }
}
exports.addMinutesToDate = (date) => {
    return new Date(date.getTime() + config.OTP_EXPIRY_TIME * 60000);
}
exports.encode = (data) => {
    const cryptr = new Cryptr(process.env.SECRET_KEY);
    return cryptr.encrypt(data);
}
exports.decode = async (encrypted) => {
    try {
        const cryptr = new Cryptr(process.env.SECRET_KEY);
        const data = cryptr.decrypt(encrypted);
        return JSON.parse(data)
    } catch (error) {
        return false
    }
}
exports.escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}
exports.isFileValid = (file, filetypes, filesize) => {
    const extension = mime.extension(file.mimetype)
    const actualFileSize = file.size
    if (!filetypes.includes(extension)) {
        return ({ status: false, error: `Only ${filetypes.toString()} allowed` })
    } else if (actualFileSize > filesize) {
        return ({ status: false, error: `File size exceeds ${formatBytes(filesize)}` })
    } else {
        return ({ status: true })
    }
}
exports.uploadFile = async (file, reWrite = false, existingFileName = "") => {
    try {
        const fileType = mime.extension(file.mimetype)
        let destPath, fileName
        if (reWrite) {
            destPath = path.join(__dirname, "../uploads") + "/" + existingFileName;
            fileName = existingFileName;
        } else {
            destPath = path.join(__dirname, "../uploads") + "/" + fileName;
            fileName = uuidv4() + "." + fileType;
        }
        const rawData = await fs.readFile(file.filepath);
        await fs.writeFile(destPath, rawData);
        return { status: true, fileName }
    } catch (error) {
        return { status: false, fileName: "" }
    }
}
exports.uploadFileToCloudinary = async (file, options, reWrite = false, existingFileName = "") => {
    try {
        const status = await cloudinary.uploader.upload(file, options)
        return { status: true, url: status.url }
    } catch (error) {
        return { status: false, url: "" }
    }
}
exports.generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};