import { Button, Form, Tooltip, OverlayTrigger } from 'react-bootstrap'
import { Formik, ErrorMessage } from 'formik'
import { Link, useHistory } from 'react-router-dom'
import * as Yup from 'yup';
import axios from "axios";
import toast from '../../utils/toast';
import { formatBytes, jsonToFormdata, handleFileChange } from '../../utils/util';
import { useState, useEffect } from "react";
import AuthBase from '../AuthBase/AuthBase';
import { ChatState } from "../../Context/ChatProvider";

const Signup = () => {
  const history = useHistory();
  const [pic, setPic] = useState("");
  const [show, setShow] = useState(false);
  const FILE_SIZE = 2097152
  const SUPPORTED_FORMATS = ['jpeg', 'jpg', 'png']
  const { user, setUser } = ChatState()
  useEffect(() => {
    if (user) history.push("/chats")
  }, [user])
  const initialValues = {
    name: "",
    email: "",
    password: "",
    confirm_password: "",
    pic: ""
  }

  const validationSchema = Yup.object().shape({
    name: Yup.string().required("Name is required").matches(/^[A-Za-z]+$/, "Should contain only alphabets").min(3, `Should contain atleast 3 alphabets`).max(20, 'Should not exceed 20 alphabets'),
    email: Yup.string().required("Email is required").email("Invalid email format"),
    password: Yup.string().required("Password is required").matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, "Should contain minimum eight characters, at least one uppercase letter, one lowercase letter, one number and one special character"),
    confirm_password: Yup.string().required("Confirm password is required").oneOf([Yup.ref('password'), null], 'Passwords and Confirm Password not matching'),
    pic: Yup.mixed().nullable().notRequired()
      .when('pic', {
        is: (value) => value && value !== "",
        then: Yup.mixed().test('fileType', `Only ${SUPPORTED_FORMATS.join(", ")} allowed`, value => value && SUPPORTED_FORMATS.includes(value.type?.split("/")[1])).test('fileSize', `File size exceeds ${formatBytes(FILE_SIZE)}`, value => value?.size <= FILE_SIZE)
      })
  }, ["pic", "pic"])

  const onSubmit = async (values, onSubmitProps) => {
    onSubmitProps.setErrors({})
    const formdata = jsonToFormdata(values)
    try {
      const config = { headers: { "Content-type": "application/json" } };
      const { data } = await axios.post("/api/user/signup", formdata, config);
      onSubmitProps.setSubmitting(false)
      toast.success("Registration Successful")
      localStorage.setItem("userInfo", JSON.stringify(data));
      setUser(data)
      history.push("/chats");
    } catch (error) {
      const { data } = error.response
      if (Array.isArray(data.error)) {
        onSubmitProps.setErrors(data.error[0])
      } else {
        toast.error(error.response.data.message)
      }
    }

  };

  return (
    <AuthBase>
      <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={onSubmit}>
        {({ values, handleChange, handleBlur, handleSubmit, errors, touched, isValid, isSubmitting, setFieldTouched, setFieldValue }) => (
          <Form onSubmit={handleSubmit} className="user-auth p-4" autoComplete="off">
            <h3 className="fs-3 text-center mb-5">Get started for free</h3>
            <Form.Group controlId="formFile" className="mb-4 text-center">
              <OverlayTrigger placement="right" overlay={<Tooltip id="button-tooltip" delay={{ show: 250, hide: 400 }} >Choose Profile Pic.</Tooltip>}>
                <div className="input-img-container mb-1 mx-auto">
                  <i className="fas fa-camera"></i>
                  <img src={pic && !errors.pic ? pic : "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg"} alt="Profile Pic" className="input-img w-100 h-100" />
                  <Form.Control className="stretch-element w-100 h-100" type="file" name="pic" onChange={handleFileChange("pic", setPic, setFieldValue, setFieldTouched)} />
                </div>
              </OverlayTrigger>
              <ErrorMessage name="pic" className="text-danger" component="small" />
            </Form.Group>
            <Form.Group className="mb-3" controlId="name">
              <Form.Label className="fw-bold">Name</Form.Label>
              <Form.Control type="text" name="name" placeholder="Enter your name" value={values.name} onChange={handleChange} onBlur={handleBlur} className={`${touched.name && errors.name ? 'field-error' : ''}`} />
              <ErrorMessage name="name" component="small" className="text-danger" />
            </Form.Group>
            <Form.Group className="mb-3" controlId="email">
              <Form.Label className="fw-bold">Email</Form.Label>
              <Form.Control type="email" name="email" placeholder="Enter your email address" value={values.email} onChange={handleChange} onBlur={handleBlur} className={`${touched.email && errors.email ? 'field-error' : ''}`} />
              <ErrorMessage name="email" component="small" className="text-danger" />
            </Form.Group>
            <Form.Group className="mb-3 toggle position-relative" controlId="password">
              <Form.Label className="fw-bold">Password</Form.Label>
              <Form.Control type={show ? "text" : "password"} name="password" placeholder="Enter your password" value={values.password} onChange={handleChange} onBlur={handleBlur} className={`${touched.password && errors.password ? 'field-error' : ''}`} />
              {
                show
                  ?
                  <i className="fa fa-fw fa-eye" onClick={() => setShow(!show)}></i>
                  :
                  <i className="fa fa-fw fa-eye-slash" onClick={() => setShow(!show)}></i>
              }
              <ErrorMessage name="password" component="small" className="text-danger" />
            </Form.Group>
            <Form.Group className="mb-3" controlId="confirm_password">
              <Form.Label className="fw-bold">Confirm Password</Form.Label>
              <Form.Control type={show ? "text" : "password"} name="confirm_password" placeholder="Enter your password again" value={values.confirm_password} onChange={handleChange} onBlur={handleBlur} className={`${touched.confirm_password && errors.confirm_password ? 'field-error' : ''}`} />
              <ErrorMessage name="confirm_password" component="small" className="text-danger" />
            </Form.Group>
            <Form.Text className="text-dark d-block text-center mb-2">
              Already have an account? <Link to="/login" className="text-primary fw-bold">Log In</Link>
            </Form.Text>
            <div className="text-center mt-4">
              <Button variant="primary" type="submit">
                Sign Up
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </AuthBase >
  );
};

export default Signup;
