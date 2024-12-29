import React from 'react';
import { DollarSign, PlusCircle, MinusCircle, History } from 'lucide-react';
import { useLanguageStore } from '../store/useLanguageStore';
import { cashDrawerTranslations } from '../translations/cashDrawer';
import { CashTransaction } from '../components/cash/CashTransaction';
import { CashCharts } from '../components/cash/CashCharts';
import { useCashDrawerStore } from '../store/useCashDrawerStore';

export function CashDrawerPage() {
  const { language } = useLanguageStore();
  const t = cashDrawerTranslations[language];
  const { balance, transactions } = useCashDrawerStore();

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t.cashDrawer}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-full">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div className="mr-4">
              <h3 className="text-lg font-semibold">{t.currentBalance}</h3>
              <p className="text-3xl font-bold mt-1">
                {balance.toFixed(3)} {t.currency}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-full">
              <PlusCircle className="w-6 h-6 text-blue-600" />
            </div>
            <div className="mr-4">
              <h3 className="text-lg font-semibold">{t.totalDeposits}</h3>
              <p className="text-3xl font-bold mt-1">
                {transactions
                  .filter(t => t.type === 'deposit')
                  .reduce((sum, t) => sum + t.amount, 0)
                  .toFixed(3)} {t.currency}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-red-100 p-3 rounded-full">
              <MinusCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="mr-4">
              <h3 className="text-lg font-semibold">{t.totalWithdrawals}</h3>
              <p className="text-3xl font-bold mt-1">
                {transactions
                  .filter(t => t.type === 'withdrawal')
                  .reduce((sum, t) => sum + t.amount, 0)
                  .toFixed(3)} {t.currency}
              </p>
            </div>
          </div>
        </div>
      </div>

      <CashCharts transactions={transactions} />

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2 space-x-reverse">
            <History className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold">{t.transactionHistory}</h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.date}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.type}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.amount}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.reason}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.balance}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((transaction, index) => (
                <tr key={transaction.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(transaction.date).toLocaleDateString(
                      language === 'ar' ? 'ar' : 'en-US',
                      { dateStyle: 'medium' }
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      transaction.type === 'deposit'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {transaction.type === 'deposit' ? t.deposit : t.withdrawal}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.amount.toFixed(3)} {t.currency}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transaction.reason}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.balanceAfter.toFixed(3)} {t.currency}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <CashTransaction />
    </div>
  );
}