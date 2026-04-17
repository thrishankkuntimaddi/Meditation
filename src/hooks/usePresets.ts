import { useState, useCallback } from 'react';
import type { Preset } from '../types';
import { savePreset, loadPresets, deletePreset } from '../utils/localStorage';
import { DEFAULT_PRESETS } from '../utils/defaultPresets';

const seedDefaults = () => {
  const stored = loadPresets();
  if (stored.length === 0) {
    DEFAULT_PRESETS.forEach(p => savePreset(p));
    return DEFAULT_PRESETS;
  }
  return stored;
};

export const usePresets = () => {
  const [presets, setPresets] = useState<Preset[]>(() => seedDefaults());

  const save = useCallback((preset: Preset) => {
    savePreset(preset);
    setPresets(loadPresets());
  }, []);

  const remove = useCallback((id: string) => {
    deletePreset(id);
    setPresets(loadPresets());
  }, []);

  const refresh = useCallback(() => {
    setPresets(loadPresets());
  }, []);

  return { presets, save, remove, refresh };
};
