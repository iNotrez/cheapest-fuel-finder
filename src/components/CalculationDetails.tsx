import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { formatDistance, formatMoney, formatPrice } from '@/lib/format';
import type { StationCalculationResult } from '@/lib/calculations/fuelSavings';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between py-1 text-sm">
      <span className="text-ink-500">{label}</span>
      <span className="font-semibold tabular-nums text-ink-900">{value}</span>
    </div>
  );
}

export function CalculationDetails({
  accurate,
  simple,
  isRoadDistance,
  litres,
  consumptionL100km,
}: {
  accurate: StationCalculationResult;
  simple: StationCalculationResult | null;
  isRoadDistance: boolean;
  litres: number;
  consumptionL100km: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-3 border-t border-ink-100 pt-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between py-1 text-left text-xs font-semibold text-ink-500 hover:text-ink-800"
      >
        How did we calculate this?
        <motion.span animate={{ rotate: open ? 180 : 0 }} aria-hidden>
          ▾
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl bg-ink-50 px-3 py-2">
              <p className="pb-1 text-[11px] font-bold uppercase tracking-wide text-ink-400">
                {isRoadDistance ? 'Accurate — actual road-driving distance' : 'Estimate — straight-line distance (routing unavailable)'}
              </p>
              <Row label="Price saving" value={formatMoney(accurate.priceSaving)} />
              <Row
                label="Extra distance"
                value={`${accurate.extraDistanceKm >= 0 ? '+' : ''}${formatDistance(accurate.extraDistanceKm)}`}
              />
              <Row label="Extra fuel used" value={`${accurate.extraFuelLitres.toFixed(2)} L`} />
              <Row label="Extra fuel cost" value={formatMoney(accurate.extraFuelCost)} />
              <div className="my-1 border-t border-ink-200" />
              <Row label="Net saving" value={formatMoney(accurate.netSaving)} />
              {accurate.breakEvenPricePerLitre != null && (
                <Row label="Break-even price" value={`${formatPrice(accurate.breakEvenPricePerLitre)}/L`} />
              )}
            </div>

            {simple && (
              <div className="mt-2 rounded-xl bg-ink-50/60 px-3 py-2">
                <p className="pb-1 text-[11px] font-bold uppercase tracking-wide text-ink-400">
                  Simple estimate — straight-line distance
                </p>
                <Row label="Net saving (estimate)" value={formatMoney(simple.netSaving)} />
              </div>
            )}

            <p className="mt-2 px-1 text-[11px] leading-relaxed text-ink-400">
              Based on buying {litres} L at this station, {consumptionL100km} L/100km fuel
              consumption, and the {isRoadDistance ? 'actual driving' : 'straight-line'} distance
              from your location. Break-even price is what the alternative would need to cost for
              this trip to be worth exactly $0.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
