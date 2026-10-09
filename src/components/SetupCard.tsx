import React, { useEffect, useState } from 'react';
import { native, platform } from '../native';
import { Button, Card, Icon } from './ui';

const DISMISS_KEY = 'meditation_setup_dnd_dismissed';

/**
 * One-time nudge on Android: silencing calls and notifications needs Do Not
 * Disturb access, which only the user can grant. Hidden once granted or dismissed.
 */
const SetupCard: React.FC = () => {
  const [needed, setNeeded] = useState(false);

  useEffect(() => {
    if (platform !== 'android') return;
    let dismissed = false;
    try { dismissed = localStorage.getItem(DISMISS_KEY) === '1'; } catch { /* ignore */ }
    if (dismissed) return;
    const check = () => native.capabilities().then(c => setNeeded(c.systemDnd === 'needs-permission'));
    check();
    const onVisible = () => { if (document.visibilityState === 'visible') check(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  if (!needed) return null;

  const later = () => {
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch { /* ignore */ }
    setNeeded(false);
  };

  return (
    <Card className="mx-6 mb-6 p-4 animate-fade-in">
      <div className="flex items-start gap-3">
        <span className="w-9 h-9 rounded-xl bg-bg border border-line/10 flex items-center justify-center text-muted flex-shrink-0">
          <Icon name="bellOff" size={18} />
        </span>
        <div className="flex-1">
          <p className="text-sm text-ink2">Let Meditation silence your phone</p>
          <p className="mt-1 text-xs text-faint leading-relaxed">
            Allow Do Not Disturb access once. Calls and notifications are then held back during every session — alarms still ring.
          </p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" variant="primary" onClick={() => native.requestDndPermission()}>Allow</Button>
            <Button size="sm" variant="ghost" onClick={later}>Later</Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default SetupCard;
