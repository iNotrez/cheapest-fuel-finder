import { useEffect, useRef, useState } from 'react';
import { fetchRouteMatrix } from '@/lib/api/client';
import { haversineDistanceKm } from '@shared/geo';
import type { RouteDistanceResult } from '@shared/types';

export type RouteDistancesStatus = 'idle' | 'loading' | 'success' | 'error';

// Keep each matrix request small, fast and inside the free tier: only route
// to the stations that could plausibly matter, nearest-first.
const MAX_ROUTED_STATIONS = 25;
const DEBOUNCE_MS = 250;

export interface RoutableStation {
  id: string;
  latitude: number;
  longitude: number;
}

export function useRouteDistances(
  origin: { latitude: number; longitude: number } | null,
  stations: RoutableStation[],
) {
  const [status, setStatus] = useState<RouteDistancesStatus>('idle');
  const [distances, setDistances] = useState<Map<string, RouteDistanceResult>>(new Map());
  const [stale, setStale] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const stationsKey = stations
    .map((s) => s.id)
    .sort()
    .join(',');

  useEffect(() => {
    if (!origin || stations.length === 0) {
      setDistances(new Map());
      return;
    }

    const timer = window.setTimeout(() => {
      const candidates = [...stations]
        .sort((a, b) => haversineDistanceKm(origin, a) - haversineDistanceKm(origin, b))
        .slice(0, MAX_ROUTED_STATIONS);

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setStatus('loading');

      fetchRouteMatrix(
        {
          origin,
          destinations: candidates.map((c) => ({ id: c.id, latitude: c.latitude, longitude: c.longitude })),
        },
        controller.signal,
      )
        .then((response) => {
          setDistances(new Map(response.results.map((r) => [r.id, r])));
          setStale(response.stale);
          setStatus('success');
        })
        .catch((err: unknown) => {
          if (err instanceof DOMException && err.name === 'AbortError') return;
          setStatus('error');
        });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin?.latitude, origin?.longitude, stationsKey]);

  return { status, distances, stale };
}
