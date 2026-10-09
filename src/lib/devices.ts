/**
 * Device presence — every open copy of the app checks in every few minutes, so
 * you can see which of your devices are listening (and will go silent when
 * you meditate somewhere else).
 *
 *   meditation_users/{uid}/devices/{deviceId}
 */
import { collection, deleteDoc, doc, onSnapshot, setDoc, type Unsubscribe } from 'firebase/firestore';
import { db, USERS_COLLECTION } from '../firebase/config';
import { getDeviceId, store } from './store';
import { native, platform, getDesktopInfo, type FocusCapabilities } from '../native';

export interface DeviceInfo {
  id: string;
  name: string;
  platform: string;     // android | ios | macos | windows | linux | web
  appVersion: string;
  lastSeen: number;
  canSilence: 'full' | 'partial' | 'app-only';
}

export const ONLINE_WINDOW_MS = 6 * 60 * 1000;
const HEARTBEAT_MS = 4 * 60 * 1000;

let devices: DeviceInfo[] = [];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(l => l());

export const deviceList = {
  get: () => devices,
  subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; },
};

const describeSilence = (caps: FocusCapabilities): DeviceInfo['canSilence'] =>
  caps.systemMute && caps.systemDnd === 'granted' ? 'full' : caps.systemMute ? 'partial' : 'app-only';

export function startPresence(uid: string): () => void {
  const col = collection(db, USERS_COLLECTION, uid, 'devices');
  const me = doc(col, getDeviceId());

  const checkIn = async () => {
    if (document.visibilityState === 'hidden' && platform !== 'desktop') return;
    const caps = await native.capabilities();
    const os = platform === 'desktop' ? (await getDesktopInfo()?.catch(() => null))?.os ?? 'desktop' : platform;
    const info: DeviceInfo = {
      id: getDeviceId(),
      name: store.getState().settings.deviceName,
      platform: os,
      appVersion: __APP_VERSION__,
      lastSeen: Date.now(),
      canSilence: describeSilence(caps),
    };
    setDoc(me, info).catch(() => {});
  };

  checkIn();
  const timer = setInterval(checkIn, HEARTBEAT_MS);
  const onVisible = () => { if (document.visibilityState === 'visible') checkIn(); };
  document.addEventListener('visibilitychange', onVisible);
  // Re-announce when the device is renamed
  let name = store.getState().settings.deviceName;
  const unsubStore = store.subscribe(() => {
    const next = store.getState().settings.deviceName;
    if (next !== name) { name = next; checkIn(); }
  });

  const unsub: Unsubscribe = onSnapshot(col, snap => {
    devices = snap.docs.map(d => d.data() as DeviceInfo).sort((a, b) => b.lastSeen - a.lastSeen);
    emit();
  }, () => {});

  return () => {
    clearInterval(timer);
    document.removeEventListener('visibilitychange', onVisible);
    unsubStore();
    unsub();
    devices = [];
    emit();
  };
}

export const forgetDevice = (uid: string, id: string) =>
  deleteDoc(doc(db, USERS_COLLECTION, uid, 'devices', id)).catch(() => {});
