import clsx from 'clsx';
import { motion } from 'framer-motion';
import { formatDistance, formatDuration, formatPrice, formatRelativeTime, isStalePrice } from '@/lib/format';
import { savingHeadline, SavingBadge } from './SavingBadge';
import { CalculationDetails } from './CalculationDetails';
import type { ComparedStation } from '@/lib/compareStations';

function navigateUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
}

export function StationCard({
  entry,
  isActive,
  onHover,
  onSetBaseline,
  litres,
  consumptionL100km,
}: {
  entry: ComparedStation;
  isActive?: boolean;
  onHover?: (stationId: string | null) => void;
  onSetBaseline?: (stationId: string) => void;
  litres: number;
  consumptionL100km: number;
}) {
  const { station, price, distanceKm, durationMin, isRoadDistance, isBaseline, comparison } = entry;
  const stale = isStalePrice(price.timestamp);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      onMouseEnter={() => onHover?.(station.id)}
      onMouseLeave={() => onHover?.(null)}
      className={clsx(
        'rounded-2xl border bg-white p-4 shadow-card transition',
        isActive ? 'border-brand-400 shadow-card-hover ring-1 ring-brand-200' : 'border-ink-100',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="font-bold text-ink-900">{station.name}</h3>
            {isBaseline && (
              <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink-500">
                Baseline
              </span>
            )}
          </div>
          <p className="text-xs text-ink-400">{station.brand !== station.name ? station.brand : station.address}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-extrabold tabular-nums text-ink-900">
            {formatPrice(price.pricePerLitre)}
            <span className="text-sm font-medium text-ink-400">/L</span>
          </p>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-500">
        <span className="flex items-center gap-1">
          <span aria-hidden>📍</span>
          {formatDistance(distanceKm)} {isRoadDistance ? 'driving' : '(straight-line est.)'}
          {durationMin != null && <> · {formatDuration(durationMin)}</>}
        </span>
        <span className={clsx('flex items-center gap-1', stale && 'font-semibold text-amber-600')}>
          <span aria-hidden>🕐</span>
          {stale ? 'Stale price' : `Updated ${formatRelativeTime(price.timestamp)}`}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        {isBaseline ? (
          <span className="text-sm text-ink-500">This is your comparison baseline.</span>
        ) : comparison ? (
          <div>
            <SavingBadge verdict={comparison.verdict} netSaving={comparison.netSaving} />
            {comparison.verdict === 'not-worth' && (
              <p className="mt-1.5 text-xs text-ink-500">
                You’d spend approximately {formatPrice(Math.abs(comparison.netSaving))} more driving
                here than you’d save on fuel.
              </p>
            )}
          </div>
        ) : (
          <span className="text-xs text-ink-400">Not enough data to compare yet.</span>
        )}

        <a
          href={navigateUrl(station.latitude, station.longitude)}
          target="_blank"
          rel="noreferrer noopener"
          className="shrink-0 rounded-full border border-ink-200 px-3 py-1.5 text-xs font-semibold text-ink-700 transition hover:bg-ink-50 active:scale-95"
        >
          Navigate ↗
        </a>
      </div>

      {!isBaseline && onSetBaseline && (
        <button
          type="button"
          onClick={() => onSetBaseline(station.id)}
          className="mt-2 text-xs font-medium text-brand-700 hover:underline"
        >
          Use as baseline instead
        </button>
      )}

      {comparison && (
        <CalculationDetails
          accurate={comparison}
          simple={entry.simpleComparison}
          isRoadDistance={isRoadDistance}
          litres={litres}
          consumptionL100km={consumptionL100km}
        />
      )}
    </motion.article>
  );
}

export { savingHeadline };
