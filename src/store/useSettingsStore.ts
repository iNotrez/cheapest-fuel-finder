import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface VehicleSettings {
  consumptionL100km: number;
  litres: number;
  tankSizeL: number | null;
  currentFuelLevelL: number | null;
}

export const DEFAULT_SETTINGS: VehicleSettings = {
  consumptionL100km: 8.0,
  litres: 50,
  tankSizeL: null,
  currentFuelLevelL: null,
};

interface SettingsState {
  settings: VehicleSettings;
  selectedFuelType: string | null;
  searchRadiusKm: number;
  updateSettings: (patch: Partial<VehicleSettings>) => void;
  setSelectedFuelType: (fuelType: string | null) => void;
  setSearchRadiusKm: (radiusKm: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      selectedFuelType: null,
      searchRadiusKm: 10,
      updateSettings: (patch) => set((state) => ({ settings: { ...state.settings, ...patch } })),
      setSelectedFuelType: (fuelType) => set({ selectedFuelType: fuelType }),
      setSearchRadiusKm: (radiusKm) => set({ searchRadiusKm: radiusKm }),
    }),
    {
      name: 'cff:settings',
      version: 1,
    },
  ),
);
