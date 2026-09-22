import clsx from 'clsx';
import { formatMoney } from '@/lib/format';
import type { SavingVerdict } from '@/lib/calculations/fuelSavings';

const STYLES: Record<SavingVerdict, { wrap: string; dot: string }> = {
  profitable: { wrap: 'bg-brand-50 text-brand-800 border-brand-200', dot: 'bg-brand-500' },
  breakeven: { wrap: 'bg-amber-50 text-amber-800 border-amber-200', dot: 'bg-amber-500' },
  'not-worth': { wrap: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' },
};

export function savingHeadline(verdict: SavingVerdict, netSaving: number): string {
  if (verdict === 'profitable') return `Save ${formatMoney(netSaving)}`;
  if (verdict === 'breakeven') return 'Basically break-even';
  return 'Not worth the drive';
}

export function SavingBadge({
  verdict,
  netSaving,
  className,
}: {
  verdict: SavingVerdict;
  netSaving: number;
  className?: string;
}) {
  const style = STYLES[verdict];
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold',
        style.wrap,
        className,
      )}
    >
      <span className={clsx('h-2 w-2 rounded-full', style.dot)} aria-hidden />
      {savingHeadline(verdict, netSaving)}
    </span>
  );
}
