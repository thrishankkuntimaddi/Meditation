/**
 * Reminder copy — short, quiet invitations. Meditation and breathing have their
 * own voice, and each comes in three styles so the reminder fits the person:
 *
 *   gentle       soft invitations, no pressure
 *   encouraging  warm motivation
 *   disciplined  short and direct
 */
import type { ReminderKind, ReminderTone } from '../../types';

type Pool = Record<ReminderTone, { titles: string[]; lines: string[] }>;

export const MESSAGES: Record<ReminderKind, Pool> = {
  meditation: {
    gentle: {
      titles: ['A quiet moment', 'Time to sit', 'Pause'],
      lines: [
        'Sit for a few minutes. Nothing to achieve — just notice.',
        'The breath is already here. Come and meet it.',
        'A few quiet minutes can change the shape of a day.',
        'Let the day pause for a while. Stillness is waiting.',
        'Close your eyes for ten breaths. That is enough to begin.',
        'You don’t need a calm mind to start. Just a few minutes.',
        'Arrive here. Leave everything else for a little while.',
        'Be still, and let things settle on their own.',
      ],
    },
    encouraging: {
      titles: ['Time to meditate', 'Your calm time', 'Ready when you are'],
      lines: [
        'Ten minutes just for you. Let’s begin.',
        'Every sit makes the next one easier. Ready?',
        'Small, steady practice builds a calm mind.',
        'Your future self will thank you for this pause.',
        'Show up for a few minutes — that’s the whole practice.',
        'One session today keeps the rhythm alive.',
        'Recharge from the inside. Your session is ready.',
        'Begin where you are. It is always enough.',
      ],
    },
    disciplined: {
      titles: ['Meditation · now', 'Practice time', 'Sit'],
      lines: [
        'Sit down. Start the timer. Begin.',
        'Consistency over intensity. Today’s session is due.',
        'Don’t wait for the right mood. Begin now.',
        'The habit is built today, not someday.',
        'You scheduled this. Keep the promise.',
        'Ten minutes. Just sit.',
        'Stillness on busy days counts the most.',
        'Show up. That is the practice.',
      ],
    },
  },
  breathing: {
    gentle: {
      titles: ['Breathe', 'A slow breath', 'Soften'],
      lines: [
        'Soften your shoulders. Take one slow breath.',
        'In for four, out for six. Notice the difference.',
        'A minute of slow breathing can settle a busy mind.',
        'Let each exhale be a little longer than the inhale.',
        'Pause. Notice your breath. Let it slow down.',
        'Unclench your jaw. Three slow breaths.',
      ],
    },
    encouraging: {
      titles: ['Breathing break', 'Quick reset', 'Recharge'],
      lines: [
        'Quick reset: three minutes of box breathing.',
        'Feeling rushed? A few slow breaths will steady you.',
        'Give your nervous system a break — breathe with me.',
        'One minute is enough to come back to yourself.',
        'Your breath is the fastest way to calm. Try it now.',
        'A breathing break now makes the rest of the day lighter.',
      ],
    },
    disciplined: {
      titles: ['Breathe · 3 min', 'Breathing practice', 'Reset'],
      lines: [
        'Breathing practice: three minutes. Start now.',
        'Reset your breath before the next task.',
        'Box breathing, 4 · 4 · 4 · 4. Begin.',
        'Slow the breath. Sharpen the focus.',
        'Scheduled breathing break. Take it.',
        'Stop. In 4, hold 4, out 4, hold 4.',
      ],
    },
  },
};

/** Lines for someone returning after a few days away — never guilt. */
const WELCOME_BACK: Record<ReminderKind, string[]> = {
  meditation: [
    'It’s been a few days. No pressure — just one quiet minute.',
    'Coming back is the practice. Start small today.',
  ],
  breathing: [
    'It’s been a while. One slow breath is a good place to restart.',
    'No catching up needed. Just breathe for a minute.',
  ],
};

/** Stable pseudo-random pick, so a given day always gets the same line. */
const pick = <T,>(list: T[], seed: string): T => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return list[Math.abs(h) % list.length];
};

export interface ReminderContext {
  streak: number;          // current streak in days
  daysSinceLast: number;   // days since the last session of any kind (Infinity if none)
}

export function composeMessage(
  kind: ReminderKind, tone: ReminderTone, dateKey: string, ctx: ReminderContext | null,
): { title: string; body: string } {
  const pool = MESSAGES[kind][tone];
  let title = pick(pool.titles, `${dateKey}:${kind}:t`);
  let body = pick(pool.lines, `${dateKey}:${kind}:b`);
  if (ctx) {
    if (ctx.daysSinceLast >= 3 && Number.isFinite(ctx.daysSinceLast)) {
      body = pick(WELCOME_BACK[kind], dateKey);
    } else if (kind === 'meditation' && ctx.streak >= 2) {
      title = `Day ${ctx.streak + 1}`;
    }
  }
  return { title, body };
}

/** A sample line for the settings preview. */
export const sampleMessage = (kind: ReminderKind, tone: ReminderTone) =>
  composeMessage(kind, tone, 'preview', null);
