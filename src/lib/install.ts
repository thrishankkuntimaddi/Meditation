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

const DOWNLOAD_BASE = 'https://github.com/thrishankkuntimaddi/Meditation/releases/latest/download/';

export interface AppDownload { label: string; detail: string; url: string }

/** The right installer for the device this page is open on (null: use the web app). */
export async function recommendedDownload(): Promise<AppDownload | null> {
  const ua = navigator.userAgent;
  if (isIOS()) return null;
  if (/Android/i.test(ua)) {
    return { label: 'Get the Android app', detail: 'Silences your phone and sends reminders · 4 MB', url: DOWNLOAD_BASE + 'Meditation-Android.apk' };
  }
  if (/Windows/i.test(ua)) {
    return { label: 'Get the Windows app', detail: 'Mutes this PC while you meditate elsewhere · 3 MB', url: DOWNLOAD_BASE + 'Meditation-Windows-Setup.exe' };
  }
  if (/Macintosh|Mac OS X/i.test(ua)) {
    // Chromium browsers can tell Apple Silicon from Intel; Safari can't, so default to Apple Silicon
    type UAData = { getHighEntropyValues?: (h: string[]) => Promise<{ architecture?: string }> };
    const data = (navigator as unknown as { userAgentData?: UAData }).userAgentData;
    const arch = await data?.getHighEntropyValues?.(['architecture']).then(v => v.architecture).catch(() => undefined);
    const intel = arch === 'x86';
    return {
      label: 'Get the Mac app',
      detail: `${intel ? 'For Intel Macs' : 'For Apple-chip Macs'} · silences your Mac · 2 MB`,
      url: DOWNLOAD_BASE + (intel ? 'Meditation-Mac-Intel.dmg' : 'Meditation-Mac-AppleSilicon.dmg'),
    };
  }
  if (/Linux/i.test(ua)) {
    return { label: 'Get the Linux app', detail: 'AppImage', url: DOWNLOAD_BASE + 'Meditation-Linux.AppImage' };
  }
  return null;
}
