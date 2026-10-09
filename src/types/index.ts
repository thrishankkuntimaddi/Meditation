export type PhaseType = 'breathing' | 'interval' | 'silent';
export type BreathPattern = 'square' | 'triangle';
export type BellSound = 'crystal' | 'bowl' | 'chime';
export type BreathStep = 'inhale' | 'hold' | 'exhale' | 'holdAfterExhale';
export type PresetIcon = 'sunrise' | 'sunset' | 'moon' | 'sparkle' | 'leaf' | 'wave';

export interface BreathingConfig {
  pattern: BreathPattern;
  inhale: number;          // seconds
  hold: number;            // seconds
  exhale: number;          // seconds
  holdAfterExhale: number; // seconds (ignored for triangle)
}

export interface Phase {
  id: string;
  name: string;
  duration: number;        // seconds
  type: PhaseType;
  breathing?: BreathingConfig;
  intervalSeconds?: number;
}

export interface Preset {
  id: string;
  name: string;
  totalDuration: number;   // seconds (derived from phases)
  phases: Phase[];
  bellSound: BellSound;
  icon?: PresetIcon;
  createdAt: number;
  updatedAt?: number;
  deleted?: boolean;       // tombstone, so deletions sync across devices
}

export type SessionKind = 'meditation' | 'breathing';

export interface Session {
  id: string;
  userId?: string;
  timestamp: number;       // when the session started
  duration: number;        // seconds actually practised
  plannedDuration?: number;
  presetName: string;
  kind?: SessionKind;
  completed: boolean;
  deviceName?: string;
}

export interface Settings {
  volume: number;          // 0..1
  breathCues: boolean;     // soft tone on every inhale / exhale change
  countdownSeconds: number;
  showFocusGuard: boolean;
  silenceOtherDevices: boolean;
  systemDnd: boolean;      // native only: toggle OS Do Not Disturb during a session
  deviceName: string;
  updatedAt?: number;
}

export type Screen = 'home' | 'editor' | 'session' | 'history' | 'profile';
