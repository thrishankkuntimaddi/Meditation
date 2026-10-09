import { useEffect, useState, useCallback } from 'react';
import { isNative } from '../native';

/**
 * usePWAUpdate — detects a waiting service worker (new web version available)
 * and exposes `updateAvailable` + `updateApp()`. A no-op inside native shells,
 * which ship their web assets in the app bundle.
 */
export function usePWAUpdate() {
  const [waitingSW, setWaitingSW] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (isNative || !('serviceWorker' in navigator)) return;

    const watch = (reg: ServiceWorkerRegistration) => {
      if (reg.waiting && navigator.serviceWorker.controller) setWaitingSW(reg.waiting);
      reg.addEventListener('updatefound', () => {
        const sw = reg.installing;
        sw?.addEventListener('statechange', () => {
          if (sw.state === 'installed' && navigator.serviceWorker.controller) setWaitingSW(sw);
        });
      });
    };

    navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(watch)).catch(() => {});

    let reloading = false;
    const onControllerChange = () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    const interval = setInterval(() => {
      navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.update().catch(() => {}))).catch(() => {});
    }, 60 * 60 * 1000);

    return () => {
      clearInterval(interval);
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
    };
  }, []);

  const updateApp = useCallback(() => {
    waitingSW?.postMessage({ type: 'SKIP_WAITING' });
  }, [waitingSW]);

  return { updateAvailable: waitingSW !== null, updateApp };
}
