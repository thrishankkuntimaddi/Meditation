import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';
import type { Session } from '../types';
import { getOfflineQueue, clearOfflineQueue, saveSessionLocally } from '../utils/localStorage';

const SESSIONS_COL = 'sessions';

export const saveSession = async (session: Omit<Session, 'id'>): Promise<void> => {
  // Always persist locally first
  saveSessionLocally({ ...session, id: `local_${Date.now()}` });

  try {
    await addDoc(collection(db, SESSIONS_COL), {
      ...session,
      createdAt: serverTimestamp(),
    });
  } catch (_) {
    // Offline — already saved locally; will sync on reconnect
  }
};

export const syncOfflineQueue = async (userId: string): Promise<void> => {
  const queue = getOfflineQueue();
  if (queue.length === 0) return;
  await Promise.all(
    queue
      .filter(s => s.userId === userId)
      .map(s =>
        addDoc(collection(db, SESSIONS_COL), {
          ...s,
          createdAt: serverTimestamp(),
        }).catch(() => {})
      )
  );
  clearOfflineQueue();
};

export const fetchSessions = async (userId: string): Promise<Session[]> => {
  try {
    const q = query(
      collection(db, SESSIONS_COL),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Session));
  } catch (_) {
    return [];
  }
};
