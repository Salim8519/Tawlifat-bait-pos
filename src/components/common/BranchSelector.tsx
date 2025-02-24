import React from 'react';
import { useLanguageStore } from '../../store/useLanguageStore';
import { dashboardTranslations } from '../../translations/dashboard';
import type { Branch } from '../../services/dashboardService';

interface BranchSelectorProps {
  branches: Branch[];
  selectedBranch: string | null;
  onBranchChange: (branch: string) => void;
}

export function BranchSelector({
  branches,
  selectedBranch,
  onBranchChange
}: BranchSelectorProps) {
  const { language } = useLanguageStore();
  const t = dashboardTranslations[language];

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
      <h3 className="text-sm font-medium text-gray-700 mb-3">{t.selectBranch}</h3>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onBranchChange('all')}
          className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
            selectedBranch === 'all'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {t.allBranches}
        </button>
        {branches.map(branch => (
          <button
            key={branch.branch_name}
            onClick={() => onBranchChange(branch.branch_name)}
            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              selectedBranch === branch.branch_name
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {branch.branch_name}
          </button>
        ))}
      </div>
    </div>
  );
}
