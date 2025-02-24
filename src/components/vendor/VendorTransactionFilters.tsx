import React, { useMemo } from 'react';
import { useLanguageStore } from '../../store/useLanguageStore';
import { vendorDashboardTranslations } from '../../translations/vendorDashboard';
import { Building2, Store } from 'lucide-react';

interface Props {
  transactions: any[];
  selectedBusiness: string | null;
  selectedBranch: string | null;
  onBusinessChange: (businessCode: string | null) => void;
  onBranchChange: (branchName: string | null) => void;
}

export function VendorTransactionFilters({
  transactions,
  selectedBusiness,
  selectedBranch,
  onBusinessChange,
  onBranchChange,
}: Props) {
  const { language } = useLanguageStore();
  const t = vendorDashboardTranslations[language];

  const { businesses, branches } = useMemo(() => {
    const businessMap = new Map<string, { code: string; name: string }>();
    const branchMap = new Map<string, Set<string>>();

    transactions.forEach((transaction) => {
      if (transaction.business_code && transaction.business_name) {
        businessMap.set(transaction.business_code, {
          code: transaction.business_code,
          name: transaction.business_name,
        });
      }

      if (transaction.business_code && transaction.branch_name) {
        if (!branchMap.has(transaction.business_code)) {
          branchMap.set(transaction.business_code, new Set());
        }
        branchMap.get(transaction.business_code)?.add(transaction.branch_name);
      }
    });

    return {
      businesses: Array.from(businessMap.values()),
      branches: selectedBusiness ? Array.from(branchMap.get(selectedBusiness) || []) : [],
    };
  }, [transactions, selectedBusiness]);

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-4">
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          <div className="flex items-center gap-1">
            <Building2 className="h-4 w-4" />
            {t.businessName}
          </div>
        </label>
        <select
          value={selectedBusiness || ''}
          onChange={(e) => onBusinessChange(e.target.value || null)}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          <option value="">{t.allBusinesses}</option>
          {businesses.map((business) => (
            <option key={business.code} value={business.code}>
              {business.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          <div className="flex items-center gap-1">
            <Store className="h-4 w-4" />
            {t.branchName}
          </div>
        </label>
        <select
          value={selectedBranch || ''}
          onChange={(e) => onBranchChange(e.target.value || null)}
          disabled={!selectedBusiness}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option value="">{t.allBranches}</option>
          {branches.map((branch) => (
            <option key={branch} value={branch}>
              {branch}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
