import type { AustralianState } from '../../../shared/types.js';
import type { FuelPriceProvider } from './FuelPriceProvider.js';
import { NSWFuelProvider } from './NSWFuelProvider.js';

/**
 * Registry of every FuelPriceProvider the app knows about. To add a new
 * state, write a class implementing FuelPriceProvider (see NSWFuelProvider
 * for the pattern) and register an instance here — nothing else in the
 * backend or frontend needs to change.
 */
const providers: FuelPriceProvider[] = [new NSWFuelProvider()];

export function getProviderForState(state: AustralianState): FuelPriceProvider {
  const provider = providers.find((p) => p.states.includes(state));
  if (!provider) {
    throw new Error(`No fuel price provider is registered for ${state} yet.`);
  }
  return provider;
}

export function getSupportedStates(): AustralianState[] {
  return providers.flatMap((p) => p.states);
}
