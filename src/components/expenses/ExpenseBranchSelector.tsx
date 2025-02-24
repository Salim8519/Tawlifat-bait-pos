import React from 'react';
import { ExpenseBranchOnlySelector } from './ExpenseBranchOnlySelector';
import { useBusinessStore } from '../../store/useBusinessStore';
import { useLanguageStore } from '../../store/useLanguageStore';

interface ExpenseBranchSelectorProps {
  selectedBranch: string | null;
  onBranchChange: (branch: string) => void;
}

export function ExpenseBranchSelector({
  selectedBranch,
  onBranchChange
}: ExpenseBranchSelectorProps) {
  const { branches } = useBusinessStore();
  const { language } = useLanguageStore();

  // Filter only active branches
  const activeBranches = branches.filter(branch => branch.is_active);

  return (
    <div className="mb-6">
      <ExpenseBranchOnlySelector
        branches={activeBranches}
        selectedBranch={selectedBranch}
        onBranchChange={onBranchChange}
      />
    </div>
  );
}
