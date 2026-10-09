import { useMemo, useSyncExternalStore } from 'react';
import { store, visiblePresets } from '../lib/store';
import { syncStatus } from '../lib/sync';
import { remoteFocus } from '../lib/focusSync';
import { deviceList } from '../lib/devices';
import { focusReport } from '../lib/focusReport';

export const useStoreState = () => useSyncExternalStore(store.subscribe, store.getState);

export const usePresets = () => {
  const { presets } = useStoreState();
  return useMemo(() => visiblePresets(presets), [presets]);
};

export const useSessions = () => useStoreState().sessions;

export const useSettings = () => useStoreState().settings;

export const useSyncStatus = () => useSyncExternalStore(syncStatus.subscribe, syncStatus.get);

export const useRemoteFocusState = () => useSyncExternalStore(remoteFocus.subscribe, remoteFocus.get);

export const useDevices = () => useSyncExternalStore(deviceList.subscribe, deviceList.get);

export const useFocusReport = () => useSyncExternalStore(focusReport.subscribe, focusReport.get);
