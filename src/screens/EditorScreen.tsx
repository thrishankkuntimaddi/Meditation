import React, { useState } from 'react';
import type { Preset, Phase } from '../types';
import { usePresets } from '../hooks/useStore';
import { store } from '../lib/store';
import { createPreset, newPhase } from '../lib/presets';
import PhaseCard from '../components/PhaseCard';
import BellPicker from '../components/BellPicker';
import { PRESET_ICONS, presetIconName } from '../lib/presetIcons';
import { formatDuration } from '../utils/formatTime';
import { Button, Card, Dialog, Icon, ScreenHeader, SectionLabel } from '../components/ui';

interface Props {
  initialPresetId?: string | null;
  onDone: () => void;
  onStart: (preset: Preset) => void;
}

const EditorScreen: React.FC<Props> = ({ initialPresetId, onDone, onStart }) => {
  const presets = usePresets();
  const [activeId, setActiveId] = useState<string>(initialPresetId ?? presets[0]?.id ?? '');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [openPhaseId, setOpenPhaseId] = useState<string | null>(null);

  const preset = presets.find(p => p.id === activeId) ?? presets[0];

  const update = (patch: Partial<Preset>) => {
    if (preset) store.savePreset({ ...preset, ...patch });
  };

  const phases = preset?.phases ?? [];
  const setPhases = (next: Phase[]) => update({ phases: next });

  const movePhase = (from: number, to: number) => {
    const next = [...phases];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setPhases(next);
  };

  const addPhase = () => {
    const p = newPhase();
    setPhases([...phases, p]);
    setOpenPhaseId(p.id);
  };

  const addPreset = () => {
    const p = createPreset();
    setActiveId(p.id);
    setOpenPhaseId(p.phases[0].id);
  };

  const doDelete = () => {
    if (!preset) return;
    const remaining = presets.filter(p => p.id !== preset.id);
    store.deletePreset(preset.id);
    setActiveId(remaining[0]?.id ?? '');
    setConfirmDelete(false);
  };

  if (!preset) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full gap-4 px-6 text-center">
        <Icon name="sliders" size={32} className="text-faint" />
        <p className="text-sm text-muted">No presets yet.</p>
        <Button variant="primary" icon="plus" onClick={addPreset}>Create a preset</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full nav-space">
      <ScreenHeader
        eyebrow="Presets"
        title="Configure"
        action={<Button size="sm" variant="primary" icon="check" onClick={onDone} id="save-preset-btn">Done</Button>}
      />

      {/* Preset chips */}
      <div className="flex overflow-x-auto gap-2 px-6 pb-1 mb-6" style={{ scrollbarWidth: 'none' }}>
        {presets.map(p => {
          const active = p.id === preset.id;
          return (
            <button
              key={p.id}
              id={`editor-tab-${p.id}`}
              onClick={() => setActiveId(p.id)}
              className={`flex-shrink-0 inline-flex items-center gap-1.5 h-10 px-4 rounded-xl text-sm font-medium transition-all ${
                active ? 'bg-ink2 text-bg' : 'bg-surface text-muted hover:text-ink2'
              }`}
            >
              <Icon name={presetIconName(p)} size={16} />
              {p.name || 'Untitled'}
            </button>
          );
        })}
        <button
          id="new-preset-btn"
          onClick={addPreset}
          className="flex-shrink-0 inline-flex items-center gap-1 h-10 px-4 rounded-xl text-sm text-muted border-[1.5px] border-dashed border-line/25 hover:text-ink2"
        >
          <Icon name="plus" size={16} /> New
        </button>
      </div>

      <div className="px-6 flex flex-col gap-7" key={preset.id}>
        {/* Name + icon */}
        <section>
          <SectionLabel>Name</SectionLabel>
          <input
            id="preset-name-input"
            className="w-full bg-transparent border-b border-line/20 pb-2 text-xl font-light text-ink2 outline-none focus:border-line/50 transition-colors"
            value={preset.name}
            onChange={e => update({ name: e.target.value })}
            placeholder="Untitled"
            aria-label="Preset name"
          />
          <div className="mt-4 flex gap-2" role="radiogroup" aria-label="Icon">
            {PRESET_ICONS.map(icon => {
              const active = presetIconName(preset) === icon;
              return (
                <button
                  key={icon}
                  role="radio"
                  aria-checked={active}
                  aria-label={icon}
                  onClick={() => update({ icon })}
                  className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${
                    active ? 'bg-ink2 text-bg' : 'bg-surface text-muted hover:text-ink2'
                  }`}
                >
                  <Icon name={icon} size={20} />
                </button>
              );
            })}
          </div>
        </section>

        {/* Summary */}
        <Card className="flex items-center justify-between px-4 py-3.5">
          <span className="inline-flex items-center gap-2 text-sm text-muted"><Icon name="timer" size={18} /> Total duration</span>
          <span className="text-sm font-medium text-ink2 tabular-nums">{formatDuration(preset.totalDuration)}</span>
        </Card>

        {/* Bell */}
        <section>
          <SectionLabel>Bell sound</SectionLabel>
          <BellPicker value={preset.bellSound} onChange={bell => update({ bellSound: bell })} />
        </section>

        {/* Phases */}
        <section>
          <SectionLabel right={`${phases.length} phase${phases.length !== 1 ? 's' : ''}`}>Phases</SectionLabel>
          <div className="flex flex-col gap-2">
            {phases.map((phase, i) => (
              <PhaseCard
                key={phase.id}
                phase={phase}
                index={i}
                defaultOpen={phase.id === openPhaseId}
                onChange={p => setPhases(phases.map((x, j) => (j === i ? p : x)))}
                onDelete={phases.length > 1 ? () => setPhases(phases.filter((_, j) => j !== i)) : undefined}
                onMoveUp={i > 0 ? () => movePhase(i, i - 1) : undefined}
                onMoveDown={i < phases.length - 1 ? () => movePhase(i, i + 1) : undefined}
              />
            ))}
            <Button id="add-phase-btn" variant="dashed" icon="plus" block onClick={addPhase}>Add phase</Button>
          </div>
        </section>

        <div className="flex flex-col gap-3">
          <Button variant="primary" size="lg" icon="play" block onClick={() => onStart(preset)}>START THIS SESSION</Button>
          {presets.length > 1 && (
            <Button id="delete-preset-btn" variant="danger" icon="trash" block onClick={() => setConfirmDelete(true)}>
              Delete preset
            </Button>
          )}
        </div>
      </div>

      <Dialog
        open={confirmDelete}
        title={`Delete “${preset.name || 'Untitled'}”?`}
        body="This removes the preset from all your synced devices. Your session history is kept."
        confirmLabel="Delete"
        destructive
        onConfirm={doDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
};

export default EditorScreen;
