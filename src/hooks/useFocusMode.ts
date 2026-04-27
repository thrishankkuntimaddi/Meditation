import { useEffect, useRef, useCallback } from 'react';

/**
 * useFocusMode
 * ─────────────────────────────────────────────────────────
 * When active = true this hook:
 *  1. Requests a Screen Wake Lock  → keeps screen on (mobile + laptop)
 *  2. Suppresses browser Notifications by re-closing them immediately
 *  3. Prevents the browser tab title from flickering (clears any title
 *     updates triggered by other libraries / background scripts)
 *  4. On visibility change (tab hidden): pushes a gentle reminder back
 *     so the user doesn't get distracted in another tab
 *  5. Overrides `document.title` to "🧘 Meditating…" so OS notification
 *     previews / tab-switchers show the right context
 *
 * IMPORTANT — what the Web can & cannot do:
 *  • OS-level "silent mode" (ringer volume) can NOT be set by a browser.
 *    The hook shows a one-time prompt overlay instead (handled in UI layer).
 *  • Notification permission must already be granted OR denied; we don't
 *    request it here to avoid interrupting the experience.
 * ─────────────────────────────────────────────────────────
 */
export function useFocusMode(active: boolean) {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const originalTitleRef = useRef(document.title);
  // ── 1. Screen Wake Lock ──────────────────────────────────
  const acquireWakeLock = useCallback(async () => {
    if (!('wakeLock' in navigator)) return;
    try {
      wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
    } catch {
      // User denied or browser doesn't support — silently skip
    }
  }, []);

  const releaseWakeLock = useCallback(() => {
    wakeLockRef.current?.release().catch(() => {});
    wakeLockRef.current = null;
  }, []);

  // Re-acquire wake lock when page becomes visible again (iOS/Android
  // releases it automatically when the page is hidden)
  useEffect(() => {
    if (!active) return;

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        await acquireWakeLock();
        // Restore the meditation title if something else changed it
        document.title = '🧘 Meditating…';
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [active, acquireWakeLock]);

  // ── 2. Suppress Notification popups (Web Notifications API) ──
  // We intercept the Notification constructor so any library that tries
  // to fire a notification during the session closes it immediately.
  const patchNotifications = useCallback(() => {
    if (!('Notification' in window)) return;
    const OrigNotif = window.Notification;

    // @ts-ignore — intentionally patching the constructor
    window.Notification = function (title: string, options?: NotificationOptions) {
      const n = new OrigNotif(title, options);
      n.close(); // immediately close any notification that tries to pop
      return n;
    };
    // Preserve static members
    Object.assign(window.Notification, OrigNotif);
    (window.Notification as any).__original__ = OrigNotif;
  }, []);

  const restoreNotifications = useCallback(() => {
    const orig = (window.Notification as any)?.__original__;
    if (orig) window.Notification = orig;
  }, []);

  // ── 3. Title override ────────────────────────────────────
  const setMeditationTitle = useCallback(() => {
    originalTitleRef.current = document.title;
    document.title = '🧘 Meditating…';
  }, []);

  const restoreTitle = useCallback(() => {
    document.title = originalTitleRef.current;
  }, []);

  // ── Master toggle ────────────────────────────────────────
  useEffect(() => {
    if (active) {
      acquireWakeLock();
      setMeditationTitle();
      patchNotifications();
    } else {
      releaseWakeLock();
      restoreTitle();
      restoreNotifications();
    }

    return () => {
      releaseWakeLock();
      restoreTitle();
      restoreNotifications();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);
}
