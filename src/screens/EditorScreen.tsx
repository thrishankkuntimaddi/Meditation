import React, { useState } from 'react';
import type { Preset, Phase } from '../types';
import { usePresets } from '../hooks/usePresets';
import PhaseCard from '../components/PhaseCard';
import BellPicker from '../components/BellPicker';
import { formatDuration } from '../utils/formatTime';

interface Props {
  editPreset?: Preset | null;
  onDone: () => void;
}

const newPhase = (): Phase => ({
  id: Math.random().toString(36).slice(2),
  name: 'New Phase',
  duration: 300,
  type: 'silent',
  breathing: { pattern: 'square', inhale: 4, hold: 4, exhale: 4, holdAfterExhale: 4 },
  intervalSeconds: 60,
});

const EditorScreen: React.FC<Props> = ({ editPreset, onDone }) => {
  const { presets, save } = usePresets();
  const [activeId, setActiveId] = useState<string>(editPreset?.id ?? presets[0]?.id ?? '');

  const preset = presets.find(p => p.id === activeId) ?? presets[0];

  const update = (patch: Partial<Preset>) => {
    if (!preset) return;
    const updated = { ...preset, ...patch };
    updated.totalDuration = updated.phases.reduce((s, p) => s + p.duration, 0);
    save(updated);
  };

  const updatePhase = (index: number, phase: Phase) => {
    const phases = [...(preset?.phases ?? [])];
    phases[index] = phase;
    update({ phases });
  };

  const addPhase = () => {
    update({ phases: [...(preset?.phases ?? []), newPhase()] });
  };

  const deletePhase = (index: number) => {
    const phases = [...(preset?.phases ?? [])];
    phases.splice(index, 1);
    update({ phases });
  };

  const movePhase = (from: number, to: number) => {
    const phases = [...(preset?.phases ?? [])];
    const [moved] = phases.splice(from, 1);
    phases.splice(to, 0, moved);
    update({ phases });
  };

  const saveNewPreset = () => {
    const newP: Preset = {
      id: Math.random().toString(36).slice(2) + Date.now().toString(36),
      name: 'Custom',
      totalDuration: 300,
      phases: [newPhase()],
      bellSound: 'crystal',
      createdAt: Date.now(),
    };
    save(newP);
    setActiveId(newP.id);
  };

  if (!preset) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-stone-400 text-sm">No presets yet.</p>
        <button onClick={saveNewPreset} className="px-6 py-3 bg-stone-800 text-stone-50 rounded-2xl text-sm">
          Create first preset
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-stone-50 pb-24">
      {/* Header */}
      <div className="px-6 pt-14 pb-4">
        <p className="text-xs text-stone-400 tracking-widest uppercase mb-1" style={{ letterSpacing: '0.2em' }}>Editor</p>
        <h2 className="text-2xl font-light text-stone-700">Configure</h2>
      </div>

      {/* Preset tabs */}
      <div className="px-6 mb-5">
        <div
          className="flex overflow-x-auto gap-2 pb-1"
          style={{ scrollbarWidth: 'none' }}
        >
          {presets.map(p => (
            <button
              key={p.id}
              id={`editor-tab-${p.id}`}
              onClick={() => setActiveId(p.id)}
              className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{
                background: activeId === p.id ? '#44403C' : '#F5F5F4',
                color: activeId === p.id ? '#FAFAF9' : '#78716C',
                border: 'none', cursor: 'pointer',
              }}
            >
              {p.name}
            </button>
          ))}
          <button
            id="new-preset-btn"
            onClick={saveNewPreset}
            className="flex-shrink-0 px-4 py-2 rounded-xl text-sm text-stone-400 transition-all"
            style={{ background: 'transparent', border: '1.5px dashed rgba(120,113,108,0.25)', cursor: 'pointer' }}
          >
            + New
          </button>
        </div>
      </div>

      <div className="px-6 flex flex-col gap-5">
        {/* Preset name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-stone-400 uppercase tracking-widest" style={{ letterSpacing: '0.15em' }}>Name</label>
          <input
            id="preset-name-input"
            className="text-stone-700 text-base font-light bg-transparent border-b border-stone-200 py-2 outline-none focus:border-stone-500 transition-colors"
            value={preset.name}
            onChange={e => update({ name: e.target.value })}
          />
        </div>

        {/* Total duration display */}
        <div
          className="flex items-center justify-between px-4 py-3 rounded-2xl"
          style={{ background: '#F5F5F4', border: '1px solid rgba(120,113,108,0.1)' }}
        >
          <span className="text-sm text-stone-500">Total duration</span>
          <span className="text-sm font-medium text-stone-700">{formatDuration(preset.totalDuration)}</span>
        </div>

        {/* Bell sound */}
        <div className="flex flex-col gap-2">
          <label className="text-xs text-stone-400 uppercase tracking-widest" style={{ letterSpacing: '0.15em' }}>Bell sound</label>
          <BellPicker value={preset.bellSound} onChange={bell => update({ bellSound: bell })} />
        </div>

        {/* Phases */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-stone-400 uppercase tracking-widest" style={{ letterSpacing: '0.15em' }}>Phases</label>
            <span className="text-xs text-stone-400">{preset.phases.length} phase{preset.phases.length !== 1 ? 's' : ''}</span>
          </div>
          {preset.phases.map((phase, i) => (
            <PhaseCard
              key={phase.id}
              phase={phase}
              index={i}
              onChange={p => updatePhase(i, p)}
              onDelete={() => deletePhase(i)}
              onMoveUp={i > 0 ? () => movePhase(i, i - 1) : undefined}
              onMoveDown={i < preset.phases.length - 1 ? () => movePhase(i, i + 1) : undefined}
            />
          ))}
          <button
            id="add-phase-btn"
            onClick={addPhase}
            className="py-3 rounded-2xl text-sm text-stone-400 transition-colors"
            style={{ border: '1.5px dashed rgba(120,113,108,0.22)', background: 'transparent', cursor: 'pointer' }}
          >
            + Add phase
          </button>
        </div>

        {/* Save */}
        <button
          id="save-preset-btn"
          onClick={onDone}
          className="w-full py-4 rounded-2xl text-sm font-medium tracking-wider"
          style={{ background: '#1C1917', color: '#FAFAF9', border: 'none', cursor: 'pointer', letterSpacing: '0.1em' }}
        >
          SAVE &amp; DONE
        </button>
      </div>
    </div>
  );
};

export default EditorScreen;
