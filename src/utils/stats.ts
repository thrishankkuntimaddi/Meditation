import type { Session } from '../types';

const dayKey = (t: number) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

/** Consecutive days (ending today or yesterday) with at least one session. */
export const computeStreak = (sessions: Session[], now: number): number => {
  const days = new Set(sessions.map(s => dayKey(s.timestamp)));
  const cursor = new Date(now);
  cursor.setHours(12, 0, 0, 0);
  if (!days.has(dayKey(cursor.getTime()))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!days.has(dayKey(cursor.getTime()))) return 0;
  }
  let streak = 0;
  while (days.has(dayKey(cursor.getTime()))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
};

export const totalMinutes = (sessions: Session[]) =>
  Math.round(sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / 60);

export const lastNDays = (sessions: Session[], n: number, now: number) => {
  const out: { key: string; label: string; minutes: number; count: number; isToday: boolean }[] = [];
  const d = new Date(now);
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - (n - 1));
  for (let i = 0; i < n; i++) {
    const key = dayKey(d.getTime());
    const daySessions = sessions.filter(s => dayKey(s.timestamp) === key);
    out.push({
      key,
      label: d.toLocaleDateString('en', { weekday: 'narrow' }),
      minutes: Math.round(daySessions.reduce((s, x) => s + x.duration, 0) / 60),
      count: daySessions.length,
      isToday: i === n - 1,
    });
    d.setDate(d.getDate() + 1);
  }
  return out;
};

export const groupByDay = (sessions: Session[], now: number) => {
  const today = dayKey(now);
  const yesterday = dayKey(now - 86400000);
  const groups: { label: string; items: Session[] }[] = [];
  for (const s of sessions) {
    const k = dayKey(s.timestamp);
    const label = k === today ? 'Today' : k === yesterday ? 'Yesterday'
      : new Date(s.timestamp).toLocaleDateString('en', { weekday: 'long', month: 'short', day: 'numeric' });
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(s);
    else groups.push({ label, items: [s] });
  }
  return groups;
};
