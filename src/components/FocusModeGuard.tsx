import React, { useEffect, useState } from 'react';

interface Props {
  /** Called once the user taps "I'm ready" or after auto-dismiss */
  onDismiss: () => void;
}

/**
 * FocusModeGuard
 * ─────────────────────────────────────────────────────────
 * Shown once per session start. Instructs the user to:
 *   • Put their phone/laptop on silent mode
 *   • Turn on Do Not Disturb
 *   • Close other apps / tabs
 *
 * Auto-dismisses after 8 s so it never blocks the session.
 * Uses localStorage to remember "seen this session" so it
 * only appears on the first start (resets when session ends).
 */
const FocusModeGuard: React.FC<Props> = ({ onDismiss }) => {
  const [visible, setVisible] = useState(true);
  const [countdown, setCountdown] = useState(8);
  const [exiting, setExiting] = useState(false);

  const dismiss = () => {
    setExiting(true);
    setTimeout(() => {
      setVisible(false);
      onDismiss();
    }, 500);
  };

  // Auto countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          dismiss();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'rgba(28,25,23,0.82)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        transition: 'opacity 0.5s ease',
        opacity: exiting ? 0 : 1,
      }}
    >
      <div
        style={{
          background: 'rgba(250,250,249,0.06)',
          border: '1px solid rgba(250,250,249,0.12)',
          borderRadius: '28px',
          padding: '36px 28px',
          maxWidth: '340px',
          width: '100%',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          boxShadow: '0 32px 80px rgba(0,0,0,0.4)',
          transform: exiting ? 'scale(0.94)' : 'scale(1)',
          transition: 'transform 0.5s ease',
        }}
      >
        {/* Icon */}
        <div style={{ fontSize: 48, lineHeight: 1 }}>🌙</div>

        {/* Heading */}
        <div>
          <p
            style={{
              color: '#FAFAF9',
              fontSize: '18px',
              fontWeight: 500,
              letterSpacing: '0.02em',
              margin: 0,
              marginBottom: '6px',
            }}
          >
            Focus Mode On
          </p>
          <p
            style={{
              color: 'rgba(250,250,249,0.45)',
              fontSize: '12px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              margin: 0,
            }}
          >
            Blocking all distractions
          </p>
        </div>

        {/* Steps */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          {[
            { icon: '🔕', label: 'Turn on Silent / Do Not Disturb' },
            { icon: '📵', label: 'Close other apps & notifications' },
            { icon: '💻', label: 'Browser notifications are suppressed' },
            { icon: '🔆', label: 'Screen will stay awake' },
          ].map(({ icon, label }) => (
            <div
              key={label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: 'rgba(250,250,249,0.06)',
                borderRadius: '14px',
                padding: '12px 16px',
                textAlign: 'left',
              }}
            >
              <span style={{ fontSize: 20, flexShrink: 0 }}>{icon}</span>
              <span
                style={{
                  color: 'rgba(250,250,249,0.75)',
                  fontSize: '13px',
                  lineHeight: 1.4,
                }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* CTA button */}
        <button
          id="focus-mode-ready-btn"
          onClick={dismiss}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '16px',
            border: 'none',
            background: 'rgba(250,250,249,0.12)',
            color: '#FAFAF9',
            fontSize: '14px',
            fontWeight: 500,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            transition: 'background 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(250,250,249,0.2)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(250,250,249,0.12)')}
        >
          <span>I'm Ready</span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: 'rgba(250,250,249,0.15)',
              fontSize: '11px',
              fontWeight: 700,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {countdown}
          </span>
        </button>

        {/* Sub note */}
        <p
          style={{
            color: 'rgba(250,250,249,0.25)',
            fontSize: '11px',
            margin: 0,
            letterSpacing: '0.04em',
          }}
        >
          Auto-continues in {countdown}s
        </p>
      </div>
    </div>
  );
};

export default FocusModeGuard;
