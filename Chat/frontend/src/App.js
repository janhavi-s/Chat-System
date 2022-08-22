import { Route, Switch } from "react-router-dom";
import Chatpage from "./Pages/Chatpage";
import Signup from "./components/Signup/Signup";
import Login from "./components/Login/Login";
import Verify from "./components/Verify/Verify";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ResetPassword from "./components/ResetPassword.js/ResetPassword";

function App() {
  return (
    <div className="App">
      <Switch>
        <Route path="/signup" component={Signup} />
        <Route path="/verify" component={Verify} />
        <Route path="/login" component={Login} />
        <Route path="/forgotPassword" component={ResetPassword} />
        <Route path="/chats" component={Chatpage} />
      </Switch>
      <ToastContainer
        position="bottom-center"
        autoClose={2000}
        hideProgressBar={true}
        newestOnTop={false}
        closeOnClick={false}
        rtl={false}
        draggable={false}
      />
    </div>
  );
}

export default App;
