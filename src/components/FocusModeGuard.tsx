import React, { useEffect, useRef, useState } from 'react';
import Icon, { type IconName } from './ui/Icon';
import { native, platform, type FocusCapabilities } from '../native';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../hooks/useStore';

interface Props {
  onDismiss: () => void;
}

const AUTO_DISMISS_S = 8;

/**
 * Shown when a session starts. Tells the user exactly what focus mode is doing
 * on *this* platform, and what they still need to do themselves.
 */
const FocusModeGuard: React.FC<Props> = ({ onDismiss }) => {
  const { user } = useAuth();
  const settings = useSettings();
  const [caps, setCaps] = useState<FocusCapabilities | null>(null);
  const [left, setLeft] = useState(AUTO_DISMISS_S);
  const [exiting, setExiting] = useState(false);
  const dismissedRef = useRef(false);

  const dismiss = React.useCallback(() => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    setExiting(true);
    setTimeout(onDismiss, 300);
  }, [onDismiss]);

  useEffect(() => { native.capabilities().then(setCaps); }, []);

  useEffect(() => {
    const id = setInterval(() => setLeft(l => Math.max(0, l - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => { if (left === 0) dismiss(); }, [left, dismiss]);

  const items: { icon: IconName; text: string; done: boolean; action?: React.ReactNode }[] = [
    { icon: 'sun', text: 'Screen will stay awake', done: true },
    {
      icon: 'devices',
      text: user
        ? settings.silenceOtherDevices ? 'Your other open devices go silent' : 'Silencing other devices is off'
        : 'Sign in to silence your other devices',
      done: !!user && settings.silenceOtherDevices,
    },
  ];

  if (caps?.systemDnd === 'granted' && settings.systemDnd && platform === 'android') {
    items.push({ icon: 'bellOff', text: 'Do Not Disturb is on', done: true });
  } else if (caps?.systemDnd === 'needs-permission' && settings.systemDnd) {
    items.push({
      icon: 'bellOff',
      text: 'Allow Do Not Disturb access',
      done: false,
      action: (
        <button
          className="text-xs font-medium underline underline-offset-2 text-white/80"
          onClick={() => { setLeft(AUTO_DISMISS_S + 20); native.requestDndPermission(); }}
        >
          Allow
        </button>
      ),
    });
  } else {
    items.push({ icon: 'bellOff', text: 'Turn on Do Not Disturb / Silent', done: false });
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 transition-opacity duration-300"
      style={{ background: 'rgb(28 25 23 / 0.86)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)', opacity: exiting ? 0 : 1 }}
    >
      <div
        className="w-full max-w-[340px] rounded-[28px] px-7 py-8 flex flex-col items-center gap-5 text-center transition-transform duration-300"
        style={{ background: 'rgb(250 250 249 / 0.06)', border: '1px solid rgb(250 250 249 / 0.12)', transform: exiting ? 'scale(0.96)' : 'scale(1)' }}
      >
        <span className="w-14 h-14 rounded-full flex items-center justify-center text-white/90" style={{ background: 'rgb(250 250 249 / 0.08)' }}>
          <Icon name="focus" size={28} />
        </span>
        <div>
          <p className="text-lg font-medium text-white/95">Focus mode on</p>
          <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-white/45">Nothing will disturb this session</p>
        </div>

        <ul className="w-full flex flex-col gap-2">
          {items.map(it => (
            <li key={it.text} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-left" style={{ background: 'rgb(250 250 249 / 0.06)' }}>
              <Icon name={it.icon} size={18} className="text-white/70 flex-shrink-0" />
              <span className="flex-1 text-[13px] leading-snug text-white/80">{it.text}</span>
              {it.action ?? (
                it.done
                  ? <Icon name="check" size={16} className="text-white/70" />
                  : <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
              )}
            </li>
          ))}
        </ul>

        <button
          id="focus-mode-ready-btn"
          onClick={dismiss}
          className="w-full h-12 rounded-2xl text-sm font-medium uppercase tracking-[0.12em] text-white flex items-center justify-center gap-2 transition-colors"
          style={{ background: 'rgb(250 250 249 / 0.12)' }}
        >
          I'm ready
          <span className="w-6 h-6 rounded-full text-[11px] font-semibold tabular-nums flex items-center justify-center" style={{ background: 'rgb(250 250 249 / 0.15)' }}>
            {left}
          </span>
        </button>
      </div>
    </div>
  );
};

export default FocusModeGuard;
