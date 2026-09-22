import { motion } from 'framer-motion';

export function EmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto flex max-w-sm flex-col items-center gap-3 rounded-2xl border border-ink-100 bg-white p-8 text-center shadow-card"
    >
      <span className="text-3xl" aria-hidden>
        ⛽
      </span>
      <div>
        <p className="font-semibold text-ink-900">{title}</p>
        <p className="mt-1 text-sm text-ink-500">{message}</p>
      </div>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-1 rounded-full border border-ink-200 px-4 py-2 text-sm font-semibold text-ink-800 transition hover:bg-ink-50 active:scale-[0.97]"
        >
          {action.label}
        </button>
      )}
    </motion.div>
  );
}
