import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface VendorCommission {
  percentage: number;
  isEnabled: boolean;
  minimumAmount: number;
}

interface SettingsState {
  vendorCommission: VendorCommission;
  updateVendorCommission: (commission: Partial<VendorCommission>) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      vendorCommission: {
        percentage: 10,
        isEnabled: true,
        minimumAmount: 0
      },
      updateVendorCommission: (commission) =>
        set((state) => ({
          vendorCommission: {
            ...state.vendorCommission,
            ...commission
          }
        }))
    }),
    {
      name: 'settings-storage'
    }
  )
);