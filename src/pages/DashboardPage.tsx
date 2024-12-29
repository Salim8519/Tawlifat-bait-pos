import React from 'react';
import { ShoppingBag, Users, TrendingUp, Package } from 'lucide-react';
import { useLanguageStore } from '../store/useLanguageStore';
import { dashboardTranslations } from '../translations/dashboard';

export function DashboardPage() {
  const { language } = useLanguageStore();
  const t = dashboardTranslations[language];

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t.dashboard}</h1>
        <div className="text-sm text-gray-500">
          {new Date().toLocaleDateString(language === 'ar' ? 'ar' : 'en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={ShoppingBag}
          label={t.dailySales}
          value={`1,234 ${t.currency}`}
          trend={`↑ 12% ${t.from} ${t.yesterday}`}
        />
        <StatCard
          icon={Users}
          label={t.newCustomers}
          value="48"
          trend={`↑ 8% ${t.thisWeek}`}
        />
        <StatCard
          icon={TrendingUp}
          label={t.totalSales}
          value={`45,678 ${t.currency}`}
          trend={`↑ 23% ${t.thisMonth}`}
        />
        <StatCard
          icon={Package}
          label={t.activeProducts}
          value="567"
          trend={`↑ 5% ${t.from} ${t.yesterday}`}
        />
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

const StatCard = ({ icon: Icon, label, value, trend }: { icon: any; label: string; value: string; trend: string }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600 mb-1">{label}</p>
        <h3 className="text-2xl font-bold">{value}</h3>
        <p className="text-sm text-green-600 mt-1">{trend}</p>
      </div>
      <div className="bg-indigo-100 p-3 rounded-full">
        <Icon className="w-6 h-6 text-indigo-600" />
      </div>
    </div>
  </div>
);