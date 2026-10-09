import { useMemo, useSyncExternalStore } from 'react';
import { store, visiblePresets } from '../lib/store';
import { syncStatus } from '../lib/sync';
import { remoteFocus } from '../lib/focusSync';

export const useStoreState = () => useSyncExternalStore(store.subscribe, store.getState);

export const usePresets = () => {
  const { presets } = useStoreState();
  return useMemo(() => visiblePresets(presets), [presets]);
};

export const useSessions = () => useStoreState().sessions;

export const useSettings = () => useStoreState().settings;

export const useSyncStatus = () => useSyncExternalStore(syncStatus.subscribe, syncStatus.get);

export const useRemoteFocusState = () => useSyncExternalStore(remoteFocus.subscribe, remoteFocus.get);
