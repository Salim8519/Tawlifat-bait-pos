import React, { useState } from 'react';
import { Plus, Search, Filter, DollarSign } from 'lucide-react';
import { useLanguageStore } from '../store/useLanguageStore';
import { cashierTranslations } from '../translations/cashiers';
import { SalaryModal, SalaryData } from '../components/cashiers/SalaryModal';

interface CashierSalary {
  id: string;
  cashierId: string;
  basicSalary: number;
  bonus: number;
  deductions: number;
  notes?: string;
  paymentDate: string;
}

export function CashiersPage() {
  const { language } = useLanguageStore();
  const t = cashierTranslations[language];
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [selectedCashierId, setSelectedCashierId] = useState<string | null>(null);

  const handleSalarySubmit = (data: SalaryData) => {
    // Here you would typically make an API call to save the salary
    console.log('Saving salary:', { cashierId: selectedCashierId, ...data });
    setShowSalaryModal(false);
    setSelectedCashierId(null);
  };

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t.cashiers}</h1>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 flex items-center">
          <Plus className="w-5 h-5 ml-2" />
          {t.addCashier}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder={t.searchCashier}
                className="w-full pr-10 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              />
            </div>
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
              <Filter className="w-5 h-5 ml-2" />
              {t.filter}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.cashier}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.email}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.phoneNumber}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.status}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.hireDate}
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">{t.actions}</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-gray-200" />
                      </div>
                      <div className="mr-4">
                        <div className="text-sm font-medium text-gray-900">
                          {language === 'ar' ? `كاشير ${i + 1}` : `Cashier ${i + 1}`}
                        </div>
                        <div className="text-sm text-gray-500">ID-{1000 + i}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    cashier{i + 1}@example.com
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    +968 9{i}XX XXX XXX
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      i % 2 === 0 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {i % 2 === 0 ? t.active : t.onLeave}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(2024, 0, i + 1).toLocaleDateString(language === 'ar' ? 'ar' : 'en-US')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                    <button className="text-indigo-600 hover:text-indigo-900 ml-4">
                      {t.edit}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedCashierId(`${i + 1}`);
                        setShowSalaryModal(true);
                      }}
                      className="text-green-600 hover:text-green-900 ml-4"
                    >
                      {t.salary}
                    </button>
                    <button className="text-red-600 hover:text-red-900">
                      {t.suspend}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <SalaryModal
        isOpen={showSalaryModal}
        onClose={() => {
          setShowSalaryModal(false);
          setSelectedCashierId(null);
        }}
        onSubmit={handleSalarySubmit}
      />
    </div>
  );
}