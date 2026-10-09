/**
 * Delivers reminders on each platform.
 *
 *   android   OS-scheduled local notifications — fire even when the app is closed.
 *             Quiet channel by default: no sound, no vibration, no pop-up.
 *   desktop   handed to the native app, which keeps a tiny scheduler running
 *             from the menu bar / system tray.
 *   web       only while the page is open (browsers can't schedule offline).
 *
 * Call `syncReminders()` whenever settings, history or focus state change.
 */
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { invoke } from '@tauri-apps/api/core';
import { platform } from '../../native';
import { store } from '../store';
import { buildSchedule, type ReminderItem } from './schedule';
import type { ReminderKind } from '../../types';

export type NotifyPermission = 'granted' | 'denied' | 'prompt' | 'unsupported';

const QUIET_CHANNEL = 'reminders-quiet';
const SOUND_CHANNEL = 'reminders-sound';

let holdUntil = 0;
let webTimers: ReturnType<typeof setTimeout>[] = [];
let channelsReady = false;
let tapHandler: ((kind: ReminderKind) => void) | null = null;

const isAndroid = platform === 'android' && Capacitor.isNativePlatform();

async function ensureChannels() {
  if (!isAndroid || channelsReady) return;
  await LocalNotifications.createChannel({
    id: QUIET_CHANNEL, name: 'Quiet reminders', importance: 2, // LOW: no sound, no pop-up
    description: 'Gentle practice reminders without sound', vibration: false, visibility: 1,
  }).catch(() => {});
  await LocalNotifications.createChannel({
    id: SOUND_CHANNEL, name: 'Reminders with sound', importance: 3,
    description: 'Practice reminders with the default sound', vibration: false, visibility: 1,
  }).catch(() => {});
  channelsReady = true;
}

export const notify = {
  async permission(): Promise<NotifyPermission> {
    if (isAndroid) {
      const p = await LocalNotifications.checkPermissions().catch(() => null);
      if (!p) return 'unsupported';
      return p.display === 'granted' ? 'granted' : p.display === 'denied' ? 'denied' : 'prompt';
    }
    if (platform === 'desktop') return 'granted';
    if (!('Notification' in window)) return 'unsupported';
    return Notification.permission === 'default' ? 'prompt' : Notification.permission;
  },

  async request(): Promise<NotifyPermission> {
    if (isAndroid) {
      const p = await LocalNotifications.requestPermissions().catch(() => null);
      return p?.display === 'granted' ? 'granted' : 'denied';
    }
    if (platform === 'desktop') return 'granted';
    if (!('Notification' in window)) return 'unsupported';
    const p = await Notification.requestPermission();
    return p === 'default' ? 'prompt' : p;
  },

  /** No reminders before this time (a session is running somewhere). */
  hold(until: number) {
    if (until === holdUntil) return;
    holdUntil = until;
    syncReminders();
  },

  /** Called with the reminder kind when the user taps a notification. */
  onTap(handler: (kind: ReminderKind) => void) { tapHandler = handler; },

  async test(kind: ReminderKind) {
    const { reminders } = store.getState().settings;
    const [item] = buildSchedule(Date.now(), {
      ...reminders,
      skipIfPracticed: false,
      [kind]: { enabled: true, time: '00:00', days: [0, 1, 2, 3, 4, 5, 6] },
    }, [], 0).filter(i => i.kind === kind);
    if (!item) return;
    await deliverNow({ ...item, id: 9999, at: Date.now() + 1500 });
  },
};

async function deliverNow(item: ReminderItem) {
  const { sound } = store.getState().settings.reminders;
  if (isAndroid) {
    await ensureChannels();
    await LocalNotifications.schedule({ notifications: [toAndroid(item, sound)] });
  } else if (platform === 'desktop') {
    await invoke('show_notification', { title: item.title, body: item.body }).catch(() => {});
  } else if ('Notification' in window && Notification.permission === 'granted') {
    showWeb(item);
  }
}

