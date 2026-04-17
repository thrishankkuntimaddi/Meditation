import React from 'react';
import type { BellSound } from '../types';

interface Props {
  value: BellSound;
  onChange: (v: BellSound) => void;
}

const BELLS: { id: BellSound; label: string; desc: string }[] = [
  { id: 'crystal', label: 'Crystal', desc: 'High, clear ring' },
  { id: 'bowl',    label: 'Bowl',    desc: 'Deep, resonant tone' },
  { id: 'chime',   label: 'Chime',   desc: 'Soft, melodic' },
];

const BellPicker: React.FC<Props> = ({ value, onChange }) => (
  <div className="flex gap-2 flex-wrap">
    {BELLS.map(b => (
      <button
        key={b.id}
        id={`bell-${b.id}`}
        onClick={() => onChange(b.id)}
        className="flex-1 min-w-[90px] flex flex-col items-center gap-1 py-3 px-2 rounded-xl transition-all duration-200"
        style={{
          background: value === b.id ? '#F5F5F4' : 'transparent',
          border: `1.5px solid ${value === b.id ? '#78716C' : 'rgba(120,113,108,0.18)'}`,
          cursor: 'pointer',
        }}
      >
        <span className="text-lg">🔔</span>
        <span className="text-xs font-medium text-stone-600">{b.label}</span>
        <span className="text-xs text-stone-400 text-center">{b.desc}</span>
      </button>
    ))}
  </div>
);

export default BellPicker;
