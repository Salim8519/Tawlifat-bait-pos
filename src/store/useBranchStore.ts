import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Branch } from '../types/branch';

interface BranchState {
  selectedBranchId: string | 'all' | null;
  defaultBranchId: string | null;
  branches: Branch[];
  setSelectedBranch: (branchId: string | 'all') => void;
  setDefaultBranchId: (branchId: string) => void;
  addBranch: (branch: Branch) => void;
  updateBranch: (branchId: string, updates: Partial<Branch>) => void;
  deleteBranch: (branchId: string) => void;
}

export const useBranchStore = create<BranchState>()(
  persist(
    (set) => ({
      selectedBranchId: null,
      defaultBranchId: null,
      branches: [
        {
          id: '1',
          name: 'فرع مسقط',
          location: 'مسقط، عمان',
          phone: '96812345678',
          isMain: false,
          status: 'active',
          createdAt: new Date().toISOString()
        },
        {
          id: '2', 
          name: 'فرع صلالة',
          location: 'صلالة، عمان',
          phone: '96887654321',
          isMain: false,
          status: 'active',
          createdAt: new Date().toISOString()
        }
      ],
      setSelectedBranch: (branchId) => set({ selectedBranchId: branchId }),
      setDefaultBranchId: (branchId) => set({ defaultBranchId: branchId }),
      addBranch: (branch) => set((state) => ({
        branches: [...state.branches, branch],
        selectedBranchId: state.selectedBranchId || branch.id
      })),
      updateBranch: (branchId, updates) => set((state) => ({
        branches: state.branches.map(branch =>
          branch.id === branchId ? { ...branch, ...updates } : branch
        )
      })),
      deleteBranch: (branchId) => set((state) => ({
        branches: state.branches.filter(branch => branch.id !== branchId),
        selectedBranchId: state.selectedBranchId === branchId ? null : state.selectedBranchId
      }))
    }),
    {
      name: 'branch-storage'
    }
  )
);