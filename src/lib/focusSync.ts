/**
 * Focus sync — "one device meditates, every device goes quiet".
 *
 * While a session runs, the meditating instance publishes a small focus doc.
 * Every other open instance of the app (other devices via Firestore, other
 * windows/tabs on the same device via BroadcastChannel) sees it, silences all
 * app sounds, asks the native shell to mute / enable Do Not Disturb, and shows
 * a calm "meditation in progress" screen until the session ends.
 *
 * The doc carries `endsAt`, so if the meditating device dies mid-session the
 * others release themselves automatically when the time is up.
 */
import { doc, onSnapshot, setDoc, type Unsubscribe } from 'firebase/firestore';
import { db, USERS_COLLECTION } from '../firebase/config';
import { uid as makeId, getDeviceId } from './store';

export interface FocusState {
  active: boolean;
  instanceId: string;   // this tab/window
  deviceId: string;     // this device
  deviceName: string;
  presetName: string;
  startedAt: number;
  endsAt: number | null; // wall clock; null while paused
  paused: boolean;
  remainingSec: number;
  heartbeat: number;
}

const PAUSED_STALE_MS = 15 * 60 * 1000;
const END_GRACE_MS = 5000;

/** Is a focus doc from someone else still in force? */
export const isFocusLive = (f: FocusState | null, now: number): f is FocusState => {
  if (!f || !f.active) return false;
  if (f.endsAt) return now < f.endsAt + END_GRACE_MS;
  return now - f.heartbeat < PAUSED_STALE_MS;
};

export const instanceId = makeId();
const deviceId = getDeviceId();

let remote: FocusState | null = null;
let ownState: FocusState | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(l => l());

let dismissedKey = '';
const keyOf = (f: FocusState) => `${f.instanceId}:${f.startedAt}`;

const setRemote = (f: FocusState | null) => {
  // Ignore our own echo, and a session the user explicitly unlocked
  if (f && (f.instanceId === instanceId || keyOf(f) === dismissedKey)) f = null;
  const same = JSON.stringify(f) === JSON.stringify(remote);
  if (same) return;
  remote = f;
  emit();
};

// ── Same-device transport: BroadcastChannel ──
type Msg = { type: 'state'; state: FocusState | null; from: string } | { type: 'query'; from: string };
const channel: BroadcastChannel | null =
  typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('meditation-focus') : null;

channel?.addEventListener('message', (e: MessageEvent<Msg>) => {
  const msg = e.data;
  if (!msg || msg.from === instanceId) return;
  if (msg.type === 'query') {
    if (ownState) channel.postMessage({ type: 'state', state: ownState, from: instanceId } satisfies Msg);
    return;
  }
  if (msg.state === null) {
    if (remote && remote.instanceId === msg.from) setRemote(null);
  } else {
    setRemote(msg.state);
  }
});
channel?.postMessage({ type: 'query', from: instanceId } satisfies Msg);

// ── Cross-device transport: Firestore ──
let focusDocUnsub: Unsubscribe | null = null;
let currentUid: string | null = null;

export function connectFocusCloud(uid: string | null) {
  if (uid === currentUid) return;
  focusDocUnsub?.();
  focusDocUnsub = null;
  currentUid = uid;
  if (!uid) return;
  const ref = doc(db, USERS_COLLECTION, uid, 'meta', 'focus');
  focusDocUnsub = onSnapshot(ref, snap => {
    const data = snap.exists() ? (snap.data() as FocusState) : null;
    if (!data || !data.active) {
      // Only clear if the cleared doc belongs to whoever we were following
      if (remote && (!data || data.instanceId === remote.instanceId)) setRemote(null);
      return;
    }
    setRemote(data);
  }, () => { /* rules or network — local focus still works */ });
  if (ownState) writeCloud(ownState);
}

const writeCloud = (state: FocusState) => {
  if (!currentUid) return;
  setDoc(doc(db, USERS_COLLECTION, currentUid, 'meta', 'focus'), state).catch(() => {});
};

// ── Publishing (from the meditating instance) ──
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

export function publishFocus(state: Omit<FocusState, 'instanceId' | 'deviceId' | 'heartbeat' | 'active'> | null) {
  if (state === null) {
    if (!ownState) return;
    ownState = { ...ownState, active: false, endsAt: null, heartbeat: Date.now() };
    channel?.postMessage({ type: 'state', state: null, from: instanceId } satisfies Msg);
    writeCloud(ownState);
    ownState = null;
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    heartbeatTimer = null;
    return;
  }
  ownState = { ...state, active: true, instanceId, deviceId, heartbeat: Date.now() };
  channel?.postMessage({ type: 'state', state: ownState, from: instanceId } satisfies Msg);
  writeCloud(ownState);
  if (!heartbeatTimer) {
    heartbeatTimer = setInterval(() => {
      if (!ownState) return;
      ownState = { ...ownState, heartbeat: Date.now() };
      writeCloud(ownState);
    }, 60_000);
  }
}

window.addEventListener('pagehide', () => {
  // Best effort: release other windows immediately if this one closes mid-session
  if (ownState) channel?.postMessage({ type: 'state', state: null, from: instanceId } satisfies Msg);
});

export const remoteFocus = {
  get: () => remote,
  subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; },
  /** Let the user override a focus lock they believe is stale. */
  dismiss() {
    if (remote) dismissedKey = keyOf(remote);
    setRemote(null);
  },
};
