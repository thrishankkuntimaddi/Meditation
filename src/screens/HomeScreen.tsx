import React, { useState } from 'react';
import type { Preset } from '../types';
import { usePresets, useSessions } from '../hooks/useStore';
import { useAuth } from '../context/AuthContext';
import { computeStreak, totalMinutes } from '../utils/stats';
import { formatDuration } from '../utils/formatTime';
import {
  BREATHING_EXERCISES, BREATH_MINUTE_OPTIONS, exerciseToPreset, patternLabel,
} from '../utils/breathingExercises';
import PresetIcon from '../components/PresetIcon';
import SetupCard from '../components/SetupCard';
import { Button, Card, Icon, ScreenHeader, SectionLabel, Segmented, type IconName } from '../components/ui';

interface Props {
  onStartSession: (preset: Preset) => void;
  onGoEditor: (presetId?: string) => void;
}

type Mode = 'meditate' | 'breathe';

const MODE_KEY = 'meditation_home_mode';
const readMode = (): Mode => {
  try { return localStorage.getItem(MODE_KEY) === 'breathe' ? 'breathe' : 'meditate'; } catch { return 'meditate'; }
};

const Stat: React.FC<{ icon: IconName; value: string; label: string }> = ({ icon, value, label }) => (
  <Card className="flex-1 px-3 py-3.5 flex flex-col items-center gap-1">
    <Icon name={icon} size={18} className="text-faint" />
    <span className="text-xl font-light text-ink2 tabular-nums">{value}</span>
    <span className="text-[11px] text-faint">{label}</span>
  </Card>
);

