/**
 * Pure, framework-free calculation engine for the "is it worth the drive"
 * decision. No React, no API calls — just numbers in, numbers out — so it
 * can be unit tested exhaustively and reused server-side if needed.
 */

/** Net saving within +/- this many dollars is shown as "basically break-even"
 * rather than a hard win/loss, since both prices and distances carry a
 * margin of error. */
export const BREAK_EVEN_BAND_DOLLARS = 0.3;

export type SavingVerdict = 'profitable' | 'breakeven' | 'not-worth';

export interface StationCalculationInput {
  baselinePricePerLitre: number;
  baselineDistanceKm: number;
  alternativePricePerLitre: number;
  alternativeDistanceKm: number;
  litres: number;
  consumptionL100km: number;
}

export interface StationCalculationResult {
  /** Money saved purely from the lower price per litre (before travel cost). */
  priceSaving: number;
  /** alternativeDistanceKm - baselineDistanceKm. Negative means the
   * alternative station is actually closer than the baseline. */
  extraDistanceKm: number;
  /** Extra litres burned (or saved, if negative) getting to the alternative
   * station instead of the baseline. */
  extraFuelLitres: number;
  /** Dollar cost (or saving, if negative) of that extra fuel. */
  extraFuelCost: number;
  /** The number that actually matters: priceSaving - extraFuelCost. */
  netSaving: number;
  /** The alternative price per litre at which netSaving would be exactly 0. */
  breakEvenPricePerLitre: number | null;
  verdict: SavingVerdict;
}

export function calculateFuelPriceSaving(
  baselinePricePerLitre: number,
  alternativePricePerLitre: number,
  litres: number,
): number {
  return (baselinePricePerLitre - alternativePricePerLitre) * litres;
}

export function calculateAdditionalDistance(
  baselineDistanceKm: number,
  alternativeDistanceKm: number,
): number {
  return alternativeDistanceKm - baselineDistanceKm;
}

export function calculateExtraFuelUsed(
  extraDistanceKm: number,
  consumptionL100km: number,
): number {
  return (extraDistanceKm * consumptionL100km) / 100;
}

export function calculateExtraFuelCost(
  extraFuelLitres: number,
  alternativePricePerLitre: number,
): number {
  return extraFuelLitres * alternativePricePerLitre;
}

export function calculateNetSaving(priceSaving: number, extraFuelCost: number): number {
  return priceSaving - extraFuelCost;
}

/**
 * The alternative price per litre at which this trip would net exactly $0.
 * Below this price, the trip is worth it; above it, it isn't.
 *
 * Derived by solving netSaving = 0 for alternativePricePerLitre:
 *   (baseline - alt) * litres - extraFuel * alt = 0
 *   baseline * litres = alt * (litres + extraFuel)
 *   alt = baseline * litres / (litres + extraFuel)
 *
 * Returns null when the result is undefined (litres + extraFuel <= 0, e.g. a
 * station so much closer that it would "use negative fuel" to reach).
 */
export function calculateBreakEvenPrice(
  baselinePricePerLitre: number,
  litres: number,
  extraFuelLitres: number,
): number | null {
  const denominator = litres + extraFuelLitres;
  if (denominator <= 0) return null;
  return (baselinePricePerLitre * litres) / denominator;
}

export function getSavingVerdict(netSaving: number): SavingVerdict {
  if (netSaving > BREAK_EVEN_BAND_DOLLARS) return 'profitable';
  if (netSaving < -BREAK_EVEN_BAND_DOLLARS) return 'not-worth';
  return 'breakeven';
}

export interface InputValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateStationCalculationInput(
  input: Partial<StationCalculationInput>,
): InputValidationResult {
  const errors: string[] = [];

  if (input.baselinePricePerLitre == null || !Number.isFinite(input.baselinePricePerLitre) || input.baselinePricePerLitre <= 0) {
    errors.push('Baseline price per litre must be a positive number.');
  }
  if (input.alternativePricePerLitre == null || !Number.isFinite(input.alternativePricePerLitre) || input.alternativePricePerLitre <= 0) {
    errors.push('Alternative price per litre must be a positive number.');
  }
  if (input.baselineDistanceKm == null || !Number.isFinite(input.baselineDistanceKm) || input.baselineDistanceKm < 0) {
    errors.push('Baseline distance must be a non-negative number.');
  }
  if (input.alternativeDistanceKm == null || !Number.isFinite(input.alternativeDistanceKm) || input.alternativeDistanceKm < 0) {
    errors.push('Alternative distance must be a non-negative number.');
  }
  if (input.litres == null || !Number.isFinite(input.litres) || input.litres <= 0) {
    errors.push('Litres to purchase must be a positive number.');
  }
  if (input.consumptionL100km == null || !Number.isFinite(input.consumptionL100km) || input.consumptionL100km <= 0) {
    errors.push('Fuel consumption must be a positive number.');
  }

  return { valid: errors.length === 0, errors };
}

export type StationComparison =
  | { valid: true; result: StationCalculationResult }
  | { valid: false; errors: string[] };

/** The single entry point the UI should call: validates, runs every step of
 * the calculation, and classifies the verdict. */
export function compareStations(input: StationCalculationInput): StationComparison {
  const validation = validateStationCalculationInput(input);
  if (!validation.valid) {
    return { valid: false, errors: validation.errors };
  }

  const priceSaving = calculateFuelPriceSaving(
    input.baselinePricePerLitre,
    input.alternativePricePerLitre,
    input.litres,
  );
  const extraDistanceKm = calculateAdditionalDistance(
    input.baselineDistanceKm,
    input.alternativeDistanceKm,
  );
  const extraFuelLitres = calculateExtraFuelUsed(extraDistanceKm, input.consumptionL100km);
  const extraFuelCost = calculateExtraFuelCost(extraFuelLitres, input.alternativePricePerLitre);
  const netSaving = calculateNetSaving(priceSaving, extraFuelCost);
  const breakEvenPricePerLitre = calculateBreakEvenPrice(
    input.baselinePricePerLitre,
    input.litres,
    extraFuelLitres,
  );

  return {
    valid: true,
    result: {
      priceSaving,
      extraDistanceKm,
      extraFuelLitres,
      extraFuelCost,
      netSaving,
      breakEvenPricePerLitre,
      verdict: getSavingVerdict(netSaving),
    },
  };
}
