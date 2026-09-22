import { AnimatePresence } from 'framer-motion';
import { StationCard } from './StationCard';
import type { ComparedStation, SortMode } from '@/lib/compareStations';

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: 'best-saving', label: 'Best actual saving' },
  { value: 'cheapest', label: 'Cheapest price' },
  { value: 'closest', label: 'Closest station' },
  { value: 'shortest-drive', label: 'Shortest drive' },
];

export function StationList({
  entries,
  sortMode,
  onSortChange,
  activeStationId,
  onHoverStation,
  onSetBaseline,
  litres,
  consumptionL100km,
}: {
  entries: ComparedStation[];
  sortMode: SortMode;
  onSortChange: (mode: SortMode) => void;
  activeStationId: string | null;
  onHoverStation: (id: string | null) => void;
  onSetBaseline: (id: string) => void;
  litres: number;
  consumptionL100km: number;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-sm text-ink-500">
          {entries.length} station{entries.length === 1 ? '' : 's'} found
        </p>
        <label className="flex items-center gap-1.5 text-xs font-medium text-ink-500">
          Sort by
          <select
            value={sortMode}
            onChange={(e) => onSortChange(e.target.value as SortMode)}
            className="rounded-lg border border-ink-200 bg-white px-2 py-1.5 text-xs font-semibold text-ink-800 shadow-sm focus:border-brand-400"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-col gap-3">
        <AnimatePresence initial={false}>
          {entries.map((entry) => (
            <StationCard
              key={entry.station.id}
              entry={entry}
              isActive={entry.station.id === activeStationId}
              onHover={onHoverStation}
              onSetBaseline={onSetBaseline}
              litres={litres}
              consumptionL100km={consumptionL100km}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
