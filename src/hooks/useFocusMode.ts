import { useEffect, useState, useSyncExternalStore } from 'react';
import { native } from '../native';
import { soundEngine } from '../engines/SoundEngine';
import { isFocusLive, remoteFocus, type FocusState } from '../lib/focusSync';
import { store } from '../lib/store';
import { focusReport } from '../lib/focusReport';

const MEDITATING_TITLE = 'Meditating · Meditation';

/**
 * Focus for the device that is meditating:
 *  - Screen Wake Lock (web) / keep-awake (native) so the screen never sleeps
 *  - System Do Not Disturb where the platform allows it (Android, macOS Shortcuts)
 *  - Tab title shows the session so other windows and switchers reflect it
 */
export function useFocusMode(active: boolean) {
  useEffect(() => {
    if (!active) return;
    let wakeLock: WakeLockSentinel | null = null;
    let cancelled = false;
    const { systemDnd } = store.getState().settings;

    const acquire = async () => {
      if (!('wakeLock' in navigator) || document.visibilityState !== 'visible') return;
      try {
        const lock = await navigator.wakeLock.request('screen');
        if (cancelled) lock.release().catch(() => {});
        else wakeLock = lock;
      } catch { /* denied or unsupported */ }
    };
    const onVisible = () => { if (document.visibilityState === 'visible') acquire(); };

    const originalTitle = document.title;
    document.title = MEDITATING_TITLE;
    acquire();
    const entered = native.enterFocus('self', systemDnd).then(r => { if (!cancelled) focusReport.set(r); });
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      wakeLock?.release().catch(() => {});
      document.title = originalTitle;
      focusReport.set(null);
      // Always restore *after* entering finished, so DND can never get stuck on
      entered.finally(() => native.exitFocus('self', systemDnd));
    };
  }, [active]);
}

/**
 * Focus for every *other* open instance while one device meditates:
 * silences all app audio and asks the native shell to mute / enable DND.
 * Returns the live remote focus state (or null).
 */
export function useListenerFocus(): FocusState | null {
  const remote = useSyncExternalStore(remoteFocus.subscribe, remoteFocus.get);
  const [now, setNow] = useState(() => Date.now());

  // Re-evaluate when the remote session is due to end, so we release on time
  // even if the meditating device never sends its "ended" update.
  useEffect(() => {
    if (!remote) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [remote]);

  const live = isFocusLive(remote, now) ? remote : null;
  const isLive = live !== null;

  useEffect(() => {
    if (!isLive) return;
    const { silenceOtherDevices, systemDnd } = store.getState().settings;
    if (!silenceOtherDevices) return;
    soundEngine.setSilenced(true);
    const entered = native.enterFocus('listener', systemDnd);
    return () => {
      soundEngine.setSilenced(false);
      entered.finally(() => native.exitFocus('listener', systemDnd));
    };
  }, [isLive]);

  return live;
}
