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

{isAuthenticated ? (
            <>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.25rem 0.6rem',
                  borderRadius: '999px',
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  border: '1px solid rgba(148,163,184,0.4)',
                  fontSize: '0.8rem',
                  color: '#4b5563',
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '999px',
                    backgroundColor: '#22c55e',
                  }}
                />
                <span
                  style={{
                    maxWidth: 140,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={email}
                >
                  {email}
                </span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                style={navButtonStyle(true)}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => navigate('/login')}
                style={navButtonStyle(false)}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => navigate('/register')}
                style={navPrimaryButtonStyle}
              >
                Register
              </button>
            </>
          )}
        </div>
      </header>

      <main
        style={{
          flex: 1,
          padding: '2rem 1.5rem 2.5rem',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 960,
          }}
        >
          {children}
        </div>
      </main>
    </div>
  );
}

const navButtonBase = {
  padding: '0.4rem 0.9rem',
  borderRadius: '999px',
  border: '1px solid rgba(148, 163, 184, 0.45)',
  backgroundColor: 'rgba(255,255,255,0.9)',
  cursor: 'pointer',
  fontSize: '0.85rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.3rem',
  transition: 'all 0.16s ease-out',
  boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
};

const navButtonStyle = (isDanger) => ({
  ...navButtonBase,
  color: isDanger ? '#b91c1c' : '#374151',
  borderColor: isDanger
    ? 'rgba(248,113,113,0.7)'
    : 'rgba(148,163,184,0.5)',
  backgroundColor: isDanger ? 'rgba(254,242,242,0.9)' : 'rgba(255,255,255,0.9)',
});

const navPrimaryButtonStyle = {
  ...navButtonBase,
  background:
    'linear-gradient(135deg, #4f46e5, #6366f1, #ec4899)',
  color: '#ffffff',
  border: 'none',
};

export default function AppRouter() {
  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          <Route path="/" element={<AllListingsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route
            path="/host/listings"
            element={
              <RequireAuth>
                <HostedListingsPage />
              </RequireAuth>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}