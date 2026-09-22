import type { FuelPrice, FuelType, Station } from '../../../shared/types';
import { parseNswTimestamp } from '../time';
import type { RawNswFuelType, RawNswPrice, RawNswStation } from './nswFuelClient';

// Matches "... SUBURB NAME NSW 2000" at the end of a free-text address.
const SUBURB_STATE_POSTCODE = /,?\s*([A-Za-z' -]+?)\s+NSW\s+(\d{4})\s*$/i;

function parseSuburbAndPostcode(address: string): { suburb?: string; postcode?: string } {
  const match = SUBURB_STATE_POSTCODE.exec(address);
  if (!match) return {};
  return { suburb: match[1].trim(), postcode: match[2] };
}

export function normalizeStation(raw: RawNswStation, prices: RawNswPrice[]): Station {
  const { suburb, postcode } = parseSuburbAndPostcode(raw.address);

  const fuelPrices: FuelPrice[] = prices
    .filter((p) => p.stationcode === raw.code)
    .map((p) => ({
      fuelType: p.fueltype,
      pricePerLitre: p.price / 100,
      timestamp: parseNswTimestamp(p.lastupdated) ?? new Date(0).toISOString(),
    }))
    .filter((p) => Number.isFinite(p.pricePerLitre) && p.pricePerLitre > 0);

  const lastUpdated =
    fuelPrices.length > 0
      ? fuelPrices.reduce((latest, p) => (p.timestamp > latest ? p.timestamp : latest), fuelPrices[0].timestamp)
      : null;

  return {
    id: raw.code,
    name: raw.name,
    brand: raw.brand,
    address: raw.address,
    suburb,
    state: 'NSW',
    postcode,
    latitude: raw.location.latitude,
    longitude: raw.location.longitude,
    fuelPrices,
    lastUpdated,
  };
}

export function normalizeFuelTypes(raw: RawNswFuelType[]): FuelType[] {
  return raw.map((f) => ({ code: f.code, name: f.name }));
}
