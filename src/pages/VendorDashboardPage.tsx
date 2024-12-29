import React from 'react';
import { Store, Package, TrendingUp, DollarSign } from 'lucide-react';
import { useLanguageStore } from '../store/useLanguageStore';
import { vendorDashboardTranslations } from '../translations/vendorDashboard';
import { VendorStoreSelector } from '../components/vendor/VendorStoreSelector';
import { VendorSalesChart } from '../components/vendor/VendorSalesChart';
import { VendorProductsTable } from '../components/vendor/VendorProductsTable';

export function VendorDashboardPage() {
  const { language } = useLanguageStore();
  const t = vendorDashboardTranslations[language];

  // Mock data - replace with API calls
  const stats = {
    totalStores: 3,
    totalProducts: 45,
    monthlyRevenue: 5678.90,
    activeProducts: 42
  };

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t.dashboard}</h1>
        <VendorStoreSelector />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">{t.totalStores}</p>
              <h3 className="text-2xl font-bold">{stats.totalStores}</h3>
            </div>
            <div className="bg-indigo-100 p-3 rounded-full">
              <Store className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">{t.activeProducts}</p>
              <h3 className="text-2xl font-bold">{stats.activeProducts}</h3>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <Package className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">{t.monthlyRevenue}</p>
              <h3 className="text-2xl font-bold">{stats.monthlyRevenue.toFixed(3)} {t.currency}</h3>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">{t.commission}</p>
              <h3 className="text-2xl font-bold">10%</h3>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <DollarSign className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      <VendorSalesChart />

      <VendorProductsTable />
    </div>
  );
}