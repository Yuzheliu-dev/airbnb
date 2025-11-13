import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import {
  ErrorNotification,
  SuccessNotification,
} from '../components/Common/Notification';
export default function LoginPage() {
    const { login } = useAuthContext();
    const navigate = useNavigate();
    const location = useLocation();
  
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
  
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
  
    const fromPath = location.state?.from?.pathname || '/';
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      setErrorMsg('');
      setSuccessMsg('');
      try {
        await login(email.trim(), password);
        setSuccessMsg('Logged in successfully!');
        navigate(fromPath, { replace: true });
      } catch (err) {
        setErrorMsg(err.message || 'Failed to login');
      }
    };
  
    return (
      <div style={pageWrapperStyle}>
        <section style={cardShellStyle}>
          <div style={cardHeaderStyle}>
            <h1 style={titleStyle}>Welcome back</h1>
            <p style={subtitleStyle}>
              Log in to manage your stays and your hosted listings.
            </p>
          </div>