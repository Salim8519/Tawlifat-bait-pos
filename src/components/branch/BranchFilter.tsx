import React from 'react';
import { Store } from 'lucide-react';
import { useLanguageStore } from '../../store/useLanguageStore';
import { useBranchStore } from '../../store/useBranchStore';
import { branchTranslations } from '../../translations/branch';

interface Props {
  className?: string;
}

export function BranchFilter({ className = '' }: Props) {
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

  return (
    <div className={`flex items-center space-x-2 space-x-reverse ${className}`}>
      <Store className="w-5 h-5 text-gray-400" />
      <select
        value={selectedBranchId || branches[0]?.id || ''}
        onChange={(e) => setSelectedBranch(e.target.value)}
        className="border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
  );
}