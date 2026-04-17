import type { Preset, Session } from '../types';

const PRESETS_KEY = 'nistha_presets';
const SESSIONS_KEY = 'nistha_sessions';
const OFFLINE_QUEUE_KEY = 'nistha_offline_queue';
const STREAK_KEY = 'nistha_streak';
const LAST_SESSION_DATE_KEY = 'nistha_last_session_date';

// ─── Presets ──────────────────────────────────────────────────────────────────

export const savePreset = (preset: Preset): void => {
  const presets = loadPresets();
  const idx = presets.findIndex(p => p.id === preset.id);
  if (idx >= 0) presets[idx] = preset;
  else presets.push(preset);
  localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
};

export const loadPresets = (): Preset[] => {
  try {
    return JSON.parse(localStorage.getItem(PRESETS_KEY) || '[]');
  } catch { return []; }
};

export const deletePreset = (id: string): void => {
  const presets = loadPresets().filter(p => p.id !== id);
  localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
};

// ─── Sessions (local cache) ────────────────────────────────────────────────────

export const saveSessionLocally = (session: Session): void => {
  const sessions = loadLocalSessions();
  sessions.unshift(session);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions.slice(0, 200)));
};

export const loadLocalSessions = (): Session[] => {
  try {
    return JSON.parse(localStorage.getItem(SESSIONS_KEY) || '[]');
  } catch { return []; }
};

// ─── Offline Queue (for Firebase sync) ────────────────────────────────────────

export const getOfflineQueue = (): Omit<Session, 'id'>[] => {
  try {
    return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
  } catch { return []; }
};

export const addToOfflineQueue = (session: Omit<Session, 'id'>): void => {
  const queue = getOfflineQueue();
  queue.push(session);
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
};

export const clearOfflineQueue = (): void => {
  localStorage.removeItem(OFFLINE_QUEUE_KEY);
};

// ─── Streak Tracking ──────────────────────────────────────────────────────────

export const updateStreak = (): number => {
  const today = new Date().toDateString();
  const lastDate = localStorage.getItem(LAST_SESSION_DATE_KEY);
  let streak = parseInt(localStorage.getItem(STREAK_KEY) || '0', 10);

  if (lastDate === today) return streak; // Already recorded today
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  if (lastDate === yesterday) streak += 1;
  else if (lastDate !== today) streak = 1;

  localStorage.setItem(STREAK_KEY, String(streak));
  localStorage.setItem(LAST_SESSION_DATE_KEY, today);
  return streak;
};

export const getStreak = (): number => {
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  const lastDate = localStorage.getItem(LAST_SESSION_DATE_KEY);
  if (lastDate !== today && lastDate !== yesterday) return 0;
  return parseInt(localStorage.getItem(STREAK_KEY) || '0', 10);
};
