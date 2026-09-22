import type {
  FuelPricesResult,
  GeocodeResult,
  RouteDistanceRequest,
  RouteMatrixResponse,
} from '@shared/types';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch {
    throw new ApiError('Network request failed. Check your connection and try again.', 0);
  }

  if (!response.ok) {
    let message = `Request failed (${response.status}).`;
    try {
      const body = (await response.json()) as { message?: string };
      if (body.message) message = body.message;
    } catch {
      // ignore — use default message
    }
    throw new ApiError(message, response.status);
  }

  return (await response.json()) as T;
}

export function fetchFuelPrices(params: {
  latitude: number;
  longitude: number;
  radiusKm: number;
  fuelType?: string;
  state?: string;
  signal?: AbortSignal;
}): Promise<FuelPricesResult> {
  const url = new URL('/api/fuel-prices', window.location.origin);
  url.searchParams.set('lat', String(params.latitude));
  url.searchParams.set('lng', String(params.longitude));
  url.searchParams.set('radius', String(params.radiusKm));
  if (params.fuelType) url.searchParams.set('fuelType', params.fuelType);
  if (params.state) url.searchParams.set('state', params.state);

  return request<FuelPricesResult>(url.toString(), { signal: params.signal });
}

export function fetchRouteMatrix(
  body: RouteDistanceRequest,
  signal?: AbortSignal,
): Promise<RouteMatrixResponse> {
  return request<RouteMatrixResponse>('/api/route-matrix', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });
}

export function fetchGeocode(query: string, signal?: AbortSignal): Promise<GeocodeResult[]> {
  const url = new URL('/api/geocode', window.location.origin);
  url.searchParams.set('q', query);
  return request<{ results: GeocodeResult[] }>(url.toString(), { signal }).then((r) => r.results);
}
