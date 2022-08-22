import { toast } from 'react-toastify';

const customToast = {
    success: (msg, options = {}) => {
        return toast(msg, {
            ...options,
            className: 'toast-success',
            type: toast.TYPE.SUCCESS,
        });
    },
    error: (msg, options = {}) => {
        return toast(msg, {
            ...options,
            className: 'toast-error',
            type: toast.TYPE.ERROR,
        });
    },
    info: (msg, options = {}) => {
        return toast(msg, {
            ...options,
            className: 'toast-info',
            type: toast.TYPE.INFO,
        });
    },
};


export default customToast;