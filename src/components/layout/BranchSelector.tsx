import React from 'react';
import { Store } from 'lucide-react';
import { useLanguageStore } from '../../store/useLanguageStore';
import { useBranchStore } from '../../store/useBranchStore';
import { branchTranslations } from '../../translations/branch';

export function BranchSelector() {
  const { language } = useLanguageStore();
  const t = branchTranslations[language];
  const { branches, selectedBranchId, setSelectedBranch } = useBranchStore();

  React.useEffect(() => {
    // Set first branch as default if none selected
    if (!selectedBranchId && branches.length > 0) {
      setSelectedBranch(branches[0].id);
    }
  }, [branches, selectedBranchId, setSelectedBranch]);

  if (branches.length === 0) return null;

  const selectedBranch = branches.find(branch => branch.id === selectedBranchId);

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
          <option value="all">{t.allBranches}</option>
          {branches.map(branch => (
            <option key={branch.id} value={branch.id}>
              {branch.name}
            </option>
          ))}
        </select>
      </div>
      {selectedBranch && selectedBranchId !== 'all' && (
        <div className="mt-1 text-xs text-gray-500">
          {selectedBranch.location}
        </div>
      )}
    </div>
  );
}