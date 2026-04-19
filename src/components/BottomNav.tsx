import React from 'react';
import type { Screen } from '../types';

interface Props {
  current: Screen;
  onChange: (s: Screen) => void;
}

const NAV_ITEMS: { screen: Screen; label: string; icon: string }[] = [
  { screen: 'home',    label: 'Home',    icon: '◎' },
  { screen: 'editor',  label: 'Presets',  icon: '⊞' },
  { screen: 'history', label: 'History', icon: '◷' },
  { screen: 'profile', label: 'Profile', icon: '◯' },
];

const BottomNav: React.FC<Props> = ({ current, onChange }) => (
  <nav
    className="fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center"
    style={{
      height: 72,
      background: 'rgba(250,250,249,0.95)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(120,113,108,0.12)',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    }}
  >
    {NAV_ITEMS.map(({ screen, label, icon }) => {
      const active = current === screen;
      return (
        <button
          key={screen}
          id={`nav-${screen}`}
          onClick={() => onChange(screen)}
          className="flex flex-col items-center justify-center gap-1"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            minWidth: 64,
            minHeight: 56,
            padding: '6px 12px',
          }}
        >
          <span
            style={{
              fontSize: 26,
              lineHeight: 1,
              color: active ? '#44403C' : '#A8A29E',
              transform: active ? 'scale(1.1)' : 'scale(1)',
              transition: 'transform 0.2s ease, color 0.2s ease',
              display: 'block',
            }}
          >
            {icon}
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: active ? 600 : 400,
              color: active ? '#44403C' : '#A8A29E',
              transition: 'color 0.2s ease',
              letterSpacing: '0.02em',
            }}
          >
            {label}
          </span>
        </button>
      );
    })}
  </nav>
);

export default BottomNav;
