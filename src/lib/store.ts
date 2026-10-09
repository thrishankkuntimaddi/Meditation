/**
 * Local-first store.
 *
 * Everything lives in localStorage first (works offline, without an account),
 * and the sync layer mirrors it to Firestore when the user is signed in.
 * React subscribes through useSyncExternalStore (see hooks/useStore.ts).
 *
 * Storage keys are kept from the original app so existing data carries over.
 */
import type { Preset, Session, Settings } from '../types';
import { DEFAULT_PRESETS } from '../utils/defaultPresets';
import { totalDurationOf } from '../engines/PhaseManager';

const KEYS = {
  presets: 'nistha_presets',
  sessions: 'nistha_sessions',
  settings: 'meditation_settings',
  deviceId: 'meditation_device_id',
  seeded: 'meditation_seeded',
} as const;

export interface StoreState {
  presets: Preset[];     // includes tombstones (deleted: true)
  sessions: Session[];   // newest first
  settings: Settings;
}

export type LocalChange =
  | { type: 'preset'; preset: Preset }
  | { type: 'session'; session: Session }
  | { type: 'settings'; settings: Settings };

const read = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const write = (key: string, value: unknown) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota / private mode */ }
};

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export const getDeviceId = (): string => {
  let id = '';
  try { id = localStorage.getItem(KEYS.deviceId) ?? ''; } catch { /* ignore */ }
  if (!id) {
    id = uid();
    try { localStorage.setItem(KEYS.deviceId, id); } catch { /* ignore */ }
  }
  return id;
};

export const guessDeviceName = (): string => {
  const ua = navigator.userAgent;
  const isApp = '__TAURI_INTERNALS__' in window;
  if (/iPhone/i.test(ua)) return 'iPhone';
  if (/iPad/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1)) return 'iPad';
  if (/Android/i.test(ua)) return /Mobile/i.test(ua) ? 'Android phone' : 'Android tablet';
  if (/Macintosh|Mac OS X/i.test(ua)) return isApp ? 'Mac (app)' : 'Mac';
  if (/Windows/i.test(ua)) return isApp ? 'Windows PC (app)' : 'Windows PC';
  if (/Linux/i.test(ua)) return 'Linux';
  return 'This device';
};

export const DEFAULT_SETTINGS: Settings = {
  volume: 0.8,
  breathCues: true,
  countdownSeconds: 3,
  showFocusGuard: true,
  silenceOtherDevices: true,
  systemDnd: true,
  deviceName: '',
  theme: 'light',
  reminders: {
    meditation: { enabled: false, time: '07:00', days: [0, 1, 2, 3, 4, 5, 6] },
    breathing: { enabled: false, time: '15:00', days: [1, 2, 3, 4, 5] },
    tone: 'gentle',
    sound: false,
    skipIfPracticed: true,
  },
};

/** Fill in fields added in later versions (nested objects included). */
const withDefaults = (s: Partial<Settings>): Settings => ({
  ...DEFAULT_SETTINGS,
  ...s,
  reminders: {
    ...DEFAULT_SETTINGS.reminders,
    ...(s.reminders ?? {}),
    meditation: { ...DEFAULT_SETTINGS.reminders.meditation, ...(s.reminders?.meditation ?? {}) },
    breathing: { ...DEFAULT_SETTINGS.reminders.breathing, ...(s.reminders?.breathing ?? {}) },
  },
});

const normalisePreset = (p: Preset): Preset => ({
  ...p,
  totalDuration: totalDurationOf(p.phases ?? []),
  phases: p.phases ?? [],
});

const loadInitial = (): StoreState => {
  let presets = read<Preset[]>(KEYS.presets, []);
  let seeded = false;
  try { seeded = localStorage.getItem(KEYS.seeded) === '1' || presets.length > 0; } catch { /* ignore */ }
  if (!seeded) {
    presets = DEFAULT_PRESETS.map(p => ({ ...p, createdAt: Date.now(), updatedAt: 0 }));
    write(KEYS.presets, presets);
  }
  try { localStorage.setItem(KEYS.seeded, '1'); } catch { /* ignore */ }

  const settings = withDefaults(read<Partial<Settings>>(KEYS.settings, {}));
  if (!settings.deviceName) settings.deviceName = guessDeviceName();

  const sessions = read<Session[]>(KEYS.sessions, [])
    .filter(s => s && typeof s.timestamp === 'number')
    .sort((a, b) => b.timestamp - a.timestamp);

  return { presets: presets.map(normalisePreset), sessions, settings };
};

// ─── Store ────────────────────────────────────────────────────────────────────

let state: StoreState = loadInitial();
const listeners = new Set<() => void>();
const changeListeners = new Set<(c: LocalChange) => void>();

