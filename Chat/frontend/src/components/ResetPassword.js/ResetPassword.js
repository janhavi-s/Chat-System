import React from 'react'
import { Form, Button } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { Formik, ErrorMessage } from 'formik'
import * as Yup from "yup"
import AuthBase from '../AuthBase/AuthBase'
import { useEffect, useState } from "react";
import axios from "axios";
import toast from '../../utils/toast';
import { useHistory } from "react-router-dom";
import { ChatState } from "../../Context/ChatProvider";

const ResetPassword = () => {
    const [show, setShow] = useState(false);
    const [email, setEmail] = useState(null)
    const [showPassword, setShowPassword] = useState(false);
    const history = useHistory();
    const { user } = ChatState()
    useEffect(() => {
        if (user) history.push("/chats")
    }, [user])
    const initialValues = { email: "" }
    const resetPasswordInitialValues = { otp: "", newPassword: "", confirmPassword: "" }
    const validationSchema = Yup.object({
        email: Yup.string().required("Email is required").email("Invalid email format"),
    })
    const resetPasswordvalidationSchema = Yup.object({
        newPassword: Yup.string().required("Password is required").matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, "Should contain minimum eight characters, at least one uppercase letter, one lowercase letter, one number and one special character"),
        confirmPassword: Yup.string().required("Confirm password is required").oneOf([Yup.ref('newPassword'), null], 'Passwords and Confirm Password not matching'),
    })
    const onSubmit = async (values, onSubmitProps) => {
        try {
            onSubmitProps.setErrors({})
            const config = { headers: { "Content-type": "application/json" } };
            const { data } = await axios.post("/api/user/forgotPassword", values, config);
            onSubmitProps.setSubmitting(false)
            toast.success(data.message);
            onSubmitProps.resetForm()
            setShow(true)
            setEmail(values.email)
        } catch (error) {
            toast.error(error.response.data.message)
        }
    };
    const resetPassword = async (values, onSubmitProps) => {
        try {
            onSubmitProps.setErrors({})
            const config = { headers: { "Content-type": "application/json" } };
            const { data } = await axios.post("/api/user/resetPassword", { ...values, email }, config);
            onSubmitProps.setSubmitting(false)
            setShow(false)
            setEmail(null)
            toast.success(data.message);
            onSubmitProps.resetForm()
            history.push("/login")
        } catch (error) {
            toast.error(error.response.data.message)
        }
    };
    return (
        <AuthBase>
            {!show && <Formik initialValues={initialValues} onSubmit={onSubmit} validationSchema={validationSchema}>
                {({ values, handleSubmit, handleBlur, handleChange, errors, touched }) => (
                    <Form onSubmit={handleSubmit} className="user-auth p-4" autoComplete="off">
                        <h3 className="fs-3 text-center mb-5">Reset Password</h3>
                        <Form.Group className="mb-3" controlId="email">
                            <Form.Label className="fw-bold">Email</Form.Label>
                            <Form.Control type="email" name="email" placeholder="Enter your email address" value={values.email} onChange={handleChange} onBlur={handleBlur} className={`${touched.email && errors.email ? "field-error" : ""}`} />
                            <ErrorMessage name="email" component="small" className="text-danger" />
                        </Form.Group>
                        <Form.Text className="text-dark d-block text-center mb-2">
                            <Link to="/login" className="text-primary fw-bold">Go Back</Link>
                        </Form.Text>
                        <div className="text-center mt-4">
                            <Button variant="primary" type="submit">
                                Submit
                            </Button>
                        </div>
                    </Form>
                )}
            </Formik>}
            {show && <Formik initialValues={resetPasswordInitialValues} onSubmit={resetPassword} validationSchema={resetPasswordvalidationSchema}>
                {({ values, handleSubmit, handleBlur, handleChange, errors, touched }) => (
                    <Form onSubmit={handleSubmit} className="user-auth p-4" autoComplete="off">
                        <Form.Group className="my-3">
                            <Form.Label className="fw-bold">OTP</Form.Label>
                            <Form.Control type="text" name="otp" placeholder="Enter OTP" value={values.otp} onChange={handleChange} onBlur={handleBlur} />
                        </Form.Group>
                        <Form.Group className="mb-3 toggle position-relative" controlId="password">
                            <Form.Label className="fw-bold">Password</Form.Label>
                            <Form.Control type={showPassword ? "text" : "password"} name="newPassword" placeholder="Enter your password" value={values.newPassword} onChange={handleChange} onBlur={handleBlur} className={`${touched.newPassword && errors.newPassword ? 'field-error' : ''}`} />
                            {
                                showPassword
                                    ?
                                    <i className="fa fa-fw fa-eye" onClick={() => setShowPassword(!showPassword)}></i>
                                    :
                                    <i className="fa fa-fw fa-eye-slash" onClick={() => setShowPassword(!showPassword)}></i>
                            }
                            <ErrorMessage name="newPassword" component="small" className="text-danger" />
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="confirm_password">
                            <Form.Label className="fw-bold">Confirm Password</Form.Label>
                            <Form.Control type={showPassword ? "text" : "password"} name="confirmPassword" placeholder="Enter your password again" value={values.confirmPassword} onChange={handleChange} onBlur={handleBlur} className={`${touched.confirmPassword && errors.confirmPassword ? 'field-error' : ''}`} />
                            <ErrorMessage name="confirmPassword" component="small" className="text-danger" />
                        </Form.Group>
                        <Button variant="primary" className="mt-4 d-block mx-auto" type="submit">Reset</Button>
                    </Form>
                )}

            </Formik>}
        </AuthBase>
    )
}

export default ResetPassword