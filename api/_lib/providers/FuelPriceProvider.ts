import type { AustralianState, FuelPricesResult } from '../../../shared/types';

export interface FuelPriceProviderQuery {
  latitude: number;
  longitude: number;
  radiusKm: number;
  fuelType?: string;
}

/**
 * A source of live fuel price data for one or more Australian states.
 * Every state-specific data source (NSW FuelCheck today; VIC/QLD/SA/WA/TAS
 * later) implements this same interface so the rest of the app — API
 * routes, caching, the frontend — never has to know which jurisdiction's API
 * it's actually talking to.
 */
export interface FuelPriceProvider {
  readonly id: string;
  readonly states: AustralianState[];
  getPricesNearby(query: FuelPriceProviderQuery): Promise<FuelPricesResult>;
}
