import React from 'react';
import { Store } from 'lucide-react';
import { useLanguageStore } from '../../store/useLanguageStore';
import { productTranslations } from '../../translations/products';
import type { Branch } from '../../types/branch';

interface Props {
  branches: Branch[];
  selectedBranch: string | 'all';
  onBranchChange: (branchId: string | 'all') => void;
  className?: string;
}

export function BranchFilter({ branches, selectedBranch, onBranchChange, className = '' }: Props) {
  const { language } = useLanguageStore();
  const t = productTranslations[language];

  // Filter only active branches
  const activeBranches = branches.filter(branch => branch.is_active);

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