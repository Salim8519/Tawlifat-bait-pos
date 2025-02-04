import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BusinessSettings } from '../services/settingsService';

interface SettingsState {
  settings: BusinessSettings | null;
  isLoading: boolean;
  error: string | null;
  setSettings: (settings: BusinessSettings | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  updateSettings: (updates: Partial<BusinessSettings>) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: null,
      isLoading: false,
      error: null,
      setSettings: (settings) => set({ settings }),
      setIsLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      updateSettings: (updates) => set((state) => ({
        settings: state.settings ? { ...state.settings, ...updates } : null
      }))
    }),
    {
      name: 'business-settings-storage'
    }
  )
);