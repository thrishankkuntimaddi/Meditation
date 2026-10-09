/**
 * Turns reminder settings + practice history into concrete notifications for
 * the next two weeks. Pure function — the platform layer (notify.ts) delivers.
 *
 * Rules that keep reminders minimal:
 *  - at most one meditation and one breathing reminder a day
 *  - today's reminder is skipped if that practice was already done today
 *  - nothing fires while a session is running on any device (hold window)
 */
import type { ReminderKind, ReminderSettings, Session } from '../../types';
import { composeMessage, type ReminderContext } from './messages';
import { computeStreak } from '../../utils/stats';

export interface ReminderItem {
  id: number;            // stable integer id (Android needs ints)
  kind: ReminderKind;
  at: number;            // epoch ms
  title: string;
  body: string;
}

const HORIZON_DAYS = 14;
const KINDS: ReminderKind[] = ['meditation', 'breathing'];

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

const sessionKind = (s: Session): ReminderKind => (s.kind === 'breathing' ? 'breathing' : 'meditation');

export function buildSchedule(
  now: number,
  r: ReminderSettings,
  sessions: Session[],
  holdUntil = 0,
): ReminderItem[] {
  const items: ReminderItem[] = [];
  const today = dayKey(new Date(now));
  const practisedToday = new Set(
    sessions.filter(s => dayKey(new Date(s.timestamp)) === today).map(sessionKind),
  );
  const last = sessions[0]?.timestamp;
  const ctx: ReminderContext = {
    streak: computeStreak(sessions, now),
    daysSinceLast: last ? Math.floor((now - last) / 86400000) : Infinity,
  };

  KINDS.forEach((kind, k) => {
    const plan = r[kind];
    if (!plan.enabled || plan.days.length === 0) return;
    const [hh, mm] = plan.time.split(':').map(Number);
    let first = true;
    for (let i = 0; i < HORIZON_DAYS; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + i);
      d.setHours(hh || 0, mm || 0, 0, 0);
      const at = d.getTime();
      if (at <= now + 30_000 || at < holdUntil) continue;
      if (!plan.days.includes(d.getDay())) continue;
      if (i === 0 && r.skipIfPracticed && practisedToday.has(kind)) continue;
      const key = dayKey(d);
      // Personal context (streak, welcome back) only applies to the next reminder
      const { title, body } = composeMessage(kind, r.tone, key, first ? ctx : null);
      first = false;
      items.push({ id: (k + 1) * 1000 + i, kind, at, title, body });
    }
  });

  return items.sort((a, b) => a.at - b.at);
}
