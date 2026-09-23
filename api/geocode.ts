import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sendError, sendJson, withErrorHandling } from './_lib/http.js';
import { cachedFetch } from './_lib/cache.js';
import type { GeocodeResult } from '../shared/types.js';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const GEOCODE_TTL_MS = 24 * 60 * 60 * 1000;

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

async function searchNominatim(query: string): Promise<GeocodeResult[]> {
  const userAgent = process.env.NOMINATIM_USER_AGENT || 'cheapest-fuel-finder (no-contact-configured)';
  const url = new URL(NOMINATIM_URL);
  url.searchParams.set('q', `${query}, NSW, Australia`);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('limit', '5');
  url.searchParams.set('countrycodes', 'au');

  const response = await fetch(url, { headers: { 'User-Agent': userAgent } });
  if (!response.ok) {
    throw new Error(`Nominatim error: ${response.status}`);
  }

  const results = (await response.json()) as NominatimResult[];
  return results.map((r) => ({
    label: r.display_name,
    latitude: Number(r.lat),
    longitude: Number(r.lon),
  }));
}

async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') {
    sendError(res, 405, 'method_not_allowed', 'Only GET is supported.');
    return;
  }

  const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  if (query.length < 3) {
    sendError(res, 400, 'invalid_request', 'q must be at least 3 characters (address, suburb or postcode).');
    return;
  }

  // Nominatim's usage policy caps public requests at 1/sec — cache per query
  // so repeated searches (or multiple users searching the same suburb)
  // don't hammer it, on top of the client-side debounce.
  const { value } = await cachedFetch(`geocode:${query.toLowerCase()}`, GEOCODE_TTL_MS, () =>
    searchNominatim(query),
  );

  res.setHeader('Cache-Control', 'public, max-age=3600');
  sendJson(res, 200, { results: value });
}

export default withErrorHandling(handler);
