import type { Preset } from '../types';

/**
 * Built-in presets. Ids are stable so the same defaults on two devices merge
 * into one when synced instead of duplicating.
 */
export const DEFAULT_PRESETS: Preset[] = [
  {
    id: 'default-morning',
    name: 'Morning',
    icon: 'sunrise',
    totalDuration: 600,
    bellSound: 'crystal',
    createdAt: 1,
    phases: [
      {
        id: 'default-morning-1',
        name: 'Box breathing',
        duration: 180,
        type: 'breathing',
        breathing: { pattern: 'square', inhale: 4, hold: 4, exhale: 4, holdAfterExhale: 4 },
      },
      { id: 'default-morning-2', name: 'Stillness', duration: 420, type: 'interval', intervalSeconds: 60 },
    ],
  },
  {
    id: 'default-evening',
    name: 'Evening',
    icon: 'sunset',
    totalDuration: 900,
    bellSound: 'bowl',
    createdAt: 2,
    phases: [
      {
        id: 'default-evening-1',
        name: 'Relaxing breath',
        duration: 300,
        type: 'breathing',
        breathing: { pattern: 'triangle', inhale: 4, hold: 7, exhale: 8, holdAfterExhale: 0 },
      },
      { id: 'default-evening-2', name: 'Interval', duration: 300, type: 'interval', intervalSeconds: 60 },
      { id: 'default-evening-3', name: 'Silence', duration: 300, type: 'silent' },
    ],
  },
  {
    id: 'default-night',
    name: 'Night',
    icon: 'moon',
    totalDuration: 600,
    bellSound: 'bowl',
    createdAt: 3,
    phases: [
      {
        id: 'default-night-1',
        name: 'Deep breathing',
        duration: 600,
        type: 'breathing',
        breathing: { pattern: 'triangle', inhale: 4, hold: 7, exhale: 8, holdAfterExhale: 0 },
      },
    ],
  },
  {
    id: 'default-silent',
    name: 'Silent sit',
    icon: 'leaf',
    totalDuration: 1200,
    bellSound: 'chime',
    createdAt: 4,
    phases: [{ id: 'default-silent-1', name: 'Silence', duration: 1200, type: 'silent' }],
  },
];
