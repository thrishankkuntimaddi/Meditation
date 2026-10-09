/**
 * Cloud sync — mirrors the local store to Firestore for signed-in users.
 *
 *   meditation_users/{uid}/presets/{presetId}     last-write-wins on updatedAt, tombstones for deletes
 *   meditation_users/{uid}/sessions/{sessionId}   append-only, id-deduplicated
 *   meditation_users/{uid}/meta/settings          shared preferences (not device name)
 *
 * Per-user subcollections need no composite index (the old top-level
 * `sessions` query did, and silently returned nothing without it). Legacy rows
 * from that collection are imported once.
 */
import {
  collection, doc, setDoc, onSnapshot, getDocs, query, where, orderBy, limit,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, USERS_COLLECTION } from '../firebase/config';
import { store } from './store';
import type { Preset, Session, Settings } from '../types';

export type SyncStatus =
  | { state: 'off' }
  | { state: 'syncing' }
  | { state: 'synced'; at: number }
  | { state: 'offline' }
  | { state: 'error'; message: string };

let status: SyncStatus = { state: 'off' };
const statusListeners = new Set<() => void>();
const setStatus = (s: SyncStatus) => { status = s; statusListeners.forEach(l => l()); };

export const syncStatus = {
  get: () => status,
  subscribe(l: () => void) { statusListeners.add(l); return () => { statusListeners.delete(l); }; },
};

const describeError = (e: unknown): string => {
  const code = (e as { code?: string })?.code ?? '';
  if (code === 'permission-denied') return 'Cloud access denied — Firestore security rules need updating (see README).';
  if (code === 'unavailable') return 'Cloud unavailable — changes are saved and will sync later.';
  return (e as Error)?.message ?? 'Sync failed';
};

const onError = (e: unknown) => {
  const code = (e as { code?: string })?.code;
  if (code === 'unavailable') setStatus({ state: 'offline' });
  else setStatus({ state: 'error', message: describeError(e) });
};

const sessionSig = (s: Session) => `${Math.round(s.timestamp / 1000)}|${s.presetName}`;

export function startSync(uid: string): () => void {
  const base = doc(db, USERS_COLLECTION, uid);
  const presetsCol = collection(base, 'presets');
  const sessionsCol = collection(base, 'sessions');
  const settingsDoc = doc(base, 'meta', 'settings');
  const unsubs: Unsubscribe[] = [];
  const presetTimers = new Map<string, ReturnType<typeof setTimeout>>();
  let firstPresets = true;
  let firstSessions = true;
  let firstSettings = true;

  setStatus({ state: 'syncing' });
  const markSynced = () => setStatus({ state: 'synced', at: Date.now() });

  const push = (p: Promise<unknown>) => p.then(markSynced).catch(onError);

  const pushPreset = (p: Preset) => push(setDoc(doc(presetsCol, p.id), p));
  const pushSession = (s: Session) => push(setDoc(doc(sessionsCol, s.id), { ...s, userId: uid }));
  const pushSettings = (s: Settings) => {
    const { deviceName: _deviceName, ...shared } = s;
    return push(setDoc(settingsDoc, shared));
  };

  // ── Presets ──
  unsubs.push(onSnapshot(presetsCol, snap => {
    const remote = snap.docs.map(d => d.data() as Preset);
    store.mergeRemotePresets(remote);
    if (firstPresets) {
      firstPresets = false;
      // Upload anything local that the cloud doesn't have, or has an older copy of
      const remoteById = new Map(remote.map(p => [p.id, p]));
      for (const local of store.getState().presets) {
        const r = remoteById.get(local.id);
        if (!r || (local.updatedAt ?? 0) > (r.updatedAt ?? 0)) pushPreset(local);
      }
    }
    if (!snap.metadata.fromCache) markSynced();
  }, onError));

  // ── Sessions ──
  unsubs.push(onSnapshot(query(sessionsCol, orderBy('timestamp', 'desc'), limit(1000)), snap => {
    const remote = snap.docs.map(d => ({ ...(d.data() as Session), id: d.id }));
    store.mergeRemoteSessions(remote);
    if (firstSessions) {
      firstSessions = false;
      const ids = new Set(remote.map(s => s.id));
      const sigs = new Set(remote.map(sessionSig));
      for (const s of store.getState().sessions) {
        if (!ids.has(s.id) && !sigs.has(sessionSig(s))) pushSession(s);
      }
      importLegacy(uid).catch(() => { /* legacy collection may be unreadable — not fatal */ });
    }
    if (!snap.metadata.fromCache) markSynced();
  }, onError));

  // ── Settings ──
  unsubs.push(onSnapshot(settingsDoc, snap => {
    if (snap.exists()) store.mergeRemoteSettings(snap.data() as Settings);
    if (firstSettings) {
      firstSettings = false;
      const local = store.getState().settings;
      const remoteAt = snap.exists() ? ((snap.data() as Settings).updatedAt ?? 0) : -1;
      if ((local.updatedAt ?? 0) > remoteAt) pushSettings(local);
    }
  }, onError));

  // ── Local edits → cloud ──
  unsubs.push(store.onLocalChange(change => {
    if (change.type === 'preset') {
      // Debounce: editing a name or stepper shouldn't write on every keystroke
      const id = change.preset.id;
      clearTimeout(presetTimers.get(id));
      presetTimers.set(id, setTimeout(() => {
        presetTimers.delete(id);
        const latest = store.getState().presets.find(p => p.id === id);
        if (latest) pushPreset(latest);
      }, 700));
    }
    else if (change.type === 'session') pushSession(change.session);
    else pushSettings(change.settings);
  }));

  return () => {
    // Flush pending preset edits before stopping
    presetTimers.forEach((t, id) => {
      clearTimeout(t);
      const latest = store.getState().presets.find(p => p.id === id);
      if (latest) pushPreset(latest);
    });
    presetTimers.clear();
    unsubs.forEach(u => u());
    setStatus({ state: 'off' });
  };
}

/** One-time import of sessions saved by the original app version. */
async function importLegacy(uid: string) {
  const flag = `meditation_legacy_imported_${uid}`;
  try { if (localStorage.getItem(flag)) return; } catch { return; }
  const snap = await getDocs(query(collection(db, 'sessions'), where('userId', '==', uid)));
  const legacy: Session[] = snap.docs.map(d => {
    const data = d.data() as Session;
    return {
      id: `legacy_${d.id}`,
      timestamp: data.timestamp,
      duration: data.duration,
      presetName: data.presetName,
      completed: !!data.completed,
      kind: 'meditation',
    };
  });
  const before = new Set(store.getState().sessions.map(s => s.id));
  store.mergeRemoteSessions(legacy);
  // Push the ones that were actually new into the per-user collection
  for (const s of store.getState().sessions) {
    if (!before.has(s.id) && s.id.startsWith('legacy_')) {
      await setDoc(doc(db, USERS_COLLECTION, uid, 'sessions', s.id), { ...s, userId: uid });
    }
  }
  try { localStorage.setItem(flag, '1'); } catch { /* ignore */ }
}
