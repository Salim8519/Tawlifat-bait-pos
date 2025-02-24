import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { getRentalHistory, type VendorRentalHistory } from '../../services/vendorRentalHistoryService';
import { useLanguageStore } from '../../store/useLanguageStore';
import { vendorSpacesTranslations } from '../../translations/vendorSpaces';

interface Props {
  businessCode: string;
  onMonthYearChange?: (month: number, year: number) => void;
  refreshTrigger?: number;
}

export function RentalHistory({ businessCode, onMonthYearChange, refreshTrigger = 0 }: Props) {
  const { language } = useLanguageStore();
  const t = vendorSpacesTranslations[language];
  const [history, setHistory] = useState<VendorRentalHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get current month and year
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  // Generate year options (2 years back and 1 year forward)
  const yearOptions = useMemo(() => {
    const currentYear = now.getFullYear();
    return Array.from(
      { length: 4 }, // 2 years back, current year, and 1 year forward
      (_, i) => currentYear - 2 + i
    ).sort((a, b) => b - a); // Sort descending
  }, [now]);

  useEffect(() => {
    loadHistory();
    onMonthYearChange?.(selectedMonth, selectedYear);
  }, [businessCode, selectedMonth, selectedYear, refreshTrigger]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getRentalHistory(businessCode, selectedMonth, selectedYear);
      setHistory(data);
    } catch (err) {
      console.error('Error loading rental history:', err);
      setError('Failed to load rental history');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-600 bg-green-50';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'overdue':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading && history.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="flex items-center justify-center p-6">
          <div className="text-gray-600">{t.loading}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{t.paymentHistory}</h3>
          <div className={`flex ${language === 'ar' ? 'space-x-reverse' : ''} space-x-4`}>
            <div>
              <label className={`block text-sm font-medium text-gray-700 mb-1 ${language === 'ar' ? 'text-right' : 'text-left'}`}>{t.month}</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className={`p-2 border rounded w-32 ${language === 'ar' ? 'text-right' : 'text-left'}`}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                  <option key={month} value={month}>
                    {format(new Date(2000, month - 1), 'MMMM')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium text-gray-700 mb-1 ${language === 'ar' ? 'text-right' : 'text-left'}`}>{t.year}</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className={`p-2 border rounded w-24 ${language === 'ar' ? 'text-right' : 'text-left'}`}
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className={`px-6 py-3 ${language === 'ar' ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4`}>
                {t.vendor}
              </th>
              <th scope="col" className={`px-6 py-3 ${language === 'ar' ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6`}>
                {t.branch}
              </th>
              <th scope="col" className={`px-6 py-3 ${language === 'ar' ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6`}>
                {t.amount}
              </th>
              <th scope="col" className={`px-6 py-3 ${language === 'ar' ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6`}>
                {t.status}
              </th>
              <th scope="col" className={`px-6 py-3 ${language === 'ar' ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6`}>
                {t.paymentDate}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {history.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className={`px-6 py-4 whitespace-nowrap ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                  <div className="text-sm font-medium text-gray-900">
                    {item.vendor_business_name}
                  </div>
                </td>
                <td className={`px-6 py-4 whitespace-nowrap ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                  <div className="text-sm text-gray-900">{item.branch_name}</div>
                </td>
                <td className={`px-6 py-4 whitespace-nowrap ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                  <div className="text-sm font-medium text-gray-900">
                    {item.tax_amount.toFixed(2)} OMR
                  </div>
                </td>
                <td className={`px-6 py-4 whitespace-nowrap ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(item.payment_status)}`}>
                    {t[item.payment_status as keyof typeof t]}
                  </span>
                </td>
                <td className={`px-6 py-4 whitespace-nowrap ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                  <div className="text-sm text-gray-900">
                    {format(new Date(item.created_at), 'MMM d, yyyy')}
                  </div>
                </td>
              </tr>
            ))}
            {history.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className={`px-6 py-4 text-center text-sm text-gray-500 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                  {t.noPaymentsFound}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
