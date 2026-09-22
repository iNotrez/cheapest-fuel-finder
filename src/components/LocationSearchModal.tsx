import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { fetchGeocode } from '@/lib/api/client';
import type { GeocodeResult } from '@shared/types';

export function LocationSearchModal({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (result: GeocodeResult) => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'success'>('idle');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
      setStatus('idle');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (query.trim().length < 3) {
      setResults([]);
      setStatus('idle');
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setStatus('loading');
      fetchGeocode(query.trim(), controller.signal)
        .then((r) => {
          setResults(r);
          setStatus('success');
        })
        .catch((err: unknown) => {
          if (err instanceof DOMException && err.name === 'AbortError') return;
          setStatus('error');
        });
    }, 400);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center bg-ink-950/40 p-4 pt-20 backdrop-blur-sm sm:pt-32"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Search for a location"
        >
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-card-hover"
          >
            <div className="flex items-center gap-2 border-b border-ink-100 px-4 py-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-ink-400" aria-hidden>
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Address, suburb or postcode"
                className="w-full bg-transparent py-1 text-base text-ink-900 outline-none placeholder:text-ink-400"
                aria-label="Search for an address, suburb or postcode"
              />
              <button
                type="button"
                onClick={onClose}
                aria-label="Close search"
                className="rounded-full p-1 text-ink-400 hover:bg-ink-50 hover:text-ink-700"
              >
                ✕
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto p-2">
              {status === 'loading' && (
                <p className="px-3 py-4 text-center text-sm text-ink-400">Searching…</p>
              )}
              {status === 'error' && (
                <p className="px-3 py-4 text-center text-sm text-red-500">
                  Couldn’t search right now. Try again.
                </p>
              )}
              {status === 'success' && results.length === 0 && (
                <p className="px-3 py-4 text-center text-sm text-ink-400">No matches found.</p>
              )}
              {results.map((result, i) => (
                <button
                  key={`${result.latitude}-${result.longitude}-${i}`}
                  type="button"
                  onClick={() => onSelect(result)}
                  className="flex w-full items-start gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-ink-800 transition hover:bg-brand-50"
                >
                  <span className="mt-0.5 text-ink-400" aria-hidden>
                    📍
                  </span>
                  <span>{result.label}</span>
                </button>
              ))}
              {status === 'idle' && query.trim().length > 0 && query.trim().length < 3 && (
                <p className="px-3 py-4 text-center text-sm text-ink-400">Keep typing…</p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
