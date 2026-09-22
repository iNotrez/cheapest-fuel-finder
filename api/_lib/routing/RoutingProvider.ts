import type { RouteDistanceResult } from '../../../shared/types';

export interface RoutingQuery {
  origin: { latitude: number; longitude: number };
  destinations: { id: string; latitude: number; longitude: number }[];
}

/**
 * A source of actual road-driving distances/durations. Kept behind this
 * interface so the routing backend (currently OpenRouteService) can be
 * swapped without touching the API route or the frontend.
 */
export interface RoutingProvider {
  readonly id: string;
  getDistances(query: RoutingQuery): Promise<RouteDistanceResult[]>;
}
