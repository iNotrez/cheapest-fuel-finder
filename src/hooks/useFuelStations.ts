import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError, fetchFuelPrices } from '@/lib/api/client';
import type { FuelPricesResult } from '@shared/types';

export type FuelStationsStatus = 'idle' | 'loading' | 'success' | 'error';

const DEBOUNCE_MS = 350;

export function useFuelStations(
  location: { latitude: number; longitude: number } | null,
  radiusKm: number,
) {
  const [status, setStatus] = useState<FuelStationsStatus>('idle');
  const [data, setData] = useState<FuelPricesResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!location) return;

    const timer = window.setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setStatus('loading');
      setError(null);

      fetchFuelPrices({
        latitude: location.latitude,
        longitude: location.longitude,
        radiusKm,
        signal: controller.signal,
      })
        .then((result) => {
          setData(result);
          setStatus('success');
        })
        .catch((err: unknown) => {
          if (err instanceof DOMException && err.name === 'AbortError') return;
          setError(err instanceof ApiError ? err.message : 'Fuel prices couldn’t be updated right now.');
          setStatus('error');
        });
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location?.latitude, location?.longitude, radiusKm, reloadToken]);

  const retry = useCallback(() => setReloadToken((t) => t + 1), []);

  return { status, data, error, retry };
}
