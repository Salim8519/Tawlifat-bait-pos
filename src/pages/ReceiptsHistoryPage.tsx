import React, { useState } from 'react';
import { Search, Filter, Download, Calendar } from 'lucide-react';
import { useLanguageStore } from '../store/useLanguageStore';
import { receiptTranslations } from '../translations/receipts';

interface ReceiptItem {
  id: string;
  date: string;
  customerName: string | null;
  customerPhone: string | null;
  total: number;
  items: number;
  paymentMethod: 'cash' | 'card';
  status: 'completed' | 'refunded' | 'cancelled';
}

// Mock data - replace with API calls
const mockReceipts: ReceiptItem[] = Array.from({ length: 10 }, (_, i) => ({
  id: `RCP${1000 + i}`,
  date: new Date(2024, 2, 20 - i).toISOString(),
  customerName: i % 3 === 0 ? null : `عميل ${i + 1}`,
  customerPhone: i % 3 === 0 ? null : `9681234567${i}`,
  total: 100 + (i * 25.5),
  items: 3 + i,
  paymentMethod: i % 2 === 0 ? 'cash' : 'card',
  status: i % 5 === 0 ? 'refunded' : i % 7 === 0 ? 'cancelled' : 'completed'
}));

export function ReceiptsHistoryPage() {
  const { language } = useLanguageStore();
  const t = receiptTranslations[language];

  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');

  const handleExport = () => {
    // Implement export functionality
    console.log('Exporting receipts...');
  };

  const filteredReceipts = mockReceipts.filter(receipt => {
    const matchesSearch = 
      (receipt.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
      (receipt.customerPhone?.includes(searchQuery) || false) ||
      receipt.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || receipt.status === statusFilter;
    const matchesPayment = paymentFilter === 'all' || receipt.paymentMethod === paymentFilter;
    
    const receiptDate = new Date(receipt.date);
    const matchesDate = 
      (!dateRange.from || receiptDate >= new Date(dateRange.from)) &&
      (!dateRange.to || receiptDate <= new Date(dateRange.to));

    return matchesSearch && matchesStatus && matchesPayment && matchesDate;
  });

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t.receiptsHistory}</h1>
        <button
          onClick={handleExport}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <Download className="w-5 h-5 ml-2" />
          {t.export}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchReceipt}
                className="w-full pr-10 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              />
            </div>

            <div className="flex space-x-2 space-x-reverse">
              <div className="relative flex-1">
                <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                  className="w-full pr-10 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="relative flex-1">
                <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                  className="w-full pr-10 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            >
              <option value="all">{t.allStatuses}</option>
              <option value="completed">{t.completed}</option>
              <option value="refunded">{t.refunded}</option>
              <option value="cancelled">{t.cancelled}</option>
            </select>

            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            >
              <option value="all">{t.allPaymentMethods}</option>
              <option value="cash">{t.cash}</option>
              <option value="card">{t.card}</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.receiptNumber}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.date}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.customer}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.amount}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.paymentMethod}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.status}
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">{t.view}</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReceipts.map((receipt) => (
                <tr key={receipt.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {receipt.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(receipt.date).toLocaleDateString(language === 'ar' ? 'ar' : 'en-US')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {receipt.customerName ? (
                      <div>
                        <div>{receipt.customerName}</div>
                        <div className="text-xs text-gray-400">{receipt.customerPhone}</div>
                      </div>
                    ) : (
                      t.guestCustomer
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {receipt.total.toFixed(2)} {t.currency}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {receipt.paymentMethod === 'cash' ? t.cash : t.card}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      receipt.status === 'completed' ? 'bg-green-100 text-green-800' :
                      receipt.status === 'refunded' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {receipt.status === 'completed' ? t.completed :
                       receipt.status === 'refunded' ? t.refunded :
                       t.cancelled}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                    <button className="text-indigo-600 hover:text-indigo-900">
                      {t.view}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}