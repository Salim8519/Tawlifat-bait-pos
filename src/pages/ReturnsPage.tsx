import React, { useState } from 'react';
import { Search, ArrowLeftRight, DollarSign, Calendar } from 'lucide-react';
import { useLanguageStore } from '../store/useLanguageStore';
import { returnsTranslations } from '../translations/returns';
import { ReturnsChart } from '../components/returns/ReturnsChart';

interface ReturnedItem {
  id: string;
  receiptId: string;
  date: string;
  itemName: string;
  quantity: number;
  amount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
}

// Mock data - replace with API calls
const mockReturns: ReturnedItem[] = [
  {
    id: '1',
    receiptId: 'RCP1001',
    date: '2024-03-15T10:30:00',
    itemName: 'تفاح أحمر',
    quantity: 2,
    amount: 5.98,
    reason: 'منتج تالف',
    status: 'approved'
  },
  {
    id: '2',
    receiptId: 'RCP1002',
    date: '2024-03-14T15:45:00',
    itemName: 'عصير برتقال',
    quantity: 1,
    amount: 1.99,
    reason: 'خطأ في الطلب',
    status: 'pending'
  }
];

export function ReturnsPage() {
  const { language } = useLanguageStore();
  const t = returnsTranslations[language];
  
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const filteredReturns = mockReturns.filter(item => {
    const matchesSearch = 
      item.receiptId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.itemName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    
    const itemDate = new Date(item.date);
    const matchesDate = 
      (!dateRange.from || itemDate >= new Date(dateRange.from)) &&
      (!dateRange.to || itemDate <= new Date(dateRange.to));

    return matchesSearch && matchesStatus && matchesDate;
  });

  const totalAmount = filteredReturns.reduce((sum, item) => sum + item.amount, 0);
  const pendingCount = filteredReturns.filter(item => item.status === 'pending').length;

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t.returns}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-indigo-100 p-3 rounded-full">
              <ArrowLeftRight className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="mr-4">
              <h3 className="text-lg font-semibold">{t.totalReturns}</h3>
              <p className="text-3xl font-bold mt-1">{filteredReturns.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-yellow-100 p-3 rounded-full">
              <Calendar className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="mr-4">
              <h3 className="text-lg font-semibold">{t.pendingReturns}</h3>
              <p className="text-3xl font-bold mt-1">{pendingCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-full">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div className="mr-4">
              <h3 className="text-lg font-semibold">{t.totalAmount}</h3>
              <p className="text-3xl font-bold mt-1">
                {totalAmount.toFixed(3)} {t.currency}
              </p>
            </div>
          </div>
        </div>
      </div>

      <ReturnsChart returns={filteredReturns} />

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchReturns}
                className="w-full pr-10 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              />
            </div>

            <div className="flex space-x-2 space-x-reverse">
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            >
              <option value="all">{t.allStatuses}</option>
              <option value="pending">{t.pending}</option>
              <option value="approved">{t.approved}</option>
              <option value="rejected">{t.rejected}</option>
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
                  {t.item}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.quantity}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.amount}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.reason}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.status}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReturns.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.receiptId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(item.date).toLocaleDateString(
                      language === 'ar' ? 'ar' : 'en-US',
                      { dateStyle: 'medium' }
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.itemName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.amount.toFixed(3)} {t.currency}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.reason}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      item.status === 'approved' ? 'bg-green-100 text-green-800' :
                      item.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {t[item.status]}
                    </span>
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