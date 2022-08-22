import { Button, Modal, Form, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { Formik, ErrorMessage } from 'formik'
import * as Yup from 'yup';
import axios from "axios";
import toast from '../../utils/toast';
import { formatBytes, jsonToFormdata, handleFileChange } from '../../utils/util';
import { useState } from "react";
import "./ProfileModal.css"
import { ChatState } from '../../Context/ChatProvider';
const ProfileModal = ({ user, children }) => {
  const { user: authUser, setUser } = ChatState()
  const [modal, setModal] = useState(false);
  const [edit, setEdit] = useState(false);
  const [pic, setPic] = useState("");
  const FILE_SIZE = 2097152
  const SUPPORTED_FORMATS = ['jpeg', 'jpg', 'png']
  console.log(user);
  const initialValues = {
    name: "",
    description: "Hey! I am using Chat.",
    pic: ""
  }

  const validationSchema = Yup.object().shape({
    name: Yup.string().required("Name is required").matches(/^[A-Za-z\s]+$/, "Should contain only alphabets").min(3, `Should contain atleast 3 alphabets`).max(20, 'Should not exceed 20 alphabets'),
    description: Yup.string().required("Name is required").matches(/^[A-Za-z\s]+$/, "Should contain only alphabets").min(3, `Should contain atleast 3 alphabets`).max(50, 'Should not exceed 50 alphabets'),
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
      const config = { headers: { Authorization: `Bearer ${user.token}`, } };
      const { data } = await axios.put("api/user/profile", formdata, config);
      onSubmitProps.setSubmitting(false)
      toast.success("Profile updated successfully")
      localStorage.setItem("userInfo", JSON.stringify(data));
      setEdit(!edit)
      setModal(!modal)
      if (authUser._id === user._id) {
        setUser(data)
      }
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
      <Modal show={modal} onHide={() => setModal(!modal)} backdrop="static" centered className="profile">
        <Modal.Header closeButton className="border-bottom-0">
          <Modal.Title as="h4">{edit ? "Update Profile" : "Profile"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {authUser._id === user._id && (!edit ? <Button className="bg-transparent p-0 text-success minw-auto d-block ms-auto mb-3" onClick={() => { setEdit(!edit); setPic(authUser.pic) }}>Edit</Button> : <Button className="bg-transparent p-0 text-success minw-auto d-block ms-auto mb-3" onClick={() => { setEdit(!edit); setPic('') }}>Cancel</Button>)}
          {edit && authUser._id === user._id
            ?
            <Formik initialValues={{ name: user.name, description: user.description } || initialValues} validationSchema={validationSchema} onSubmit={onSubmit}>
              {({ values, handleChange, handleBlur, handleSubmit, errors, touched, isValid, isSubmitting, setFieldTouched, setFieldValue }) => (
                <Form onSubmit={handleSubmit} className="user-auth" autoComplete="off">
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
                  <Form.Group className="mb-4" controlId="name">
                    <Form.Label className="fw-bold">Name</Form.Label>
                    <Form.Control type="text" name="name" placeholder="Enter your name" value={values.name} onChange={handleChange} onBlur={handleBlur} className={`${touched.name && errors.name ? 'field-error' : ''}`} />
                    <ErrorMessage name="name" component="small" className="text-danger" />
                  </Form.Group>
                  <Form.Group className="mb-4" controlId="name">
                    <Form.Label className="fw-bold">Description</Form.Label>
                    <Form.Control type="text" name="description" placeholder="Enter your description" value={values.description} onChange={handleChange} onBlur={handleBlur} className={`${touched.description && errors.description ? 'field-error' : ''}`} />
                    <ErrorMessage name="description" component="small" className="text-danger" />
                  </Form.Group>
                  <Button type="submit" variant="primary" className="d-block mx-auto mb-3">
                    Update
                  </Button>
                </Form>
              )}
            </Formik>
            :
            <>
              <img src={user.pic} className="d-block" alt="Profile pic" />
              <div className='mb-3'>
                <label className="form-label mb-1">Name</label>
                <p className="form-control">{user.name}</p>
              </div>
              <div className='mb-3'>
                <label className="form-label mb-1">Email</label>
                <p className="form-control">{user.email}</p>
              </div>
              <div className='mb-3'>
                <label className="form-label mb-1">Description</label>
                <p className="form-control">{user.description}</p>
              </div>
            </>
          }
        </Modal.Body>
      </Modal>
    </>
  );
};

export default ProfileModal;
