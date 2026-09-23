import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getProviderForState } from './_lib/providers/index.js';
import { sendError, sendJson, withErrorHandling, parseNumber } from './_lib/http.js';
import type { AustralianState } from '../shared/types.js';

const MAX_RADIUS_KM = 50;

async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') {
    sendError(res, 405, 'method_not_allowed', 'Only GET is supported.');
    return;
  }

  const latitude = parseNumber(req.query.lat);
  const longitude = parseNumber(req.query.lng);
  const radiusKm = parseNumber(req.query.radius) ?? 10;
  const fuelType = typeof req.query.fuelType === 'string' ? req.query.fuelType : undefined;
  const state = (typeof req.query.state === 'string' ? req.query.state : 'NSW') as AustralianState;

  if (latitude == null || longitude == null) {
    sendError(res, 400, 'invalid_request', 'lat and lng query parameters are required.');
    return;
  }
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    sendError(res, 400, 'invalid_request', 'lat/lng are out of range.');
    return;
  }
  if (radiusKm <= 0 || radiusKm > MAX_RADIUS_KM) {
    sendError(res, 400, 'invalid_request', `radius must be between 0 and ${MAX_RADIUS_KM}km.`);
    return;
  }

  let provider;
  try {
    provider = getProviderForState(state);
  } catch (err) {
    sendError(res, 400, 'unsupported_state', err instanceof Error ? err.message : String(err));
    return;
  }

  const result = await provider.getPricesNearby({ latitude, longitude, radiusKm, fuelType });

  // Prices refresh every ~15 minutes server-side; let CDN/browser cache
  // briefly too so rapid re-renders/tab-switches don't re-hit the function.
  res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
  sendJson(res, 200, result);
}

export default withErrorHandling(handler);
