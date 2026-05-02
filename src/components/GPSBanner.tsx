import { useEffect, useState } from 'react';
import { requestLocation, startLocationTracking, stopLocationTracking, type GpsStatus } from '../services/gps';

interface Props {
  userId: string;
  taskId?: string;
  onLocationUpdate?: (lat: number, lng: number) => void;
}

export function GPSBanner({ userId, taskId, onLocationUpdate }: Props) {
  const [status, setStatus] = useState<GpsStatus>({ state: 'idle' });

  useEffect(() => {
    async function init() {
      const result = await requestLocation();
      setStatus(result);
      if (result.state === 'active' && result.lat != null && result.lng != null) {
        onLocationUpdate?.(result.lat, result.lng);
        startLocationTracking(userId, taskId, (lat, lng, accuracy) => {
          onLocationUpdate?.(lat, lng);
        });
      }
    }
    init();
    return () => stopLocationTracking();
  }, [userId, taskId]);

  if (status.state === 'idle') return null;

  if (status.state === 'requesting') {
    return (
      <div className="gps-banner">
        📍 Requesting location…
      </div>
    );
  }

  if (status.state === 'denied') {
    return (
      <div className="gps-banner">
        📍 Location access denied
      </div>
    );
  }

  if (status.state === 'unavailable') {
    return null;
  }

  return (
    <div className="gps-banner gps-active">
      📍 Live location sharing active
    </div>
  );
}
