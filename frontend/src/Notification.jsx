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