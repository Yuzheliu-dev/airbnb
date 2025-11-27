import { useEffect, useRef, useState } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationsContext';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import HostedListingsPage from '../pages/HostedListingsPage';
import AllListingsPage from '../pages/AllListingsPage';
import EditListingPage from '../pages/EditListingPage';
import ListingDetailPage from '../pages/ListingDetailPage';
import HostedBookingManagementPage from '../pages/HostedBookingManagementPage';

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
  const { notifications, unreadCount, markAllAsRead, dismissNotification } = useNotifications();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsRef = useRef(null);

  useEffect(() => {
    if (!notificationsOpen) return undefined;
    const handleClick = (event) => {
      if (!notificationsRef.current) return;
      if (!notificationsRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => {
      document.removeEventListener('mousedown', handleClick);
    };
  }, [notificationsOpen]);

  useEffect(() => {
    if (notificationsOpen) {
      markAllAsRead();
    }
  }, [notificationsOpen, markAllAsRead]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const formatTimestamp = (value) => {
    if (!value) return '';
    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  };

  const toggleNotifications = () => {
    setNotificationsOpen((prev) => !prev);
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
            aria-label="Go to all listings"
            onClick={() => navigate('/')}
            style={navButtonStyle(false)}
          >
            All Listings
          </button>

          {isAuthenticated && (
            <>
              <button
                type="button"
                aria-label="Go to hosted listings"
                onClick={() => navigate('/host/listings')}
                style={navButtonStyle(false)}
              >
                Hosted Listings
              </button>
              <div style={{ position: 'relative' }} ref={notificationsRef}>
                <button
                  type="button"
                  aria-label="Open notifications panel"
                  onClick={toggleNotifications}
                  style={notificationsButtonStyle(unreadCount)}
                >
                  🔔
                  {unreadCount > 0 && (
                    <span style={notificationsBadgeStyle}>{unreadCount > 9 ? '9+' : unreadCount}</span>
                  )}
                </button>
                {notificationsOpen && (
                  <div style={notificationsPanelStyle}>
                    <div style={notificationsHeaderStyle}>
                      <strong>通知</strong>
                      <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                        {notifications.length ? `共 ${notifications.length} 条` : '暂无'}
                      </span>
                    </div>
                    {notifications.length ? (
                      <ul style={notificationsListStyle}>
                        {notifications.map((notification) => (
                          <li
                            key={notification.id}
                            style={{
                              ...notificationItemStyle,
                              backgroundColor: notification.read ? '#fff' : '#eef2ff',
                            }}
                          >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                              <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                {notification.type === 'host' ? '房东提醒' : '预订提醒'}
                              </span>
                              <strong style={{ fontSize: '0.9rem' }}>{notification.message}</strong>
                              {notification.detail && (
                                <span style={{ fontSize: '0.8rem', color: '#4b5563' }}>{notification.detail}</span>
                              )}
                              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                                {formatTimestamp(notification.createdAt)}
                              </span>
                            </div>
                            <button
                              type="button"
                              style={notificationDismissButtonStyle}
                              onClick={() => dismissNotification(notification.id)}
                              aria-label="移除通知"
                            >
                              ×
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280' }}>暂无通知</p>
                    )}
                  </div>
                )}
              </div>
            </>
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
                aria-label="Log out of Airbrb"
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
                aria-label="Open login screen"
                onClick={() => navigate('/login')}
                style={navButtonStyle(false)}
              >
                Login
              </button>
              <button
                type="button"
                aria-label="Open register screen"
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

const notificationsButtonStyle = (hasUnread) => ({
  ...navButtonBase,
  position: 'relative',
  fontSize: '1.1rem',
  borderColor: hasUnread ? 'rgba(248,113,113,0.8)' : 'rgba(148,163,184,0.5)',
});

const notificationsBadgeStyle = {
  position: 'absolute',
  top: -6,
  right: -2,
  minWidth: 18,
  height: 18,
  borderRadius: '999px',
  backgroundColor: '#ef4444',
  color: '#fff',
  fontSize: '0.7rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0 4px',
  fontWeight: 600,
};

const notificationsPanelStyle = {
  position: 'absolute',
  top: '120%',
  right: 0,
  width: 320,
  maxHeight: 360,
  padding: '0.9rem',
  borderRadius: '16px',
  border: '1px solid rgba(226,232,240,0.9)',
  backgroundColor: '#fff',
  boxShadow: '0 25px 45px rgba(15,23,42,0.18)',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.6rem',
  zIndex: 20,
};

const notificationsHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const notificationsListStyle = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '0.6rem',
  maxHeight: 250,
  overflowY: 'auto',
};

const notificationItemStyle = {
  borderRadius: '12px',
  border: '1px solid rgba(226,232,240,0.9)',
  padding: '0.7rem 0.8rem',
  display: 'flex',
  gap: '0.6rem',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
};

const notificationDismissButtonStyle = {
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  color: '#94a3b8',
  fontSize: '1rem',
  padding: 0,
};

export default function AppRouter() {
  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          <Route path="/" element={<AllListingsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/listings/:listingId" element={<ListingDetailPage />} />

          <Route
            path="/host/listings"
            element={
              <RequireAuth>
                <HostedListingsPage mode="list" />
              </RequireAuth>
            }
          />

          <Route
            path="/host/listings/new"
            element={
              <RequireAuth>
                <HostedListingsPage mode="create" />
              </RequireAuth>
            }
          />

          <Route
            path="/host/listings/:listingId/edit"
            element={
              <RequireAuth>
                <EditListingPage />
              </RequireAuth>
            }
          />

          <Route
            path="/host/listings/:listingId/bookings"
            element={
              <RequireAuth>
                <HostedBookingManagementPage />
              </RequireAuth>
            }
          />

          <Route
            path="/host/listings/:listingId/bookings"
            element={
              <RequireAuth>
                <HostedBookingManagementPage />
              </RequireAuth>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}