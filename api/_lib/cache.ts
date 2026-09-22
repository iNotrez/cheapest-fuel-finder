/**
 * Minimal in-memory TTL cache for serverless functions.
 *
 * Vercel reuses warm function instances between invocations, so a
 * module-level cache like this gives us real hit rates in practice without
 * needing an external store for the MVP. It intentionally also keeps the
 * last-known-good value past its TTL so callers can serve a "stale" response
 * (clearly labelled as such) instead of a hard failure when the upstream API
 * is down or rate-limited.
 */
interface CacheEntry<T> {
  value: T;
  fetchedAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();
const inFlight = new Map<string, Promise<unknown>>();

export interface CachedFetchResult<T> {
  value: T;
  fetchedAt: number;
  stale: boolean;
}

/**
 * Returns a cached value if it's within `ttlMs`. Otherwise calls `fetcher`.
 * If `fetcher` throws and a previous value exists, that stale value is
 * returned instead (with `stale: true`) rather than propagating the error.
 * Concurrent calls for the same key share a single in-flight request.
 */
export async function cachedFetch<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>,
): Promise<CachedFetchResult<T>> {
  const existing = store.get(key) as CacheEntry<T> | undefined;
  const now = Date.now();

  if (existing && now - existing.fetchedAt < ttlMs) {
    return { value: existing.value, fetchedAt: existing.fetchedAt, stale: false };
  }

  const pending = inFlight.get(key) as Promise<T> | undefined;
  if (pending) {
    const value = await pending;
    const entry = store.get(key) as CacheEntry<T>;
    return { value, fetchedAt: entry.fetchedAt, stale: false };
  }

  const promise = fetcher()
    .then((value) => {
      store.set(key, { value, fetchedAt: Date.now() });
      return value;
    })
    .finally(() => {
      inFlight.delete(key);
    });

  inFlight.set(key, promise);

  try {
    const value = await promise;
    return { value, fetchedAt: Date.now(), stale: false };
  } catch (err) {
    if (existing) {
      return { value: existing.value, fetchedAt: existing.fetchedAt, stale: true };
    }
    throw err;
  }
}
