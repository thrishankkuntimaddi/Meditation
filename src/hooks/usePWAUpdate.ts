import { useEffect, useState, useCallback } from 'react';

/**
 * usePWAUpdate — detects a waiting service worker (new version available)
 * and exposes `updateAvailable` flag + `updateApp()` function.
 *
 * Works with vite-plugin-pwa in `registerType: 'prompt'` mode.
 */
export function usePWAUpdate() {
  const [waitingSW, setWaitingSW] = useState<ServiceWorker | null>(null);
  const updateAvailable = waitingSW !== null;

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const checkForWaiting = (reg: ServiceWorkerRegistration) => {
      if (reg.waiting) {
        setWaitingSW(reg.waiting);
        return;
      }
      // Listen for a new SW that finishes installing and becomes waiting
      reg.addEventListener('updatefound', () => {
        const newSW = reg.installing;
        if (!newSW) return;
        newSW.addEventListener('statechange', () => {
          if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
            setWaitingSW(newSW);
          }
        });
      });
    };

    // Check existing registrations
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach(checkForWaiting);
    });

    // Also listen for newly-registered SWs
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      // Reload once the new SW takes control
      window.location.reload();
    });

    // Poll for updates every 60 seconds (catches background updates)
    const interval = setInterval(() => {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((r) => r.update());
      });
    }, 60_000);

    return () => clearInterval(interval);
  }, []);

  const updateApp = useCallback(() => {
    if (!waitingSW) return;
    // Tell the waiting SW to skip waiting and become active
    waitingSW.postMessage({ type: 'SKIP_WAITING' });
  }, [waitingSW]);

  return { updateAvailable, updateApp };
}
