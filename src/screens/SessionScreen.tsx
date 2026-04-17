import React, { useEffect, useState } from 'react';
import type { Preset } from '../types';
import type { SessionData } from '../hooks/useSession';
import BreathingCircle from '../components/BreathingCircle';
import CountdownOverlay from '../components/CountdownOverlay';
import { formatTime } from '../utils/formatTime';

interface Props {
  preset: Preset;
  sessionData: SessionData;
  onPause: () => void;
  onResume: () => void;
  onEnd: () => void;
}

const SessionScreen: React.FC<Props> = ({ preset, sessionData, onPause, onResume, onEnd }) => {
  const { status, countdown, elapsed, remaining, total, phaseState } = sessionData;
  const [eyesClosed, setEyesClosed] = useState(false);

  // Lock screen wake on mobile
  useEffect(() => {
    let wakeLock: any = null;
    if ('wakeLock' in navigator) {
      (navigator as any).wakeLock.request('screen').then((wl: any) => { wakeLock = wl; }).catch(() => {});
    }
    return () => { wakeLock?.release?.(); };
  }, []);

  const progress = total > 0 ? elapsed / total : 0;
  const circumference = 2 * Math.PI * 54;

  const phase = phaseState?.phase ?? null;
  const breathStep = phaseState?.breathStep ?? null;
  const stepElapsed = phaseState?.breathStepElapsedSec ?? 0;
  const stepDuration = (() => {
    if (!phase?.breathing || !breathStep) return 0;
    const bp = phase.breathing;
    const map: Record<string, number> = {
      inhale: bp.inhale, hold: bp.hold,
      exhale: bp.exhale, holdAfterExhale: bp.holdAfterExhale,
    };
    return map[breathStep] ?? 0;
  })();

  if (status === 'complete') {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-stone-50 animate-fade-in">
        <div className="flex flex-col items-center gap-4">
          <span className="text-4xl">✦</span>
          <h2 className="text-2xl font-light text-stone-700">Complete</h2>
          <p className="text-stone-400 text-sm">{Math.round(elapsed / 60)} minutes of stillness</p>
          <button
            id="session-done-btn"
            onClick={onEnd}
            className="mt-6 px-8 py-3 rounded-2xl text-sm font-medium"
            style={{ background: '#1C1917', color: '#FAFAF9', border: 'none', cursor: 'pointer', letterSpacing: '0.1em' }}
          >
            DONE
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-between transition-all duration-700"
      style={{
        background: '#FAFAF9',
        opacity: eyesClosed ? 0.04 : 1,
      }}
    >
      {/* Countdown overlay */}
      {status === 'countdown' && <CountdownOverlay count={countdown} />}

      {/* Top: phase info */}
      <div className="flex flex-col items-center pt-14 gap-1 animate-fade-in">
        <p className="text-xs text-stone-400 tracking-widest uppercase" style={{ letterSpacing: '0.2em' }}>
          {preset.name}
        </p>
        <p className="text-base font-light text-stone-600">
          {phase?.name ?? 'Starting...'}
        </p>
        {phaseState && (
          <p className="text-xs text-stone-300 mt-1">
            Phase {phaseState.phaseIndex + 1} of {preset.phases.length}
          </p>
        )}
      </div>

      {/* Center: breathing circle */}
      <div className="flex flex-col items-center gap-8">
        <BreathingCircle
          breathStep={breathStep}
          stepDuration={stepDuration}
          stepElapsed={stepElapsed}
          isRunning={status === 'running'}
          phaseType={phase?.type ?? 'silent'}
        />

        {/* Timer */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-4xl font-thin text-stone-600 tabular-nums">
            {formatTime(remaining)}
          </span>
          <span className="text-xs text-stone-300">remaining</span>
        </div>

        {/* Progress arc */}
        <svg width={120} height={120} className="absolute opacity-20" style={{ top: '50%', transform: 'translateY(-50%)' }}>
          <circle cx={60} cy={60} r={54} fill="none" stroke="#78716C" strokeWidth={1} />
          <circle
            cx={60} cy={60} r={54}
            fill="none" stroke="#44403C" strokeWidth={2}
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            strokeLinecap="round"
            transform="rotate(-90 60 60)"
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
      </div>

      {/* Bottom controls */}
      <div className="flex flex-col items-center gap-4 pb-16 w-full px-8">
        {/* Eyes closed toggle */}
        <button
          id="eyes-closed-btn"
          onClick={() => setEyesClosed(e => !e)}
          className="text-xs text-stone-300 tracking-widest uppercase"
          style={{ background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.18em' }}
        >
          {eyesClosed ? 'Tap to see' : 'Eyes closed mode'}
        </button>

        <div className="flex gap-4 w-full">
          {/* Pause / Resume */}
          <button
            id="pause-resume-btn"
            onClick={status === 'paused' ? onResume : onPause}
            className="flex-1 py-4 rounded-2xl text-sm font-medium transition-all"
            style={{
              background: '#F5F5F4', color: '#44403C',
              border: '1.5px solid rgba(120,113,108,0.15)', cursor: 'pointer',
            }}
          >
            {status === 'paused' ? 'Resume' : 'Pause'}
          </button>

          {/* End */}
          <button
            id="end-session-btn"
            onClick={onEnd}
            className="py-4 px-6 rounded-2xl text-sm font-medium transition-all"
            style={{
              background: 'transparent', color: '#A8A29E',
              border: '1.5px solid rgba(120,113,108,0.12)', cursor: 'pointer',
            }}
          >
            End
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionScreen;
