const UserListItem = ({ user, handleFunction }) => {
  return (
    <div className="user-box results d-flex align-items-center p-2" onClick={handleFunction}>
      <div className="img-box">
        <img src={"https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg"} alt="profile pic" className="me-3" />
      </div>
      <div>
        <p className='name mb-0'>{user.name}</p>
        <p className='email mb-0'>Email: {user.email}</p>
      </div>
    </div>
  );
};

export default UserListItem;
