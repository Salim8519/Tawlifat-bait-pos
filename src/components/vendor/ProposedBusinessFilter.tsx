import React from 'react';
import { Store } from 'lucide-react';
import { useLanguageStore } from '../../store/useLanguageStore';
import type { VendorAssignment } from '../../types/vendor';

interface Props {
  selectedBusinessCode: string | 'all';
  onBusinessChange: (businessCode: string | 'all') => void;
  assignments: VendorAssignment[];
  className?: string;
}

export function ProposedBusinessFilter({ 
  selectedBusinessCode,
  onBusinessChange,
  assignments,
  className = ''
}: Props) {
  const { language } = useLanguageStore();

  console.log('ProposedBusinessFilter - Raw assignments:', assignments); // Debug log

  // Get unique businesses from assignments using owner_business_name
  const uniqueBusinesses = Array.from(
    new Set(assignments.map(a => a.owner_business_code))
  ).map(code => {
    const assignment = assignments.find(a => a.owner_business_code === code);
    return {
      code,
      name: assignment?.owner_business_name || 'Unnamed Business'
    };
  });

  console.log('ProposedBusinessFilter - Unique businesses:', uniqueBusinesses); // Debug log

  const translations = {
    ar: {
      proposedBusinesses: 'المتاجر المقترحة',
      allBusinesses: 'جميع المتاجر',
      selectBusiness: 'اختر متجر...'
    },
    en: {
      proposedBusinesses: 'Proposed Businesses',
      allBusinesses: 'All Businesses',
      selectBusiness: 'Select business...'
    }
  };

  const t = translations[language];

  return (
    <div className={`flex items-center space-x-2 space-x-reverse ${className}`}>
      <Store className="w-5 h-5 text-gray-400" />
      <select
        value={selectedBusinessCode}
        onChange={(e) => onBusinessChange(e.target.value as string | 'all')}
        className="flex-1 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
        <option value="all">{t.allBusinesses}</option>
        {uniqueBusinesses.map(business => (
          <option key={business.code} value={business.code}>
            {business.name}
          </option>
        ))}
      </select>
    </div>
  );
}