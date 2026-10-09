import type { Phase, BreathStep, BreathingConfig } from '../types';

/**
 * PhaseManager — derives the full session position from *absolute* elapsed time.
 *
 * Being a pure function of elapsed seconds makes it immune to dropped frames,
 * throttled background tabs and locked screens: however large the gap between
 * two ticks, the state is always exact. Cues (bells) are found by diffing two
 * consecutive snapshots, so each cue fires at most once per tick.
 */

export interface BreathStepDef {
  step: BreathStep;
  duration: number;
}

export interface PhaseSnapshot {
  phaseIndex: number;
  phase: Phase;
  phaseElapsedSec: number;
  phaseRemainingSec: number;
  breathStep: BreathStep | null;
  breathStepIndex: number;
  breathStepElapsedSec: number;
  breathStepDuration: number;
  breathCycle: number;
  intervalCount: number;
  totalElapsedSec: number;
  done: boolean;
}

export type Cue = 'phase' | 'breath' | 'interval';

export const getBreathSteps = (bp: BreathingConfig | undefined): BreathStepDef[] => {
  if (!bp) return [];
  const steps: BreathStepDef[] = [
    { step: 'inhale', duration: bp.inhale },
    { step: 'hold', duration: bp.hold },
    { step: 'exhale', duration: bp.exhale },
  ];
  if (bp.pattern === 'square') steps.push({ step: 'holdAfterExhale', duration: bp.holdAfterExhale });
  return steps.filter(s => s.duration > 0);
};

export const totalDurationOf = (phases: Phase[]) =>
  phases.reduce((sum, p) => sum + Math.max(0, p.duration), 0);

export function snapshotAt(phases: Phase[], elapsedSec: number): PhaseSnapshot {
  const total = totalDurationOf(phases);
  const t = Math.max(0, Math.min(elapsedSec, total));

  // Locate the phase
  let phaseIndex = 0;
  let phaseStart = 0;
  while (phaseIndex < phases.length - 1 && t >= phaseStart + phases[phaseIndex].duration) {
    phaseStart += phases[phaseIndex].duration;
    phaseIndex++;
  }
  const phase = phases[phaseIndex];
  const phaseElapsedSec = t - phaseStart;

  // Locate the breath step within the phase
  let breathStep: BreathStep | null = null;
  let breathStepIndex = 0;
  let breathStepElapsedSec = 0;
  let breathStepDuration = 0;
  let breathCycle = 0;
  if (phase.type === 'breathing') {
    const steps = getBreathSteps(phase.breathing);
    const cycleLen = steps.reduce((s, x) => s + x.duration, 0);
    if (cycleLen > 0) {
      breathCycle = Math.floor(phaseElapsedSec / cycleLen);
      let within = phaseElapsedSec - breathCycle * cycleLen;
      for (let i = 0; i < steps.length; i++) {
        if (within < steps[i].duration || i === steps.length - 1) {
          breathStepIndex = i;
          breathStep = steps[i].step;
          breathStepElapsedSec = within;
          breathStepDuration = steps[i].duration;
          break;
        }
        within -= steps[i].duration;
      }
    }
  }

  const interval = Math.max(10, phase.intervalSeconds ?? 60);
  const intervalCount = phase.type === 'interval' ? Math.floor(phaseElapsedSec / interval) : 0;

  return {
    phaseIndex,
    phase,
    phaseElapsedSec,
    phaseRemainingSec: Math.max(0, phase.duration - phaseElapsedSec),
    breathStep,
    breathStepIndex,
    breathStepElapsedSec,
    breathStepDuration,
    breathCycle,
    intervalCount,
    totalElapsedSec: t,
    done: total > 0 && elapsedSec >= total,
  };
}

/** Which cues should sound when moving from `prev` to `next`. */
export function cuesBetween(prev: PhaseSnapshot | null, next: PhaseSnapshot): Cue[] {
  if (!prev || next.done) return [];
  if (next.phaseIndex !== prev.phaseIndex) return ['phase'];
  const cues: Cue[] = [];
  if (next.breathStep && (next.breathStepIndex !== prev.breathStepIndex || next.breathCycle !== prev.breathCycle)) {
    cues.push('breath');
  }
  if (next.intervalCount > prev.intervalCount) cues.push('interval');
  return cues;
}
