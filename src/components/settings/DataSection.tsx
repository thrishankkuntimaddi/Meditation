import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { signOutUser } from '../../firebase/auth';
import { deleteCloudData } from '../../lib/sync';
import { store } from '../../lib/store';
import { Dialog, Icon, Row, RowGroup, SectionLabel } from '../ui';

type Pending = 'device' | 'everything' | null;

/** Reset options: clear this device only, or delete everything everywhere. */
const DataSection: React.FC = () => {
  const { user } = useAuth();
  const [pending, setPending] = useState<Pending>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const clearDevice = async () => {
    setBusy(true);
    // Sign out first, otherwise cloud sync would immediately restore the data
    if (user) await signOutUser().catch(() => {});
    store.resetLocal();
    setBusy(false);
    setPending(null);
    setMessage(user ? 'This device was cleared and signed out. Your cloud data is untouched.' : 'This device was reset.');
  };

  const deleteEverything = async () => {
    if (!user) return;
    setBusy(true);
    try {
      await deleteCloudData(user.uid);
      store.resetLocal();
      setMessage('All your meditation data was deleted. Your account still exists.');
    } catch {
      setMessage('Could not reach the cloud. Nothing was deleted — try again when online.');
    }
    setBusy(false);
    setPending(null);
  };

  return (
    <section>
      <SectionLabel>Your data</SectionLabel>
      <RowGroup>
        <Row
          icon="refresh"
          title={user ? 'Clear this device' : 'Reset app'}
          subtitle={user
            ? 'Removes data from this device and signs out. Your synced data stays in your account.'
            : 'Deletes presets, history and settings on this device.'}
          onClick={() => setPending('device')}
          right={<Icon name="chevronRight" size={16} className="text-faint" />}
        />
        {user && (
          <Row
            icon="trash"
            title="Delete all my data"
            subtitle="Permanently deletes your presets, history and settings from every device."
            onClick={() => setPending('everything')}
            right={<Icon name="chevronRight" size={16} className="text-faint" />}
          />
        )}
      </RowGroup>
      {message && <p className="mt-2 px-1 text-xs text-muted" role="status">{message}</p>}

      <Dialog
        open={pending === 'device'}
        title={user ? 'Clear this device?' : 'Reset the app?'}
        body={user
          ? 'Everything on this device is removed and you are signed out. Sign in again any time to bring your synced data back.'
          : 'Your presets, history and settings on this device will be deleted. This can’t be undone.'}
        confirmLabel={busy ? 'Working…' : user ? 'Clear device' : 'Reset'}
        destructive
        onConfirm={clearDevice}
        onCancel={() => setPending(null)}
      />
      <Dialog
        open={pending === 'everything'}
        title="Delete all your data?"
        body="Your presets, meditation history and settings are permanently deleted from the cloud and this device. Other devices will no longer receive them. This can’t be undone."
        confirmLabel={busy ? 'Deleting…' : 'Delete everything'}
        destructive
        onConfirm={deleteEverything}
        onCancel={() => setPending(null)}
      />
    </section>
  );
};

export default DataSection;
