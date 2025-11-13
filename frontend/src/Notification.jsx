import React from 'react';
const baseStyle = {
    padding: '0.75rem 0.9rem',
    borderRadius: '12px',
    marginBottom: '0.9rem',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    fontSize: '0.85rem',
    gap: '0.6rem',
    boxShadow: '0 10px 30px rgba(15,23,42,0.08)',
  };
  const iconStyle = {
    width: 24,
    height: 24,
    borderRadius: '999px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    fontSize: '0.9rem',
  };
  const contentStyle = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.15rem',
  };
  
  const titleStyle = {
    fontWeight: 600,
  };

  const closeButtonStyle = {
    marginLeft: '0.4rem',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: '1rem',
    lineHeight: 1,
    color: 'inherit',
  };

  export function ErrorNotification({ message, onClose }) {
    if (!message) return null;
    return (
      <div
        style={{
          ...baseStyle,
          background: 'linear-gradient(135deg, #fef2f2, #fee2e2)',
          border: '1px solid #fecaca',
          color: '#b91c1c',
        }}
        role="alert"
      >
        <div
          style={{
            ...iconStyle,
            backgroundColor: '#fee2e2',
            color: '#b91c1c',
          }}
        >
          !
        </div>
        <div style={contentStyle}>
          <span style={titleStyle}>Something went wrong</span>
          <span>{message}</span>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            style={closeButtonStyle}
            aria-label="Close error message"
          >
            ×
          </button>
        )}
      </div>
    );
  }
  export function SuccessNotification({ message, onClose }) {
    if (!message) return null;
    return (
      <div
        style={{
          ...baseStyle,
          background: 'linear-gradient(135deg, #ecfdf3, #dcfce7)',
          border: '1px solid #bbf7d0',
          color: '#166534',
        }}
        role="status"
      >
        <div
          style={{
            ...iconStyle,
            backgroundColor: '#dcfce7',
            color: '#15803d',
          }}
        >
          ✓
        </div>
        <div style={contentStyle}>
          <span style={titleStyle}>Success</span>
          <span>{message}</span>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            style={closeButtonStyle}
            aria-label="Close success message"
          >
            ×
          </button>
        )}
      </div>
    );
  }