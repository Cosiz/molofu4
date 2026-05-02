import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useEffect, useState } from 'react';
import { getSyncQueueCount } from '../services/offline';

export function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!isOnline) {
      getSyncQueueCount().then(setPendingCount).catch(() => {});
    }
  }, [isOnline]);

  if (isOnline) return null;

  return (
    <div className="offline-banner" role="status" aria-live="polite">
      📴 Offline — {pendingCount > 0 ? `${pendingCount} change${pendingCount > 1 ? 's' : ''} will sync when connected` : 'changes will sync when connected'}
    </div>
  );
}
