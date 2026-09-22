import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { formatPrice } from '@/lib/format';
import type { ComparedStation } from '@/lib/compareStations';

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

function verdictColor(entry: ComparedStation): string {
  if (entry.isBaseline) return '#25303d';
  if (!entry.comparison) return '#71899a';
  if (entry.comparison.verdict === 'profitable') return '#158758';
  if (entry.comparison.verdict === 'breakeven') return '#d97706';
  return '#dc2626';
}

export function MapView({
  userLocation,
  entries,
  activeStationId,
  onSelectStation,
}: {
  userLocation: { latitude: number; longitude: number };
  entries: ComparedStation[];
  activeStationId: string | null;
  onSelectStation: (id: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: [userLocation.longitude, userLocation.latitude],
      zoom: 12,
      attributionControl: { compact: true },
      // Embedded (not full-screen) map: require Ctrl/Cmd+scroll to zoom so
      // an ordinary page scroll over the map doesn't get trapped by it.
      cooperativeGestures: true,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // User location marker + recentre when the location itself changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!userMarkerRef.current) {
      const el = document.createElement('div');
      el.className = 'relative flex h-4 w-4 items-center justify-center';
      el.innerHTML = `
        <span class="absolute inline-flex h-full w-full rounded-full bg-brand-500 opacity-60 animate-pulse-ring"></span>
        <span class="relative inline-flex h-3 w-3 rounded-full bg-brand-600 border-2 border-white shadow"></span>
      `;
      userMarkerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([userLocation.longitude, userLocation.latitude])
        .addTo(map);
    } else {
      userMarkerRef.current.setLngLat([userLocation.longitude, userLocation.latitude]);
    }

    map.easeTo({ center: [userLocation.longitude, userLocation.latitude], duration: 500 });
  }, [userLocation.latitude, userLocation.longitude]);

  // Station markers.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const currentIds = new Set(entries.map((e) => e.station.id));
    for (const [id, marker] of markersRef.current) {
      if (!currentIds.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    }

    for (const entry of entries) {
      const existing = markersRef.current.get(entry.station.id);
      const isActive = entry.station.id === activeStationId;
      const color = verdictColor(entry);

      if (existing) {
        const el = existing.getElement();
        el.style.background = color;
        el.style.zIndex = isActive ? '10' : '1';
        el.style.transform = isActive ? 'scale(1.15)' : 'scale(1)';
        continue;
      }

      const el = document.createElement('button');
      el.type = 'button';
      el.setAttribute('aria-label', `${entry.station.name}, ${formatPrice(entry.price.pricePerLitre)} per litre`);
      el.className =
        'rounded-full border-2 border-white px-2 py-1 text-[11px] font-bold text-white shadow-card cursor-pointer transition-transform';
      el.style.background = color;
      el.textContent = formatPrice(entry.price.pricePerLitre);
      el.addEventListener('click', () => onSelectStation(entry.station.id));

      const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([entry.station.longitude, entry.station.latitude])
        .addTo(map);

      markersRef.current.set(entry.station.id, marker);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, activeStationId]);

  // Pan to the active station's marker.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !activeStationId) return;
    const entry = entries.find((e) => e.station.id === activeStationId);
    if (!entry) return;
    map.easeTo({ center: [entry.station.longitude, entry.station.latitude], duration: 400 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStationId]);

  return (
    <div
      ref={containerRef}
      role="application"
      aria-label="Map of nearby fuel stations"
      className="h-full w-full rounded-2xl"
    />
  );
}
