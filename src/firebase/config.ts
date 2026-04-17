import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyALUloNt0HWTMeP4IARvRMS9JY-R5_NnFM",
  authDomain: "nistha-passi-core.firebaseapp.com",
  projectId: "nistha-passi-core",
  storageBucket: "nistha-passi-core.firebasestorage.app",
  messagingSenderId: "299692286010",
  appId: "1:299692286010:web:a5cb437b9dd63d83aa5503",
  measurementId: "G-Q9WJF89G55"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
