import { motion } from 'framer-motion';

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="mx-auto flex max-w-sm flex-col items-center gap-3 rounded-2xl border border-red-100 bg-red-50/60 p-6 text-center"
      role="alert"
    >
      <span className="text-2xl" aria-hidden>
        ⚠️
      </span>
      <div>
        <p className="font-semibold text-ink-900">{title}</p>
        <p className="mt-1 text-sm text-ink-500">{message}</p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-1 rounded-full bg-ink-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink-800 active:scale-[0.97]"
        >
          Try again
        </button>
      )}
    </motion.div>
  );
}
