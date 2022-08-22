import { Link, useHistory } from "react-router-dom";
import { Dropdown, Navbar, Nav, Container } from 'react-bootstrap'
import { ChatState } from "../../Context/ChatProvider";
import ProfileModal from "../ProfileModal/ProfileModal";
import ChangePassword from "../ChangePassword/ChangePassword";
import appLogo from "../../images/appLogo.png"
import { getSender, getSenderFull, ucFirst } from "../../utils/util";
import "./Menu.css"

const Menu = () => {
  const {
    setSelectedChat,
    user,
    notification,
    setNotification,
    setChats,
    setUser
  } = ChatState();
  console.log(notification);
  const history = useHistory();

  const logoutHandler = () => {
    localStorage.removeItem("userInfo");
    localStorage.removeItem("jwt");
    setSelectedChat(null);
    setUser(null);
    setNotification([]);
    setChats([])
    history.push("/login");
  };
  console.log(notification);
  return (
    <>
      <Navbar className="main-navbar">
        <Container fluid className="px-5">
          <Navbar.Brand as={Link} to="/chats" className="text-white">
            <img alt="Chit Chat" src={appLogo} width="30" height="30" className="d-inline-block me-2" />
            Chat
          </Navbar.Brand>

          <Nav>
            <Dropdown className="notification ms-0">
              <Dropdown.Toggle variant="success" id="dropdown-basic" className="btn btn-primary position-relative minw-auto py-0 bg-transparent me-4 top-50 translate-middle-y">
                <i className="fa fa-bell"></i>
                <span className="notification-count position-absolute start-100 translate-middle badge rounded-pill bg-danger">
                  {notification.length > 0 && notification.length}
                </span>
              </Dropdown.Toggle>

              <Dropdown.Menu>
                {!notification.length && <Dropdown.Item as="div">No New Messages</Dropdown.Item>}
                {notification.map((notif) => (
                  <Dropdown.Item as="button"
                    onClick={() => {
                      setSelectedChat(notif.chat);
                      setNotification(notification.filter((n) => n !== notif));
                    }}
                  >
                    {notif.chat.isGroupChat
                      ? `New Message in ${notif.chat.chatName}`
                      : `New Message from ${getSender(user, notif.chat.users).name}`}
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown>

            <Dropdown>
              <Dropdown.Toggle variant="success" id="user" className="user minw-auto py-0 bg-transparent">
                <img alt="User" src={user.pic} className="d-inline-block me-2 rounded-pill" />
              </Dropdown.Toggle>

              <Dropdown.Menu>
                <ProfileModal user={user}>
                  <Dropdown.Item as="button">Profile</Dropdown.Item>
                </ProfileModal>
                <ChangePassword user={user}>
                  <Dropdown.Item as="button">Change Password</Dropdown.Item>
                </ChangePassword>
                <Dropdown.Item as="button" onClick={logoutHandler}>Logout</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Nav>
        </Container>
      </Navbar>
    </>
  );
}

export default Menu;
