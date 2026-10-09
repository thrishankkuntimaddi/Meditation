import React from 'react';
import type { Preset } from '../types';
import Icon from './ui/Icon';
import { presetIconName } from '../lib/presetIcons';

const PresetIcon: React.FC<{ preset: Preset; active?: boolean }> = ({ preset, active }) => (
  <span
    className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
      active ? 'bg-bg/10 text-bg' : 'bg-bg border border-line/10 text-muted'
    }`}
  >
    <Icon name={presetIconName(preset)} size={22} />
  </span>
);

export default PresetIcon;
