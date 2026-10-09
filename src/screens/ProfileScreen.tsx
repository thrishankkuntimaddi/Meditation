import React, { useState, useSyncExternalStore } from 'react';
import { useAuth } from '../context/AuthContext';
import { signIn, signUp, signOutUser, resetPassword, authErrorMessage } from '../firebase/auth';
import { usePWAUpdate } from '../hooks/usePWAUpdate';
import { useSettings, useSyncStatus } from '../hooks/useStore';
import { store } from '../lib/store';
import { platform, isNative } from '../native';
import { installPrompt, isIOS, isStandalone } from '../lib/install';
import { previewBell } from '../lib/bells';
import { soundEngine } from '../engines/SoundEngine';
import DataSection from '../components/settings/DataSection';
import FocusSection from '../components/settings/FocusSection';
import RemindersSection from '../components/settings/RemindersSection';
import AutostartRow from '../components/settings/AutostartRow';
import DownloadRow from '../components/settings/DownloadRow';
import {
  Button, Card, Field, Icon, Row, RowGroup, ScreenHeader, SectionLabel, Segmented, Stepper, Toggle,
} from '../components/ui';


// ─── Account ──────────────────────────────────────────────────────────────────

const AuthForm: React.FC = () => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setNotice(''); setLoading(true);
    try {
      if (mode === 'signup') await signUp(email, password, name);
      else await signIn(email, password);
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const forgot = async () => {
    setError(''); setNotice('');
    if (!email.trim()) { setError('Enter your email above first.'); return; }
    try {
      await resetPassword(email);
      setNotice('Password reset email sent. Check your inbox.');
    } catch (err) {
      setError(authErrorMessage(err));
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Segmented
        value={mode}
        onChange={m => { setMode(m); setError(''); setNotice(''); }}
        options={[{ value: 'signin', label: 'Sign in' }, { value: 'signup', label: 'Create account' }]}
      />
      {mode === 'signup' && (
        <Field id="auth-name" label="Name" icon="user" value={name} onChange={e => setName(e.target.value)}
          placeholder="Your name" autoComplete="name" />
      )}
      <Field id="auth-email" label="Email" icon="mail" type="email" value={email} onChange={e => setEmail(e.target.value)}
        placeholder="you@example.com" autoComplete="email" inputMode="email" />
      <Field id="auth-password" label="Password" icon="lock" type="password" value={password} onChange={e => setPassword(e.target.value)}
        placeholder="At least 6 characters" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} />

      {error && <p className="text-xs text-danger px-1" role="alert">{error}</p>}
      {notice && <p className="text-xs text-ok px-1" role="status">{notice}</p>}

      <Button id="auth-submit-btn" type="submit" variant="primary" size="lg" block disabled={loading || !email || !password}>
        {loading ? 'Please wait…' : mode === 'signin' ? 'SIGN IN' : 'CREATE ACCOUNT'}
      </Button>
      {mode === 'signin' && (
        <button type="button" onClick={forgot} className="self-center text-xs text-muted hover:text-ink2">
          Forgot password?
        </button>
      )}
    </form>
  );
};

