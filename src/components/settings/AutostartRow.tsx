import React, { useEffect, useState } from 'react';
import { autostart } from '../../native';
import { Row, Toggle } from '../ui';

/** Desktop: open at login, so reminders and silencing work without opening the app. */
const AutostartRow: React.FC = () => {
  const [on, setOn] = useState<boolean | null>(null);
  useEffect(() => { autostart.get().then(setOn); }, []);
  return (
    <Row icon="sun" title="Open at login"
      subtitle="Starts quietly in the menu bar / system tray, so reminders and silencing always work."
      right={<Toggle label="Open at login" checked={!!on} disabled={on === null}
        onChange={async v => { setOn(v); if (!(await autostart.set(v))) setOn(!v); }} />} />
  );
};

export default AutostartRow;
