import React from 'react';
import type { Phase, PhaseType } from '../types';
import { formatDuration } from '../utils/formatTime';

interface Props {
  phase: Phase;
  index: number;
  onChange: (p: Phase) => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

const TYPE_OPTIONS: PhaseType[] = ['breathing', 'interval', 'silent'];

const PhaseCard: React.FC<Props> = ({ phase, index, onChange, onDelete, onMoveUp, onMoveDown }) => {
  const [open, setOpen] = React.useState(false);

  const update = (patch: Partial<Phase>) => onChange({ ...phase, ...patch });
  const updateBreathing = (patch: object) =>
    onChange({ ...phase, breathing: { ...phase.breathing!, ...patch } });

  return (
    <div
      className="rounded-2xl border transition-all duration-200"
      style={{ border: '1.5px solid rgba(120,113,108,0.15)', background: '#FAFAF9' }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer"
        onClick={() => setOpen(o => !o)}
      >
        <span className="text-xs text-stone-400 font-mono w-5 text-center">{index + 1}</span>
        <div className="flex-1 min-w-0">
          <input
            className="text-sm font-medium text-stone-700 bg-transparent border-none outline-none w-full placeholder-stone-300"
            value={phase.name}
            onChange={e => update({ name: e.target.value })}
            onClick={e => e.stopPropagation()}
            placeholder="Phase name"
            id={`phase-name-${index}`}
          />
        </div>
        <span className="text-xs text-stone-400">{formatDuration(phase.duration)}</span>
        <span className="text-xs text-stone-400 px-2 py-0.5 rounded-full bg-stone-100">{phase.type}</span>
        <span className="text-stone-300 ml-1">{open ? '▴' : '▾'}</span>
      </div>

      {open && (
        <div className="px-4 pb-4 flex flex-col gap-4 border-t border-stone-100 animate-fade-in">
          {/* Duration */}
          <div className="flex items-center gap-3 pt-3">
            <label className="text-xs text-stone-400 w-20">Duration</label>
            <div className="flex gap-2 flex-1">
              <div className="flex items-center gap-1">
                <input
                  type="number" min={0} max={120}
                  className="w-14 text-sm text-stone-700 border border-stone-200 rounded-lg px-2 py-1 text-center outline-none focus:border-stone-400"
                  value={Math.floor(phase.duration / 60)}
                  onChange={e => update({ duration: Math.max(0, +e.target.value) * 60 + (phase.duration % 60) })}
                  id={`phase-min-${index}`}
                />
                <span className="text-xs text-stone-400">min</span>
              </div>
              <div className="flex items-center gap-1">
                <input
                  type="number" min={0} max={59}
                  className="w-14 text-sm text-stone-700 border border-stone-200 rounded-lg px-2 py-1 text-center outline-none focus:border-stone-400"
                  value={phase.duration % 60}
                  onChange={e => update({ duration: Math.floor(phase.duration / 60) * 60 + Math.max(0, Math.min(59, +e.target.value)) })}
                  id={`phase-sec-${index}`}
                />
                <span className="text-xs text-stone-400">sec</span>
              </div>
            </div>
          </div>

          {/* Type */}
          <div className="flex items-center gap-3">
            <label className="text-xs text-stone-400 w-20">Type</label>
            <div className="flex gap-1.5 flex-1">
              {TYPE_OPTIONS.map(t => (
                <button
                  key={t}
                  id={`phase-type-${index}-${t}`}
                  onClick={() => update({ type: t })}
                  className="px-3 py-1 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: phase.type === t ? '#44403C' : '#F5F5F4',
                    color: phase.type === t ? '#FAFAF9' : '#78716C',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Interval config */}
          {phase.type === 'interval' && (
            <div className="flex items-center gap-3">
              <label className="text-xs text-stone-400 w-20">Bell every</label>
              <div className="flex items-center gap-1">
                <input
                  type="number" min={10}
                  className="w-16 text-sm text-stone-700 border border-stone-200 rounded-lg px-2 py-1 text-center outline-none focus:border-stone-400"
                  value={phase.intervalSeconds ?? 60}
                  onChange={e => update({ intervalSeconds: Math.max(10, +e.target.value) })}
                  id={`phase-interval-${index}`}
                />
                <span className="text-xs text-stone-400">sec</span>
              </div>
            </div>
          )}

          {/* Breathing config */}
          {phase.type === 'breathing' && (
            <div className="flex flex-col gap-3 p-3 rounded-xl bg-stone-50">
              {/* Pattern */}
              <div className="flex items-center gap-3">
                <label className="text-xs text-stone-400 w-20">Pattern</label>
                <div className="flex gap-1.5">
                  {(['square', 'triangle'] as const).map(p => (
                    <button
                      key={p}
                      id={`pattern-${index}-${p}`}
                      onClick={() => updateBreathing({ pattern: p })}
                      className="px-3 py-1 rounded-lg text-xs font-medium transition-all"
                      style={{
                        background: (phase.breathing?.pattern ?? 'square') === p ? '#44403C' : '#F5F5F4',
                        color: (phase.breathing?.pattern ?? 'square') === p ? '#FAFAF9' : '#78716C',
                        border: 'none', cursor: 'pointer',
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Timing */}
              {[
                { key: 'inhale', label: 'Inhale' },
                { key: 'hold', label: 'Hold' },
                { key: 'exhale', label: 'Exhale' },
                ...(phase.breathing?.pattern === 'square' ? [{ key: 'holdAfterExhale', label: 'Hold after' }] : []),
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center gap-3">
                  <label className="text-xs text-stone-400 w-20">{label}</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number" min={0} max={30}
                      className="w-14 text-sm text-stone-700 border border-stone-200 rounded-lg px-2 py-1 text-center outline-none focus:border-stone-400"
                      value={(phase.breathing as any)?.[key] ?? 4}
                      onChange={e => updateBreathing({ [key]: Math.max(0, +e.target.value) })}
                      id={`breath-${index}-${key}`}
                    />
                    <span className="text-xs text-stone-400">sec</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button onClick={onMoveUp} disabled={!onMoveUp} className="text-xs text-stone-400 hover:text-stone-600 disabled:opacity-30">↑</button>
            <button onClick={onMoveDown} disabled={!onMoveDown} className="text-xs text-stone-400 hover:text-stone-600 disabled:opacity-30">↓</button>
            <button
              id={`phase-delete-${index}`}
              onClick={onDelete}
              className="ml-auto text-xs text-red-400 hover:text-red-600"
            >
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhaseCard;
