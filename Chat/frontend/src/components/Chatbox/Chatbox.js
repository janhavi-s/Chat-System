import { useState, useEffect, useRef } from "react";
import { Button, Form, Spinner } from 'react-bootstrap'
import ProfileModal from "../ProfileModal/ProfileModal";
import ScrollableChat from "../ScrollableChat/ScrollableChat";
import UpdateGroupChatModal from "../UpdateGroupChatModal/UpdateGroupChatModal";
import { getSender, getSenderFull, ucFirst } from "../../utils/util";
import io from "socket.io-client";
import axios from "axios";
import toast from '../../utils/toast';
import { toast as t } from 'react-toastify';
import { ChatState } from "../../Context/ChatProvider";
import InputEmoji from "react-input-emoji";
import { jsonToFormdata } from '../../utils/util';
import "./Chatbox.css"
const ENDPOINT = "http://localhost:5000"; // "https://talk-a-tive.herokuapp.com"; -> After deployment
var socket, selectedChatCompare;

const Chatbox = ({ fetchAgain, setFetchAgain }) => {
  const toastId = useRef(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState({ msgType: null, content: "" });
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [istyping, setIsTyping] = useState(false);
  const { selectedChat, setSelectedChat, user, notification, setNotification } =
    ChatState();

  const fetchMessages = async () => {
    if (!selectedChat) return;

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      setLoading(true);

      const { data } = await axios.get(
        `/api/message/${selectedChat._id}`,
        config
      );
      setMessages(data);
      setLoading(false);

      socket.emit("join chat", selectedChat._id);
    } catch (error) {
      toast.error("Failed to Load the Messages")
    }
  };

  const sendMessage = async (text, isFile = false) => {
    if (newMessage.content) {
      socket.emit("stop typing", selectedChat._id);
      try {
        const config = {
          headers: {
            "Content-type": isFile ? "multipart/form-data" : "application / json",
            Authorization: `Bearer ${user.token}`,
          },
          onUploadProgress: p => {
            if (isFile) {
              const progress = (p.loaded / p.total);
              if (toastId.current === null) {
                toastId.current = toast.info('Upload in Progress', {
                  progress,
                  hideProgressBar: false,
                });
              } else {
                t.update(toastId.current, { progress });
              }
            }
          }
        };

        let formData = { type: newMessage.msgType, content: newMessage.content, chatId: selectedChat._id }
        formData = isFile ? jsonToFormdata(formData) : formData

        const { data } = await axios.post(
          "/api/message",
          formData,
          config
        );
        if (isFile) {
          t.update(toastId.current, {
            render: "File sent successfully",
            type: "success",
            autoClose: 1000
          })
          toastId.current = null
        }
        setNewMessage({ msgType: null, content: "" });
        socket.emit("new message", data);
        setMessages([...messages, data]);

      } catch (error) {
        if (isFile) {
          t.update(toastId.current, {
            render: error.response.data.message,
            type: t.TYPE.ERROR,
          });
          toastId.current = null
        } else {
          toast.error(error.response.data.message)
        }
      }
    }
  };

  const handleFileChange = (e) => {
    const files = e.target.files
    if (files.length > 0) {
      const file = files[0]
      if (file.type === "application/pdf") {
        setNewMessage({ msgType: "pdf", content: file })
      }
      else if (file.type.includes("document")) {
        setNewMessage({ msgType: "doc", content: file })
      }
      else if (file.type.includes("image")) {
        setNewMessage({ msgType: "image", content: file })
      } else {
        toast.error("File not supported", { autoClose: false });
        console.log(1);
        return
      }
    }
    e.target.value = null;
  }

  const typingHandler = (text) => {
    setNewMessage({ msgType: "text", content: text });
    if (!socketConnected) return;

    if (!typing) {
      setTyping(true);
      socket.emit("typing", selectedChat._id);
    }
    let lastTypingTime = new Date().getTime();
    var timerLength = 1000;
    setTimeout(() => {
      var timeNow = new Date().getTime();
      var timeDiff = timeNow - lastTypingTime;
      if (timeDiff >= timerLength && typing) {
        socket.emit("stop typing", selectedChat._id);
        setTyping(false);
      }
    }, timerLength);
  };
  useEffect(() => {
    socket = io(ENDPOINT);
    socket.emit("setup", user);
    socket.on("connected", () => setSocketConnected(true));
    socket.on("typing", () => setIsTyping(true));
    socket.on("stop typing", () => setIsTyping(false));

    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    fetchMessages();

    selectedChatCompare = selectedChat;
    // eslint-disable-next-line
  }, [selectedChat]);

  useEffect(() => {
    socket.on("message recieved", (newMessageRecieved) => {
      console.log("I am fired");
      if (
        !selectedChatCompare || // if chat is not selected or doesn't match current chat
        selectedChatCompare._id !== newMessageRecieved.chat._id
      ) {
        if (!notification.includes(newMessageRecieved)) {
          setNotification([newMessageRecieved, ...notification]);
          setFetchAgain(!fetchAgain);
        }
      } else {
        setMessages([...messages, newMessageRecieved]);
      }
    });
  });

  const renderMessage = () => {
    if (selectedChat) {
      const userInfo = getSender(user, selectedChat.users)

      return (
        <>
          <div className="user-box rounded-0 d-flex align-items-center py-3 px-3 border-bottom">
            <i className="fas fa-arrow-left me-md-0 me-3 d-flex d-md-none" onClick={() => setSelectedChat(false)}></i>
            <div className="img-box">
              <img src={!selectedChat.isGroupChat ? userInfo.pic : selectedChat.groupPic} alt="profile pic" className="me-3" />
            </div>
            <div className="align-self-stretch w-100">
              {messages &&
                (!selectedChat.isGroupChat ? (
                  <ProfileModal user={getSenderFull(user, selectedChat.users)}><p className="mb-0">{ucFirst(userInfo.name)}</p></ProfileModal>
                ) : (
                  <>
                    <UpdateGroupChatModal fetchMessages={fetchMessages} fetchAgain={fetchAgain} setFetchAgain={setFetchAgain} />
                  </>
                ))}
              {/* <p className="mb-0 typing-indicator text-primary">{istyping && "typing..."}</p> */}
            </div>
          </div>

          <div className="px-2 py-2 pt-0 message-wrapper">
            {loading ? (
              <div className="h-100 d-flex align-items-center justify-content-center">
                <Spinner animation="border" variant="primary" style={{ width: "3rem", height: "3rem" }} />
              </div>
            ) : (
              <>
                <div className="messages h-100">
                  <ScrollableChat messages={messages} />
                </div>
                <div className="mt-4 d-flex align-items-center">
                  <div className="rounded-pill attach-file me-2">
                    <Form.Control type="file" onChange={() => sendMessage("", true)} onInput={handleFileChange} />
                    <i className="rounded-pill p-2  fas fa-paperclip"></i>
                  </div>
                  <InputEmoji
                    value={newMessage.msgType === "text" ? newMessage.content : ""}
                    onChange={typingHandler}
                    cleanOnEnter
                    onEnter={sendMessage}
                    placeholder="Type a message..."
                  />
                  <Button className="minw-auto rounded-pill" onClick={sendMessage}><i className="fas fa-arrow-right"></i></Button>
                </div>
              </>
            )}
          </div>
        </>
      )
    } else {
      return (
        // to get socket.io on same page
        <div className="bg-light d-flex align-items-center flex-column justify-content-center h-100">
          <i className="fas fa-comments fa-4x mb-4"></i>
          <h1 className="fs-4">Click on a user to start chatting</h1>
        </div>
      )
    }
  }

  return (
    <section id="chat-message" className={`chat-message ${selectedChat ? 'd-md-flex flex-column' : 'd-none'}`}>
      {renderMessage()}
    </section>
  );
};

export default Chatbox;
