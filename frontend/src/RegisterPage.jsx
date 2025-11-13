import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import {
  ErrorNotification,
  SuccessNotification,
} from '../components/Common/Notification';
export default function RegisterPage() {
    const { register } = useAuthContext();
    const navigate = useNavigate();
  
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
  
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      setErrorMsg('');
      setSuccessMsg('');
  
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match.');
        return;
      }
  
      try {
        await register(email.trim(), password, name.trim());
        setSuccessMsg('Registered and logged in successfully!');
        navigate('/', { replace: true });
      } catch (err) {
        setErrorMsg(err.message || 'Failed to register');
      }
    };
  
    return (
      <div style={pageWrapperStyle}>
        <section style={cardShellStyle}>
          <div style={cardHeaderStyle}>
            <h1 style={titleStyle}>Create an account</h1>
            <p style={subtitleStyle}>
              Start hosting or booking your dream stays with Airbrb.
            </p>
          </div>
  
          <ErrorNotification
          message={errorMsg}
          onClose={() => setErrorMsg('')}
        />
        <SuccessNotification
          message={successMsg}
          onClose={() => setSuccessMsg('')}
        />

        <form onSubmit={handleSubmit} style={formStyle}>
          <label style={labelStyle}>
            <span style={labelTextStyle}>Name</span>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={inputStyle}
              autoComplete="name"
              placeholder="your name"
            />
          </label>

          <label style={labelStyle}>
            <span style={labelTextStyle}>Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              autoComplete="email"
              placeholder="you@example.com"
            />
          </label>

          <label style={labelStyle}>
            <span style={labelTextStyle}>Password</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
              autoComplete="new-password"
              placeholder="••••••••"
            />
          </label>

          <label style={labelStyle}>
            <span style={labelTextStyle}>Confirm Password</span>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={inputStyle}
              autoComplete="new-password"
              placeholder="••••••••"
            />
          </label>

         