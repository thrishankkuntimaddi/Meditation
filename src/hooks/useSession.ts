import { useState, useRef, useCallback, useEffect } from 'react';
import type { Preset, Session } from '../types';
import { TimerEngine } from '../engines/TimerEngine';
import { snapshotAt, cuesBetween, totalDurationOf, type PhaseSnapshot } from '../engines/PhaseManager';
import { soundEngine } from '../engines/SoundEngine';
import { store, uid } from '../lib/store';
import { publishFocus } from '../lib/focusSync';

export type SessionStatus = 'idle' | 'countdown' | 'running' | 'paused' | 'complete';

/** Sessions ended early still count once this share of the planned time is done. */
export const RECORD_THRESHOLD = 0.75;

export interface SessionData {
  status: SessionStatus;
  countdown: number;
  elapsed: number;       // seconds
  remaining: number;     // seconds
  total: number;         // seconds
  snapshot: PhaseSnapshot | null;
  preset: Preset | null;
  recorded: boolean;     // was this session saved to history?
}

const IDLE: SessionData = {
  status: 'idle', countdown: 0, elapsed: 0, remaining: 0, total: 0, snapshot: null, preset: null, recorded: false,
};

export const useSession = () => {
  const [data, setData] = useState<SessionData>(IDLE);

  const timerRef = useRef<TimerEngine | null>(null);
  const countdownRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevSnapRef = useRef<PhaseSnapshot | null>(null);
  const sessionIdRef = useRef('');
  const startedAtRef = useRef(0);
  const savedRef = useRef(false);
  const presetRef = useRef<Preset | null>(null);

  const clearTimers = useCallback(() => {
    timerRef.current?.stop();
    timerRef.current = null;
    if (countdownRef.current) clearTimeout(countdownRef.current);
    countdownRef.current = null;
  }, []);

  const announce = useCallback((paused: boolean) => {
    const preset = presetRef.current;
    const te = timerRef.current;
    if (!preset) return;
    const total = totalDurationOf(preset.phases);
    const remainingSec = te ? te.getRemainingMs() / 1000 : total;
    publishFocus({
      deviceName: store.getState().settings.deviceName,
      presetName: preset.name,
      startedAt: startedAtRef.current,
      endsAt: paused ? null : Date.now() + remainingSec * 1000,
      paused,
      remainingSec,
    });
  }, []);

  const record = useCallback((elapsedSec: number, completed: boolean): boolean => {
    const preset = presetRef.current;
    if (savedRef.current || !preset) return savedRef.current;
    const total = totalDurationOf(preset.phases);
    if (!completed && elapsedSec < total * RECORD_THRESHOLD) return false;
    savedRef.current = true;
    const session: Session = {
      id: sessionIdRef.current,
      timestamp: startedAtRef.current,
      duration: Math.round(elapsedSec),
      plannedDuration: total,
      presetName: preset.name,
      kind: preset.id.startsWith('breath-') ? 'breathing' : 'meditation',
      completed,
      deviceName: store.getState().settings.deviceName,
    };
    store.addSession(session);
    return true;
  }, []);

  const begin = useCallback((preset: Preset) => {
    const total = totalDurationOf(preset.phases);
    const te = new TimerEngine(total);
    timerRef.current = te;
    startedAtRef.current = Date.now();
    prevSnapRef.current = null;

    te.onTick = (elapsedMs) => {
      const elapsed = elapsedMs / 1000;
      const snap = snapshotAt(preset.phases, elapsed);
      const { breathCues } = store.getState().settings;
      for (const cue of cuesBetween(prevSnapRef.current, snap)) {
        if (cue === 'phase') soundEngine.playDoubleBell();
        else if (cue === 'interval') soundEngine.playBell();
        else if (cue === 'breath' && breathCues && snap.breathStep) soundEngine.playBreathCue(snap.breathStep);
      }
      prevSnapRef.current = snap;
      setData(d => ({ ...d, elapsed, remaining: Math.max(0, total - elapsed), snapshot: snap }));
    };

    te.onComplete = () => {
      soundEngine.playQuadBell();
      const recorded = record(total, true);
      publishFocus(null);
      setData(d => ({ ...d, status: 'complete', elapsed: total, remaining: 0, recorded }));
    };

    soundEngine.playBell();
    setData(d => ({ ...d, status: 'running', countdown: 0 }));
    te.start();
    announce(false);
  }, [announce, record]);

  const start = useCallback((preset: Preset) => {
    clearTimers();
    const { settings } = store.getState();
    const total = totalDurationOf(preset.phases);
    if (total <= 0) return;

    // Unlock audio within the user-gesture call chain
    soundEngine.unlock();
    soundEngine.setBellType(preset.bellSound);
    soundEngine.setVolume(settings.volume);

    presetRef.current = preset;
    sessionIdRef.current = uid();
    savedRef.current = false;
    startedAtRef.current = Date.now();

    const count = Math.max(0, Math.round(settings.countdownSeconds));
    setData({
      ...IDLE,
      status: count > 0 ? 'countdown' : 'running',
      countdown: count,
      total,
      remaining: total,
      preset,
      snapshot: snapshotAt(preset.phases, 0),
    });
    announce(false);

    if (count === 0) { begin(preset); return; }
    let n = count;
    const step = () => {
      n--;
      if (n > 0) {
        setData(d => ({ ...d, countdown: n }));
        countdownRef.current = setTimeout(step, 1000);
      } else {
        begin(preset);
      }
    };
    countdownRef.current = setTimeout(step, 1000);
  }, [announce, begin, clearTimers]);

  const pause = useCallback(() => {
    if (!timerRef.current) return;
    timerRef.current.pause();
    setData(d => ({ ...d, status: 'paused' }));
    announce(true);
  }, [announce]);

  const resume = useCallback(() => {
    if (!timerRef.current) return;
    soundEngine.unlock();
    timerRef.current.resume();
    setData(d => ({ ...d, status: 'running' }));
    announce(false);
  }, [announce]);

  /** End early. Returns whether the session counted towards history. */
  const end = useCallback((): boolean => {
    const elapsed = (timerRef.current?.getElapsedMs() ?? 0) / 1000;
    const recorded = record(elapsed, false);
    clearTimers();
    publishFocus(null);
    return recorded;
  }, [clearTimers, record]);

  const reset = useCallback(() => {
    clearTimers();
    presetRef.current = null;
    setData(IDLE);
  }, [clearTimers]);

  useEffect(() => () => {
    clearTimers();
    publishFocus(null);
  }, [clearTimers]);

  return { data, start, pause, resume, end, reset };
};