const emit = () => listeners.forEach(l => l());
const notifyChange = (c: LocalChange) => changeListeners.forEach(l => l(c));

const setState = (patch: Partial<StoreState>) => {
  state = { ...state, ...patch };
  if (patch.presets) write(KEYS.presets, state.presets);
  if (patch.sessions) write(KEYS.sessions, state.sessions.slice(0, 1000));
  if (patch.settings) write(KEYS.settings, state.settings);
  emit();
};

export const store = {
  getState: () => state,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  },
  /** The sync layer listens here to push local edits to the cloud. */
  onLocalChange(listener: (c: LocalChange) => void) {
    changeListeners.add(listener);
    return () => { changeListeners.delete(listener); };
  },

  // ── Presets ──
  savePreset(preset: Preset) {
    const p = normalisePreset({ ...preset, updatedAt: Date.now() });
    const presets = [...state.presets];
    const i = presets.findIndex(x => x.id === p.id);
    if (i >= 0) presets[i] = p; else presets.push(p);
    setState({ presets });
    notifyChange({ type: 'preset', preset: p });
  },
  deletePreset(id: string) {
    const existing = state.presets.find(p => p.id === id);
    if (!existing) return;
    const tomb: Preset = { ...existing, deleted: true, updatedAt: Date.now() };
    setState({ presets: state.presets.map(p => (p.id === id ? tomb : p)) });
    notifyChange({ type: 'preset', preset: tomb });
  },

  // ── Sessions ──
  addSession(session: Session) {
    if (state.sessions.some(s => s.id === session.id)) return;
    setState({ sessions: [session, ...state.sessions].sort((a, b) => b.timestamp - a.timestamp) });
    notifyChange({ type: 'session', session });
  },

  // ── Settings ──
  updateSettings(patch: Partial<Settings>) {
    const settings = { ...state.settings, ...patch, updatedAt: Date.now() };
    setState({ settings });
    // Device name and theme are per-device: never pushed to the cloud
    const { deviceName: _deviceName, theme: _theme, ...shared } = patch;
    if (Object.keys(shared).length > 0) notifyChange({ type: 'settings', settings });
  },

  /** Wipe everything on this device back to a fresh install (device id is kept). */
  resetLocal() {
    const keep = state.settings.deviceName;
    try {
      [KEYS.presets, KEYS.sessions, KEYS.settings, KEYS.seeded, 'meditation_home_mode']
        .forEach(k => localStorage.removeItem(k));
      Object.keys(localStorage)
        .filter(k => k.startsWith('meditation_legacy_imported_'))
        .forEach(k => localStorage.removeItem(k));
    } catch { /* ignore */ }
    const fresh = loadInitial();
    state = { ...fresh, settings: { ...fresh.settings, deviceName: keep } };
    write(KEYS.settings, state.settings);
    emit();
  },

  // ── Remote merges (from the sync layer; do not echo back) ──
  mergeRemotePresets(remote: Preset[]) {
    const byId = new Map(state.presets.map(p => [p.id, p]));
    let changed = false;
    for (const r of remote) {
      const local = byId.get(r.id);
      if (!local || (r.updatedAt ?? 0) > (local.updatedAt ?? 0)) {
        byId.set(r.id, normalisePreset(r));
        changed = true;
      }
    }
    if (changed) setState({ presets: [...byId.values()].sort((a, b) => a.createdAt - b.createdAt) });
  },
  mergeRemoteSessions(remote: Session[]) {
    const ids = new Set(state.sessions.map(s => s.id));
    // Legacy rows were saved with different local/remote ids — also dedupe on content
    const sig = (s: Session) => `${Math.round(s.timestamp / 1000)}|${s.presetName}`;
    const sigs = new Set(state.sessions.map(sig));
    const fresh = remote.filter(r => !ids.has(r.id) && !sigs.has(sig(r)));
    if (fresh.length === 0) return;
    setState({ sessions: [...state.sessions, ...fresh].sort((a, b) => b.timestamp - a.timestamp) });
  },
  mergeRemoteSettings(remote: Partial<Settings>) {
    if ((remote.updatedAt ?? 0) <= (state.settings.updatedAt ?? 0)) return;
    const { deviceName: _deviceName, theme: _theme, ...shared } = remote;
    setState({ settings: withDefaults({ ...state.settings, ...shared }) });
  },
};

// Keep other windows/tabs on this device in step (e.g. a session finished in another window)
window.addEventListener('storage', e => {
  if (e.key === KEYS.presets || e.key === KEYS.sessions || e.key === KEYS.settings) {
    const fresh = loadInitial();
    state = { ...fresh, settings: { ...fresh.settings, deviceName: state.settings.deviceName } };
    emit();
  }
});

export const visiblePresets =(presets: Preset[]) => presets.filter(p => !p.deleted);
