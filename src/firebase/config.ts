import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, indexedDBLocalPersistence, browserLocalPersistence } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  memoryLocalCache,
  type Firestore,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyALUloNt0HWTMeP4IARvRMS9JY-R5_NnFM',
  authDomain: 'nistha-passi-core.firebaseapp.com',
  projectId: 'nistha-passi-core',
  storageBucket: 'nistha-passi-core.firebasestorage.app',
  messagingSenderId: '299692286010',
  appId: '1:299692286010:web:a5cb437b9dd63d83aa5503',
  measurementId: 'G-Q9WJF89G55',
};

const app = initializeApp(firebaseConfig);

/** The Firebase project is shared with other apps, so all of this app's data is namespaced here. */
export const USERS_COLLECTION = 'meditation_users';

// Explicit persistence works the same in browsers, Capacitor WebViews and Electron
const makeAuth = () => {
  try {
    return initializeAuth(app, { persistence: [indexedDBLocalPersistence, browserLocalPersistence] });
  } catch {
    return getAuth(app);
  }
};
export const auth = makeAuth();

// Offline-first: writes made without a connection are queued in IndexedDB and
// sent automatically when the device comes back online.
const makeDb = (): Firestore => {
  try {
    return initializeFirestore(app, {
      ignoreUndefinedProperties: true,
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
  } catch {
    return initializeFirestore(app, { ignoreUndefinedProperties: true, localCache: memoryLocalCache() });
  }
};
export const db = makeDb();

export default app;
