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

const Login = () => {
  const [show, setShow] = useState(false);
  const history = useHistory();
  const { user, setUser } = ChatState()
  useEffect(() => {
    if (user) history.push("/chats")
  }, [user])
  const initialValues = {
    email: "",
    password: ""
  }
  const validationSchema = Yup.object({
    email: Yup.string().required("Email is required").email("Invalid email format"),
    password: Yup.string().required("Password is required")
  })
  const onSubmit = async (values, onSubmitProps) => {
    try {
      onSubmitProps.setErrors({})
      const config = { headers: { "Content-type": "application/json" } };
      const { data } = await axios.post("/api/user/login", values, config);
      onSubmitProps.setSubmitting(false)
      toast.success("Login Successful");
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
      <Formik initialValues={initialValues} onSubmit={onSubmit} validationSchema={validationSchema}>
        {({ values, handleSubmit, handleBlur, handleChange, errors, isValid, isSubmitting, touched }) => (
          <Form onSubmit={handleSubmit} className="user-auth p-4" autoComplete="off">
            <h3 className="fs-3 text-center mb-5">Log In</h3>
            <Form.Group className="mb-3" controlId="email">
              <Form.Label className="fw-bold">Email</Form.Label>
              <Form.Control type="email" name="email" placeholder="Enter your email address" value={values.email} onChange={handleChange} onBlur={handleBlur} className={`${touched.email && errors.email ? "field-error" : ""}`} />
              <ErrorMessage name="email" component="small" className="text-danger" />
            </Form.Group>
            <Form.Group className="mb-3 toggle position-relative" controlId="password">
              <Form.Label className="fw-bold">Password</Form.Label>
              <Form.Control type={show ? "text" : "password"} name="password" placeholder="Enter your password" value={values.password} onChange={handleChange} onBlur={handleBlur} className={`${touched.password && errors.password ? "field-error" : ""}`} />
              {
                show
                  ?
                  <i className="fa fa-fw fa-eye" onClick={() => setShow(!show)}></i>
                  :
                  <i className="fa fa-fw fa-eye-slash" onClick={() => setShow(!show)}></i>
              }
              <ErrorMessage name="password" component="small" className="text-danger" />
            </Form.Group>
            <Form.Text className="text-dark d-block text-center mb-2">
              Don't have an account? <Link to="/signup" className="text-primary fw-bold">Sign Up</Link>
            </Form.Text>
            <Form.Text className="text-dark d-block text-center mb-2">
              <Link to="/forgotPassword" className="text-primary fw-bold">Forgot Password?</Link>
            </Form.Text>
            <div className="text-center mt-4">
              <Button variant="primary" type="submit">
                Log In
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </AuthBase>
  );
};

export default Login;
