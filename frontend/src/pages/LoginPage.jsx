import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import {
  ErrorNotification,
  SuccessNotification,
} from '../Common/Notification';
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

        <ErrorNotification message={errorMsg} onClose={() => setErrorMsg('')} />
        <SuccessNotification message={successMsg} onClose={() => setSuccessMsg('')} />

        <form onSubmit={handleSubmit} style={formStyle} data-testid="login-form">
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
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </label>

          <button type="submit" style={submitButtonStyle}>
            Login
          </button>
        </form>

        <p style={bottomHintStyle}>
          Don&apos;t have an account?{' '}
          <button
            type="button"
            onClick={() => navigate('/register')}
            style={linkButtonStyle}
          >
            Register
          </button>
        </p>
      </section>
    </div>
  );
}

const pageWrapperStyle = {
  width: '100%',
  minHeight: 'calc(100vh - 80px)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
};

const cardShellStyle = {
  width: '100%',
  maxWidth: 420,
  padding: '2rem 2.1rem 2rem',
  borderRadius: '20px',
  background: 'rgba(255,255,255,0.92)',
  border: '1px solid rgba(148,163,184,0.35)',
  boxShadow: '0 25px 60px rgba(15,23,42,0.18)',
  backdropFilter: 'blur(18px)',
};

const cardHeaderStyle = {
  marginBottom: '1.5rem',
};

const titleStyle = {
  fontSize: '1.5rem',
  margin: 0,
};

const subtitleStyle = {
  marginTop: '0.4rem',
  fontSize: '0.9rem',
  color: '#6b7280',
};

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.8rem',
};

const labelStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.3rem',
};

const labelTextStyle = {
  fontSize: '0.8rem',
  fontWeight: 500,
  color: '#4b5563',
};

const inputStyle = {
  padding: '0.55rem 0.65rem',
  borderRadius: '10px',
  border: '1px solid #d1d5db',
  fontSize: '0.9rem',
  outline: 'none',
  transition: 'all 0.15s ease-out',
  backgroundColor: '#f9fafb',
};

const submitButtonStyle = {
  marginTop: '0.4rem',
  padding: '0.7rem 0.8rem',
  borderRadius: '999px',
  border: 'none',
  background:
    'linear-gradient(145deg, #4f46e5, #6366f1, #ec4899)',
  color: '#fff',
  cursor: 'pointer',
  fontSize: '0.95rem',
  fontWeight: 600,
  boxShadow: '0 14px 30px rgba(88,80,236,0.4)',
};

const bottomHintStyle = {
  marginTop: '1rem',
  fontSize: '0.8rem',
  color: '#6b7280',
};

const linkButtonStyle = {
  border: 'none',
  background: 'none',
  padding: 0,
  margin: 0,
  cursor: 'pointer',
  color: '#4f46e5',
  fontSize: '0.8rem',
  fontWeight: 500,
  textDecoration: 'underline',
};