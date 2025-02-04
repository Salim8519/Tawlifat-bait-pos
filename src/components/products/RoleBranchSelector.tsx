import React, { useEffect } from 'react';
import { Store } from 'lucide-react';
import { useLanguageStore } from '../../store/useLanguageStore';
import { useAuthStore } from '../../store/useAuthStore';
import { productTranslations } from '../../translations/products';
import type { Branch } from '../../types/branch';

interface Props {
  branches: Branch[];
  selectedBranch: string | 'all';
  onBranchChange: (branchId: string | 'all') => void;
  className?: string;
}

export function RoleBranchSelector({ 
  branches, 
  selectedBranch, 
  onBranchChange,
  className = '' 
}: Props) {
  const { language } = useLanguageStore();
  const { user } = useAuthStore();
  const t = productTranslations[language];
  const [hasInitialized, setHasInitialized] = React.useState(false);

  const isCashier = user?.role === 'cashier';
  const activeBranches = branches.filter(branch => branch.is_active);
  const mainBranch = activeBranches.find(b => b.isMain);

  useEffect(() => {
    if (!hasInitialized && mainBranch) {
      onBranchChange(mainBranch.branch_name);
      setHasInitialized(true);
    }
  }, [mainBranch, hasInitialized, onBranchChange]);

  if (isCashier) {
    return (
      <div className={`flex items-center space-x-2 space-x-reverse ${className}`}>
        <Store className="w-5 h-5 text-gray-400" />
        <select
          value={selectedBranch}
          onChange={(e) => onBranchChange(e.target.value)}
          className="border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          dir={language === 'ar' ? 'rtl' : 'ltr'}
        >
          {mainBranch && (
            <option value={mainBranch.branch_name} selected>
              {mainBranch.branch_name}
            </option>
          )}
          {activeBranches
            .filter(b => !b.isMain)
            .map(branch => (
              <option key={branch.branch_id} value={branch.branch_name}>
                {branch.branch_name}
              </option>
            ))}
        </select>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 space-x-reverse ${className}`}>
      <Store className="w-5 h-5 text-gray-400" />
      <select
        value={selectedBranch}
        onChange={(e) => onBranchChange(e.target.value)}
        className="border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
        <option value="all">{t.allBranches}</option>
        {activeBranches.map(branch => (
          <option key={branch.branch_id} value={branch.branch_name}>
            {branch.branch_name}
          </option>
        ))}
      </select>
    </div>
  );
}