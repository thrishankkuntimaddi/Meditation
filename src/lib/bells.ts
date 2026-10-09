import type { BellSound } from '../types';
import { soundEngine } from '../engines/SoundEngine';
import { store } from './store';

export const BELLS: { id: BellSound; label: string; desc: string }[] = [
  { id: 'crystal', label: 'Crystal', desc: 'High, clear' },
  { id: 'bowl', label: 'Bowl', desc: 'Deep, resonant' },
  { id: 'chime', label: 'Chime', desc: 'Soft, melodic' },
];

export const previewBell = (b: BellSound) => {
  soundEngine.unlock();
  soundEngine.setVolume(store.getState().settings.volume);
  soundEngine.playBell(b);
};
