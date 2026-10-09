import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { onAuthChange } from '../firebase/auth';
import { startSync } from '../lib/sync';
import { connectFocusCloud } from '../lib/focusSync';
import { startPresence } from '../lib/devices';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => onAuthChange(u => {
    setUser(u);
    setLoading(false);
  }), []);

  // Cloud sync + cross-device focus run for as long as someone is signed in
  const uid = user?.uid ?? null;
  useEffect(() => {
    connectFocusCloud(uid);
    if (!uid) return;
    const stop = startSync(uid);
    const stopPresence = startPresence(uid);
    return () => {
      stop();
      stopPresence();
      connectFocusCloud(null);
    };
  }, [uid]);

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
