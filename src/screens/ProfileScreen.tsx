import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { signIn, signUp, signOutUser } from '../firebase/auth';
import { soundEngine } from '../engines/SoundEngine';
import { usePWAUpdate } from '../hooks/usePWAUpdate';
import type { BellSound } from '../types';

const ProfileScreen: React.FC = () => {
  const { user } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [bell, setBell] = useState<BellSound>('crystal');
  const { updateAvailable, updateApp } = usePWAUpdate();

  const handleAuth = async () => {
    setError('');
    setLoading(true);
    try {
      if (mode === 'signup') {
        await signUp(email, password, name);
      } else {
        await signIn(email, password);
      }
    } catch (e: any) {
      setError(e.message?.replace('Firebase: ', '').replace(/ \(auth\/.*\)/, '') ?? 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const previewBell = (b: BellSound) => {
    soundEngine.unlock();
    soundEngine.setBellType(b);
    soundEngine.playBell();
    setBell(b);
  };

  if (user) {
    return (
      <div className="flex flex-col min-h-screen bg-stone-50" style={{ paddingBottom: 88 }}>
        <div className="px-6 pt-14 pb-6">
          <p className="text-xs text-stone-400 tracking-widest uppercase mb-1" style={{ letterSpacing: '0.2em' }}>Profile</p>
          <h2 className="text-2xl font-light text-stone-700">
            {user.displayName ?? 'Practitioner'}
          </h2>
          <p className="text-sm text-stone-400 mt-1">{user.email}</p>
        </div>

        {/* Bell preview */}
        <div className="px-6 mb-6">
          <p className="text-xs text-stone-400 uppercase tracking-widest mb-3" style={{ letterSpacing: '0.15em' }}>
            Bell sound preview
          </p>
          <div className="flex gap-2">
            {(['crystal', 'bowl', 'chime'] as BellSound[]).map(b => (
              <button
                key={b}
                id={`profile-bell-${b}`}
                onClick={() => previewBell(b)}
                className="flex-1 py-3 rounded-2xl text-sm font-medium transition-all"
                style={{
                  background: bell === b ? '#44403C' : '#F5F5F4',
                  color: bell === b ? '#FAFAF9' : '#78716C',
                  border: `1.5px solid ${bell === b ? '#44403C' : 'rgba(120,113,108,0.15)'}`,
                  cursor: 'pointer',
                }}
              >
                {b.charAt(0).toUpperCase() + b.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* About */}
        <div className="px-6 mb-6">
          <div className="p-4 rounded-2xl" style={{ background: '#F5F5F4' }}>
            <p className="text-sm text-stone-500 font-medium mb-1">Nistha</p>
            <p className="text-xs text-stone-400">
              A calm meditation companion. Synthesized bells, drift-free timing, offline-ready.
            </p>
          </div>
        </div>

        {/* Update App */}
        <div className="px-6 mb-3">
          <button
            id="update-app-profile-btn"
            onClick={updateApp}
            className="w-full py-4 rounded-2xl text-sm font-medium flex items-center justify-center gap-2 transition-all"
            style={{
              background: updateAvailable ? '#1C1917' : '#F5F5F4',
              color: updateAvailable ? '#FAFAF9' : '#A8A29E',
              border: updateAvailable ? 'none' : '1.5px solid rgba(120,113,108,0.18)',
              cursor: updateAvailable ? 'pointer' : 'default',
            }}
          >
            {updateAvailable && (
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: '#86EFAC', flexShrink: 0,
                boxShadow: '0 0 6px rgba(134,239,172,0.6)',
                display: 'inline-block',
              }} />
            )}
            {updateAvailable ? 'Update App — New version ready' : 'App is up to date'}
          </button>
        </div>

        {/* Sign out */}
        <div className="px-6">
          <button
            id="signout-btn"
            onClick={signOutUser}
            className="w-full py-4 rounded-2xl text-sm font-medium"
            style={{ background: 'transparent', color: '#A8A29E', border: '1.5px solid rgba(120,113,108,0.18)', cursor: 'pointer' }}
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-stone-50" style={{ paddingBottom: 88 }}>
      <div className="px-6 pt-14 pb-8">
        <p className="text-xs text-stone-400 tracking-widest uppercase mb-1" style={{ letterSpacing: '0.2em' }}>Profile</p>
        <h2 className="text-2xl font-light text-stone-700">
          {mode === 'signin' ? 'Welcome back' : 'Create account'}
        </h2>
        <p className="text-sm text-stone-400 mt-1">
          Sign in to sync your sessions across devices.
        </p>
      </div>

      <div className="px-6 flex flex-col gap-4">
        {/* Toggle */}
        <div
          className="flex rounded-2xl p-1"
          style={{ background: '#F5F5F4', border: '1px solid rgba(120,113,108,0.1)' }}
        >
          {(['signin', 'signup'] as const).map(m => (
            <button
              key={m}
              id={`auth-mode-${m}`}
              onClick={() => { setMode(m); setError(''); }}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                background: mode === m ? '#fff' : 'transparent',
                color: mode === m ? '#44403C' : '#A8A29E',
                border: mode === m ? '1px solid rgba(120,113,108,0.15)' : 'none',
                cursor: 'pointer',
                boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              {m === 'signin' ? 'Sign in' : 'Sign up'}
            </button>
          ))}
        </div>

        {/* Name (signup only) */}
        {mode === 'signup' && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-stone-400">Name</label>
            <input
              id="auth-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name"
              className="w-full px-4 py-3.5 rounded-2xl text-sm text-stone-700 outline-none transition-colors"
              style={{ background: '#F5F5F4', border: '1.5px solid rgba(120,113,108,0.15)' }}
            />
          </div>
        )}

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-stone-400">Email</label>
          <input
            id="auth-email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-4 py-3.5 rounded-2xl text-sm text-stone-700 outline-none"
            style={{ background: '#F5F5F4', border: '1.5px solid rgba(120,113,108,0.15)' }}
          />
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-stone-400">Password</label>
          <input
            id="auth-password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-4 py-3.5 rounded-2xl text-sm text-stone-700 outline-none"
            style={{ background: '#F5F5F4', border: '1.5px solid rgba(120,113,108,0.15)' }}
            onKeyDown={e => e.key === 'Enter' && handleAuth()}
          />
        </div>

        {/* Error */}
        {error && (
          <p className="text-xs text-red-400 px-1">{error}</p>
        )}

        {/* Submit */}
        <button
          id="auth-submit-btn"
          onClick={handleAuth}
          disabled={loading || !email || !password}
          className="w-full py-4 rounded-2xl text-sm font-medium tracking-wider transition-all disabled:opacity-40"
          style={{ background: '#1C1917', color: '#FAFAF9', border: 'none', cursor: 'pointer', letterSpacing: '0.1em' }}
        >
          {loading ? '...' : mode === 'signin' ? 'SIGN IN' : 'CREATE ACCOUNT'}
        </button>

        <p className="text-xs text-stone-400 text-center">
          Sessions are saved locally even without an account.
        </p>
      </div>
    </div>
  );
};

export default ProfileScreen;
