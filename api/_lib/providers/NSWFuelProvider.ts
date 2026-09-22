import type { FuelPricesResult, FuelType, Station } from '../../../shared/types';
import { haversineDistanceKm } from '../../../shared/geo';
import { cachedFetch } from '../cache';
import type { FuelPriceProvider, FuelPriceProviderQuery } from './FuelPriceProvider';
import { getAllPrices, getReferenceData } from './nswFuelClient';
import { normalizeFuelTypes, normalizeStation } from './normalize';

// NSW retailers are required to update FuelCheck within a short window of
// any price change; refreshing our cache every 15 minutes keeps us well
// within the 2,500 calls/month free tier (~96/day at this rate) while
// staying close to real-time.
const PRICES_TTL_MS = 15 * 60 * 1000;
const REFERENCE_TTL_MS = 12 * 60 * 60 * 1000;

async function loadAllStations(): Promise<{ stations: Station[]; fetchedAt: number; stale: boolean }> {
  const { value, fetchedAt, stale } = await cachedFetch('nsw:prices', PRICES_TTL_MS, getAllPrices);
  const stations = value.stations.map((s) => normalizeStation(s, value.prices));
  return { stations, fetchedAt, stale };
}

async function loadFuelTypes(): Promise<FuelType[]> {
  const { value } = await cachedFetch('nsw:reference', REFERENCE_TTL_MS, getReferenceData);
  return normalizeFuelTypes(value.fueltypes.items);
}

export class NSWFuelProvider implements FuelPriceProvider {
  readonly id = 'nsw-fuelcheck';
  readonly states = ['NSW'] as const;

  async getPricesNearby(query: FuelPriceProviderQuery): Promise<FuelPricesResult> {
    const [{ stations, fetchedAt, stale }, fuelTypes] = await Promise.all([
      loadAllStations(),
      loadFuelTypes(),
    ]);

    const origin = { latitude: query.latitude, longitude: query.longitude };

    const nearby = stations
      .map((station) => ({
        station,
        distanceKm: haversineDistanceKm(origin, station),
      }))
      .filter(({ distanceKm }) => distanceKm <= query.radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .map(({ station }) => station);

    const filtered = query.fuelType
      ? nearby
          .map((station) => ({
            ...station,
            fuelPrices: station.fuelPrices.filter((p) => p.fuelType === query.fuelType),
          }))
          .filter((station) => station.fuelPrices.length > 0)
      : nearby.filter((station) => station.fuelPrices.length > 0);

    return {
      stations: filtered,
      fuelTypes,
      source: this.id,
      fetchedAt: new Date(fetchedAt).toISOString(),
      stale,
    };
  }
}
