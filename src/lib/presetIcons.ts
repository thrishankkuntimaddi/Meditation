import type { Preset, PresetIcon as PresetIconName } from '../types';
import type { IconName } from '../components/ui/Icon';

export const PRESET_ICONS: PresetIconName[] = ['sunrise', 'sunset', 'moon', 'sparkle', 'leaf', 'wave'];

const LEGACY_BY_NAME: Record<string, PresetIconName> = {
  Morning: 'sunrise', Evening: 'sunset', Night: 'moon',
};

export const presetIconName = (p: Preset): IconName => p.icon ?? LEGACY_BY_NAME[p.name] ?? 'sparkle';
