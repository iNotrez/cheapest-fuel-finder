import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { formatDistance, formatPrice } from '@/lib/format';
import type { ComparedStation } from '@/lib/compareStations';

export function BaselineBar({
  baseline,
  allEntries,
  onChangeBaseline,
}: {
  baseline: ComparedStation | undefined;
  allEntries: ComparedStation[];
  onChangeBaseline: (stationId: string) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  if (!baseline) return null;

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-ink-100 bg-white px-4 py-3 shadow-card">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">Comparing against</p>
        <p className="font-bold text-ink-900">{baseline.station.name}</p>
        <p className="text-sm text-ink-500">
          {formatPrice(baseline.price.pricePerLitre)}/L · {formatDistance(baseline.distanceKm)} away
        </p>
      </div>
      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        className="shrink-0 rounded-full border border-ink-200 px-3 py-1.5 text-xs font-semibold text-ink-700 transition hover:bg-ink-50 active:scale-95"
      >
        Change
      </button>

      <AnimatePresence>
        {pickerOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-ink-950/40 backdrop-blur-sm sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPickerOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Choose baseline station"
          >
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[70vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-2 shadow-card-hover sm:rounded-2xl"
            >
              <p className="px-3 py-2 text-sm font-bold text-ink-900">Choose your baseline station</p>
              {[...allEntries]
                .sort((a, b) => a.distanceKm - b.distanceKm)
                .map((entry) => (
                  <button
                    key={entry.station.id}
                    type="button"
                    onClick={() => {
                      onChangeBaseline(entry.station.id);
                      setPickerOpen(false);
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition hover:bg-brand-50"
                  >
                    <span>
                      <span className="block font-semibold text-ink-900">{entry.station.name}</span>
                      <span className="text-xs text-ink-400">{formatDistance(entry.distanceKm)} away</span>
                    </span>
                    <span className="font-bold tabular-nums text-ink-900">
                      {formatPrice(entry.price.pricePerLitre)}
                    </span>
                  </button>
                ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
