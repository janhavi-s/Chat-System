export const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export const jsonToFormdata = (values) => {
    const formdata = new FormData()
    Object.keys(values).forEach(key => {
        if (Array.isArray(values[key])) {
            formdata.append(key, JSON.stringify(values[key]))
        } else {
            formdata.append(key, values[key])
        }
    })
    return formdata
}

export const handleFileChange = (key, setFile, setFieldValue, setFieldTouched) => async event => {
    const file = event.target.files[0]
    await setFieldValue(key, event.target.files[0])
    await setFieldTouched(key, true)
    if (file) {
        let reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function (e) {
            setFile(e.target.result)
        }
    } else {
        setFile("")
    }
}

export const secondsToTime = (seconds) => {
    const m = Math.floor(seconds % 3600 / 60).toString().padStart(2, '0'),
        s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

export const isSameSenderMargin = (messages, m, i, userId) => {
    if (messages[i].sender._id === userId) {
        return "auto"
    } else if (m.chat.isGroupChat && messages[i]?.sender._id === messages[i - 1]?.sender._id) {
        return "41px"
    } else {
        return "0"
    }
};

export const isSameSender = (messages, m, i, userId) => {
    if (messages[i]?.sender._id === userId) return true
    return messages[i]?.sender._id === messages[i - 1]?.sender._id
};

export const isLastMessage = (messages, i, userId) => {
    return (
        i === messages.length - 1 &&
        messages[messages.length - 1].sender._id !== userId &&
        messages[messages.length - 1].sender._id
    );
};

export const isSameUser = (messages, m, i) => {
    return i > 0 && messages[i - 1].sender._id === m.sender._id;
};

export const getSender = (loggedUser, users) => {
    let user
    user = users[0]._id === loggedUser._id ? users[1] : users[0];
    return user
};

export const getSenderFull = (loggedUser, users) => {
    return users[0]._id === loggedUser._id ? users[1] : users[0];
};

export const ucFirst = (value) => {
    return value[0].toUpperCase() + value.slice(1).toLowerCase()
}



