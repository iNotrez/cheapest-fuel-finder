import { useCallback, useEffect, useRef, useState } from 'react';

export type LocationSource = 'geolocation' | 'manual';

export interface AppLocation {
  latitude: number;
  longitude: number;
  label: string;
  source: LocationSource;
}

export type GeolocationStatus = 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable';

export function useGeolocation() {
  const [status, setStatus] = useState<GeolocationStatus>('idle');
  const [location, setLocation] = useState<AppLocation | null>(null);
  const requestedOnMount = useRef(false);

  const requestGeolocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setStatus('unavailable');
      return;
    }
    setStatus('requesting');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          label: 'Your current location',
          source: 'geolocation',
        });
        setStatus('granted');
      },
      () => {
        setStatus('denied');
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 5 * 60 * 1000 },
    );
  }, []);

  // Ask exactly once, automatically, when the app first loads. We never call
  // this again on our own — repeated silent re-prompts are exactly what the
  // spec asks us to avoid.
  useEffect(() => {
    if (requestedOnMount.current) return;
    requestedOnMount.current = true;
    requestGeolocation();
  }, [requestGeolocation]);

  const setManualLocation = useCallback((loc: { latitude: number; longitude: number; label: string }) => {
    setLocation({ ...loc, source: 'manual' });
    setStatus('granted');
  }, []);

  return { status, location, requestGeolocation, setManualLocation };
}
