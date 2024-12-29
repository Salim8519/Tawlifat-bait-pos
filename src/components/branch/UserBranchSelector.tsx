import React from 'react';
import { Store } from 'lucide-react';
import { useLanguageStore } from '../../store/useLanguageStore';
import { useBranchStore } from '../../store/useBranchStore';
import { useAuthStore } from '../../store/useAuthStore';
import { branchTranslations } from '../../translations/branch';

export function UserBranchSelector() {
  const { language } = useLanguageStore();
  const t = branchTranslations[language];
  const { user } = useAuthStore();
  const { branches, selectedBranchId, setSelectedBranch } = useBranchStore();

  // Filter branches based on user role and assignments
  const userBranches = React.useMemo(() => {
    if (user?.role === 'owner') {
      return branches; // Owner can see all branches
    } else if (user?.role === 'cashier') {
      // Filter branches assigned to this cashier
      return branches.filter(branch => 
        user.assignedBranches?.includes(branch.id)
      );
    }
    return [];
  }, [branches, user]);

  React.useEffect(() => {
    // Set first available branch as default if none selected
    if (!selectedBranchId && userBranches.length > 0) {
      setSelectedBranch(userBranches[0].id);
    }
  }, [userBranches, selectedBranchId, setSelectedBranch]);

  if (userBranches.length === 0) return null;

  const selectedBranch = userBranches.find(branch => branch.id === selectedBranchId);

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
          {user?.role === 'owner' && (
            <option value="all">{t.allBranches}</option>
          )}
          {userBranches.map(branch => (
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