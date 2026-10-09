import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useDevices, useSettings } from '../../hooks/useStore';
import { getDeviceId, store } from '../../lib/store';
import { forgetDevice, ONLINE_WINDOW_MS, type DeviceInfo } from '../../lib/devices';
import { focusReport, silenceTest } from '../../lib/focusReport';
import { getDesktopInfo, native, platform, type DesktopOS, type FocusCapabilities } from '../../native';
import { Button, Dialog, Icon, IconButton, Row, RowGroup, SectionLabel, Toggle, type IconName } from '../ui';

const PLATFORM_ICON: Record<string, IconName> = {
  android: 'phone', ios: 'phone', web: 'cloud', macos: 'devices', windows: 'devices', linux: 'devices',
};

const SILENCE_LABEL: Record<DeviceInfo['canSilence'], string> = {
  full: 'Full silence',
  partial: 'Mutes sound',
  'app-only': 'App sounds only',
};

const ago = (ms: number) => {
  const m = Math.round(ms / 60000);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h} h ago`;
  return `${Math.round(h / 24)} days ago`;
};

const MacFocusGuide: React.FC<{ open: boolean; onClose: () => void; onCheck: () => void }> = ({ open, onClose, onCheck }) => (
  <Dialog
    open={open}
    title="Turn on Mac Focus automatically"
    body={
      <ol className="list-decimal pl-5 space-y-2 text-[13px]">
        <li>Open the <b>Shortcuts</b> app and click <b>+</b> to make a new shortcut.</li>
        <li>Add the action <b>Set Focus</b> → choose <b>Do Not Disturb</b> → <b>Turn On</b>.</li>
        <li>Name it exactly <b>Meditation Focus On</b>.</li>
        <li>Make a second shortcut: <b>Set Focus</b> → <b>Do Not Disturb</b> → <b>Turn Off</b>, named <b>Meditation Focus Off</b>.</li>
        <li>Come back and tap <b>Check</b>.</li>
      </ol>
    }
    confirmLabel="Check"
    cancelLabel="Close"
    onConfirm={onCheck}
    onCancel={onClose}
  />
);

/** Silence controls for this device and the list of the user's devices. */
const FocusSection: React.FC = () => {
  const { user } = useAuth();
  const settings = useSettings();
  const devices = useDevices();
  const testEndsAt = useSyncExternalStore(silenceTest.subscribe, silenceTest.endsAt);
  const report = useSyncExternalStore(focusReport.subscribe, focusReport.get);
  const [caps, setCaps] = useState<FocusCapabilities | null>(null);
  const [os, setOs] = useState<DesktopOS | null>(null);
  const [guide, setGuide] = useState(false);
  const [deviceName, setDeviceName] = useState(settings.deviceName);
  const [now, setNow] = useState(() => Date.now());

  const refresh = (force = false) => {
    native.capabilities().then(setCaps);
    getDesktopInfo(force)?.then(i => setOs(i.os)).catch(() => {});
  };

  useEffect(() => {
    refresh();
    // Re-check after returning from Android's permission screen / the Shortcuts app
    const onVisible = () => { if (document.visibilityState === 'visible') refresh(true); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), testEndsAt ? 500 : 30000);
    return () => clearInterval(id);
  }, [testEndsAt]);

  const set = store.updateSettings;
  const me = getDeviceId();
  const testLeft = testEndsAt ? Math.max(0, Math.ceil((testEndsAt - now) / 1000)) : 0;

  const thisDeviceRow = () => {
    if (platform === 'android') {
      return caps?.systemDnd === 'granted'
        ? <Row icon="bellOff" title="Do Not Disturb" subtitle="Turns on automatically during sessions. Alarms still ring."
            right={<Toggle label="Do Not Disturb during sessions" checked={settings.systemDnd} onChange={v => set({ systemDnd: v })} />} />
        : <Row icon="bellOff" title="Do Not Disturb access needed"
            subtitle="Allow it once so Meditation can silence calls and notifications while you meditate."
            right={<Button size="sm" variant="primary" onClick={() => native.requestDndPermission()}>Allow</Button>} />;
    }
    if (platform === 'desktop' && os === 'macos') {
      return (
        <>
          <Row icon="volumeOff" title="Mute notification sounds" subtitle="While you meditate here, alert sounds are muted — your bells still play." right={<Icon name="check" size={16} className="text-ok" />} />
          {caps?.systemDnd === 'granted'
            ? <Row icon="bellOff" title="Mac Focus" subtitle="Your Meditation Focus shortcuts run at the start and end of every session."
                right={<Toggle label="Mac Focus during sessions" checked={settings.systemDnd} onChange={v => set({ systemDnd: v })} />} />
            : <Row icon="bellOff" title="Hide notification banners too" subtitle="One-time setup with the Shortcuts app (1 minute)."
                right={<Button size="sm" onClick={() => setGuide(true)}>Set up</Button>} />}
        </>
      );
    }
    if (platform === 'desktop') {
      return <Row icon="volumeOff" title="Mute this computer" subtitle="While another device meditates, this computer’s sound is muted, then restored." right={<Icon name="check" size={16} className="text-ok" />} />;
    }
    return <Row icon="info" title="Browser limits" subtitle="Browsers can only silence this app. Install the Android or desktop app to silence the whole device." />;
  };

  return (
    <section>
      <SectionLabel>Focus across devices</SectionLabel>
      <RowGroup>
        <Row icon="devices" title="Silence my other devices"
          subtitle={user
            ? 'While you meditate, every other device with the app open goes quiet until you finish.'
            : 'Sign in on each device to use this. It already works between windows on this device.'}
          right={<Toggle label="Silence my other devices" checked={settings.silenceOtherDevices} onChange={v => set({ silenceOtherDevices: v })} />} />
        {thisDeviceRow()}
        <div className="px-4 py-3.5 flex items-center gap-3.5">
          <span className="w-9 h-9 rounded-xl bg-bg border border-line/10 flex items-center justify-center text-muted">
            <Icon name="edit" size={18} />
          </span>
          <label className="flex-1 min-w-0">
            <span className="block text-xs text-faint">This device’s name</span>
            <input
              value={deviceName}
              onChange={e => setDeviceName(e.target.value)}
              onBlur={() => set({ deviceName: deviceName.trim() || settings.deviceName })}
              className="w-full bg-transparent text-sm text-ink2 outline-none"
              aria-label="Device name"
            />
          </label>
        </div>
        <Row
          icon="focus"
          title={testEndsAt ? `Testing silence… ${testLeft}s` : 'Test silence (15 seconds)'}
          subtitle={testEndsAt
            ? report
              ? [report.dnd && 'Do Not Disturb on', report.alertsMuted && 'alert sounds muted', report.awake && 'screen awake']
                  .filter(Boolean).join(' · ') || 'Your other open devices should be silent now'
              : 'Starting…'
            : 'Silences this device and your other open devices briefly, so you can check it works.'}
          onClick={testEndsAt ? undefined : () => silenceTest.start(15)}
          right={testEndsAt ? undefined : <Icon name="play" size={16} className="text-faint" />}
        />
      </RowGroup>

      {user && devices.length > 0 && (
        <>
          <SectionLabel className="mt-5">Your devices</SectionLabel>
          <RowGroup>
            {devices.map(d => {
              const online = now - d.lastSeen < ONLINE_WINDOW_MS;
              return (
                <div key={d.id} className="flex items-center gap-3.5 px-4 py-3">
                  <span className="relative w-9 h-9 rounded-xl bg-bg border border-line/10 flex items-center justify-center text-muted">
                    <Icon name={PLATFORM_ICON[d.platform] ?? 'devices'} size={18} />
                    <span className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-surface ${online ? 'bg-ok' : 'bg-line/30'}`} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm text-ink2 truncate">{d.name}{d.id === me ? ' (this device)' : ''}</span>
                    <span className="block text-xs text-faint">
                      {online ? 'Open now' : `Last seen ${ago(now - d.lastSeen)}`} · {SILENCE_LABEL[d.canSilence]}
                    </span>
                  </span>
                  {d.id !== me && !online && (
                    <IconButton icon="x" label={`Forget ${d.name}`} onClick={() => forgetDevice(user.uid, d.id)} />
                  )}
                </div>
              );
            })}
          </RowGroup>
          <p className="mt-2 px-1 text-xs text-faint leading-relaxed">
            Devices go silent only while the app is open on them. The desktop app keeps running in the menu bar / system tray so it’s always ready.
          </p>
        </>
      )}

      <MacFocusGuide open={guide} onClose={() => setGuide(false)} onCheck={() => { refresh(true); setGuide(false); }} />
    </section>
  );
};

export default FocusSection;
