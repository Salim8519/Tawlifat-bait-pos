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
  const { branches, setSelectedBranch } = useBusinessStore();
  const t = posTranslations[language];
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeBranch = () => {
      if (!isInitialized && branches.length > 0) {
        console.log('Initializing branch selection. User:', user);
        console.log('Available branches:', branches);
        
        // For cashiers and managers, use their assigned branch if available
        if ((user?.role === 'cashier' || user?.role === 'manager') && user?.main_branch) {
          console.log(`${user.role} detected with main_branch:`, user.main_branch);
          
          // Find the branch that matches the assigned branch name
          const assignedBranch = branches.find(b => {
            const match = b.branch_name === user.main_branch && b.is_active;
            console.log('Checking branch:', b.branch_name, 'Match:', match);
            return match;
          });

          if (assignedBranch) {
            console.log('Found assigned branch:', assignedBranch);
            setSelectedBranchId(assignedBranch.branch_id);
            onBranchChange(assignedBranch.branch_id);
            setSelectedBranch(assignedBranch.branch_id);
          } else {
            console.log('Assigned branch not found or not active, selecting first active branch');
            selectFirstActiveBranch();
          }
        } else {
          console.log('No main_branch assigned or different role, selecting first active branch');
          selectFirstActiveBranch();
        }
        setIsInitialized(true);
      }
    };

    const selectFirstActiveBranch = () => {
      const firstActiveBranch = branches.find(b => b.is_active);
      if (firstActiveBranch) {
        console.log('Selected first active branch:', firstActiveBranch);
        setSelectedBranchId(firstActiveBranch.branch_id);
        onBranchChange(firstActiveBranch.branch_id);
        setSelectedBranch(firstActiveBranch.branch_id);
      }
    };

    initializeBranch();
  }, [branches, isInitialized, onBranchChange, user, setSelectedBranch]);

  const handleBranchChange = (branchId: string) => {
    console.log('Branch selection changed to:', branchId);
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