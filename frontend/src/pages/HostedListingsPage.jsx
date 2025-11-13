import React from 'react';

export default function HostedListingsPage() {
  return (
    <div
      style={{
        marginTop: '0.5rem',
        padding: '1.25rem 1.35rem',
        borderRadius: '18px',
        backgroundColor: 'rgba(255,255,255,0.94)',
        border: '1px solid rgba(148,163,184,0.38)',
        boxShadow: '0 16px 40px rgba(15,23,42,0.16)',
      }}
    >
      <h1
        style={{
          fontSize: '1.4rem',
          marginTop: 0,
          marginBottom: '0.4rem',
        }}
      >
        Hosted Listings
      </h1>
      <p
        style={{
          margin: 0,
          fontSize: '0.9rem',
          color: '#6b7280',
        }}
      >
        This is a placeholder for your hosted listings screen (Feature Set 2.2).
        You will list and manage your own properties here.
      </p>
    </div>
  );
}
