import React, { useEffect, useState } from 'react';
import type { FocusState } from '../lib/focusSync';
import { remoteFocus } from '../lib/focusSync';
import { formatTime } from '../utils/formatTime';
import Icon from './ui/Icon';
import { HoldButton } from './ui';

/**
 * Shown on every *other* open device while one device meditates. All app sound
 * is silenced underneath (see useListenerFocus); this screen simply holds the
 * quiet until the session ends, then disappears on its own.
 */
const RemoteFocusOverlay: React.FC<{ focus: FocusState }> = ({ focus }) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const remaining = focus.endsAt ? Math.max(0, (focus.endsAt - now) / 1000) : focus.remainingSec;

  return (
    <div className="fixed inset-0 z-[150] flex flex-col items-center justify-center bg-bg px-8" role="status">
      <div className="relative w-48 h-48 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-line/10 animate-pulse-ring" />
        <div className="absolute inset-8 rounded-full bg-surface border border-line/15" />
        <Icon name="focus" size={40} className="relative text-muted" />
      </div>

      <p className="mt-10 text-[11px] font-medium uppercase tracking-eyebrow text-faint">Meditating on {focus.deviceName}</p>
      <h1 className="mt-2 text-2xl font-light text-ink2 text-center">{focus.presetName}</h1>
      <p className="mt-6 text-5xl font-extralight text-ink2 tabular-nums">{formatTime(remaining)}</p>
      <p className="mt-2 text-xs text-faint">{focus.paused ? 'Paused' : 'remaining'}</p>

      <div className="mt-10 flex items-center gap-2 text-xs text-faint">
        <Icon name="volumeOff" size={16} />
        This device is silenced until the session ends
      </div>

      <div className="absolute inset-x-0 flex justify-center" style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 32px)' }}>
        <HoldButton
          onConfirm={() => remoteFocus.dismiss()}
          holdMs={2000}
          className="h-10 px-5 rounded-full text-xs text-faint border border-line/15"
        >
          Hold to unlock this device
        </HoldButton>
      </div>
    </div>
  );
};

export default RemoteFocusOverlay;
