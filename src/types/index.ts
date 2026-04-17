export type PhaseType = 'breathing' | 'interval' | 'silent';
export type BreathPattern = 'square' | 'triangle';
export type BellSound = 'crystal' | 'bowl' | 'chime';
export type BreathStep = 'inhale' | 'hold' | 'exhale' | 'holdAfterExhale';

export interface BreathingConfig {
  pattern: BreathPattern;
  inhale: number;       // seconds
  hold: number;         // seconds
  exhale: number;       // seconds
  holdAfterExhale: number; // seconds (0 for triangle)
}

export interface Phase {
  id: string;
  name: string;
  duration: number;     // seconds
  type: PhaseType;
  breathing?: BreathingConfig;
  intervalSeconds?: number;
}

export interface Preset {
  id: string;
  name: string;
  totalDuration: number; // seconds
  phases: Phase[];
  bellSound: BellSound;
  createdAt: number;
}

export interface Session {
  id: string;
  userId: string;
  timestamp: number;
  duration: number;     // seconds actually completed
  presetName: string;
  completed: boolean;
}

export interface TimerState {
  running: boolean;
  paused: boolean;
  elapsed: number;      // ms
  total: number;        // ms
}

export interface SessionState {
  phase: Phase | null;
  phaseIndex: number;
  phaseElapsed: number; // seconds
  breathStep: BreathStep | null;
  breathStepElapsed: number;
  breathCycle: number;
}

export type Screen = 'home' | 'editor' | 'session' | 'history' | 'profile';
