import { Button, ButtonGroup, Dropdown, Form, Modal, OverlayTrigger, Tooltip } from 'react-bootstrap'
import axios from "axios";
import { useState, useEffect } from "react";
import { ChatState } from "../../Context/ChatProvider";
import UserBadgeItem from "../UserBadgeItem/UserBadgeItem";
import UserListItem from "../UserListItem/UserListItem";
import { jsonToFormdata, handleFileChange } from '../../utils/util';
import toast from '../../utils/toast';
import { Formik, ErrorMessage, FieldArray } from 'formik'
import "./UpdateGroupChatModal.css"
import * as Yup from 'yup';

const UpdateGroupChatModal = ({ fetchMessages, fetchAgain, setFetchAgain }) => {
  const { selectedChat, setSelectedChat, user } = ChatState();
  const [groupPic, setGroupPic] = useState(selectedChat.groupPic || "");
  const { groupAdmin } = selectedChat
  const [modal, setModal] = useState(false);
  const [addParticipantModal, setAddParticipantModal] = useState(false);
  const [show, setShow] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [searchResult, setSearchResult] = useState([]);

  const groupDetailsInitialValues = {
    groupChatName: "",
    description: "",
    users: [],
    groupPic: "",
  }

  const groupDetailsFormValues = {
    groupChatName: selectedChat.chatName,
    description: selectedChat.description,
    users: selectedChat.users || [],
    groupPic: "",
  }

  const groupDetailsValidationSchema = Yup.object({
    groupChatName: Yup.string().required("Name is required").matches(/^[A-Za-z1-9\s]+$/, "Should contain only alphabets and digits").min(3, `Should contain atleast 3 alphabets`).max(20, 'Should not exceed 20 alphabets'),
    description: Yup.string().required("Description is required").matches(/^[A-Za-z1-9\s]+$/, "Should contain only alphabets and digits").min(3, `Should contain atleast 3 alphabets`).max(50, 'Should not exceed 50 alphabets'),
  })

  const searchParticipants = async (query, setFieldValue) => {
    if (!query) {
      setFieldValue("users", selectedChat.users)
      return
    }
    const filteredParticipants = selectedChat.users.filter(user => user.name.toLowerCase().includes(query.toLowerCase()))
    console.log(filteredParticipants);
    setFieldValue("users", filteredParticipants)
  };

  const groupDetailsSubmit = async (values, onSubmitProps) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const formdata = jsonToFormdata({ ...values, chatId: selectedChat._id })
      const { data } = await axios.put(
        `/api/chat/rename`,
        formdata,
        config
      );
      // setSelectedChat("");
      setSelectedChat(data);
      setFetchAgain(!fetchAgain);
      setModal(false)
      toast.success("Group details updated successfully");

    } catch (error) {
      toast.error(error.response.data.message);
    }
  };

  const participantInitialValues = { users: [] }

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
      const { data } = await axios.get(`/api/user?search=${query}`, config);
      setLoading(false);
      setSearchResult(data);
    } catch (error) {
      toast.error("Failed to Load the Search Results");
      setLoading(false);
    }
  };

  const addParticipants = async (values, onSubmitProps) => {
    if (values.users.length < 1) {
      toast.error("Please select the participants to be added");
      return;
    }
    const newParticipantsId = values.users.map(user => user._id)
    const existingParticipantsId = selectedChat.users.map(user => user._id)
    if (existingParticipantsId.find((id) => newParticipantsId.includes(id))) {
      toast.error("User Already in group!");
      return;
    }

    if (selectedChat.groupAdmin._id !== user._id) {
      toast.error("Only admins can add someone!");
      return;
    }

    try {
      setLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await axios.put(
        `/api/chat/groupadd`,
        {
          chatId: selectedChat._id,
          users: newParticipantsId,
        },
        config
      );
      onSubmitProps.resetForm()
      toast.success("Participants added successfully");
      setSelectedChat(data);
      setFetchAgain(!fetchAgain);
      setLoading(false);
      setSearchResult([])
      setAddParticipantModal(false)
    } catch (error) {
      toast.error(error.response.data.message);
      setLoading(false);
    }
  };

  const handleGroup = (push, userToAdd, users) => {
    if (users.some(user => user._id === userToAdd._id) || selectedChat.users.some(user => user._id === userToAdd._id)) {
      toast.error("Already added to group");
      return;
    }
    push(userToAdd);
  };

  const handleRemove = async (user1, type) => {
    if (selectedChat.groupAdmin._id !== user._id && user1._id !== user._id) {
      toast.error("Only admins can remove someone!");
      return;
    }

    try {
      setLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await axios.put(
        `/api/chat/groupremove`,
        {
          chatId: selectedChat._id,
          userId: user1._id,
          type
        },
        config
      );
      user1._id === user._id ? setSelectedChat(null) : setSelectedChat(data);
      setFetchAgain(prev => !prev);
      fetchMessages();
      setLoading(false);
    } catch (error) {
      toast.error(error.response.data.message);
      setLoading(false);
    }
  };

  const closeParticipantModal = () => {
    setAddParticipantModal(!addParticipantModal)
    setSearch("");
    setSearchResult([])
  }

  return (
    <>
      <Dropdown as={ButtonGroup} className="d-flex">
        <p className="mb-0 flex-grow-1">{selectedChat.chatName}</p>

        <Dropdown.Toggle className='dot flex-grow-0 minw-auto bg-transparent' />

        <Dropdown.Menu>
          <Dropdown.Item onClick={() => setModal(!modal)}>Group Details</Dropdown.Item>
          {groupAdmin._id === user._id && <Dropdown.Item onClick={() => setAddParticipantModal(!modal)}>Add Participant</Dropdown.Item>}
        </Dropdown.Menu>
      </Dropdown>
      <Modal className="groupDetails" show={modal} onHide={() => setModal(!modal)} backdrop="static" centered>
        <Modal.Header closeButton className="border-bottom-0">
          <Modal.Title as="h4">Group Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Formik initialValues={groupDetailsFormValues || groupDetailsInitialValues} validationSchema={groupDetailsValidationSchema} onSubmit={groupDetailsSubmit}>
            {({ values, handleChange, handleBlur, handleSubmit, errors, touched, setFieldValue, setFieldTouched }) => (
              <Form onSubmit={handleSubmit} autoComplete="off">
                {groupAdmin._id === user._id ?
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
                  :
                  <div className="input-img-container mb-1 mx-auto">
                    <img src={groupPic && !errors.groupPic ? groupPic : "https://cdn2.iconfinder.com/data/icons/people-groups/512/Group_Woman-512.png"} alt="Profile Pic" className="input-img w-100 h-100" />
                  </div>
                }
                {groupAdmin._id === user._id ?
                  <div className="mb-3">
                    <Form.Control type="text" name="groupChatName" value={values.groupChatName} onChange={handleChange} onBlur={handleBlur} className={`${touched.groupChatName && errors.groupChatName ? 'field-error' : ''}`} placeholder="Group Name" />
                    <ErrorMessage name="groupChatName" component="small" className="text-danger" />
                  </div>
                  :
                  <div className="mb-3">
                    <small className="d-inline-block mb-1">Group Name</small>
                    <div className="mb-3 form-control">{values.groupChatName}</div>
                  </div>
                }

                {groupAdmin._id === user._id ?
                  <div className="mb-3">
                    <Form.Control type="text" name="description" value={values.description} onChange={handleChange} onBlur={handleBlur} className={`${touched.description && errors.description ? 'field-error' : ''}`} placeholder="Group Description" />
                    <ErrorMessage name="description" component="small" className="text-danger" />
                  </div>
                  :
                  <div className="mb-3">
                    <small className="d-inline-block mb-1">Group Description</small>
                    <div className="mb-3 form-control">{values.description}</div>
                  </div>
                }
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
                <h6 className='mt-3 mb-2'>Group Members</h6>
                <Form.Control className="mb-3" type="text" onChange={(e) => searchParticipants(e.target.value, setFieldValue)} placeholder="Search Participants" />
                <FieldArray name="users">
                  {
                    (fieldArrayProps) => {
                      const { remove, form } = fieldArrayProps
                      const { users } = form.values
                      return (
                        <div>
                          {users.length > 0 && users.map((u, index) => (
                            <UserBadgeItem
                              key={u._id}
                              user={u}
                              admin={selectedChat.groupAdmin}
                              handleFunction={() => { remove(index); handleRemove(u, "leave") }}
                            />
                          ))}
                        </div>
                      )
                    }
                  }
                </FieldArray>

                <Modal.Footer className="border-top-0 justify-content-center px-0">
                  {groupAdmin._id === user._id &&
                    (<>
                      <Button type="submit" variant="primary" className="dd-block w-100 minw-auto mb-3">
                        Update
                      </Button>
                      <Button className="bg-transparent text-danger border border-danger d-block w-100 minw-auto mb-3" onClick={() => handleRemove(user, "delete")}>
                        Delete Group
                      </Button>
                    </>)
                  }
                  {groupAdmin._id !== user._id && <Button className="bg-transparent text-danger border border-danger d-block w-100 minw-auto mb-3" onClick={() => handleRemove(user, "leave")}>
                    Leave Group
                  </Button>}
                </Modal.Footer>
              </Form>
            )}
          </Formik>
          {/* <div className="py-2 bg-success">
            <h6 className='text-nowrap'>https://drive.google.com/file/d/14YUnqnJHlvgYHpO7r-2jC0Un1l5OPxGz/view?usp=sharing</h6>
          </div> */}
        </Modal.Body>
      </Modal>
      {groupAdmin._id === user._id &&
        <Modal className="groupDetails" show={addParticipantModal} onHide={closeParticipantModal} backdrop="static" centered>
          <Modal.Header closeButton className="border-bottom-0">
            <Modal.Title as="h4">Add Participant</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Formik initialValues={participantInitialValues} onSubmit={addParticipants}>
              {({ values, handleChange, handleBlur, handleSubmit, errors, touched, setFieldValue, setFieldTouched }) => (
                <Form onSubmit={handleSubmit} autoComplete="off">
                  <Form.Control type="text" onChange={(e) => handleSearch(e.target.value, setFieldValue)} placeholder="Search Users" />
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
                          <div className='mt-3'>
                            {users.length > 0 && users.map((u, index) => (
                              <UserBadgeItem
                                key={u._id}
                                user={u}
                                admin={selectedChat.groupAdmin}
                                handleFunction={() => remove(index)}
                              />
                            ))}
                          </div>
                        )
                      }
                    }
                  </FieldArray>
                  <Modal.Footer className="border-top-0 justify-content-center">
                    {groupAdmin._id === user._id && <Button type="submit" variant="primary" className="minw-auto mb-3">
                      Add
                    </Button>}
                  </Modal.Footer>
                </Form>
              )}
            </Formik>
            {/* <div className="py-2 bg-success">
            <h6 className='text-nowrap'>https://drive.google.com/file/d/14YUnqnJHlvgYHpO7r-2jC0Un1l5OPxGz/view?usp=sharing</h6>
          </div> */}
          </Modal.Body>
        </Modal>}
    </>
  );
};

export default UpdateGroupChatModal;