const HomeScreen: React.FC<Props> = ({ onStartSession, onGoEditor }) => {
  const presets = usePresets();
  const sessions = useSessions();
  const { user } = useAuth();
  const [now] = useState(() => Date.now());
  const [mode, setModeState] = useState<Mode>(readMode);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [exerciseId, setExerciseId] = useState(BREATHING_EXERCISES[0].id);
  const [minutes, setMinutes] = useState<Record<string, number>>({});

  const setMode = (m: Mode) => {
    setModeState(m);
    try { localStorage.setItem(MODE_KEY, m); } catch { /* ignore */ }
  };

  const hour = new Date(now).getHours();
  const greeting = hour < 5 ? 'Peaceful night' : hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.displayName?.split(' ')[0];

  const activePreset = presets.find(p => p.id === selectedId) ?? presets[0] ?? null;
  const exercise = BREATHING_EXERCISES.find(e => e.id === exerciseId) ?? BREATHING_EXERCISES[0];
  const exerciseMinutes = minutes[exercise.id] ?? exercise.defaultMinutes;

  const begin = () => {
    if (mode === 'breathe') onStartSession(exerciseToPreset(exercise, exerciseMinutes));
    else if (activePreset) onStartSession(activePreset);
  };

  return (
    <div className="flex flex-col min-h-full" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 168px)' }}>
      <ScreenHeader eyebrow="Meditation" title={firstName ? `${greeting}, ${firstName}` : greeting} />

      <div className="flex gap-2.5 px-6 mb-7">
        <Stat icon="meditate" value={String(sessions.length)} label="Sessions" />
        <Stat icon="clock" value={String(totalMinutes(sessions))} label="Minutes" />
        <Stat icon="flame" value={String(computeStreak(sessions, now))} label="Day streak" />
      </div>

      <SetupCard />

      <div className="px-6 mb-6">
        <Segmented
          value={mode}
          onChange={setMode}
          options={[{ value: 'meditate', label: 'Meditate', icon: 'meditate' }, { value: 'breathe', label: 'Breathe', icon: 'wave' }]}
        />
      </div>

      {mode === 'meditate' ? (
        <section className="px-6 animate-fade-in" key="meditate">
          <SectionLabel right={
            <button onClick={() => onGoEditor()} className="inline-flex items-center gap-1 text-xs text-muted hover:text-ink2">
              <Icon name="edit" size={14} /> Edit
            </button>
          }>
            Choose a session
          </SectionLabel>
          <div className="flex flex-col gap-2">
            {presets.map(preset => {
              const active = activePreset?.id === preset.id;
              return (
                <button
                  key={preset.id}
                  id={`preset-${preset.id}`}
                  onClick={() => setSelectedId(preset.id)}
                  aria-pressed={active}
                  className={`flex items-center gap-3.5 pl-2.5 pr-4 py-2.5 rounded-2xl text-left border transition-all duration-200 ${
                    active ? 'bg-ink2 border-ink2' : 'bg-surface border-line/10 hover:border-line/25'
                  }`}
                >
                  <PresetIcon preset={preset} active={active} />
                  <span className="flex-1 min-w-0">
                    <span className={`block text-[15px] font-medium truncate ${active ? 'text-bg' : 'text-ink2'}`}>{preset.name}</span>
                    <span className={`block text-xs mt-0.5 ${active ? 'text-bg/60' : 'text-faint'}`}>
                      {formatDuration(preset.totalDuration)} · {preset.phases.length} phase{preset.phases.length !== 1 ? 's' : ''}
                    </span>
                  </span>
                  {active && <Icon name="check" size={20} className="text-bg" />}
                </button>
              );
            })}
            <Button variant="dashed" icon="plus" block onClick={() => onGoEditor('new')} className="mt-1">
              New preset
            </Button>
          </div>
        </section>
      ) : (
        <section className="px-6 animate-fade-in" key="breathe">
          <SectionLabel>Breathing exercises</SectionLabel>
          <div className="flex flex-col gap-2">
            {BREATHING_EXERCISES.map(ex => {
              const active = ex.id === exercise.id;
              return (
                <div
                  key={ex.id}
                  className={`rounded-2xl border transition-all duration-200 ${active ? 'bg-surface border-line/30' : 'bg-surface/60 border-line/10'}`}
                >
                  <button
                    id={`exercise-${ex.id}`}
                    onClick={() => setExerciseId(ex.id)}
                    aria-pressed={active}
                    className="w-full flex items-center gap-3.5 pl-2.5 pr-4 py-2.5 text-left"
                  >
                    <span className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${active ? 'bg-ink2 text-bg' : 'bg-bg border border-line/10 text-muted'}`}>
                      <Icon name="wave" size={22} />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-[15px] font-medium text-ink2">{ex.name}</span>
                      <span className="block text-xs mt-0.5 text-faint">{ex.tagline}</span>
                    </span>
                    <span className="text-xs text-muted tabular-nums">{patternLabel(ex.breathing)}</span>
                  </button>
                  {active && (
                    <div className="px-4 pb-4 animate-fade-in">
                      <p className="text-[13px] text-muted leading-relaxed">{ex.description}</p>
                      <div className="mt-3 flex gap-2" role="radiogroup" aria-label="Duration">
                        {BREATH_MINUTE_OPTIONS.map(m => (
                          <button
                            key={m}
                            role="radio"
                            aria-checked={m === exerciseMinutes}
                            onClick={() => setMinutes(prev => ({ ...prev, [ex.id]: m }))}
                            className={`flex-1 h-9 rounded-xl text-[13px] font-medium transition-colors ${
                              m === exerciseMinutes ? 'bg-ink2 text-bg' : 'bg-bg text-muted border border-line/15'
                            }`}
                          >
                            {m} min
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Begin — pinned above the tab bar */}
      <div
        className="fixed inset-x-0 z-40 pointer-events-none"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 68px)' }}
      >
        <div className="mx-auto max-w-[480px] px-6 pb-4 pt-6 bg-gradient-to-t from-bg via-bg/95 to-transparent">
          <Button
            id="start-session-btn"
            variant="primary"
            size="lg"
            block
            icon="play"
            disabled={mode === 'meditate' && !activePreset}
            onClick={begin}
            className="pointer-events-auto shadow-lg"
          >
            BEGIN
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
