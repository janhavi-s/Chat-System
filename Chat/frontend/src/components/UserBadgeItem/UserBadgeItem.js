import { isEmptyArray } from 'formik';
import { Badge } from 'react-bootstrap'
import { ChatState } from '../../Context/ChatProvider';

const UserBadgeItem = ({ user, handleFunction, admin }) => {
  const { selectedChat, user: loggedUser } = ChatState();

  return (
    <Badge bg="primary" className="text-center mb-2 me-2" style={{ minWidth: "98px" }}>
      <img src={user.pic} className="d-block mt-1 mb-2 mx-auto rounded-pill" alt={user.name} width="45" height="45" />
      {user.name}
      {admin?._id === user._id && <span> (Admin)</span>}
      {(!selectedChat || (selectedChat?.groupAdmin?._id !== user._id && selectedChat?.groupAdmin?._id === loggedUser._id)) && <i style={{ cursor: "pointer" }} className="ms-2 fa fa-times" onClick={handleFunction}></i>}
    </Badge>
  );
};

export default UserBadgeItem;
