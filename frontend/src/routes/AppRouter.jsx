import React from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import HostedListingsPage from '../pages/HostedListingsPage';
import AllListingsPage from '../pages/AllListingsPage';

function RequireAuth({ children }) {
  const { isAuthenticated } = useAuthContext();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

function MainLayout({ children }) {
  const { isAuthenticated, email, logout } = useAuthContext();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'radial-gradient(circle at top left, #eff6ff, #f9fafb)',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      <header
        style={{
          padding: '0.85rem 1.8rem',
          borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          backdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            cursor: 'pointer',
          }}
          onClick={() => navigate('/')}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '999px',
              background:
                'conic-gradient(from 140deg, #6366f1, #ec4899, #f97316, #6366f1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 0 2px rgba(255,255,255,0.9)',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.9rem',
            }}
          >
            A
          </div>
          <span
            style={{
              fontWeight: 700,
              letterSpacing: '0.04em',
              fontSize: '1rem',
            }}
          >
            Airbrb
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'center',
          }}
        >
          <button
            type="button"
            onClick={() => navigate('/')}
            style={navButtonStyle(false)}
          >
            All Listings
          </button>

          {isAuthenticated && (
            <button
              type="button"
              onClick={() => navigate('/host/listings')}
              style={navButtonStyle(false)}
            >
              Hosted Listings
            </button>
          )}

         