import { useState, useEffect } from "react";
import Chatbox from "../components/Chatbox/Chatbox";
import MyChats from "../components/MyChats/MyChats";
import Menu from "../components/Menu/Menu";
import { ChatState } from "../Context/ChatProvider";
import { Link } from "react-router-dom";
import { Container, Alert } from 'react-bootstrap'

const Chatpage = () => {
  const { user } = ChatState();

  const [fetchAgain, setFetchAgain] = useState(false);

  return (
    <Container fluid className="p-0">
      {!user?.isAccountVerified && <Alert className="mb-0 py-2 text-center" variant="danger" style={{ fontSize: "0.8rem" }}>
        Your account is not verified yet.
        <Alert.Link as={Link} to="/verify" className="text-decoration-underline ps-1">Click Here</Alert.Link> to verify.
      </Alert>}
      {user && <Menu />}
      <div className="d-md-flex">
        {user && <MyChats fetchAgain={fetchAgain} />}
        {user && (
          <Chatbox fetchAgain={fetchAgain} setFetchAgain={setFetchAgain} />
        )}
      </div>
    </Container>
  );
};

export default Chatpage;
