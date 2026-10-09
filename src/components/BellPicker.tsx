import React from 'react';
import type { BellSound } from '../types';
import { BELLS, previewBell } from '../lib/bells';
import Icon from './ui/Icon';

interface Props {
  value: BellSound;
  onChange: (v: BellSound) => void;
}

const BellPicker: React.FC<Props> = ({ value, onChange }) => (
  <div className="grid grid-cols-3 gap-2">
    {BELLS.map(b => {
      const active = value === b.id;
      return (
        <button
          key={b.id}
          id={`bell-${b.id}`}
          onClick={() => { previewBell(b.id); onChange(b.id); }}
          aria-pressed={active}
          className={`flex flex-col items-center gap-1.5 py-3.5 px-2 rounded-2xl border transition-all duration-200 ${
            active ? 'bg-surface border-line/40 text-ink2' : 'bg-transparent border-line/15 text-muted hover:border-line/30'
          }`}
        >
          <Icon name="bell" size={20} />
          <span className="text-[13px] font-medium">{b.label}</span>
          <span className="text-[11px] text-faint">{b.desc}</span>
        </button>
      );
    })}
  </div>
);

export default BellPicker;
