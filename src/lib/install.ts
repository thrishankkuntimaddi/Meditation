/** Captures the browser's PWA install prompt so the Profile screen can offer it. */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferred = e as BeforeInstallPromptEvent;
  listeners.forEach(l => l());
});
window.addEventListener('appinstalled', () => {
  deferred = null;
  listeners.forEach(l => l());
});

export const installPrompt = {
  available: () => deferred !== null,
  subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; },
  async prompt() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice.catch(() => null);
    deferred = null;
    listeners.forEach(l => l());
  },
};

export const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches ||
  (navigator as unknown as { standalone?: boolean }).standalone === true;

export const isIOS = () => /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
  (/Macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1);

export const RELEASES_URL = 'https://github.com/thrishankkuntimaddi/Meditation/releases/latest';
