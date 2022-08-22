import React from 'react'

import "./AuthBase.css"
const AuthBase = (props) => {
    return (
        <div className="auth-page min-vh-100 w-100 d-flex align-items-center justify-content-center">
            {props.children}
        </div>
    )
}

export default AuthBase
