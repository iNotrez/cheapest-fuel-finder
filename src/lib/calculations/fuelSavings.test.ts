import { describe, expect, it } from 'vitest';
import {
  BREAK_EVEN_BAND_DOLLARS,
  calculateAdditionalDistance,
  calculateBreakEvenPrice,
  calculateExtraFuelCost,
  calculateExtraFuelUsed,
  calculateFuelPriceSaving,
  calculateNetSaving,
  compareStations,
  getSavingVerdict,
  validateStationCalculationInput,
  type StationCalculationInput,
} from './fuelSavings';
import { haversineDistanceKm } from '../../../shared/geo';

const baseInput: StationCalculationInput = {
  baselinePricePerLitre: 2.05,
  baselineDistanceKm: 2,
  alternativePricePerLitre: 1.95,
  alternativeDistanceKm: 8,
  litres: 50,
  consumptionL100km: 8,
};

describe('individual calculation steps (worked example from the spec)', () => {
  it('price saving = $5.00', () => {
    expect(calculateFuelPriceSaving(2.05, 1.95, 50)).toBeCloseTo(5.0, 5);
  });

  it('extra distance = 6 km', () => {
    expect(calculateAdditionalDistance(2, 8)).toBe(6);
  });

  it('extra fuel = 0.48 L', () => {
    expect(calculateExtraFuelUsed(6, 8)).toBeCloseTo(0.48, 5);
  });

  it('extra fuel cost ≈ $0.94', () => {
    expect(calculateExtraFuelCost(0.48, 1.95)).toBeCloseTo(0.936, 5);
  });

  it('net saving ≈ $4.06', () => {
    expect(calculateNetSaving(5.0, 0.936)).toBeCloseTo(4.064, 5);
  });
});

describe('compareStations — end-to-end worked example', () => {
  it('matches every figure from the spec example', () => {
    const comparison = compareStations(baseInput);
    expect(comparison.valid).toBe(true);
    if (!comparison.valid) return;

    expect(comparison.result.priceSaving).toBeCloseTo(5.0, 5);
    expect(comparison.result.extraDistanceKm).toBe(6);
    expect(comparison.result.extraFuelLitres).toBeCloseTo(0.48, 5);
    expect(comparison.result.extraFuelCost).toBeCloseTo(0.936, 5);
    expect(comparison.result.netSaving).toBeCloseTo(4.064, 5);
    expect(comparison.result.verdict).toBe('profitable');
    expect(comparison.result.breakEvenPricePerLitre).toBeCloseTo(2.0308, 3);
  });
});

