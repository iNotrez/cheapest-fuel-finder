import { motion } from 'framer-motion';

export function LoadingState({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center gap-4 py-16 text-center"
      role="status"
      aria-live="polite"
    >
      <span className="relative flex h-12 w-12 items-center justify-center">
        <span className="absolute inset-0 rounded-full border-2 border-brand-200" />
        <span className="absolute inset-0 rounded-full border-2 border-t-brand-500 animate-spin motion-reduce:animate-none" />
      </span>
      <p className="text-sm font-medium text-ink-500">{message}</p>
    </motion.div>
  );
}

export function StationCardSkeleton() {
  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-4 shadow-card">
      <div className="skeleton h-4 w-2/3 rounded" />
      <div className="mt-3 skeleton h-7 w-1/3 rounded" />
      <div className="mt-3 flex gap-3">
        <div className="skeleton h-4 w-16 rounded" />
        <div className="skeleton h-4 w-20 rounded" />
      </div>
      <div className="mt-4 skeleton h-8 w-28 rounded-full" />
    </div>
  );
}
