import React, { useState } from 'react';
import Icon from './ui/Icon';

const UpdateBanner: React.FC<{ onUpdate: () => void }> = ({ onUpdate }) => {
  const [loading, setLoading] = useState(false);
  return (
    <div className="fixed left-1/2 -translate-x-1/2 z-[90] animate-slide-up" style={{ top: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}>
      <div className="flex items-center gap-3 rounded-full bg-ink text-bg pl-4 pr-1.5 py-1.5 shadow-xl whitespace-nowrap">
        <span className="w-2 h-2 rounded-full bg-ok" />
        <span className="text-xs opacity-75">New version available</span>
        <button
          id="update-app-btn"
          onClick={() => { setLoading(true); onUpdate(); }}
          disabled={loading}
          className="h-8 px-3.5 rounded-full bg-bg text-ink text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-60"
        >
          <Icon name="refresh" size={14} />
          {loading ? 'Updating…' : 'Update'}
        </button>
      </div>
    </div>
  );
};

export default UpdateBanner;
