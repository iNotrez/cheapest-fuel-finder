/**
 * Normalised data model shared between the backend (/api) and the frontend.
 * Every FuelPriceProvider must map its raw API response into these shapes
 * so the rest of the app never has to know which state/data source it came from.
 */

export type AustralianState = 'NSW' | 'VIC' | 'QLD' | 'SA' | 'WA' | 'TAS' | 'NT' | 'ACT';

export interface FuelType {
  /** Provider-specific code, e.g. "E10", "P95", "DL". Never assume a fixed set. */
  code: string;
  /** Human readable name, e.g. "Ethanol 94". Falls back to `code` if unknown. */
  name: string;
}

export interface FuelPrice {
  fuelType: string;
  /** Dollars per litre, e.g. 1.849 */
  pricePerLitre: number;
  /** ISO 8601 timestamp of when this price was last submitted/updated. */
  timestamp: string;
}

export interface OpeningHours {
  raw?: string;
}

export interface Station {
  id: string;
  name: string;
  brand: string;
  address: string;
  suburb?: string;
  state: AustralianState;
  postcode?: string;
  latitude: number;
  longitude: number;
  fuelPrices: FuelPrice[];
  /** Most recent timestamp across all this station's fuel prices. */
  lastUpdated: string | null;
  openingHours?: OpeningHours;
}

export interface FuelPricesQuery {
  latitude: number;
  longitude: number;
  radiusKm: number;
  fuelType?: string;
  state?: AustralianState;
}

export interface FuelPricesResult {
  stations: Station[];
  fuelTypes: FuelType[];
  source: string;
  fetchedAt: string;
  /** True if we served a cached snapshot because the live call failed or was throttled. */
  stale: boolean;
}

export interface RouteDistanceRequest {
  origin: { latitude: number; longitude: number };
  destinations: { id: string; latitude: number; longitude: number }[];
}

export interface RouteDistanceResult {
  id: string;
  distanceKm: number | null;
  durationMin: number | null;
  /** false when we had to fall back to a straight-line estimate. */
  isRoadDistance: boolean;
}

export interface RouteMatrixResponse {
  results: RouteDistanceResult[];
  provider: string;
  stale: boolean;
}

export interface GeocodeResult {
  label: string;
  latitude: number;
  longitude: number;
}

export interface ApiErrorBody {
  error: string;
  message: string;
}