describe('compareStations — additional scenarios', () => {
  it('alternative is cheaper but far away: extra driving wipes out the saving', () => {
    const comparison = compareStations({
      baselinePricePerLitre: 2.0,
      baselineDistanceKm: 1,
      alternativePricePerLitre: 1.85,
      alternativeDistanceKm: 40,
      litres: 40,
      consumptionL100km: 9,
    });
    expect(comparison.valid).toBe(true);
    if (!comparison.valid) return;
    // priceSaving = 0.15*40 = 6; extraDistance = 39; extraFuel = 39*9/100=3.51
    // extraFuelCost = 3.51*1.85 = 6.4935; netSaving = 6 - 6.4935 = -0.4935
    expect(comparison.result.netSaving).toBeLessThan(0);
    expect(comparison.result.verdict).toBe('not-worth');
  });

  it('alternative is only slightly cheaper: small but real net saving', () => {
    const comparison = compareStations({
      baselinePricePerLitre: 1.9,
      baselineDistanceKm: 3,
      alternativePricePerLitre: 1.88,
      alternativeDistanceKm: 3.5,
      litres: 45,
      consumptionL100km: 7,
    });
    expect(comparison.valid).toBe(true);
    if (!comparison.valid) return;
    // priceSaving = 0.02*45 = 0.9; extraDistance=0.5; extraFuel=0.035
    // extraFuelCost = 0.035*1.88=0.0658; netSaving=0.8342
    expect(comparison.result.netSaving).toBeCloseTo(0.8342, 3);
    expect(comparison.result.verdict).toBe('profitable');
  });

  it('same fuel price and same distance nets exactly zero (break-even)', () => {
    const comparison = compareStations({
      baselinePricePerLitre: 1.9,
      baselineDistanceKm: 5,
      alternativePricePerLitre: 1.9,
      alternativeDistanceKm: 5,
      litres: 50,
      consumptionL100km: 8,
    });
    expect(comparison.valid).toBe(true);
    if (!comparison.valid) return;
    expect(comparison.result.priceSaving).toBe(0);
    expect(comparison.result.extraFuelCost).toBe(0);
    expect(comparison.result.netSaving).toBe(0);
    expect(comparison.result.verdict).toBe('breakeven');
  });

  it('same fuel price but alternative is further away: pure loss', () => {
    const comparison = compareStations({
      baselinePricePerLitre: 1.9,
      baselineDistanceKm: 2,
      alternativePricePerLitre: 1.9,
      alternativeDistanceKm: 10,
      litres: 50,
      consumptionL100km: 8,
    });
    expect(comparison.valid).toBe(true);
    if (!comparison.valid) return;
    expect(comparison.result.priceSaving).toBe(0);
    expect(comparison.result.netSaving).toBeLessThan(0);
    expect(comparison.result.verdict).toBe('not-worth');
  });

  it('alternative is closer than the baseline: distance is a bonus, not a cost', () => {
    const comparison = compareStations({
      baselinePricePerLitre: 2.0,
      baselineDistanceKm: 10,
      alternativePricePerLitre: 1.98,
      alternativeDistanceKm: 3,
      litres: 50,
      consumptionL100km: 8,
    });
    expect(comparison.valid).toBe(true);
    if (!comparison.valid) return;
    // extraDistance = -7 -> negative extra fuel -> extra fuel COST is negative (a bonus)
    expect(comparison.result.extraDistanceKm).toBe(-7);
    expect(comparison.result.extraFuelLitres).toBeCloseTo(-0.56, 5);
    expect(comparison.result.extraFuelCost).toBeLessThan(0);
    expect(comparison.result.netSaving).toBeGreaterThan(comparison.result.priceSaving);
    expect(comparison.result.verdict).toBe('profitable');
  });

  it('larger fuel purchase amplifies both the saving and the break-even sensitivity', () => {
    const small = compareStations({ ...baseInput, litres: 50 });
    const large = compareStations({ ...baseInput, litres: 100 });
    expect(small.valid && large.valid).toBe(true);
    if (!small.valid || !large.valid) return;
    expect(large.result.netSaving).toBeGreaterThan(small.result.netSaving);
  });

  it('smaller fuel purchase shrinks the saving', () => {
    const comparison = compareStations({ ...baseInput, litres: 10 });
    expect(comparison.valid).toBe(true);
    if (!comparison.valid) return;
    // priceSaving = 0.10*10=1; extraFuel unaffected by litres (distance/consumption only) = 0.48
    // extraFuelCost = 0.936; netSaving = 1 - 0.936 = 0.064
    expect(comparison.result.netSaving).toBeCloseTo(0.064, 3);
    expect(comparison.result.verdict).toBe('breakeven');
  });

  it('a thirstier vehicle burns through the price saving faster', () => {
    const efficient = compareStations({ ...baseInput, consumptionL100km: 6 });
    const thirsty = compareStations({ ...baseInput, consumptionL100km: 18 });
    expect(efficient.valid && thirsty.valid).toBe(true);
    if (!efficient.valid || !thirsty.valid) return;
    expect(thirsty.result.netSaving).toBeLessThan(efficient.result.netSaving);
  });

  it('rejects zero/negative litres, consumption, price, or distance', () => {
    const zeroLitres = compareStations({ ...baseInput, litres: 0 });
    expect(zeroLitres.valid).toBe(false);

    const negConsumption = compareStations({ ...baseInput, consumptionL100km: -8 });
    expect(negConsumption.valid).toBe(false);

    const zeroPrice = compareStations({ ...baseInput, alternativePricePerLitre: 0 });
    expect(zeroPrice.valid).toBe(false);

    const negDistance = compareStations({ ...baseInput, alternativeDistanceKm: -1 });
    expect(negDistance.valid).toBe(false);
  });

  it('treats missing/undefined route data as invalid input rather than crashing', () => {
    const missingDistance = compareStations({
      ...baseInput,
      alternativeDistanceKm: undefined as unknown as number,
    });
    expect(missingDistance.valid).toBe(false);
    if (missingDistance.valid) return;
    expect(missingDistance.errors.length).toBeGreaterThan(0);
  });

  it('validateStationCalculationInput reports every failing field', () => {
    const { valid, errors } = validateStationCalculationInput({});
    expect(valid).toBe(false);
    expect(errors.length).toBe(6);
  });
});

describe('calculateBreakEvenPrice', () => {
  it('equals the baseline price when there is no extra fuel (same distance)', () => {
    expect(calculateBreakEvenPrice(2.05, 50, 0)).toBeCloseTo(2.05, 5);
  });

  it('returns null when litres + extraFuel is zero or negative (degenerate case)', () => {
    expect(calculateBreakEvenPrice(2.05, 10, -10)).toBeNull();
    expect(calculateBreakEvenPrice(2.05, 10, -20)).toBeNull();
  });
});

describe('getSavingVerdict', () => {
  it('classifies profitable, breakeven and not-worth using the break-even band', () => {
    expect(getSavingVerdict(BREAK_EVEN_BAND_DOLLARS + 0.01)).toBe('profitable');
    expect(getSavingVerdict(BREAK_EVEN_BAND_DOLLARS - 0.01)).toBe('breakeven');
    expect(getSavingVerdict(0)).toBe('breakeven');
    expect(getSavingVerdict(-BREAK_EVEN_BAND_DOLLARS + 0.01)).toBe('breakeven');
    expect(getSavingVerdict(-BREAK_EVEN_BAND_DOLLARS - 0.01)).toBe('not-worth');
  });
});

describe('haversineDistanceKm', () => {
  it('is ~0 for identical points', () => {
    const p = { latitude: -33.8688, longitude: 151.2093 };
    expect(haversineDistanceKm(p, p)).toBeCloseTo(0, 5);
  });

  it('roughly matches the known straight-line distance from Sydney CBD to Parramatta (~17-18km)', () => {
    const sydneyCbd = { latitude: -33.8688, longitude: 151.2093 };
    const parramatta = { latitude: -33.8151, longitude: 151.0011 };
    const distance = haversineDistanceKm(sydneyCbd, parramatta);
    expect(distance).toBeGreaterThan(15);
    expect(distance).toBeLessThan(21);
  });
});
