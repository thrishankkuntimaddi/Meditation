import React, { useEffect, useState } from 'react';
import type { SessionData } from '../hooks/useSession';
import { RECORD_THRESHOLD } from '../hooks/useSession';
import BreathingCircle from '../components/BreathingCircle';
import CountdownOverlay from '../components/CountdownOverlay';
import FocusModeGuard from '../components/FocusModeGuard';
import { useFocusMode } from '../hooks/useFocusMode';
import { useSettings } from '../hooks/useStore';
import { formatDuration, formatTime } from '../utils/formatTime';
import { Button, HoldButton, Icon, IconButton } from '../components/ui';

interface Props {
  session: SessionData;
  onPause: () => void;
  onResume: () => void;
  onEnd: () => boolean;   // returns whether the session was recorded
  onClose: () => void;
}

const SessionScreen: React.FC<Props> = ({ session, onPause, onResume, onEnd, onClose }) => {
  const { status, countdown, elapsed, remaining, total, snapshot, preset } = session;
  const settings = useSettings();
  const [eyesClosed, setEyesClosed] = useState(false);
  const [guardDismissed, setGuardDismissed] = useState(!settings.showFocusGuard);
  const [endedEarly, setEndedEarly] = useState<{ recorded: boolean; elapsed: number } | null>(null);

  const isActive = (status === 'countdown' || status === 'running' || status === 'paused') && !endedEarly;
  useFocusMode(isActive);

  // Space bar pauses / resumes on desktop
  useEffect(() => {
    if (!isActive) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || (e.target as HTMLElement)?.tagName === 'INPUT') return;
      e.preventDefault();
      if (status === 'running') onPause();
      else if (status === 'paused') onResume();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isActive, status, onPause, onResume]);

  if (!preset) return null;

  // ── Summary (completed or ended early) ──
  if (status === 'complete' || endedEarly) {
    const done = status === 'complete';
    const practised = done ? total : endedEarly!.elapsed;
    const recorded = done ? session.recorded : endedEarly!.recorded;
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-bg px-8 animate-fade-in">
        <span className="w-20 h-20 rounded-full bg-surface border border-line/15 flex items-center justify-center text-ink2">
          <Icon name={done ? 'check' : 'leaf'} size={34} strokeWidth={1.4} />
        </span>
        <p className="mt-8 text-[11px] font-medium uppercase tracking-eyebrow text-faint">{preset.name}</p>
        <h1 className="mt-2 text-3xl font-light text-ink2">{done ? 'Session complete' : 'Session ended'}</h1>
        <p className="mt-3 text-sm text-muted">{formatDuration(Math.max(1, Math.round(practised)))} of stillness</p>
        <p className="mt-6 max-w-[280px] text-center text-xs text-faint leading-relaxed">
          {recorded
            ? 'Added to your journey.'
            : `Sessions ended before ${Math.round(RECORD_THRESHOLD * 100)}% aren't recorded.`}
        </p>
        <Button id="session-done-btn" variant="primary" size="lg" className="mt-10 w-full max-w-[280px]" onClick={onClose}>
          DONE
        </Button>
      </div>
    );
  }

  const phase = snapshot?.phase ?? preset.phases[0];
  const phaseIndex = snapshot?.phaseIndex ?? 0;
  const progress = total > 0 ? elapsed / total : 0;

  const handleEnd = () => {
    const recorded = onEnd();
    setEndedEarly({ recorded, elapsed });
  };

  return (
    <>
      {isActive && !guardDismissed && <FocusModeGuard onDismiss={() => setGuardDismissed(true)} />}
      {status === 'countdown' && countdown > 0 && <CountdownOverlay count={countdown} />}

      <div className="fixed inset-0 flex flex-col items-center justify-between bg-bg">
        {/* Top: phase info */}
        <div className="flex flex-col items-center gap-1 px-6 text-center" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 40px)' }}>
          <p className="text-[11px] font-medium uppercase tracking-eyebrow text-faint">{preset.name}</p>
          <p className="text-lg font-light text-ink2">{phase.name}</p>
          {preset.phases.length > 1 && (
            <div className="mt-2 flex items-center gap-1.5" aria-label={`Phase ${phaseIndex + 1} of ${preset.phases.length}`}>
              {preset.phases.map((p, i) => (
                <span
                  key={p.id}
                  className={`h-1 rounded-full transition-all duration-500 ${
                    i === phaseIndex ? 'w-6 bg-ink2/70' : i < phaseIndex ? 'w-1.5 bg-ink2/40' : 'w-1.5 bg-line/20'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Centre: orb + timer */}
        <div className="flex flex-col items-center gap-6">
          <BreathingCircle
            breathStep={snapshot?.breathStep ?? null}
            stepDuration={snapshot?.breathStepDuration ?? 0}
            stepElapsed={snapshot?.breathStepElapsedSec ?? 0}
            isRunning={status === 'running'}
            phaseType={phase.type}
            progress={progress}
          />
          <div className="flex flex-col items-center gap-1">
            <span className="text-5xl font-extralight text-ink2 tabular-nums" id="session-remaining">{formatTime(remaining)}</span>
            <span className="text-xs text-faint">
              {status === 'paused' ? 'Paused' : preset.phases.length > 1 && snapshot
                ? `${formatTime(snapshot.phaseRemainingSec)} left in this phase`
                : 'remaining'}
            </span>
          </div>
        </div>

        {/* Bottom controls */}
        <div className="w-full max-w-[420px] px-6 flex flex-col items-center gap-3" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 28px)' }}>
          <div className="flex items-center gap-1 text-xs text-faint">
            <IconButton icon="eyeOff" label="Eyes closed mode" onClick={() => setEyesClosed(true)} id="eyes-closed-btn" />
            <span>Eyes closed</span>
          </div>
          <div className="flex gap-3 w-full">
            <Button
              id="pause-resume-btn"
              size="lg"
              icon={status === 'paused' ? 'play' : 'pause'}
              className="flex-1"
              onClick={status === 'paused' ? onResume : onPause}
              disabled={status === 'countdown'}
            >
              {status === 'paused' ? 'Resume' : 'Pause'}
            </Button>
            <HoldButton
              id="end-session-btn"
              onConfirm={handleEnd}
              className="h-14 px-5 rounded-2xl text-sm font-medium text-muted border border-line/15"
            >
              <Icon name="stop" size={16} /> Hold to end
            </HoldButton>
          </div>
        </div>
      </div>

      {/* Eyes-closed mode: near-black screen, tap anywhere to return */}
      {eyesClosed && (
        <button
          className="fixed inset-0 z-[60] bg-black/95 flex items-end justify-center animate-fade-in"
          onClick={() => setEyesClosed(false)}
          aria-label="Tap to show the session"
        >
          <span className="mb-16 text-[11px] uppercase tracking-eyebrow text-white/20">
            {formatTime(remaining)} · tap to see
          </span>
        </button>
      )}
    </>
  );
};

export default SessionScreen;
