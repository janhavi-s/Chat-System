import { Button, Form } from 'react-bootstrap'
import { Formik } from 'formik'
import { Link, Redirect, useHistory } from 'react-router-dom'
import axios from "axios";
import toast from '../../utils/toast';
import { secondsToTime } from '../../utils/util';
import { useState, useEffect } from "react";
import AuthBase from '../AuthBase/AuthBase';
import { ChatState } from "../../Context/ChatProvider";

const Verify = () => {
    const history = useHistory();
    const [show, setShow] = useState(false)
    const [resend, setResend] = useState(false)
    const { user, setUser } = ChatState()
    const [counter, setCounter] = useState(0);
    const initialValues = { otp: "" }
    useEffect(() => {
        const timer = counter > 0 && setInterval(() => setCounter(counter - 1), 1000);
        return () => clearInterval(timer);
    }, [counter]);
    const onSubmit = async (values, onSubmitProps) => {
        try {
            const config = { headers: { "Content-type": "application/json", Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.post("/api/user/verify/email", values, config);
            onSubmitProps.setSubmitting(false)
            toast.success(data.message)
            const userInfo = JSON.parse(localStorage.getItem("userInfo"));
            userInfo.isAccountVerified = true
            localStorage.setItem("userInfo", JSON.stringify(userInfo))
            setUser({ ...user, isAccountVerified: true })
            history.push("/chats");
        } catch (error) {
            toast.error(error.response.data.message)
        }

    };
    const sendOTP = async (resend = false) => {
        try {
            const config = { headers: { "Content-type": "application/json", Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get("/api/user/send/email/otp", config);
            if (!resend) setShow(!show)
            toast.success(data.message)
            setCounter(300)
            setResend(true)
        } catch (error) {
            toast.error(error.response.data.message)
        }
    }

    if (user && user.isAccountVerified) {
        return <Redirect to="/chats" />
    }
    return (
        <AuthBase>
            <Formik initialValues={initialValues} onSubmit={onSubmit}>
                {({ values, handleChange, handleBlur, handleSubmit }) => (
                    <Form onSubmit={handleSubmit} className="user-auth p-4" autoComplete="off">
                        <Link to="/chats"><i className="fas fa-arrow-left mb-4"></i></Link>
                        <h3 className="fs-3 text-center mb-5">Verify your account</h3>
                        <div className='mb-3'>
                            <label className="form-label mb-1">Email</label>
                            <p className="form-control">{user?.email}</p>
                        </div>
                        {resend &&
                            <div className="d-flex align-items-center">
                                <button type="button" className={`btn p-0 minw-auto me-3 bg-transparent ${counter > 0 ? 'text-mute' : 'text-success'}`} disabled={counter > 0} onClick={() => sendOTP(true)}>Resend OTP</button>
                                {counter > 0 && <span>{secondsToTime(counter)}</span>}
                            </div>}
                        {!show && <Button variant="primary" className="my-4 d-block mx-auto" type="button" onClick={() => sendOTP()} disabled={show}>Send OTP</Button>}
                        {show &&
                            <>
                                <Form.Group className="my-3" controlId="name">
                                    <Form.Label className="fw-bold">OTP</Form.Label>
                                    <Form.Control type="text" name="otp" placeholder="Enter OTP" value={values.otp} onChange={handleChange} onBlur={handleBlur} />
                                </Form.Group>
                                <Button variant="primary" className="mt-4 d-block mx-auto" type="submit">Verify</Button>
                            </>
                        }
                    </Form>
                )}
            </Formik>
        </AuthBase >
    );
};

export default Verify;
