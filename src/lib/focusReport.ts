/**
 * What focus mode actually achieved on this device, plus a short "test silence"
 * that runs the whole chain (this device + every other open device) for a few
 * seconds so users can see it working before relying on it.
 */
import { native, type FocusReport } from '../native';
import { publishFocus } from './focusSync';
import { store } from './store';

let report: FocusReport | null = null;
let testEndsAt: number | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(l => l());

export const focusReport = {
  get: () => report,
  set(r: FocusReport | null) { report = r; emit(); },
  subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; },
};

export const silenceTest = {
  endsAt: () => testEndsAt,
  subscribe: focusReport.subscribe,
  async start(seconds = 15) {
    if (testEndsAt) return;
    const { systemDnd, deviceName } = store.getState().settings;
    testEndsAt = Date.now() + seconds * 1000;
    report = null;
    emit();
    publishFocus({
      deviceName,
      presetName: 'Silence test',
      startedAt: Date.now(),
      endsAt: testEndsAt,
      paused: false,
      remainingSec: seconds,
    });
    report = await native.enterFocus('self', systemDnd);
    emit();
    setTimeout(async () => {
      await native.exitFocus('self', systemDnd);
      publishFocus(null);
      testEndsAt = null;
      emit();
    }, seconds * 1000);
  },
};
