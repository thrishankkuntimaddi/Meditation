import type { BreathingConfig, Preset, BellSound } from '../types';

export interface BreathingExercise {
  id: string;
  name: string;
  tagline: string;
  description: string;
  breathing: BreathingConfig;
  bellSound: BellSound;
  defaultMinutes: number;
}

export const BREATHING_EXERCISES: BreathingExercise[] = [
  {
    id: 'box',
    name: 'Box breathing',
    tagline: 'Focus & composure',
    description: 'Equal counts in, hold, out, hold. Steadies attention and calms the nervous system.',
    breathing: { pattern: 'square', inhale: 4, hold: 4, exhale: 4, holdAfterExhale: 4 },
    bellSound: 'crystal',
    defaultMinutes: 5,
  },
  {
    id: '478',
    name: 'Relaxing breath',
    tagline: '4-7-8 · Relax & sleep',
    description: 'Inhale 4, hold 7, exhale slowly for 8. A long exhale that winds the body down.',
    breathing: { pattern: 'triangle', inhale: 4, hold: 7, exhale: 8, holdAfterExhale: 0 },
    bellSound: 'bowl',
    defaultMinutes: 3,
  },
  {
    id: 'coherent',
    name: 'Coherent',
    tagline: 'Balance',
    description: 'Five seconds in, five seconds out — about six breaths a minute, smooth and even.',
    breathing: { pattern: 'triangle', inhale: 5, hold: 0, exhale: 5, holdAfterExhale: 0 },
    bellSound: 'chime',
    defaultMinutes: 5,
  },
  {
    id: 'calm',
    name: 'Calming breath',
    tagline: 'Ease anxiety',
    description: 'Inhale 4, exhale 6. Lengthening the out-breath gently slows the heart.',
    breathing: { pattern: 'triangle', inhale: 4, hold: 0, exhale: 6, holdAfterExhale: 0 },
    bellSound: 'bowl',
    defaultMinutes: 5,
  },
  {
    id: 'energize',
    name: 'Energizing',
    tagline: 'Wake up',
    description: 'Inhale 6, hold 2, exhale 3 — fuller in-breaths to lift energy and alertness.',
    breathing: { pattern: 'triangle', inhale: 6, hold: 2, exhale: 3, holdAfterExhale: 0 },
    bellSound: 'crystal',
    defaultMinutes: 3,
  },
];

export const BREATH_MINUTE_OPTIONS = [1, 3, 5, 10];

export const patternLabel = (b: BreathingConfig) =>
  [b.inhale, b.hold, b.exhale, b.pattern === 'square' ? b.holdAfterExhale : 0]
    .filter((n, i) => n > 0 || i === 0 || i === 2)
    .join(' · ');

/** Turn a breathing exercise into a one-phase preset the session engine can run. */
export const exerciseToPreset = (ex: BreathingExercise, minutes: number): Preset => {
  const b = ex.breathing;
  const cycle = b.inhale + b.hold + b.exhale + (b.pattern === 'square' ? b.holdAfterExhale : 0);
  // Round up to whole breath cycles so the session ends at the end of an exhale
  const duration = Math.ceil((minutes * 60) / cycle) * cycle;
  return {
    id: `breath-${ex.id}`,
    name: ex.name,
    icon: 'wave',
    bellSound: ex.bellSound,
    totalDuration: duration,
    createdAt: 0,
    phases: [{ id: `breath-${ex.id}-1`, name: ex.name, duration, type: 'breathing', breathing: b }],
  };
};
