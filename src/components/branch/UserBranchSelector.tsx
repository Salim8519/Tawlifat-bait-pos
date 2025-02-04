import React from 'react';
import { Store } from 'lucide-react';
import { useLanguageStore } from '../../store/useLanguageStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useBranchSelection } from '../../hooks/useBranchSelection';
import { branchTranslations } from '../../translations/branch';
import type { Branch } from '../../types/branch';

interface Props {
  branches: Branch[];
}

export function UserBranchSelector({ branches }: Props) {
  const { language } = useLanguageStore();
  const t = branchTranslations[language];
  const { user } = useAuthStore();
  const { selectedBranchId, setSelectedBranch } = useBranchSelection(branches);

  const currentBranch = branches.find(b => b.branch_id === selectedBranchId);
  const mainBranch = branches.find(b => b.isMain);

  // For cashiers, only show their assigned main branch
  const availableBranches = user?.role === 'cashier' && mainBranch
    ? [mainBranch]
    : branches;
  return (
    <div className="px-4 py-2 bg-indigo-50 border-b">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 space-x-reverse">
          <Store className="w-5 h-5 text-indigo-600" />
          <span className="text-sm font-medium text-gray-700">{t.currentBranch}:</span>
        </div>
        <select
          value={selectedBranchId || ''}
          onChange={(e) => setSelectedBranch(e.target.value)}
          className="ml-2 px-2 py-1 text-sm border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          dir={language === 'ar' ? 'rtl' : 'ltr'}
        >
          {(user?.role === 'owner' || user?.role === 'manager') && (
            <option value="all">{t.allBranches}</option>
          )}
          {availableBranches.map(branch => (
            <option key={branch.branch_id} value={branch.branch_id}>
              {branch.branch_name}
            </option>
          ))}
        </select>
      </div>
      {currentBranch && selectedBranchId !== 'all' && (
        <div className="mt-1 text-xs text-gray-500">
          {currentBranch.location}
        </div>
      )}
    </div>
  );
}