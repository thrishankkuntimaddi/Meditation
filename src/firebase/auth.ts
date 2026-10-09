import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type User,
} from 'firebase/auth';
import { auth } from './config';

export const signUp = async (email: string, password: string, displayName?: string): Promise<User> => {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  if (displayName?.trim()) await updateProfile(cred.user, { displayName: displayName.trim() });
  return cred.user;
};

export const signIn = async (email: string, password: string): Promise<User> => {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  return cred.user;
};

export const resetPassword = (email: string) => sendPasswordResetEmail(auth, email.trim());

export const signOutUser = () => signOut(auth);

export const onAuthChange = (callback: (user: User | null) => void) => onAuthStateChanged(auth, callback);

const AUTH_MESSAGES: Record<string, string> = {
  'auth/invalid-email': 'That email address looks invalid.',
  'auth/missing-password': 'Please enter your password.',
  'auth/weak-password': 'Password should be at least 6 characters.',
  'auth/email-already-in-use': 'An account with this email already exists — sign in instead.',
  'auth/invalid-credential': 'Email or password is incorrect.',
  'auth/wrong-password': 'Email or password is incorrect.',
  'auth/user-not-found': 'No account found for this email.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'auth/network-request-failed': 'No connection. Check your internet and try again.',
};

export const authErrorMessage = (e: unknown): string => {
  const code = (e as { code?: string })?.code ?? '';
  return AUTH_MESSAGES[code] ?? 'Something went wrong. Please try again.';
};
