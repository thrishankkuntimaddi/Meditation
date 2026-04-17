import React from 'react';
import type { Screen } from '../types';

interface Props {
  current: Screen;
  onChange: (s: Screen) => void;
}

const NAV_ITEMS: { screen: Screen; label: string; icon: string }[] = [
  { screen: 'home',    label: 'Home',    icon: '◎' },
  { screen: 'editor',  label: 'Editor',  icon: '⊞' },
  { screen: 'history', label: 'History', icon: '◷' },
  { screen: 'profile', label: 'Profile', icon: '◯' },
];

const BottomNav: React.FC<Props> = ({ current, onChange }) => (
  <nav
    className="fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center"
    style={{
      height: 64,
      background: 'rgba(250,250,249,0.92)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderTop: '1px solid rgba(120,113,108,0.12)',
    }}
  >
    {NAV_ITEMS.map(({ screen, label, icon }) => {
      const active = current === screen;
      return (
        <button
          key={screen}
          id={`nav-${screen}`}
          onClick={() => onChange(screen)}
          className="flex flex-col items-center justify-center gap-0.5 w-16 h-full"
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <span
            className="text-lg transition-all duration-200"
            style={{ color: active ? '#44403C' : '#A8A29E', transform: active ? 'scale(1.15)' : 'scale(1)' }}
          >
            {icon}
          </span>
          <span
            className="text-xs font-medium transition-colors duration-200"
            style={{ color: active ? '#44403C' : '#A8A29E' }}
          >
            {label}
          </span>
        </button>
      );
    })}
  </nav>
);

export default BottomNav;
