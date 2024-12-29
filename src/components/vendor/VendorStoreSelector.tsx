import React from 'react';
import { Store } from 'lucide-react';
import { useLanguageStore } from '../../store/useLanguageStore';
import { vendorDashboardTranslations } from '../../translations/vendorDashboard';
import { useVendorStore } from '../../store/useVendorStore';

export function VendorStoreSelector() {
  const { language } = useLanguageStore();
  const t = vendorDashboardTranslations[language];
  const { stores, selectedStoreId, selectedOwnerId, setSelectedStore } = useVendorStore();

  const filteredStores = selectedOwnerId === 'all' 
    ? stores 
    : stores.filter(store => store.ownerId === selectedOwnerId);

  return (
    <div className="flex items-center space-x-2 space-x-reverse">
      <Store className="w-5 h-5 text-gray-400" />
      <select
        value={selectedStoreId || ''}
        onChange={(e) => setSelectedStore(e.target.value)}
        className="border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
        <option value="all">{t.allStores}</option>
        {filteredStores.map(store => (
          <option key={store.id} value={store.id}>
            {store.name} - {store.branch}
          </option>
        ))}
      </select>
    </div>
  );
}