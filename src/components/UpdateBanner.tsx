import React, { useState } from 'react';

interface Props {
  onUpdate: () => void;
}

const UpdateBanner: React.FC<Props> = ({ onUpdate }) => {
  const [loading, setLoading] = useState(false);

  const handleUpdate = () => {
    setLoading(true);
    onUpdate();
    // Give SW time to activate before reload triggers
    setTimeout(() => setLoading(false), 3000);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: '#1C1917',
        color: '#FAFAF9',
        borderRadius: 100,
        padding: '10px 16px 10px 14px',
        boxShadow: '0 8px 32px rgba(28,25,23,0.28)',
        fontSize: 13,
        fontWeight: 500,
        whiteSpace: 'nowrap',
        animation: 'slideDownFade 0.35s ease-out forwards',
        border: '1px solid rgba(250,250,249,0.08)',
      }}
    >
      {/* Pulse dot */}
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: '#86EFAC',
          flexShrink: 0,
          boxShadow: '0 0 6px rgba(134,239,172,0.6)',
          animation: 'pulse 2s ease-in-out infinite',
          display: 'inline-block',
        }}
      />
      <span style={{ color: 'rgba(250,250,249,0.7)', fontSize: 12 }}>
        New version available
      </span>
      <button
        id="update-app-btn"
        onClick={handleUpdate}
        disabled={loading}
        style={{
          background: '#FAFAF9',
          color: '#1C1917',
          border: 'none',
          borderRadius: 100,
          padding: '5px 14px',
          fontSize: 12,
          fontWeight: 600,
          cursor: loading ? 'default' : 'pointer',
          letterSpacing: '0.04em',
          opacity: loading ? 0.6 : 1,
          transition: 'opacity 0.2s',
          flexShrink: 0,
        }}
      >
        {loading ? 'Updating…' : 'Update'}
      </button>

      <style>{`
        @keyframes slideDownFade {
          from { opacity: 0; transform: translateX(-50%) translateY(-12px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
};

export default UpdateBanner;
