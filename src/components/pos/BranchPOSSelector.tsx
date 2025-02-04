import React, { useEffect, useState } from 'react';
import { Store } from 'lucide-react';
import { useLanguageStore } from '../../store/useLanguageStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useBusinessStore } from '../../store/useBusinessStore';
import { posTranslations } from '../../translations/pos';

interface Props {
  onBranchChange: (branchId: string) => void;
}

export function BranchPOSSelector({ onBranchChange }: Props) {
  const { language } = useLanguageStore();
  const { user } = useAuthStore();
  const { branches, getCurrentBranch, setSelectedBranch } = useBusinessStore();
  const t = posTranslations[language];
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeBranch = () => {
      if (!isInitialized && branches.length > 0) {
        // For cashiers, use their assigned branch
        if (user?.role === 'cashier') {
          const currentBranch = getCurrentBranch();
          if (currentBranch) {
            setSelectedBranchId(currentBranch.branch_id);
            onBranchChange(currentBranch.branch_id);
            setSelectedBranch(currentBranch.branch_id);
          }
        } else {
          // For other roles, select the first active branch
          const firstActiveBranch = branches.find(b => b.is_active);
          if (firstActiveBranch) {
            setSelectedBranchId(firstActiveBranch.branch_id);
            onBranchChange(firstActiveBranch.branch_id);
            setSelectedBranch(firstActiveBranch.branch_id);
          }
        }
        setIsInitialized(true);
      }
    };

    initializeBranch();
  }, [branches, isInitialized, onBranchChange, user?.role, getCurrentBranch, setSelectedBranch]);

  const handleBranchChange = (branchId: string) => {
    setSelectedBranchId(branchId);
    onBranchChange(branchId);
    setSelectedBranch(branchId);
  };

  return (
    <div className="flex items-center space-x-2 space-x-reverse">
      <Store className="w-5 h-5 text-gray-400" />
      <select
        value={selectedBranchId}
        onChange={(e) => handleBranchChange(e.target.value)}
        className="border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        dir={language === 'ar' ? 'rtl' : 'ltr'}
        required
      >
        {!selectedBranchId && <option value="">{t.selectBranch}</option>}
        {branches
          .filter(branch => branch.is_active)
          .map(branch => (
            <option 
              key={branch.branch_id} 
              value={branch.branch_id}
            >
              {branch.branch_name}
            </option>
          ))}
      </select>
    </div>
  );
}