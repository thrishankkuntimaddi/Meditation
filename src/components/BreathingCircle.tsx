import React, { useEffect, useRef } from 'react';
import type { BreathStep } from '../types';

interface Props {
  breathStep: BreathStep | null;
  stepDuration: number;      // seconds for current step
  stepElapsed: number;       // seconds elapsed in current step
  isRunning: boolean;
  phaseType: string;
}

const STEP_LABELS: Record<string, string> = {
  inhale: 'Inhale',
  hold: 'Hold',
  exhale: 'Exhale',
  holdAfterExhale: 'Hold',
};

const STEP_COLORS: Record<string, string> = {
  inhale: 'rgba(120,113,108,0.18)',
  hold: 'rgba(120,113,108,0.10)',
  exhale: 'rgba(120,113,108,0.07)',
  holdAfterExhale: 'rgba(120,113,108,0.10)',
};

const BreathingCircle: React.FC<Props> = ({
  breathStep, stepDuration, stepElapsed, isRunning, phaseType
}) => {
  const circleRef = useRef<HTMLDivElement>(null);
  const outerRef = useRef<HTMLDivElement>(null);

  // Compute scale: inhale → expand, exhale → contract
  const progress = stepDuration > 0 ? Math.min(stepElapsed / stepDuration, 1) : 0;

  let scale = 1;
  if (breathStep === 'inhale') scale = 1 + 0.35 * progress;
  else if (breathStep === 'exhale') scale = 1.35 - 0.35 * progress;
  else if (breathStep === 'hold') scale = 1.35;
  else if (breathStep === 'holdAfterExhale') scale = 1;

  // For silent/interval phases — gentle idle pulse
  const isIdle = !breathStep || phaseType !== 'breathing';

  useEffect(() => {
    const el = circleRef.current;
    if (!el) return;
    if (!isIdle) {
      el.style.transform = `scale(${scale})`;
      el.style.transition = 'transform 0.12s linear';
    }
  }, [scale, isIdle]);

  const ringColor = breathStep ? STEP_COLORS[breathStep] : 'rgba(120,113,108,0.10)';
  const label = breathStep ? STEP_LABELS[breathStep] : (phaseType === 'silent' ? 'Be Still' : 'Breathe');

  return (
    <div className="flex flex-col items-center justify-center gap-6 select-none">
      {/* Outer glow ring */}
      <div
        ref={outerRef}
        className={`relative flex items-center justify-center rounded-full transition-all duration-700 ${isIdle && isRunning ? 'animate-pulse-ring' : ''}`}
        style={{ width: 260, height: 260, background: ringColor }}
      >
        {/* Mid ring */}
        <div
          className="absolute rounded-full"
          style={{
            width: 220, height: 220,
            background: 'rgba(120,113,108,0.08)',
            border: '1px solid rgba(120,113,108,0.15)',
          }}
        />
        {/* Breathing circle */}
        <div
          ref={circleRef}
          className="relative flex items-center justify-center rounded-full"
          style={{
            width: 160,
            height: 160,
            background: 'linear-gradient(135deg, #F5F5F4 0%, #E7E5E4 100%)',
            boxShadow: '0 8px 40px rgba(120,113,108,0.18), inset 0 1px 2px rgba(255,255,255,0.9)',
            border: '1.5px solid rgba(120,113,108,0.2)',
            transform: `scale(${isIdle ? 1 : scale})`,
            transition: isIdle ? 'none' : 'transform 0.12s linear',
          }}
        >
          <span
            className="text-stone-500 text-sm font-medium tracking-widest uppercase"
            style={{ letterSpacing: '0.15em' }}
          >
            {label}
          </span>
        </div>
      </div>
    </div>
  );
};

export default BreathingCircle;
