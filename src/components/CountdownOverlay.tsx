import React from 'react';

/** Full-screen "Beginning in 3 · 2 · 1" before a session starts. */
const CountdownOverlay: React.FC<{ count: number }> = ({ count }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/95 animate-fade-in">
    <div className="flex flex-col items-center gap-4">
      <span className="text-xs font-medium uppercase tracking-[0.3em] text-faint">Beginning in</span>
      <span key={count} className="font-extralight text-ink2 animate-slide-up tabular-nums" style={{ fontSize: 96, lineHeight: 1 }}>
        {count}
      </span>
      <span className="text-sm text-faint">Settle in. Soften your gaze.</span>
    </div>
  </div>
);

export default CountdownOverlay;
