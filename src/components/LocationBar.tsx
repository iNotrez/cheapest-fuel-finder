import { useState } from 'react';
import { motion } from 'framer-motion';
import { LocationSearchModal } from './LocationSearchModal';
import type { AppLocation, GeolocationStatus } from '@/hooks/useGeolocation';
import type { GeocodeResult } from '@shared/types';

export function LocationBar({
  status,
  location,
  radiusKm,
  onSelectManualLocation,
  onUseCurrentLocation,
}: {
  status: GeolocationStatus;
  location: AppLocation | null;
  radiusKm: number;
  onSelectManualLocation: (result: GeocodeResult) => void;
  onUseCurrentLocation: () => void;
}) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-6"
    >
      <div className="flex items-center gap-2 text-sm">
        {status === 'requesting' && !location && (
          <span className="flex items-center gap-1.5 text-ink-500">
            <span className="animate-pulse">📍</span> Finding your location…
          </span>
        )}
        {location && (
          <span className="flex items-center gap-1.5 font-medium text-ink-800">
            <span aria-hidden>📍</span>
            {location.source === 'geolocation' ? 'Using your current location' : location.label}
          </span>
        )}
        {!location && (status === 'denied' || status === 'unavailable') && (
          <span className="text-ink-500">We couldn’t access your location.</span>
        )}
        {location && (
          <span className="hidden text-ink-400 sm:inline">· within {radiusKm} km</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {location && (
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="rounded-full border border-ink-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink-700 shadow-sm transition hover:bg-ink-50 active:scale-95"
          >
            Change location
          </button>
        )}
        {!location && (status === 'denied' || status === 'unavailable') && (
          <>
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="rounded-full bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-700 active:scale-95"
            >
              Search for a location
            </button>
            <button
              type="button"
              onClick={onUseCurrentLocation}
              className="rounded-full border border-ink-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink-700 shadow-sm transition hover:bg-ink-50 active:scale-95"
            >
              Try location again
            </button>
          </>
        )}
      </div>

      <LocationSearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelect={(result) => {
          onSelectManualLocation(result);
          setSearchOpen(false);
        }}
      />
    </motion.div>
  );
}
