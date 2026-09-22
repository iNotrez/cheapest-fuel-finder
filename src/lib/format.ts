export function formatPrice(pricePerLitre: number): string {
  return `$${pricePerLitre.toFixed(2)}`;
}

export function formatMoney(amount: number): string {
  const sign = amount < 0 ? '-' : '';
  return `${sign}$${Math.abs(amount).toFixed(2)}`;
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 1) return '<1 min';
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hours}h ${mins}m`;
}

/** Freshness threshold: NSW retailers must update FuelCheck promptly after a
 * price change, so anything older than this is flagged as stale rather than
 * presented as a guaranteed current price. */
export const STALE_PRICE_THRESHOLD_HOURS = 24;

export function isStalePrice(timestamp: string, thresholdHours = STALE_PRICE_THRESHOLD_HOURS): boolean {
  const ageMs = Date.now() - new Date(timestamp).getTime();
  return ageMs > thresholdHours * 60 * 60 * 1000;
}

export function formatRelativeTime(timestamp: string): string {
  const ageMs = Date.now() - new Date(timestamp).getTime();
  const ageMin = Math.round(ageMs / 60_000);

  if (ageMin < 1) return 'just now';
  if (ageMin < 60) return `${ageMin} minute${ageMin === 1 ? '' : 's'} ago`;

  const ageHours = Math.round(ageMin / 60);
  if (ageHours < 24) return `${ageHours} hour${ageHours === 1 ? '' : 's'} ago`;

  const ageDays = Math.round(ageHours / 24);
  return `${ageDays} day${ageDays === 1 ? '' : 's'} ago`;
}
