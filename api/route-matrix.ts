import type { VercelRequest, VercelResponse } from '@vercel/node';
import { OpenRouteServiceProvider } from './_lib/routing/OpenRouteServiceProvider.js';
import { sendError, sendJson, withErrorHandling } from './_lib/http.js';
import { haversineDistanceKm } from '../shared/geo.js';
import type { RouteDistanceResult, RouteMatrixResponse, RouteDistanceRequest } from '../shared/types.js';

const routingProvider = new OpenRouteServiceProvider();

function isValidBody(body: unknown): body is RouteDistanceRequest {
  if (!body || typeof body !== 'object') return false;
  const b = body as Record<string, unknown>;
  if (!b.origin || typeof b.origin !== 'object') return false;
  if (!Array.isArray(b.destinations)) return false;
  const origin = b.origin as Record<string, unknown>;
  return typeof origin.latitude === 'number' && typeof origin.longitude === 'number';
}

async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    sendError(res, 405, 'method_not_allowed', 'Only POST is supported.');
    return;
  }

  const body: unknown = req.body;
  if (!isValidBody(body)) {
    sendError(res, 400, 'invalid_request', 'Expected { origin: {latitude,longitude}, destinations: [...] }.');
    return;
  }

  if (body.destinations.length === 0) {
    const empty: RouteMatrixResponse = { results: [], provider: routingProvider.id, stale: false };
    sendJson(res, 200, empty);
    return;
  }

  try {
    const results = await routingProvider.getDistances(body);
    const response: RouteMatrixResponse = { results, provider: routingProvider.id, stale: false };
    res.setHeader('Cache-Control', 'public, max-age=120, stale-while-revalidate=600');
    sendJson(res, 200, response);
  } catch (err) {
    console.error('Routing provider failed, falling back to straight-line distances:', err);
    // Never fail the whole request just because routing is down — fall back
    // to clearly-labelled straight-line estimates so the UI still works.
    const results: RouteDistanceResult[] = body.destinations.map((d) => ({
      id: d.id,
      distanceKm: haversineDistanceKm(body.origin, d),
      durationMin: null,
      isRoadDistance: false,
    }));
    const response: RouteMatrixResponse = { results, provider: 'haversine-fallback', stale: true };
    sendJson(res, 200, response);
  }
}

export default withErrorHandling(handler);
