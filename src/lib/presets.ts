import type { Phase, Preset } from '../types';
import { store, uid } from './store';

export const newPhase = (): Phase => ({
  id: uid(),
  name: 'Silence',
  duration: 300,
  type: 'silent',
  breathing: { pattern: 'square', inhale: 4, hold: 4, exhale: 4, holdAfterExhale: 4 },
  intervalSeconds: 60,
});

export const createPreset = (): Preset => {
  const p: Preset = {
    id: uid(),
    name: 'My session',
    icon: 'sparkle',
    totalDuration: 300,
    phases: [newPhase()],
    bellSound: 'crystal',
    createdAt: Date.now(),
  };
  store.savePreset(p);
  return p;
};
