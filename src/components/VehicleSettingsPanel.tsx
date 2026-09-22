import { AnimatePresence, motion } from 'framer-motion';
import { DEFAULT_SETTINGS, useSettingsStore } from '@/store/useSettingsStore';

function NumberField({
  label,
  hint,
  value,
  onChange,
  min = 0,
  step = 0.1,
  required,
  unit,
}: {
  label: string;
  hint?: string;
  value: number | null;
  onChange: (value: number | null) => void;
  min?: number;
  step?: number;
  required?: boolean;
  unit: string;
}) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between">
        <span className="text-sm font-semibold text-ink-800">
          {label}
          {required && <span className="text-brand-600"> *</span>}
        </span>
        {hint && <span className="text-[11px] text-ink-400">{hint}</span>}
      </span>
      <div className="mt-1 flex items-center overflow-hidden rounded-xl border border-ink-200 bg-white focus-within:border-brand-400">
        <input
          type="number"
          inputMode="decimal"
          min={min}
          step={step}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
          className="w-full bg-transparent px-3 py-2.5 text-base text-ink-900 outline-none"
        />
        <span className="pr-3 text-sm font-medium text-ink-400">{unit}</span>
      </div>
    </label>
  );
}

export function VehicleSettingsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { settings, updateSettings } = useSettingsStore();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex justify-end bg-ink-950/40 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Vehicle and calculator settings"
        >
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            onClick={(e) => e.stopPropagation()}
            className="flex h-full w-full max-w-sm flex-col overflow-y-auto bg-white p-5 shadow-card-hover"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-ink-900">Vehicle &amp; calculator</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close settings"
                className="rounded-full p-1.5 text-ink-400 hover:bg-ink-50 hover:text-ink-700"
              >
                ✕
              </button>
            </div>
            <p className="mt-1 text-sm text-ink-500">
              Used to work out whether driving to a cheaper station is actually worth it.
            </p>

            <div className="mt-5 flex flex-col gap-4">
              <NumberField
                label="Fuel consumption"
                required
                unit="L/100km"
                min={0.1}
                value={settings.consumptionL100km}
                onChange={(v) => updateSettings({ consumptionL100km: v ?? DEFAULT_SETTINGS.consumptionL100km })}
              />
              <NumberField
                label="Litres to purchase"
                unit="L"
                min={1}
                step={1}
                value={settings.litres}
                onChange={(v) => updateSettings({ litres: v ?? DEFAULT_SETTINGS.litres })}
              />

              <div className="mt-2 border-t border-ink-100 pt-4">
                <p className="text-xs font-bold uppercase tracking-wide text-ink-400">Optional</p>
                <p className="mt-1 text-xs text-ink-400">
                  Add these if you'd like the litres estimate based on your actual tank instead.
                </p>
              </div>

              <NumberField
                label="Fuel tank size"
                unit="L"
                step={1}
                value={settings.tankSizeL}
                onChange={(v) => updateSettings({ tankSizeL: v })}
              />
              <NumberField
                label="Current fuel level"
                unit="L"
                step={1}
                value={settings.currentFuelLevelL}
                onChange={(v) => updateSettings({ currentFuelLevelL: v })}
              />

              {settings.tankSizeL != null && settings.currentFuelLevelL != null && (
                <button
                  type="button"
                  onClick={() =>
                    updateSettings({
                      litres: Math.max(1, Math.round(settings.tankSizeL! - settings.currentFuelLevelL!)),
                    })
                  }
                  className="rounded-xl bg-brand-50 px-3 py-2 text-left text-sm text-brand-800 transition hover:bg-brand-100"
                >
                  Fill from {settings.currentFuelLevelL} L to {settings.tankSizeL} L → use{' '}
                  <strong>{Math.max(1, Math.round(settings.tankSizeL - settings.currentFuelLevelL))} L</strong>
                </button>
              )}

              <button
                type="button"
                onClick={() => updateSettings(DEFAULT_SETTINGS)}
                className="mt-2 self-start text-xs font-medium text-ink-400 hover:text-ink-700 hover:underline"
              >
                Reset to defaults
              </button>
            </div>

            <p className="mt-auto pt-6 text-[11px] leading-relaxed text-ink-400">
              Saved on this device only. No account needed — your settings and fuel-type choice are
              kept in your browser's local storage.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
