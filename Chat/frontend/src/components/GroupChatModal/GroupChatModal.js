import { useState } from "react";
import { Formik, ErrorMessage, FieldArray } from 'formik'
import { Button, Form, Modal, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { jsonToFormdata, handleFileChange } from '../../utils/util';
import * as Yup from 'yup';
import UserBadgeItem from "../UserBadgeItem/UserBadgeItem";
import UserListItem from "../UserListItem/UserListItem";
import toast from '../../utils/toast';
import { ChatState } from "../../Context/ChatProvider";
import axios from "axios";
const GroupChatModal = ({ children }) => {
  const [groupPic, setGroupPic] = useState("");
  const [modal, setModal] = useState(false);
  const [search, setSearch] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchResult, setSearchResult] = useState([]);
  const { user, chats, setChats } = ChatState();
  const initialValues = {
    groupChatName: "",
    description: "",
    users: [],
    groupPic: ""
  }

  const validationSchema = Yup.object({
    groupChatName: Yup.string().required("Name is required").matches(/^[A-Za-z0-9\s]+$/, "Should contain only alphabets and digits").min(3, `Should contain atleast 3 alphabets`).max(20, 'Should not exceed 20 alphabets'),
    description: Yup.string().required("Description is required").matches(/^[A-Za-z0-9\s]+$/, "Should contain only alphabets and digits").min(3, `Should contain atleast 3 alphabets`).max(50, 'Should not exceed 50 alphabets'),
  })

  const handleGroup = (push, userToAdd, users) => {
    if (users.some(user => user._id === userToAdd._id)) {
      toast.error("User already added");
      return;
    }
    push(userToAdd);
  };

  const handleSearch = async (query) => {
    setSearch(query);
    if (!query) {
      setSearchResult([])
      return;
    }

    try {
      setLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await axios.get(`/api/user?search=${search}`, config);
      setLoading(false);
      setSearchResult(data);
    } catch (error) {
      toast.error("Failed to Load the Search Results");
    }
  };
  const onSubmit = async (values, onSubmitProps) => {
    onSubmitProps.setErrors({})
    if (!values.users) {
      toast.error("Please select group members");
      return;
    }
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const formdata = jsonToFormdata(values)
      const { data } = await axios.post(`/api/chat/group`, formdata, config);
      setChats([data, ...chats]);
      setModal(!modal)
      setSearch("")
      setSearchResult([])
      toast.success("New Group Chat Created!");
      onSubmitProps.setSubmitting(false)
    } catch (error) {
      toast.error(error.response.data.message);
      onSubmitProps.setSubmitting(false)
    }
  };
  const closeModal = () => {
    setModal(!modal);
    setSearch("");
    setSearchResult([])
  }
  return (
    <>
      <span onClick={() => setModal(!modal)}>{children}</span>
      <Modal className="group-chat" show={modal} onHide={closeModal} backdrop="static" centered>
        <Modal.Header closeButton className="border-bottom-0">
          <Modal.Title as="h4">Create Group</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={onSubmit}>
            {({ values, handleChange, handleBlur, handleSubmit, errors, touched, setFieldValue, setFieldTouched }) => (
              <Form onSubmit={handleSubmit} autoComplete="off">
                <Form.Group controlId="formFile" className="mb-4-5 text-center">
                  <OverlayTrigger placement="right" overlay={<Tooltip id="button-tooltip" delay={{ show: 250, hide: 400 }} >Choose Group Pic.</Tooltip>}>
                    <div className="input-img-container mb-1 mx-auto">
                      <i className="fas fa-camera"></i>
                      <img src={groupPic && !errors.groupPic ? groupPic : "https://cdn2.iconfinder.com/data/icons/people-groups/512/Group_Woman-512.png"} alt="Profile Pic" className="input-img w-100 h-100" />
                      <Form.Control className="stretch-element w-100 h-100" type="file" name="groupPic" onChange={handleFileChange("groupPic", setGroupPic, setFieldValue, setFieldTouched)} />
                    </div>
                  </OverlayTrigger>
                  <ErrorMessage name="pic" className="text-danger" component="small" />
                </Form.Group>
                <div className="mb-3">
                  <Form.Control type="text" name="groupChatName" value={values.groupChatName} onChange={handleChange} onBlur={handleBlur} className={`${touched.groupChatName && errors.groupChatName ? 'field-error' : ''}`} placeholder="Group Name" />
                  <ErrorMessage name="groupChatName" component="small" className="text-danger" />
                </div>
                <div className="mb-3">
                  <Form.Control type="text" name="description" value={values.description} onChange={handleChange} onBlur={handleBlur} className={`${touched.description && errors.description ? 'field-error' : ''}`} placeholder="Group Description" />
                  <ErrorMessage name="description" component="small" className="text-danger" />
                </div>
                <Form.Control type="text" value={search} onChange={(e) => handleSearch(e.target.value)} placeholder="Search Users" />
                {loading ? (
                  <div>Loading...</div>
                ) : (

                  <FieldArray name="users">
                    {
                      (fieldArrayProps) => {
                        const { push, form } = fieldArrayProps
                        const { users } = form.values
                        return (
                          searchResult.length > 0 && <div className="p-2 shadow-sm">
                            {searchResult?.slice(0, 4).map((user) => (
                              <UserListItem
                                key={user._id}
                                user={user}
                                handleFunction={() => { handleGroup(push, user, users) }}
                              />
                            ))}
                          </div>
                        )
                      }
                    }
                  </FieldArray>

                )}
                <FieldArray name="users">
                  {
                    (fieldArrayProps) => {
                      const { remove, form } = fieldArrayProps
                      const { users } = form.values
                      return (
                        <div className="mt-3">
                          {users.length > 0 && users.map((u, index) => (
                            <UserBadgeItem
                              key={u._id}
                              user={u}
                              handleFunction={() => remove(index)}
                            />
                          ))}
                        </div>
                      )
                    }
                  }
                </FieldArray>
                <Modal.Footer className="border-top-0 justify-content-center">
                  <Button variant="primary" type="submit">
                    Create Group
                  </Button>
                </Modal.Footer>
              </Form>
            )}
          </Formik>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default GroupChatModal;
