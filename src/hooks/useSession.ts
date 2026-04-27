import { useState, useRef, useCallback, useEffect } from 'react';
import type { Preset } from '../types';
import { TimerEngine } from '../engines/TimerEngine';
import { PhaseManager } from '../engines/PhaseManager';
import type { PhaseManagerState } from '../engines/PhaseManager';
import { soundEngine } from '../engines/SoundEngine';

export type SessionStatus = 'idle' | 'countdown' | 'running' | 'paused' | 'complete';

export interface SessionData {
  status: SessionStatus;
  countdown: number;
  elapsed: number;       // seconds
  remaining: number;     // seconds
  total: number;         // seconds
  phaseState: PhaseManagerState | null;
}

export const useSession = () => {
  const [status, setStatus] = useState<SessionStatus>('idle');
  const [countdown, setCountdown] = useState(3);
  const [elapsed, setElapsed] = useState(0);
  const [phaseState, setPhaseState] = useState<PhaseManagerState | null>(null);

  const timerRef = useRef<TimerEngine | null>(null);
  const phaseManagerRef = useRef<PhaseManager | null>(null);
  const presetRef = useRef<Preset | null>(null);
  const totalDurationRef = useRef<number>(0);
  const prevElapsedRef = useRef(0);
  const countdownRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Guard: prevent saving session more than once per session
  const sessionSavedRef = useRef(false);

  const total = totalDurationRef.current;

  const cleanup = useCallback(() => {
    timerRef.current?.stop();
    if (countdownRef.current) clearTimeout(countdownRef.current);
  }, []);

  const start = useCallback((preset: Preset) => {
    cleanup();
    sessionSavedRef.current = false;
    presetRef.current = preset;

    // Unlock & configure audio — must happen in a user-gesture call chain
    soundEngine.unlock();
    soundEngine.setBellType(preset.bellSound);

    // Calculate totalDuration from phases
    const totalDuration = preset.phases.reduce((sum, p) => sum + p.duration, 0);
    const fullPreset = { ...preset, totalDuration };
    presetRef.current = fullPreset;
    totalDurationRef.current = totalDuration;

    setStatus('countdown');
    setCountdown(3);
    setElapsed(0);
    setPhaseState(null);
    prevElapsedRef.current = 0;

    let count = 3;
    const tick = () => {
      count--;
      if (count > 0) {
        setCountdown(count);
        countdownRef.current = setTimeout(tick, 1000);
      } else {
        setCountdown(0);
        beginSession(fullPreset, totalDuration);
      }
    };
    countdownRef.current = setTimeout(tick, 1000);
  }, [cleanup]);

  const beginSession = (preset: Preset, totalDuration: number) => {
    // Ensure sound engine bell type is correct (may have changed in editor)
    soundEngine.setBellType(preset.bellSound);

    const pm = new PhaseManager(preset.phases, (state) => {
      setPhaseState(state);
    });
    phaseManagerRef.current = pm;

    const te = new TimerEngine(totalDuration);
    timerRef.current = te;

    te.onTick = (elapsedMs) => {
      const elapsedSec = elapsedMs / 1000;
      const delta = elapsedSec - prevElapsedRef.current;
      prevElapsedRef.current = elapsedSec;
      setElapsed(elapsedSec);
      pm.tick(delta);
    };

    te.onComplete = () => {
      soundEngine.playQuadBell();
      setStatus('complete');
    };

    setStatus('running');
    te.start();
  };

  const pause = useCallback(() => {
    timerRef.current?.pause();
    setStatus('paused');
  }, []);

  const resume = useCallback(() => {
    timerRef.current?.resume();
    setStatus('running');
  }, []);

  const stop = useCallback(() => {
    cleanup();
    setStatus('idle');
    setElapsed(0);
    setPhaseState(null);
    presetRef.current = null;
    totalDurationRef.current = 0;
    prevElapsedRef.current = 0;
    sessionSavedRef.current = false;
  }, [cleanup]);

  useEffect(() => () => cleanup(), [cleanup]);

  const sessionData: SessionData = {
    status,
    countdown,
    elapsed,
    remaining: Math.max(0, total - elapsed),
    total,
    phaseState,
  };

  return {
    sessionData,
    start,
    pause,
    resume,
    stop,
    preset: presetRef.current,
    sessionSavedRef,
  };
};
