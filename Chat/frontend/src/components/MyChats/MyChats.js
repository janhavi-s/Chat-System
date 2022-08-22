import { useState, useEffect } from "react";
import { Button, Offcanvas, Form, Dropdown } from 'react-bootstrap'
import { getSender, ucFirst } from "../../utils/util";
import GroupChatModal from "../GroupChatModal/GroupChatModal";
import UserListItem from "../UserListItem/UserListItem";
import { ChatState } from "../../Context/ChatProvider";
import axios from "axios";
import toast from '../../utils/toast';
import "./MyChats.css"

const MyChats = ({ fetchAgain }) => {
  const [drawer, setDrawer] = useState(false);
  const [search, setSearch] = useState("");
  const { selectedChat, setSelectedChat, user, chats, setChats, notification } = ChatState();
  const [loading, setLoading] = useState(false);
  const [searchResult, setSearchResult] = useState({ results: [], message: "" });
  const [loadingChat, setLoadingChat] = useState(false);
  const fetchChats = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await axios.get("/api/chat", config);
      setChats(data);
    } catch (error) {
      toast.error("Failed to Load the chats")
    }
  };
  const accessChat = async (userId) => {
    try {
      setDrawer(!drawer)
      setSearchResult({ results: "", message: "" })
      setSearch("")
      setLoadingChat(true);
      const config = {
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await axios.post(`/api/chat`, { userId }, config);
      if (!chats.find((c) => c._id === data._id)) setChats([data, ...chats]);
      setSelectedChat(data);
      setLoadingChat(false);
      setDrawer(!drawer)
    } catch (error) {
      toast.error("Error fetching the chat");
    }
  };
  const handleSearch = async () => {
    if (!search) {
      toast.error("Please Enter something in search");
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
      if (data.length > 0) setSearchResult({ results: data, message: "" });
      else setSearchResult({ results: data, message: "No Users found" });
    } catch (error) {
      toast.error("Error Occured!");
    }
  };
  useEffect(() => {
    fetchChats();
    // eslint-disable-next-line
  }, [fetchAgain]);
  return (
    <section id="mychats" className={`mychats border d-md-flex flex-column ${selectedChat ? 'd-none' : 'd-flex '}`}>
      <div className="border-bottom p-2 d-flex align-items-center">
        <Button className="w-100 bg-transparent text-dark search-user d-flex align-items-center" onClick={() => setDrawer(!drawer)}>
          <i className="fa fa-search me-3"></i>
          <span>Search User</span>
        </Button>

        <Dropdown>
          <Dropdown.Toggle className="btn minw-auto text-dark bg-transparent px-3">
            <i className="fas fa-ellipsis-v"></i>
          </Dropdown.Toggle>
          <Dropdown.Menu>
            <GroupChatModal>
              <Dropdown.Item>
                <i className="fa fa-plus me-2"></i>
                Create Group
              </Dropdown.Item>
            </GroupChatModal>
          </Dropdown.Menu>
        </Dropdown>

      </div>
      <div className="chat-list ">
        {chats.map((chat) => {
          const notificationCount = notification.filter((notif) => notif.chat._id === chat._id).length
          const type = chat?.latestMessage?.type
          const sender = !chat.isGroupChat ? getSender(user, chat.users) : chat.chatName
          return (<div key={chat._id} className={`${selectedChat?._id === chat._id && "active"} border-bottom user-box chat d-flex align-items-center p-2`} onClick={() => { setSelectedChat(chat) }}>
            <img src={!chat.isGroupChat ? sender.pic : chat.groupPic} alt="profile pic" className="me-3" />
            <div className="user flex-grow-1">
              <p className='name mb-1'>{!chat.isGroupChat ? ucFirst(sender.name) : ucFirst(sender)}</p>
              {chat.latestMessage ?
                <div className='latestMessage justify-content-between d-flex mb-0'>
                  <span className="me-1 d-inline-block">{chat.latestMessage.sender._id === user._id ? "You" : chat.latestMessage.sender.name}:</span>
                  {["image", "pdf", "doc"].includes(type) &&
                    <div className="d-inline-flex align-items-center">
                      <i className="fas fa-file me-1 text-muted"></i>
                      {chat.latestMessage.content.file.filename.length > 25
                        ? chat.latestMessage.content.file.filename.substring(0, 25) + "..."
                        : chat.latestMessage.content.file.filename}
                    </div>
                  }
                  <span className="flex-grow-1">
                    {type === "text" && chat.latestMessage.content.message.length > 20
                      ? chat.latestMessage.content.message.substring(0, 20) + "..."
                      : chat.latestMessage.content.message}
                  </span>
                  {/* {notificationCount > 0 && <span class="badge rounded-pill bg-danger">
                    {notificationCount > 99 ? "99+" : notificationCount}
                  </span>} */}
                </div>
                :
                <p className='latestMessage mb-0'>No messages yet!</p>
              }
            </div>
          </div>)
        })}
      </div>

      <Offcanvas show={drawer} onHide={() => setDrawer(!drawer)}>
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Search Users</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <div className="d-flex aling-items-center mb-3">
            <Form.Group className="me-2 flex-grow-1">
              <Form.Control value={search} onChange={(e) => setSearch(e.target.value)} type="text" placeholder="Search by name" />
            </Form.Group>
            <Button className="shadow-none minw-auto text-center" onClick={handleSearch}>
              <i className="fa fa-search"></i>
            </Button>
          </div>

          {loading ? (
            //<ChatLoading />
            <h2>Loading...</h2>
          ) : (
            searchResult.results.length > 0 ? searchResult.results?.map((result) => {
              return <UserListItem key={result._id} user={result} handleFunction={() => accessChat(result._id)} />
            })
              :
              searchResult.message && <h5 className="text-center text-danger">No Users Found</h5>
          )}

        </Offcanvas.Body>
      </Offcanvas>
    </section >
  );
};

export default MyChats;
