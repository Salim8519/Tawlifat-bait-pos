import React from 'react';
import { ShoppingBag, Package, TrendingUp } from 'lucide-react';
import { useLanguageStore } from '../store/useLanguageStore';
import { useAuthStore } from '../store/useAuthStore';
import { dashboardTranslations } from '../translations/dashboard';

export function SubVendorDashboardPage() {
  const { language } = useLanguageStore();
  const { user } = useAuthStore();
  const t = dashboardTranslations[language];

  // Mock data - replace with actual API calls for the specific sub-vendor
  const vendorStats = {
    dailySales: 234.50,
    totalProducts: 45,
    monthlyRevenue: 5678.90,
    activeProducts: 42,
    lowStockProducts: 3,
    topSellingProducts: []
  };

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t.dashboard}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">{t.dailySales}</p>
              <h3 className="text-2xl font-bold">{vendorStats.dailySales} {t.currency}</h3>
            </div>
            <div className="bg-indigo-100 p-3 rounded-full">
              <ShoppingBag className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">{t.activeProducts}</p>
              <h3 className="text-2xl font-bold">{vendorStats.activeProducts}</h3>
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
              <h3 className="text-2xl font-bold">{vendorStats.monthlyRevenue} {t.currency}</h3>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">{t.latestSales}</h2>
          <p className="text-gray-500 text-center py-8">{t.noSalesData}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">{t.topProducts}</h2>
          <p className="text-gray-500 text-center py-8">{t.noProductsData}</p>
        </div>
      </div>
    </div>
  );
}