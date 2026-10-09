import React from 'react';
import type { Screen } from '../types';
import Icon, { type IconName } from './ui/Icon';

interface Props {
  current: Screen;
  onChange: (s: Screen) => void;
}

const NAV_ITEMS: { screen: Screen; label: string; icon: IconName }[] = [
  { screen: 'home', label: 'Practice', icon: 'meditate' },
  { screen: 'editor', label: 'Presets', icon: 'sliders' },
  { screen: 'history', label: 'Journey', icon: 'chart' },
  { screen: 'profile', label: 'Profile', icon: 'user' },
];

const BottomNav: React.FC<Props> = ({ current, onChange }) => (
  <nav
    className="fixed bottom-0 inset-x-0 z-50 bg-bg/90 backdrop-blur-xl border-t border-line/10 pb-safe"
    aria-label="Main"
  >
    <div className="mx-auto max-w-[480px] h-[68px] flex items-stretch justify-around px-2">
      {NAV_ITEMS.map(({ screen, label, icon }) => {
        const active = current === screen;
        return (
          <button
            key={screen}
            id={`nav-${screen}`}
            onClick={() => onChange(screen)}
            aria-current={active ? 'page' : undefined}
            className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors duration-200 ${
              active ? 'text-ink2' : 'text-faint hover:text-muted'
            }`}
          >
            <span
              className={`flex items-center justify-center w-12 h-7 rounded-full transition-all duration-200 ${
                active ? 'bg-surface2/70' : ''
              }`}
            >
              <Icon name={icon} size={22} strokeWidth={active ? 1.8 : 1.6} />
            </span>
            <span className={`text-[11px] tracking-[0.02em] ${active ? 'font-semibold' : 'font-normal'}`}>{label}</span>
          </button>
        );
      })}
    </div>
  </nav>
);

export default BottomNav;
