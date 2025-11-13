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