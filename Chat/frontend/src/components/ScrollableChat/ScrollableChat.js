import { useState } from "react";
import ScrollableFeed from "react-scrollable-feed";
import { isLastMessage, isSameSender, isSameSenderMargin, isSameUser } from "../../utils/util";
import { ChatState } from "../../Context/ChatProvider";
import { OverlayTrigger, Tooltip } from "react-bootstrap"
import fileDownload from "js-file-download";
import axios from "axios";
import "./ScrollableChat.css"

const ScrollableChat = ({ messages }) => {
  const { user } = ChatState();


  const downloadFile = async (id) => {
    const config = {
      headers: {
        Authorization: `Bearer ${user.token}`,
        responseType: "blob"
      },
    };
    const { data: { url, filename } } = await axios.get(`/api/message/file/${id}`, config);
    const { data } = await axios.get(url, { responseType: "blob" })
    fileDownload(data, filename);
  }

  return (
    <>
      <ScrollableFeed className="d-flex flex-column">
        {messages &&
          messages.map((m, i) => {
            return <div className="message-container" key={m._id}
              style={{
                marginLeft: isSameSenderMargin(messages, m, i, user._id),
                marginTop: isSameUser(messages, m, i, user._id) ? 8 : 18
              }}>
              {(!isSameSender(messages, m, i, user._id) && m.chat.isGroupChat) &&
                <OverlayTrigger placement="bottom" delay={{ show: 250, hide: 400 }} overlay={<Tooltip id="button-tooltip">{m.sender.name}</Tooltip>}>
                  <img alt="Receiver" src={m.sender.pic} className="receiver rounded-pill me-2" />
                </OverlayTrigger>}
              <div
                className="message"
                style={{
                  backgroundColor: `${m.sender._id === user._id ? "var(--bs-white)" : "var(--focus-primary)"}`
                }}
              >
                {(!isSameSender(messages, m, i, user._id) && m.chat.isGroupChat) && <span className="username">{m.sender.name}</span>}
                {m.type === "image" &&
                  <div className="border rounded img-message">
                    <img onClick={() => downloadFile(m._id)} src={m.content.file.url} />
                  </div>}
                {(m.type === "pdf" || m.type === "doc") &&
                  <div className="file-message d-flex align-items-center px-2 py-3 rounded">
                    <div className="flex-grow-1">
                      <i className={`fs-5 ${m.type === "pdf" ? "text-danger fa-file-pdf" : "fa-file-word"} fas me-2`}></i>
                      <span className="fs-6 filename">{
                        m.content.file.filename.length > 20
                          ? m.content.file.filename.substring(0, 20) + "..."
                          : m.content.file.filename}</span>
                    </div>
                    <i onClick={() => downloadFile(m._id)} className="fs-5 fas fa-arrow-alt-circle-down"></i>
                  </div>}
                {m.type === "text" &&
                  <span>{m.content.message}</span>
                }
                <span className="msg-time">{new Date(m.createdAt).toLocaleTimeString('en-US', { timeStyle: 'short' })}</span>
              </div>
            </div>
          })}
      </ScrollableFeed>

    </>
  );
};

export default ScrollableChat;
