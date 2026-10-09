import React, { useEffect, useState } from 'react';
import { recommendedDownload, RELEASES_URL, type AppDownload } from '../../lib/install';
import { Icon, Row } from '../ui';

/** Web only: one button for the right installer on this device, plus "other devices". */
const DownloadRow: React.FC = () => {
  const [dl, setDl] = useState<AppDownload | null>(null);
  useEffect(() => { recommendedDownload().then(setDl); }, []);
  return (
    <>
      {dl && (
        <Row icon="download" title={dl.label} subtitle={dl.detail}
          onClick={() => { window.location.href = dl.url; }}
          right={<Icon name="chevronRight" size={16} className="text-faint" />} />
      )}
      <Row icon="devices" title="Apps for other devices" subtitle="Android, Mac, Windows and Linux — with an install guide"
        onClick={() => window.open(RELEASES_URL, '_blank', 'noopener')}
        right={<Icon name="chevronRight" size={16} className="text-faint" />} />
    </>
  );
};

export default DownloadRow;
