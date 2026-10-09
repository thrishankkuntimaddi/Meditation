import React from 'react';
import type { BreathStep, PhaseType } from '../types';

interface Props {
  breathStep: BreathStep | null;
  stepDuration: number;      // seconds for current step
  stepElapsed: number;       // seconds elapsed in current step
  isRunning: boolean;
  phaseType: PhaseType;
  progress: number;          // 0..1 of the whole session
}

const STEP_LABELS: Record<BreathStep, string> = {
  inhale: 'Breathe in',
  hold: 'Hold',
  exhale: 'Breathe out',
  holdAfterExhale: 'Hold',
};

const SIZE = 280;
const RING_R = 134;
const CIRC = 2 * Math.PI * RING_R;
const MIN_SCALE = 0.72;
const MAX_SCALE = 1;

// Ease the orb so it moves like a breath, not a metronome
const ease = (t: number) => 0.5 - Math.cos(Math.PI * Math.min(1, Math.max(0, t))) / 2;

const BreathingCircle: React.FC<Props> = ({ breathStep, stepDuration, stepElapsed, isRunning, phaseType, progress }) => {
  const t = stepDuration > 0 ? stepElapsed / stepDuration : 0;
  const isBreathing = phaseType === 'breathing' && breathStep !== null;

  let scale = 0.86;
  if (isBreathing) {
    if (breathStep === 'inhale') scale = MIN_SCALE + (MAX_SCALE - MIN_SCALE) * ease(t);
    else if (breathStep === 'exhale') scale = MAX_SCALE - (MAX_SCALE - MIN_SCALE) * ease(t);
    else if (breathStep === 'hold') scale = MAX_SCALE;
    else scale = MIN_SCALE;
  }

  const secondsLeft = isBreathing ? Math.max(1, Math.ceil(stepDuration - stepElapsed - 0.001)) : null;
  const label = isBreathing ? STEP_LABELS[breathStep!] : phaseType === 'silent' ? 'Be still' : 'Rest in awareness';

  return (
    <div className="relative select-none" style={{ width: SIZE, height: SIZE }} aria-live="polite">
      {/* Session progress ring — wraps the orb */}
      <svg width={SIZE} height={SIZE} className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle cx={SIZE / 2} cy={SIZE / 2} r={RING_R} fill="none" stroke="rgb(var(--c-line) / 0.12)" strokeWidth={2} />
        <circle
          cx={SIZE / 2} cy={SIZE / 2} r={RING_R}
          fill="none" stroke="rgb(var(--c-ink-2) / 0.55)" strokeWidth={2} strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={CIRC * (1 - Math.min(1, progress))}
          style={{ transition: 'stroke-dashoffset 0.4s linear' }}
        />
      </svg>

      {/* Soft halo for silent / interval phases */}
      {!isBreathing && (
        <div
          className={`absolute inset-6 rounded-full bg-line/10 ${isRunning ? 'animate-pulse-ring' : ''}`}
          aria-hidden="true"
        />
      )}

      {/* The orb */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="rounded-full flex flex-col items-center justify-center"
          style={{
            width: 220,
            height: 220,
            transform: `scale(${scale})`,
            transition: isBreathing ? 'transform 0.15s linear' : 'transform 1.2s ease-in-out',
            background: 'radial-gradient(circle at 35% 30%, rgb(var(--c-bg)) 0%, rgb(var(--c-surface)) 45%, rgb(var(--c-surface-2)) 100%)',
            boxShadow: '0 10px 50px rgb(var(--c-line) / 0.18), inset 0 1px 2px rgb(255 255 255 / 0.5)',
            border: '1px solid rgb(var(--c-line) / 0.16)',
          }}
        >
          <span className="text-[13px] font-medium uppercase tracking-[0.16em] text-muted">{label}</span>
          {secondsLeft !== null && (
            <span className="mt-1 text-3xl font-extralight text-ink2 tabular-nums">{secondsLeft}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default BreathingCircle;
