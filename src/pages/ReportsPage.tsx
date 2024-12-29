import React from 'react';
import { Calendar, Download } from 'lucide-react';
import { useLanguageStore } from '../store/useLanguageStore';
import { reportTranslations } from '../translations/reports';

export function ReportsPage() {
  const { language } = useLanguageStore();
  const t = reportTranslations[language];

  // Mock data - replace with actual API calls
  const mockData = {
    monthlySales: [],
    topProducts: [],
    customerAnalytics: [],
    inventory: []
  };

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t.reports}</h1>
        <div className="flex space-x-4 space-x-reverse">
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
            <Calendar className="w-5 h-5 ml-2" />
            {t.selectDate}
          </button>
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
            <Download className="w-5 h-5 ml-2" />
            {t.exportReport}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">{t.monthlySales}</h2>
          <div className="aspect-[4/3] bg-gray-50 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">{t.chartComingSoon}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">{t.topSellingProducts}</h2>
          <div className="aspect-[4/3] bg-gray-50 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">{t.chartComingSoon}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">{t.customerAnalytics}</h2>
          <div className="aspect-[4/3] bg-gray-50 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">{t.chartComingSoon}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">{t.inventory}</h2>
          <div className="aspect-[4/3] bg-gray-50 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">{t.chartComingSoon}</p>
          </div>
        </div>
      </div>
    </div>
  );
}