import { compareStations, type StationCalculationResult } from '@/lib/calculations/fuelSavings';
import { haversineDistanceKm } from '@shared/geo';
import type { FuelPrice, RouteDistanceResult, Station } from '@shared/types';
import type { VehicleSettings } from '@/store/useSettingsStore';

export interface ComparedStation {
  station: Station;
  price: FuelPrice;
  distanceKm: number;
  durationMin: number | null;
  isRoadDistance: boolean;
  isBaseline: boolean;
  comparison: StationCalculationResult | null;
  comparisonErrors: string[] | null;
  /** Same calculation, but always using straight-line distance — shown in
   * the "how did we calculate this" detail as the simple estimate. */
  simpleComparison: StationCalculationResult | null;
  baselineDistanceKm: number;
}

export interface BuildComparedStationsParams {
  stations: Station[];
  fuelType: string;
  origin: { latitude: number; longitude: number };
  routeDistances: Map<string, RouteDistanceResult>;
  baselineStationId: string | null;
  settings: VehicleSettings;
}

export interface BuildComparedStationsResult {
  entries: ComparedStation[];
  baselineStationId: string | null;
}

interface StationWithDistance {
  station: Station;
  price: FuelPrice;
  distanceKm: number;
  durationMin: number | null;
  isRoadDistance: boolean;
}

function withDistance(
  stations: Station[],
  fuelType: string,
  origin: { latitude: number; longitude: number },
  routeDistances: Map<string, RouteDistanceResult>,
): StationWithDistance[] {
  return stations
    .map((station) => {
      const price = station.fuelPrices.find((p) => p.fuelType === fuelType);
      if (!price) return null;

      const routed = routeDistances.get(station.id);
      const distanceKm = routed?.distanceKm ?? haversineDistanceKm(origin, station);
      const isRoadDistance = routed?.isRoadDistance ?? false;
      const durationMin = routed?.durationMin ?? null;

      return { station, price, distanceKm, durationMin, isRoadDistance };
    })
    .filter((x): x is StationWithDistance => x !== null);
}

export function buildComparedStations(params: BuildComparedStationsParams): BuildComparedStationsResult {
  const withDist = withDistance(params.stations, params.fuelType, params.origin, params.routeDistances);
  if (withDist.length === 0) return { entries: [], baselineStationId: null };

  const requestedBaseline = params.baselineStationId
    ? withDist.find((s) => s.station.id === params.baselineStationId)
    : undefined;

  const baseline =
    requestedBaseline ?? withDist.reduce((closest, s) => (s.distanceKm < closest.distanceKm ? s : closest));

  const baselineHaversineKm = haversineDistanceKm(params.origin, baseline.station);

  const entries: ComparedStation[] = withDist.map((entry) => {
    const outcome = compareStations({
      baselinePricePerLitre: baseline.price.pricePerLitre,
      baselineDistanceKm: baseline.distanceKm,
      alternativePricePerLitre: entry.price.pricePerLitre,
      alternativeDistanceKm: entry.distanceKm,
      litres: params.settings.litres,
      consumptionL100km: params.settings.consumptionL100km,
    });

    const simpleOutcome = compareStations({
      baselinePricePerLitre: baseline.price.pricePerLitre,
      baselineDistanceKm: baselineHaversineKm,
      alternativePricePerLitre: entry.price.pricePerLitre,
      alternativeDistanceKm: haversineDistanceKm(params.origin, entry.station),
      litres: params.settings.litres,
      consumptionL100km: params.settings.consumptionL100km,
    });

    return {
      station: entry.station,
      price: entry.price,
      distanceKm: entry.distanceKm,
      durationMin: entry.durationMin,
      isRoadDistance: entry.isRoadDistance,
      isBaseline: entry.station.id === baseline.station.id,
      comparison: outcome.valid ? outcome.result : null,
      comparisonErrors: outcome.valid ? null : outcome.errors,
      simpleComparison: simpleOutcome.valid ? simpleOutcome.result : null,
      baselineDistanceKm: baseline.distanceKm,
    };
  });

  return { entries, baselineStationId: baseline.station.id };
}

export type SortMode = 'best-saving' | 'cheapest' | 'closest' | 'shortest-drive';

export function sortComparedStations(entries: ComparedStation[], mode: SortMode): ComparedStation[] {
  const sorted = [...entries];
  switch (mode) {
    case 'cheapest':
      return sorted.sort((a, b) => a.price.pricePerLitre - b.price.pricePerLitre);
    case 'closest':
      return sorted.sort((a, b) => a.distanceKm - b.distanceKm);
    case 'shortest-drive':
      return sorted.sort((a, b) => (a.durationMin ?? a.distanceKm * 1.5) - (b.durationMin ?? b.distanceKm * 1.5));
    case 'best-saving':
    default:
      return sorted.sort((a, b) => {
        const bNet = b.comparison?.netSaving ?? -Infinity;
        const aNet = a.comparison?.netSaving ?? -Infinity;
        return bNet - aNet;
      });
  }
}