const toAndroid = (item: ReminderItem, sound: boolean) => ({
  id: item.id,
  title: item.title,
  body: item.body,
  schedule: { at: new Date(item.at), allowWhileIdle: true },
  // Inexact is fine for a reminder (a minute or two either way) and, unlike
  // exact alarms, never sends the user to a system settings screen.
  isExactNotification: false,
  channelId: sound ? SOUND_CHANNEL : QUIET_CHANNEL,
  smallIcon: 'ic_stat_meditation',
  iconColor: '#78716C',
  autoCancel: true,
  extra: { kind: item.kind },
});

function showWeb(item: ReminderItem) {
  const opts: NotificationOptions = {
    body: item.body,
    icon: `${import.meta.env.BASE_URL}icons/icon-192.png`,
    badge: `${import.meta.env.BASE_URL}icons/icon-192.png`,
    tag: `reminder-${item.kind}`,
    silent: !store.getState().settings.reminders.sound,
    data: { kind: item.kind },
  };
  navigator.serviceWorker?.getRegistration().then(reg => {
    if (reg) reg.showNotification(item.title, opts);
    else {
      const n = new Notification(item.title, opts);
      n.onclick = () => { window.focus(); tapHandler?.(item.kind); n.close(); };
    }
  }).catch(() => { new Notification(item.title, opts); });
}

/** Native calls must never wedge the scheduler. */
const withTimeout = <T,>(p: Promise<T>, ms = 10_000) =>
  Promise.race([p, new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))]);

let syncing: Promise<void> | null = null;
let again = false;

/** Re-plan and hand reminders to the platform. Safe to call often. */
export function syncReminders(): Promise<void> {
  if (syncing) { again = true; return syncing; }
  syncing = (async () => {
    try {
      const { settings, sessions } = store.getState();
      const items = buildSchedule(Date.now(), settings.reminders, sessions, holdUntil);
      const sound = settings.reminders.sound;

      if (isAndroid) {
        const pending = await LocalNotifications.getPending().catch(() => ({ notifications: [] }));
        if (pending.notifications.length) {
          await LocalNotifications.cancel({ notifications: pending.notifications.map(n => ({ id: n.id })) }).catch(() => {});
        }
        if (items.length && (await notify.permission()) === 'granted') {
          await ensureChannels();
          await withTimeout(LocalNotifications.schedule({ notifications: items.map(i => toAndroid(i, sound)) }));
        }
      } else if (platform === 'desktop') {
        await invoke('set_reminders', { items: items.map(({ id, at, title, body }) => ({ id, at, title, body })) }).catch(() => {});
      } else {
        webTimers.forEach(clearTimeout);
        webTimers = [];
        if ('Notification' in window && Notification.permission === 'granted') {
          const soon = items.filter(i => i.at - Date.now() < 24 * 3600 * 1000);
          webTimers = soon.map(i => setTimeout(() => showWeb(i), i.at - Date.now()));
        }
      }
    } catch {
      /* try again on the next change */
    } finally {
      syncing = null;
      if (again) { again = false; syncReminders(); }
    }
  })();
  return syncing;
}

/** Wire up: listen for taps and keep the schedule current. */
export function initReminders() {
  if (isAndroid) {
    LocalNotifications.addListener('localNotificationActionPerformed', e => {
      const kind = (e.notification.extra as { kind?: ReminderKind } | undefined)?.kind;
      if (kind) tapHandler?.(kind);
    });
  }
  navigator.serviceWorker?.addEventListener('message', e => {
    if (e.data?.type === 'reminder-tap' && e.data.kind) tapHandler?.(e.data.kind);
  });

  // Re-plan when reminder settings or history change, and daily on return
  let prev = '';
  const check = () => {
    const { settings, sessions } = store.getState();
    const sig = JSON.stringify(settings.reminders) + '|' + (sessions[0]?.id ?? '') + '|' + new Date().toDateString();
    if (sig !== prev) { prev = sig; syncReminders(); }
  };
  check();
  store.subscribe(check);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') check(); });
}