const SyncBadge: React.FC = () => {
  const s = useSyncStatus();
  const map = {
    off: { icon: 'cloudOff', text: 'Sync off', cls: 'text-faint' },
    syncing: { icon: 'refresh', text: 'Syncing…', cls: 'text-muted' },
    synced: { icon: 'cloud', text: 'Synced', cls: 'text-ok' },
    offline: { icon: 'cloudOff', text: 'Offline — will sync later', cls: 'text-muted' },
    error: { icon: 'cloudOff', text: 'Sync problem', cls: 'text-danger' },
  } as const;
  const m = map[s.state];
  return (
    <div>
      <span className={`inline-flex items-center gap-1.5 text-xs ${m.cls}`}><Icon name={m.icon} size={14} /> {m.text}</span>
      {s.state === 'error' && <p className="mt-1 text-xs text-faint leading-relaxed">{s.message}</p>}
    </div>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────

const ProfileScreen: React.FC = () => {
  const { user, loading } = useAuth();
  const settings = useSettings();
  const { updateAvailable, updateApp } = usePWAUpdate();
  const canInstall = useSyncExternalStore(installPrompt.subscribe, installPrompt.available);
  const set = store.updateSettings;
  const volumePct = Math.round(settings.volume * 100);

  return (
    <div className="flex flex-col min-h-full nav-space">
      <ScreenHeader
        eyebrow="Profile"
        title={user ? (user.displayName || 'Practitioner') : 'Welcome'}
      />

      <div className="px-6 flex flex-col gap-7">
        {/* Account */}
        <section>
          {loading ? null : user ? (
            <Card className="p-4 flex items-center gap-3.5">
              <span className="w-12 h-12 rounded-full bg-ink2 text-bg flex items-center justify-center text-lg font-light">
                {(user.displayName || user.email || '?').charAt(0).toUpperCase()}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-ink2 truncate">{user.email}</p>
                <div className="mt-1"><SyncBadge /></div>
              </div>
            </Card>
          ) : (
            <>
              <p className="text-sm text-muted mb-5 leading-relaxed">
                Sign in to sync your presets and journey across your phone and computer — and to silence every device while you meditate.
              </p>
              <AuthForm />
              <p className="mt-4 text-xs text-faint text-center">Without an account, everything is saved on this device.</p>
            </>
          )}
        </section>

        {/* Appearance */}
        <section>
          <SectionLabel>Appearance</SectionLabel>
          <Segmented
            value={settings.theme}
            onChange={theme => set({ theme })}
            options={[
              { value: 'light', label: 'Light', icon: 'sun' },
              { value: 'dark', label: 'Dark', icon: 'moon' },
              { value: 'system', label: 'System', icon: 'devices' },
            ]}
          />
        </section>

        {/* Sound */}
        <section>
          <SectionLabel>Sound</SectionLabel>
          <RowGroup>
            <div className="px-4 py-3.5">
              <div className="flex items-center gap-3.5">
                <span className="w-9 h-9 rounded-xl bg-bg border border-line/10 flex items-center justify-center text-muted">
                  <Icon name={settings.volume === 0 ? 'volumeOff' : 'volume'} size={18} />
                </span>
                <span className="flex-1 text-sm text-ink2">Bell volume</span>
                <span className="text-xs text-faint tabular-nums">{volumePct}%</span>
              </div>
              <input
                type="range" min={0} max={100} step={5} value={volumePct}
                aria-label="Bell volume"
                style={{ '--fill': `${volumePct}%` } as React.CSSProperties}
                onChange={e => { const v = +e.target.value / 100; set({ volume: v }); soundEngine.setVolume(v); }}
                onPointerUp={() => previewBell('crystal')}
                className="mt-2"
              />
            </div>
            <Row icon="wave" title="Breath cues" subtitle="A soft tone at each inhale and exhale"
              right={<Toggle label="Breath cues" checked={settings.breathCues} onChange={v => set({ breathCues: v })} />} />
            <Row icon="bell" title="Test bell" onClick={() => previewBell('bowl')} right={<Icon name="play" size={16} className="text-faint" />} />
          </RowGroup>
        </section>

        {/* Session */}
        <section>
          <SectionLabel>Session</SectionLabel>
          <RowGroup>
            <Row icon="timer" title="Start countdown"
              right={<Stepper label="countdown" value={settings.countdownSeconds} min={0} max={10}
                format={v => (v === 0 ? 'Off' : `${v}s`)} onChange={v => set({ countdownSeconds: v })} />} />
            <Row icon="focus" title="Focus checklist" subtitle="Show the focus mode screen at the start"
              right={<Toggle label="Focus checklist" checked={settings.showFocusGuard} onChange={v => set({ showFocusGuard: v })} />} />
          </RowGroup>
        </section>

        <RemindersSection />

        <FocusSection />

        <DataSection />

        {/* App */}
        <section>
          <SectionLabel>App</SectionLabel>
          <RowGroup>
            {platform === 'desktop' && <AutostartRow />}
            {canInstall && (
              <Row icon="download" title="Install app" subtitle="Add Meditation to your home screen or dock" onClick={() => installPrompt.prompt()}
                right={<Icon name="chevronRight" size={16} className="text-faint" />} />
            )}
            {!isNative && isIOS() && !isStandalone() && (
              <Row icon="download" title="Install on iPhone" subtitle="Tap Share, then “Add to Home Screen”." />
            )}
            {!isNative && (
              <DownloadRow />
            )}
            {!isNative && (
              <Row icon="refresh" title={updateAvailable ? 'Update available' : 'App is up to date'}
                subtitle={updateAvailable ? 'Tap to load the new version' : undefined}
                onClick={updateAvailable ? updateApp : undefined}
                right={updateAvailable ? <span className="w-2 h-2 rounded-full bg-ok" /> : undefined} />
            )}
            <Row icon="info" title="Meditation" subtitle={`Version ${__APP_VERSION__} · ${platform === 'web' ? 'Web' : platform === 'desktop' ? 'Desktop' : 'Android'}`} />
          </RowGroup>
        </section>

        {user && (
          <Button id="signout-btn" variant="ghost" icon="logOut" block onClick={() => signOutUser()}>Sign out</Button>
        )}
      </div>
    </div>
  );
};

export default ProfileScreen;
