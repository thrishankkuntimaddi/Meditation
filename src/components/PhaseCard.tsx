import React, { useState } from 'react';
import type { Phase, PhaseType, BreathingConfig } from '../types';
import { formatDuration } from '../utils/formatTime';
import { Icon, IconButton, Segmented, Stepper, type IconName } from './ui';

interface Props {
  phase: Phase;
  index: number;
  onChange: (p: Phase) => void;
  onDelete?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  defaultOpen?: boolean;
}

const TYPE_META: Record<PhaseType, { label: string; icon: IconName; hint: string }> = {
  breathing: { label: 'Breathing', icon: 'wave', hint: 'Guided breath with a soft cue at each step' },
  interval: { label: 'Interval', icon: 'bell', hint: 'Silent sitting with a bell at a steady interval' },
  silent: { label: 'Silent', icon: 'leaf', hint: 'Complete silence until the phase ends' },
};

const DEFAULT_BREATH: BreathingConfig = { pattern: 'square', inhale: 4, hold: 4, exhale: 4, holdAfterExhale: 4 };

const Line: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex items-center justify-between gap-3 min-h-[40px]">
    <span className="text-[13px] text-muted">{label}</span>
    {children}
  </div>
);

const secs = (v: number) => `${v}s`;

const PhaseCard: React.FC<Props> = ({ phase, index, onChange, onDelete, onMoveUp, onMoveDown, defaultOpen }) => {
  const [open, setOpen] = useState(!!defaultOpen);
  const update = (patch: Partial<Phase>) => onChange({ ...phase, ...patch });
  const breathing = phase.breathing ?? DEFAULT_BREATH;
  const updateBreathing = (patch: Partial<BreathingConfig>) => update({ breathing: { ...breathing, ...patch } });
  const meta = TYPE_META[phase.type];

  const minutes = Math.floor(phase.duration / 60);
  const seconds = phase.duration % 60;

  return (
    <div className="rounded-2xl border border-line/15 bg-bg overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 pl-3 pr-2 py-2.5">
        <span className="w-9 h-9 rounded-xl bg-surface flex items-center justify-center text-muted flex-shrink-0">
          <Icon name={meta.icon} size={18} />
        </span>
        <div className="flex-1 min-w-0">
          <input
            className="w-full bg-transparent text-sm font-medium text-ink2 outline-none placeholder:text-faint"
            value={phase.name}
            onChange={e => update({ name: e.target.value })}
            placeholder={`Phase ${index + 1}`}
            aria-label={`Phase ${index + 1} name`}
            id={`phase-name-${index}`}
          />
          <p className="text-xs text-faint mt-0.5">{meta.label} · {formatDuration(phase.duration)}</p>
        </div>
        <IconButton
          icon={open ? 'chevronUp' : 'chevronDown'}
          label={open ? 'Collapse phase' : 'Edit phase'}
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
          id={`phase-toggle-${index}`}
        />
      </div>

      {open && (
        <div className="px-4 pb-4 pt-1 flex flex-col gap-2 border-t border-line/10 animate-fade-in">
          <div className="pt-3">
            <Segmented
              size="sm"
              value={phase.type}
              onChange={t => update({ type: t, breathing: t === 'breathing' ? breathing : phase.breathing })}
              options={(Object.keys(TYPE_META) as PhaseType[]).map(t => ({ value: t, label: TYPE_META[t].label }))}
            />
            <p className="text-xs text-faint mt-2 px-1">{meta.hint}</p>
          </div>

          <Line label="Minutes">
            <Stepper label="minutes" value={minutes} min={0} max={180}
              onChange={m => update({ duration: Math.max(5, m * 60 + seconds) })} />
          </Line>
          <Line label="Seconds">
            <Stepper label="seconds" value={seconds} min={0} max={55} step={5}
              onChange={s => update({ duration: Math.max(5, minutes * 60 + s) })} />
          </Line>

          {phase.type === 'interval' && (
            <Line label="Bell every">
              <Stepper label="bell interval" value={phase.intervalSeconds ?? 60} min={10} max={900} step={10}
                format={v => (v >= 60 && v % 60 === 0 ? `${v / 60}m` : `${v}s`)}
                onChange={v => update({ intervalSeconds: v })} />
            </Line>
          )}

          {phase.type === 'breathing' && (
            <div className="mt-1 rounded-xl bg-surface p-3 flex flex-col gap-1">
              <Segmented
                size="sm"
                value={breathing.pattern}
                onChange={p => updateBreathing({ pattern: p })}
                options={[{ value: 'square', label: 'Box (4 steps)' }, { value: 'triangle', label: 'Triangle (3 steps)' }]}
                className="bg-bg mb-1"
              />
              <Line label="Breathe in">
                <Stepper label="inhale" value={breathing.inhale} min={1} max={30} format={secs} onChange={v => updateBreathing({ inhale: v })} />
              </Line>
              <Line label="Hold">
                <Stepper label="hold" value={breathing.hold} min={0} max={30} format={secs} onChange={v => updateBreathing({ hold: v })} />
              </Line>
              <Line label="Breathe out">
                <Stepper label="exhale" value={breathing.exhale} min={1} max={30} format={secs} onChange={v => updateBreathing({ exhale: v })} />
              </Line>
              {breathing.pattern === 'square' && (
                <Line label="Hold after">
                  <Stepper label="hold after exhale" value={breathing.holdAfterExhale} min={0} max={30} format={secs}
                    onChange={v => updateBreathing({ holdAfterExhale: v })} />
                </Line>
              )}
            </div>
          )}

          <div className="flex items-center gap-1 pt-2">
            <IconButton icon="arrowUp" label="Move up" onClick={onMoveUp} disabled={!onMoveUp} />
            <IconButton icon="arrowDown" label="Move down" onClick={onMoveDown} disabled={!onMoveDown} />
            {onDelete && (
              <button
                id={`phase-delete-${index}`}
                onClick={onDelete}
                className="ml-auto inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-medium text-danger hover:bg-danger/5"
              >
                <Icon name="trash" size={16} />
                Remove
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PhaseCard;
