import { motion } from 'framer-motion';
import clsx from 'clsx';
import { formatPrice } from '@/lib/format';
import type { FuelType, Station } from '@shared/types';

export interface FuelTypeSummary {
  code: string;
  name: string;
  cheapestPrice: number;
  stationCount: number;
}

export function summariseFuelTypes(stations: Station[], fuelTypes: FuelType[]): FuelTypeSummary[] {
  const nameByCode = new Map(fuelTypes.map((f) => [f.code, f.name]));
  const cheapest = new Map<string, { price: number; count: number }>();

  for (const station of stations) {
    for (const price of station.fuelPrices) {
      const existing = cheapest.get(price.fuelType);
      if (!existing) {
        cheapest.set(price.fuelType, { price: price.pricePerLitre, count: 1 });
      } else {
        cheapest.set(price.fuelType, {
          price: Math.min(existing.price, price.pricePerLitre),
          count: existing.count + 1,
        });
      }
    }
  }

  return [...cheapest.entries()]
    .map(([code, { price, count }]) => ({
      code,
      name: nameByCode.get(code) ?? code,
      cheapestPrice: price,
      stationCount: count,
    }))
    .sort((a, b) => a.cheapestPrice - b.cheapestPrice);
}

export function FuelTypeGrid({
  summaries,
  selected,
  onSelect,
}: {
  summaries: FuelTypeSummary[];
  selected: string | null;
  onSelect: (code: string) => void;
}) {
  return (
    <div>
      <h2 className="px-1 text-lg font-bold text-ink-900 sm:text-xl">Cheapest fuel near you</h2>
      <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {summaries.map((summary, i) => {
          const isSelected = summary.code === selected;
          return (
            <motion.button
              key={summary.code}
              type="button"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, type: 'spring', stiffness: 300, damping: 26 }}
              onClick={() => onSelect(summary.code)}
              className={clsx(
                'group relative overflow-hidden rounded-2xl border px-4 py-3.5 text-left shadow-card transition',
                isSelected
                  ? 'border-brand-500 bg-brand-600 text-white shadow-card-hover'
                  : 'border-ink-100 bg-white text-ink-900 hover:border-brand-200 hover:shadow-card-hover',
              )}
            >
              <span
                className={clsx(
                  'block text-xs font-semibold uppercase tracking-wide',
                  isSelected ? 'text-brand-100' : 'text-ink-400',
                )}
              >
                {summary.name}
              </span>
              <span className="mt-0.5 block text-2xl font-extrabold tabular-nums">
                {formatPrice(summary.cheapestPrice)}
                <span className="text-sm font-medium opacity-70">/L</span>
              </span>
              <span
                className={clsx('mt-0.5 block text-[11px]', isSelected ? 'text-brand-100' : 'text-ink-400')}
              >
                {summary.stationCount} station{summary.stationCount === 1 ? '' : 's'}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
