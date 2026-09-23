import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Header } from '@/components/Header';
import { LocationBar } from '@/components/LocationBar';
import { LoadingState, StationCardSkeleton } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/EmptyState';
import { FuelTypeGrid, summariseFuelTypes } from '@/components/FuelTypeGrid';
import { StationList } from '@/components/StationList';
import { BaselineBar } from '@/components/BaselineBar';
import { VehicleSettingsPanel } from '@/components/VehicleSettingsPanel';

// The map pulls in maplibre-gl (~300kB gzipped) — only load it once the user
// actually needs a map, not on first paint.
const MapView = lazy(() => import('@/components/MapView').then((m) => ({ default: m.MapView })));
import { useGeolocation } from '@/hooks/useGeolocation';
import { useFuelStations } from '@/hooks/useFuelStations';
import { useRouteDistances } from '@/hooks/useRouteDistances';
import { buildComparedStations, sortComparedStations, type SortMode } from '@/lib/compareStations';
import { useSettingsStore } from '@/store/useSettingsStore';

const DEFAULT_RADIUS_KM = 10;
const MAX_RADIUS_KM = 50;

export default function App() {
  const geo = useGeolocation();
  const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS_KM);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [baselineStationId, setBaselineStationId] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('best-saving');
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list');
  const [hoveredStationId, setHoveredStationId] = useState<string | null>(null);

  const { settings, selectedFuelType, setSelectedFuelType } = useSettingsStore();

  const fuelStations = useFuelStations(
    geo.location ? { latitude: geo.location.latitude, longitude: geo.location.longitude } : null,
    radiusKm,
  );

  const fuelTypeSummaries = useMemo(
    () => (fuelStations.data ? summariseFuelTypes(fuelStations.data.stations, fuelStations.data.fuelTypes) : []),
    [fuelStations.data],
  );

  // If the previously-selected fuel type isn't available at this location, clear it.
  useEffect(() => {
    if (!fuelStations.data || !selectedFuelType) return;
    const stillAvailable = fuelTypeSummaries.some((s) => s.code === selectedFuelType);
    if (!stillAvailable) setSelectedFuelType(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fuelStations.data]);

  const stationsForFuelType = useMemo(() => {
    if (!fuelStations.data || !selectedFuelType) return [];
    return fuelStations.data.stations.filter((s) => s.fuelPrices.some((p) => p.fuelType === selectedFuelType));
  }, [fuelStations.data, selectedFuelType]);

  const routeCandidates = useMemo(
    () => stationsForFuelType.map((s) => ({ id: s.id, latitude: s.latitude, longitude: s.longitude })),
    [stationsForFuelType],
  );

  const routeDistances = useRouteDistances(
    geo.location ? { latitude: geo.location.latitude, longitude: geo.location.longitude } : null,
    routeCandidates,
  );

  const compared = useMemo(() => {
    if (!geo.location || !selectedFuelType || stationsForFuelType.length === 0) {
      return { entries: [], baselineStationId: null };
    }
    return buildComparedStations({
      stations: stationsForFuelType,
      fuelType: selectedFuelType,
      origin: geo.location,
      routeDistances: routeDistances.distances,
      baselineStationId,
      settings,
    });
  }, [geo.location, selectedFuelType, stationsForFuelType, routeDistances.distances, baselineStationId, settings]);

  const sortedEntries = useMemo(
    () => sortComparedStations(compared.entries, sortMode),
    [compared.entries, sortMode],
  );

  const baselineEntry = compared.entries.find((e) => e.isBaseline);

  useEffect(() => {
    setBaselineStationId(null);
  }, [selectedFuelType]);

  const selectedFuelName =
    fuelStations.data?.fuelTypes.find((f) => f.code === selectedFuelType)?.name ?? selectedFuelType;

  return (
    <div className="min-h-screen pb-16">
      <Header onOpenSettings={() => setSettingsOpen(true)} />
      <LocationBar
        status={geo.status}
        location={geo.location}
        radiusKm={radiusKm}
        onSelectManualLocation={(result) =>
          geo.setManualLocation({ latitude: result.latitude, longitude: result.longitude, label: result.label })
        }
        onUseCurrentLocation={geo.requestGeolocation}
      />

      <main className="mx-auto max-w-6xl px-4 sm:px-6">
        <AnimatePresence initial={false}>
          {!geo.location && (geo.status === 'idle' || geo.status === 'requesting') && (
            <LoadingState key="loc" message="📍 Finding your location…" />
          )}

          {!geo.location && (geo.status === 'denied' || geo.status === 'unavailable') && (
            <motion.div key="denied" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <EmptyState
                title="We couldn't access your location"
                message="Search for an address, suburb or postcode above to find fuel near you instead."
              />
            </motion.div>
          )}

          {geo.location && fuelStations.status === 'loading' && !fuelStations.data && (
            <motion.div key="loading-fuel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <LoadingState message="⛽ Finding nearby fuel…" />
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="skeleton h-24 rounded-2xl" />
                ))}
              </div>
            </motion.div>
          )}

          {geo.location && fuelStations.status === 'error' && (
            <ErrorState
              key="err-fuel"
              title="Fuel prices couldn't be updated right now"
              message={fuelStations.error ?? 'Please try again in a moment.'}
              onRetry={fuelStations.retry}
            />
          )}

          {geo.location && fuelStations.status === 'success' && fuelStations.data && (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-6 py-4"
            >
              {fuelStations.data.stale && (
                <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                  Showing the last prices we could fetch — live data is temporarily unavailable.
                </p>
              )}

              {fuelTypeSummaries.length === 0 ? (
                <EmptyState
                  title="No fuel stations found nearby"
                  message={`We couldn't find any stations with price data within ${radiusKm} km.`}
                  action={
                    radiusKm < MAX_RADIUS_KM
                      ? { label: `Expand search to ${Math.min(radiusKm * 2, MAX_RADIUS_KM)} km`, onClick: () => setRadiusKm((r) => Math.min(r * 2, MAX_RADIUS_KM)) }
                      : undefined
                  }
                />
              ) : (
                <FuelTypeGrid
                  summaries={fuelTypeSummaries}
                  selected={selectedFuelType}
                  onSelect={(code) => setSelectedFuelType(code)}
                />
              )}

              {selectedFuelType && (
                <div>
                  <h2 className="px-1 text-lg font-bold text-ink-900 sm:text-xl">
                    Cheapest {selectedFuelName} near you
                  </h2>

                  {stationsForFuelType.length === 0 ? (
                    <EmptyState
                      title={`No stations selling ${selectedFuelName}`}
                      message={`None of the stations within ${radiusKm} km currently list a price for ${selectedFuelName}.`}
                      action={
                        radiusKm < MAX_RADIUS_KM
                          ? { label: `Expand search to ${Math.min(radiusKm * 2, MAX_RADIUS_KM)} km`, onClick: () => setRadiusKm((r) => Math.min(r * 2, MAX_RADIUS_KM)) }
                          : undefined
                      }
                    />
                  ) : (
                    <div className="mt-3 flex flex-col gap-4">
                      {routeDistances.status === 'loading' && compared.entries.every((e) => !e.isRoadDistance) && (
                        <p className="flex items-center gap-1.5 text-xs text-ink-400">
                          <span className="animate-pulse">🗺️</span> Calculating driving distances…
                        </p>
                      )}

                      {baselineEntry && (
                        <BaselineBar
                          baseline={baselineEntry}
                          allEntries={compared.entries}
                          onChangeBaseline={setBaselineStationId}
                        />
                      )}

                      {/* Mobile view toggle */}
                      <div className="flex gap-2 rounded-full bg-ink-100 p-1 md:hidden" role="tablist">
                        <button
                          role="tab"
                          aria-selected={mobileView === 'list'}
                          onClick={() => setMobileView('list')}
                          className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${mobileView === 'list' ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500'}`}
                        >
                          List
                        </button>
                        <button
                          role="tab"
                          aria-selected={mobileView === 'map'}
                          onClick={() => setMobileView('map')}
                          className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${mobileView === 'map' ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500'}`}
                        >
                          Map
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                        <div className={mobileView === 'map' ? 'hidden md:block' : ''}>
                          {routeDistances.status === 'loading' && compared.entries.length === 0 ? (
                            <div className="flex flex-col gap-3">
                              {Array.from({ length: 3 }).map((_, i) => (
                                <StationCardSkeleton key={i} />
                              ))}
                            </div>
                          ) : (
                            <StationList
                              entries={sortedEntries}
                              sortMode={sortMode}
                              onSortChange={setSortMode}
                              activeStationId={hoveredStationId}
                              onHoverStation={setHoveredStationId}
                              onSetBaseline={setBaselineStationId}
                              litres={settings.litres}
                              consumptionL100km={settings.consumptionL100km}
                            />
                          )}
                        </div>
                        <div className={`h-[70vh] md:sticky md:top-20 md:h-[calc(100vh-6rem)] ${mobileView === 'list' ? 'hidden md:block' : ''}`}>
                          <Suspense
                            fallback={
                              <div className="flex h-full w-full items-center justify-center rounded-2xl bg-ink-100">
                                <span className="text-sm text-ink-400">Loading map…</span>
                              </div>
                            }
                          >
                            <MapView
                              userLocation={geo.location}
                              entries={sortedEntries}
                              activeStationId={hoveredStationId}
                              onSelectStation={setHoveredStationId}
                            />
                          </Suspense>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <VehicleSettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
