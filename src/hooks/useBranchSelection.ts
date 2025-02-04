import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useBusinessStore } from '../store/useBusinessStore';
import type { Branch } from '../types/branch';

export function useBranchSelection(branches: Branch[]) {
  const { user } = useAuthStore();
  const { setSelectedBranch } = useBusinessStore();
  const [selectedBranchId, setLocalBranchId] = useState<string | 'all' | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const initializeBranchSelection = async () => {
      if (!user || branches.length === 0 || initialized) {
        return;
      }

      // For cashiers, set their main branch
      if (user.role === 'cashier') {
        const mainBranch = branches.find(b => b.isMain);

        if (mainBranch) {
          setSelectedBranch(mainBranch.branch_id);
          setLocalBranchId(mainBranch.branch_id);
        }
      } else if (!selectedBranchId) {
        setSelectedBranch('all');
        setLocalBranchId('all');
      }
      
      setInitialized(true);
    };

    initializeBranchSelection();
  }, [user, branches]);

  return {
    selectedBranchId,
    setSelectedBranch: (branchId: string | 'all') => {
      setSelectedBranch(branchId);
      setLocalBranchId(branchId);
    }
  };
}