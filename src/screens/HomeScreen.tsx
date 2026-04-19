import React, { useState } from 'react';
import type { Preset } from '../types';
import { usePresets } from '../hooks/usePresets';
import { getStreak, loadLocalSessions } from '../utils/localStorage';
import { formatDuration } from '../utils/formatTime';

interface Props {
  onStartSession: (preset: Preset) => void;
  onGoEditor: () => void;
}

const PRESET_ICONS: Record<string, string> = {
  Morning: '🌅',
  Evening: '🌇',
  Night: '🌙',
  Custom: '✦',
};

const HomeScreen: React.FC<Props> = ({ onStartSession, onGoEditor }) => {
  const { presets } = usePresets();
  const [selected, setSelected] = useState<Preset | null>(null);
  const streak = getStreak();
  const sessions = loadLocalSessions();
  const totalMin = Math.round(sessions.reduce((s, sess) => s + sess.duration, 0) / 60);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const activePreset = selected ?? presets[0] ?? null;

  return (
    <div className="flex flex-col min-h-screen bg-stone-50" style={{ paddingBottom: 88 }}>
      {/* Header */}
      <div className="px-6 pt-14 pb-6">
        <p className="text-xs text-stone-400 tracking-widest uppercase" style={{ letterSpacing: '0.2em' }}>Nistha</p>
        <h1 className="text-2xl font-light text-stone-700 mt-1">{greeting}</h1>
      </div>

      {/* Stats row */}
      <div className="flex gap-3 px-6 mb-8">
        {[
          { label: 'Sessions', value: String(sessions.length) },
          { label: 'Minutes', value: String(totalMin) },
          { label: 'Day streak', value: `${streak} 🔥` },
        ].map(s => (
          <div
            key={s.label}
            className="flex-1 rounded-2xl p-3 flex flex-col items-center gap-1"
            style={{ background: '#F5F5F4', border: '1px solid rgba(120,113,108,0.1)' }}
          >
            <span className="text-lg font-light text-stone-700">{s.value}</span>
            <span className="text-xs text-stone-400">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Preset selector */}
      <div className="px-6 mb-6">
        <p className="text-xs text-stone-400 uppercase tracking-widest mb-3" style={{ letterSpacing: '0.18em' }}>
          Select session
        </p>
        <div className="flex flex-col gap-2">
          {presets.map(preset => (
            <button
              key={preset.id}
              id={`preset-${preset.id}`}
              onClick={() => setSelected(preset)}
              className="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-left transition-all duration-200"
              style={{
                background: activePreset?.id === preset.id ? '#44403C' : '#F5F5F4',
                border: `1.5px solid ${activePreset?.id === preset.id ? '#44403C' : 'rgba(120,113,108,0.12)'}`,
                cursor: 'pointer',
              }}
            >
              <span className="text-xl">{PRESET_ICONS[preset.name] ?? '✦'}</span>
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: activePreset?.id === preset.id ? '#FAFAF9' : '#44403C' }}>
                  {preset.name}
                </p>
                <p className="text-xs mt-0.5" style={{ color: activePreset?.id === preset.id ? 'rgba(250,250,249,0.6)' : '#A8A29E' }}>
                  {formatDuration(preset.totalDuration)} · {preset.phases.length} phase{preset.phases.length !== 1 ? 's' : ''}
                </p>
              </div>
              {activePreset?.id === preset.id && (
                <span style={{ color: '#FAFAF9', fontSize: 18 }}>✓</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Edit button */}
      <div className="px-6 mb-4">
        <button
          id="edit-preset-btn"
          onClick={onGoEditor}
          className="w-full py-3 rounded-2xl text-sm text-stone-500 transition-colors duration-200"
          style={{ border: '1.5px dashed rgba(120,113,108,0.25)', background: 'transparent', cursor: 'pointer' }}
        >
          + Create or edit preset
        </button>
      </div>

      {/* Start button */}
      <div className="px-6 mt-auto">
        <button
          id="start-session-btn"
          disabled={!activePreset}
          onClick={() => activePreset && onStartSession(activePreset)}
          className="w-full py-5 rounded-2xl text-base font-medium tracking-wider transition-all duration-300 disabled:opacity-40"
          style={{
            background: '#1C1917',
            color: '#FAFAF9',
            border: 'none',
            cursor: activePreset ? 'pointer' : 'default',
            letterSpacing: '0.12em',
          }}
        >
          BEGIN
        </button>
      </div>
    </div>
  );
};

export default HomeScreen;
