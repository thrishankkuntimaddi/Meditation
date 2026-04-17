import type { Phase, BreathStep } from '../types';
import { soundEngine } from './SoundEngine';

export interface PhaseManagerState {
  phaseIndex: number;
  phase: Phase;
  phaseElapsedSec: number;
  breathStep: BreathStep | null;
  breathStepElapsedSec: number;
  breathCycle: number;
  totalElapsedSec: number;
}

type EventCallback = (state: PhaseManagerState) => void;

export class PhaseManager {
  private phases: Phase[];
  private phaseIndex = 0;
  private phaseElapsed = 0;       // seconds accumulator
  private breathStepElapsed = 0;  // seconds accumulator within a breath step
  private breathCycle = 0;
  private breathStepIndex = 0;    // index into breath steps array
  private totalElapsed = 0;       // seconds

  private lastIntervalBell = 0;   // seconds since last interval bell

  private onUpdate: EventCallback;

  constructor(phases: Phase[], onUpdate: EventCallback) {
    if (phases.length === 0) throw new Error('Phases cannot be empty');
    this.phases = phases;
    this.onUpdate = onUpdate;
  }

  get currentPhase(): Phase {
    return this.phases[this.phaseIndex];
  }

  private getBreathSteps(): { step: BreathStep; duration: number }[] {
    const bp = this.currentPhase.breathing;
    if (!bp) return [];
    if (bp.pattern === 'square') {
      return [
        { step: 'inhale' as BreathStep, duration: bp.inhale },
        { step: 'hold' as BreathStep, duration: bp.hold },
        { step: 'exhale' as BreathStep, duration: bp.exhale },
        { step: 'holdAfterExhale' as BreathStep, duration: bp.holdAfterExhale },
      ].filter(s => s.duration > 0);
    } else {
      return [
        { step: 'inhale' as BreathStep, duration: bp.inhale },
        { step: 'hold' as BreathStep, duration: bp.hold },
        { step: 'exhale' as BreathStep, duration: bp.exhale },
      ].filter(s => s.duration > 0);
    }
  }

  /** Called every animation frame with delta in seconds */
  tick(deltaSec: number) {
    this.totalElapsed += deltaSec;
    this.phaseElapsed += deltaSec;
    this.breathStepElapsed += deltaSec;

    const phase = this.currentPhase;

    // --- Advance breath step ---
    if (phase.type === 'breathing' && phase.breathing) {
      const steps = this.getBreathSteps();
      if (steps.length > 0) {
        const currentStep = steps[this.breathStepIndex];
        if (this.breathStepElapsed >= currentStep.duration) {
          this.breathStepElapsed -= currentStep.duration;
          // Advance to next step
          this.breathStepIndex = (this.breathStepIndex + 1) % steps.length;
          if (this.breathStepIndex === 0) this.breathCycle++;
          // Bell on each breath step change
          soundEngine.playBell();
        }
      }
    }

    // --- Interval bell ---
    if (phase.type === 'interval') {
      const interval = phase.intervalSeconds ?? 60;
      if (this.phaseElapsed - this.lastIntervalBell >= interval) {
        soundEngine.playBell();
        this.lastIntervalBell = this.phaseElapsed;
      }
    }

    // --- Phase transition ---
    if (this.phaseElapsed >= phase.duration) {
      const isLast = this.phaseIndex === this.phases.length - 1;
      if (isLast) {
        // Session complete — handled by TimerEngine onComplete
        this.emitState();
        return;
      } else {
        // Double bell for phase end
        soundEngine.playDoubleBell();
        this.phaseIndex++;
        this.phaseElapsed = 0;
        this.breathStepElapsed = 0;
        this.breathStepIndex = 0;
        this.breathCycle = 0;
        this.lastIntervalBell = 0;
      }
    }

    this.emitState();
  }

  private emitState() {
    const phase = this.currentPhase;
    const steps = phase.type === 'breathing' ? this.getBreathSteps() : [];
    const breathStep = steps.length > 0 ? steps[this.breathStepIndex].step : null;

    this.onUpdate({
      phaseIndex: this.phaseIndex,
      phase,
      phaseElapsedSec: this.phaseElapsed,
      breathStep,
      breathStepElapsedSec: this.breathStepElapsed,
      breathCycle: this.breathCycle,
      totalElapsedSec: this.totalElapsed,
    });
  }

  reset() {
    this.phaseIndex = 0;
    this.phaseElapsed = 0;
    this.breathStepElapsed = 0;
    this.breathStepIndex = 0;
    this.breathCycle = 0;
    this.totalElapsed = 0;
    this.lastIntervalBell = 0;
  }
}
