import { supabase } from './supabase';

export interface GpsStatus {
  state: 'idle' | 'requesting' | 'active' | 'denied' | 'unavailable';
  lat?: number;
  lng?: number;
  accuracy?: number;
  error?: string;
}

let watchId: number | null = null;

export async function requestLocation(): Promise<GpsStatus> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ state: 'unavailable' });
      return;
    }
    resolve({ state: 'requesting' });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          state: 'active',
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      (err) => {
        resolve({
          state: err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable',
          error: err.message,
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  });
}

export async function startLocationTracking(
  userId: string,
  taskId?: string,
  onUpdate?: (lat: number, lng: number, accuracy: number) => void
) {
  if (watchId !== null) return;
  if (!navigator.geolocation) return;

  watchId = navigator.geolocation.watchPosition(
    async (pos) => {
      const { latitude: lat, longitude: lng, accuracy } = pos.coords;
      onUpdate?.(lat, lng, accuracy);

      // Log to Supabase
      try {
        await supabase.from('locations').insert({
          task_id: taskId,
          user_id: userId,
          lat,
          lng,
          accuracy,
        });
      } catch (err) {
        console.error('[GPS] Failed to log location', err);
      }
    },
    (err) => {
      console.warn('[GPS] Watch error:', err.message);
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
  );
}

export function stopLocationTracking() {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
}
