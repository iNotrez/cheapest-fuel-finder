import type { RouteDistanceResult } from '../../../shared/types.js';
import { haversineDistanceKm } from '../../../shared/geo.js';
import type { RoutingProvider, RoutingQuery } from './RoutingProvider.js';

const MATRIX_URL = 'https://api.openrouteservice.org/v2/matrix/driving-car';

// Free tier is 2,500 matrix requests/day — one request per search comfortably
// covers real usage, and we only ever send the nearest N candidates (never
// every station in the search radius) to keep each request small and fast.
const MAX_DESTINATIONS_PER_REQUEST = 25;

interface OrsMatrixResponse {
  distances: (number | null)[][];
  durations: (number | null)[][];
}

export class OpenRouteServiceProvider implements RoutingProvider {
  readonly id = 'openrouteservice';

  async getDistances(query: RoutingQuery): Promise<RouteDistanceResult[]> {
    const apiKey = process.env.ORS_API_KEY;
    if (!apiKey) {
      throw new Error('ORS_API_KEY is not configured. See .env.example.');
    }

    const destinations = query.destinations.slice(0, MAX_DESTINATIONS_PER_REQUEST);
    if (destinations.length === 0) return [];

    const locations: [number, number][] = [
      [query.origin.longitude, query.origin.latitude],
      ...destinations.map((d): [number, number] => [d.longitude, d.latitude]),
    ];

    const response = await fetch(MATRIX_URL, {
      method: 'POST',
      headers: {
        Authorization: apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        locations,
        sources: [0],
        destinations: destinations.map((_, i) => i + 1),
        metrics: ['distance', 'duration'],
        units: 'km',
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouteService matrix error: ${response.status} ${await response.text()}`);
    }

    const data = (await response.json()) as OrsMatrixResponse;
    const distanceRow = data.distances?.[0] ?? [];
    const durationRow = data.durations?.[0] ?? [];

    return destinations.map((destination, i) => {
      const distanceKm = distanceRow[i];
      const durationSec = durationRow[i];
      if (distanceKm == null || durationSec == null) {
        // ORS couldn't route this one (e.g. unreachable) — fall back to a
        // clearly-labelled straight-line estimate rather than dropping it.
        return {
          id: destination.id,
          distanceKm: haversineDistanceKm(query.origin, destination),
          durationMin: null,
          isRoadDistance: false,
        };
      }
      return {
        id: destination.id,
        distanceKm,
        durationMin: durationSec / 60,
        isRoadDistance: true,
      };
    });
  }
}
