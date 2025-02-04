import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Branch } from '../types/branch';

interface BusinessState {
  businessCode: string | null;
  branches: Branch[];
  selectedBranchId: string | 'all' | null;
  defaultBranchId: string | null;
  setBusinessCode: (code: string | null) => void;
  setBranches: (branches: Branch[]) => void;
  setSelectedBranch: (branchId: string | 'all') => void;
  setDefaultBranch: (branchId: string | null) => void;
  getCurrentBranch: () => Branch | null;
}

export const useBusinessStore = create<BusinessState>()(
  persist(
    (set, get) => ({
      businessCode: null,
      branches: [],
      selectedBranchId: null,
      defaultBranchId: null,
      setBusinessCode: (code) => set({ businessCode: code }),
      setBranches: (branches) => set({ branches }),
      setSelectedBranch: (branchId) => set({ selectedBranchId: branchId }),
      setDefaultBranch: (branchId) => set({ defaultBranchId: branchId }),
      getCurrentBranch: () => {
        const { branches, selectedBranchId } = get();
        if (!selectedBranchId || selectedBranchId === 'all') return null;
        return branches.find(b => b.branch_id === selectedBranchId) || null;
      }
    }),
    {
      name: 'business-storage'
    }
  )
);