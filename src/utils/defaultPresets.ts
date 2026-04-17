import type { Preset } from '../types';

const id = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

export const DEFAULT_PRESETS: Preset[] = [
  {
    id: id(),
    name: 'Morning',
    totalDuration: 600, // 10 min
    bellSound: 'crystal',
    createdAt: Date.now(),
    phases: [
      {
        id: id(),
        name: 'Breathing',
        duration: 180,
        type: 'breathing',
        breathing: {
          pattern: 'square',
          inhale: 4,
          hold: 4,
          exhale: 4,
          holdAfterExhale: 4,
        },
      },
      {
        id: id(),
        name: 'Stillness',
        duration: 420,
        type: 'interval',
        intervalSeconds: 60,
      },
    ],
  },
  {
    id: id(),
    name: 'Evening',
    totalDuration: 900, // 15 min
    bellSound: 'bowl',
    createdAt: Date.now(),
    phases: [
      {
        id: id(),
        name: 'Breathing',
        duration: 300,
        type: 'breathing',
        breathing: {
          pattern: 'triangle',
          inhale: 4,
          hold: 7,
          exhale: 8,
          holdAfterExhale: 0,
        },
      },
      {
        id: id(),
        name: 'Interval',
        duration: 300,
        type: 'interval',
        intervalSeconds: 60,
      },
      {
        id: id(),
        name: 'Silence',
        duration: 300,
        type: 'silent',
      },
    ],
  },
  {
    id: id(),
    name: 'Night',
    totalDuration: 600, // 10 min
    bellSound: 'bowl',
    createdAt: Date.now(),
    phases: [
      {
        id: id(),
        name: 'Deep Breathing',
        duration: 600,
        type: 'breathing',
        breathing: {
          pattern: 'triangle',
          inhale: 4,
          hold: 7,
          exhale: 8,
          holdAfterExhale: 0,
        },
      },
    ],
  },
  {
    id: id(),
    name: 'Custom',
    totalDuration: 300,
    bellSound: 'chime',
    createdAt: Date.now(),
    phases: [
      {
        id: id(),
        name: 'Phase 1',
        duration: 300,
        type: 'silent',
      },
    ],
  },
];
