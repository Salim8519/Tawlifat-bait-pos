import React from 'react';
import { Users } from 'lucide-react';
import { useLanguageStore } from '../../store/useLanguageStore';
import { vendorDashboardTranslations } from '../../translations/vendorDashboard';
import { useVendorStore } from '../../store/useVendorStore';

export function StoreOwnerSelector() {
  const { language } = useLanguageStore();
  const t = vendorDashboardTranslations[language];
  const { owners, selectedOwnerId, setSelectedOwner } = useVendorStore();

  return (
    <div className="flex items-center space-x-2 space-x-reverse">
      <Users className="w-5 h-5 text-gray-400" />
      <select
        value={selectedOwnerId || ''}
        onChange={(e) => setSelectedOwner(e.target.value)}
        className="border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
        <option value="all">{t.allOwners}</option>
        {owners.map(owner => (
          <option key={owner.id} value={owner.id}>
            {owner.name}
          </option>
        ))}
      </select>
    </div>
  );
}