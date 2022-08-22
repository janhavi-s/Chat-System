import { Button, Modal, Form } from 'react-bootstrap'
import { Formik, ErrorMessage } from 'formik'
import * as Yup from 'yup';
import axios from "axios";
import toast from '../../utils/toast';
import { useState } from "react";
import "./ChangePassword.css"
import { ChatState } from '../../Context/ChatProvider';
import { useHistory } from 'react-router-dom';
const ChangePassword = ({ children }) => {
  const history = useHistory();
  const { user, setUser } = ChatState()
  const [modal, setModal] = useState(false);
  const [show, setShow] = useState(false);
  const initialValues = {
    oldPassword: "",
    newPassword: "",
    cNewPassword: ""
  }

  const validationSchema = Yup.object().shape({
    oldPassword: Yup.string().required("Old Password is required"),
    newPassword: Yup.string().required("New Password is required").matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, "Should contain minimum eight characters, at least one uppercase letter, one lowercase letter, one number and one special character"),
    cNewPassword: Yup.string().required("Confirm new password is required").oneOf([Yup.ref('newPassword'), null], 'Passwords and Confirm Password not matching'),
  })

  const onSubmit = async (values, onSubmitProps) => {
    onSubmitProps.setErrors({})
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}`, } };
      const { data } = await axios.post("api/user/changePassword", values, config);
      onSubmitProps.setSubmitting(false)
      toast.success(data.message)
      localStorage.removeItem("userInfo");
      setUser(null);
      history.push("/login");
      setModal(!modal)
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
    <>
      <span onClick={() => setModal(!modal)}>{children}</span>
      <Modal show={modal} onHide={() => setModal(!modal)} centered className="profile">
        <Modal.Header closeButton className="border-bottom-0">
          <Modal.Title as="h4">Change Password</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {
            <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={onSubmit}>
              {({ values, handleChange, handleBlur, handleSubmit, errors, touched }) => (
                <Form onSubmit={handleSubmit} className="user-auth" autoComplete="off">
                  <Form.Group className="mb-4" controlId="name">
                    <Form.Label className="fw-bold">Old Password</Form.Label>
                    <Form.Control type={show ? "text" : "password"} name="oldPassword" placeholder="Enter your old password" value={values.oldPassword} onChange={handleChange} onBlur={handleBlur} className={`${touched.oldPassword && errors.oldPassword ? 'field-error' : ''}`} />
                    <ErrorMessage name="oldPassword" component="small" className="text-danger" />
                  </Form.Group>
                  <Form.Group className="mb-4 toggle position-relative" controlId="name">
                    <Form.Label className="fw-bold">New Password</Form.Label>
                    <Form.Control type={show ? "text" : "password"} name="newPassword" placeholder="Enter your new password" value={values.newPassword} onChange={handleChange} onBlur={handleBlur} className={`${touched.newPassword && errors.newPassword ? 'field-error' : ''}`} />
                    {
                      show
                        ?
                        <i className="fa fa-fw fa-eye" onClick={() => setShow(!show)}></i>
                        :
                        <i className="fa fa-fw fa-eye-slash" onClick={() => setShow(!show)}></i>
                    }
                    <ErrorMessage name="newPassword" component="small" className="text-danger" />
                  </Form.Group>
                  <Form.Group className="mb-4" controlId="name">
                    <Form.Label className="fw-bold">Confirm New Password</Form.Label>
                    <Form.Control type={show ? "text" : "password"} name="cNewPassword" placeholder="Enter your old password" value={values.cNewPassword} onChange={handleChange} onBlur={handleBlur} className={`${touched.cNewPassword && errors.cNewPassword ? 'field-error' : ''}`} />
                    <ErrorMessage name="cNewPassword" component="small" className="text-danger" />
                  </Form.Group>
                  <Button type="submit" variant="primary" className="d-block mx-auto mb-3">
                    Change
                  </Button>
                </Form>
              )}
            </Formik>
          }
        </Modal.Body>
      </Modal>
    </>
  );
};

export default ChangePassword;
