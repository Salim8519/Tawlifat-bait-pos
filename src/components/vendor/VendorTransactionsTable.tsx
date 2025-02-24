import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Store } from 'lucide-react';
import { useLanguageStore } from '../../store/useLanguageStore';
import { vendorDashboardTranslations } from '../../translations/vendorDashboard';
import { DateRangeType, fetchVendorDashboardTransactions } from '../../services/vendorDashboardService';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { VendorTransactionStats } from './VendorTransactionStats';
import { VendorTransactionFilters } from './VendorTransactionFilters';

interface Props {
  vendorCode: string;
}

export function VendorTransactionsTable({ vendorCode }: Props) {
  const { language } = useLanguageStore();
  const t = vendorDashboardTranslations[language];
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState<DateRangeType>('today');
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<string | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);

  const loadTransactions = async () => {
    try {
      // Don't load if we're in custom mode and don't have both dates
      if (dateRange === 'custom' && (!customStartDate || !customEndDate)) {
        return;
      }

      setIsLoading(true);
      setError(null);
      const data = await fetchVendorDashboardTransactions({
        vendorCode,
        dateRange,
        customStartDate: customStartDate || undefined,
        customEndDate: customEndDate || undefined
      });
      setTransactions(data);
    } catch (err) {
      setError(t.errorLoadingTransactions);
      console.error('Error loading transactions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [vendorCode, dateRange, customStartDate, customEndDate]);

  const handleDateRangeChange = (newRange: DateRangeType) => {
    setDateRange(newRange);
    // Reset custom dates when switching away from custom range
    if (newRange !== 'custom') {
      setCustomStartDate(null);
      setCustomEndDate(null);
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      if (selectedBusiness && transaction.business_code !== selectedBusiness) {
        return false;
      }
      if (selectedBranch && transaction.branch_name !== selectedBranch) {
        return false;
      }
      return true;
    });
  }, [transactions, selectedBusiness, selectedBranch]);

  const formatDate = (date: string) => {
    return format(new Date(date), 'PPP', {
      locale: language === 'ar' ? ar : enUS
    });
  };

  const renderPeriodDates = (transaction: any) => {
    if (transaction.transaction_type === 'tax' && transaction.tax_period) {
      return <span className="text-gray-500 text-sm">{transaction.tax_period}</span>;
    }
    if (transaction.transaction_type === 'rental' && transaction.rental_start_date && transaction.rental_end_date) {
      return (
        <span className="text-gray-500 text-sm">
          {formatDate(transaction.rental_start_date)} - {formatDate(transaction.rental_end_date)}
        </span>
      );
    }
    return null;
  };

  const renderLocation = (transaction: any) => {
    return (
      <div className="flex items-center space-x-1 space-x-reverse">
        <Store className="h-4 w-4 text-gray-400" />
        <div className="text-sm">
          <span className="font-medium">{transaction.business_name}</span>
          {transaction.branch_name && (
            <>
              <span className="mx-1 text-gray-400">•</span>
              <span className="text-gray-600">{transaction.branch_name}</span>
            </>
          )}
        </div>
      </div>
    );
  };

  const handleBusinessChange = (businessCode: string | null) => {
    setSelectedBusiness(businessCode);
    setSelectedBranch(null); // Reset branch when business changes
  };

  if (isLoading) {
    return <div className="text-center py-4">{t.loading}</div>;
  }

  if (error) {
    return <div className="text-red-600 text-center py-4">{error}</div>;
  }

  return (
    <div className="space-y-4">
      <VendorTransactionStats 
        transactions={filteredTransactions}
        dateRange={dateRange}
      />
      
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">{t.transactions}</h2>
        <div className="flex items-center space-x-4 space-x-reverse">
          <select
            value={dateRange}
            onChange={(e) => handleDateRangeChange(e.target.value as DateRangeType)}
            className="border rounded-md px-3 py-1.5 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="today">{t.today}</option>
            <option value="yesterday">{t.yesterday}</option>
            <option value="this_week">{t.thisWeek}</option>
            <option value="this_month">{t.thisMonth}</option>
            <option value="last_3_months">{t.last3Months}</option>
            <option value="custom">{t.customRange}</option>
          </select>

          {dateRange === 'custom' && (
            <div className="flex items-center space-x-2 space-x-reverse">
              <Calendar className="h-5 w-5 text-gray-400" />
              <input
                type="date"
                value={customStartDate?.toISOString().split('T')[0] || ''}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : null;
                  setCustomStartDate(date);
                  // If end date is before start date, reset end date
                  if (date && customEndDate && customEndDate < date) {
                    setCustomEndDate(null);
                  }
                }}
                className="border rounded-md px-2 py-1"
                max={customEndDate?.toISOString().split('T')[0]}
              />
              <span>-</span>
              <input
                type="date"
                value={customEndDate?.toISOString().split('T')[0] || ''}
                onChange={(e) => setCustomEndDate(e.target.value ? new Date(e.target.value) : null)}
                className="border rounded-md px-2 py-1"
                min={customStartDate?.toISOString().split('T')[0]}
              />
            </div>
          )}
        </div>
      </div>

      <VendorTransactionFilters
        transactions={transactions}
        selectedBusiness={selectedBusiness}
        selectedBranch={selectedBranch}
        onBusinessChange={handleBusinessChange}
        onBranchChange={setSelectedBranch}
      />

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t.date}
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t.location}
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t.transactionType}
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t.productName}
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t.quantity}
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t.amount}
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t.profit}
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t.notes}
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t.status}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredTransactions.map((transaction) => (
              <tr key={transaction.transaction_id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(transaction.transaction_date)}
                  {renderPeriodDates(transaction)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {renderLocation(transaction)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {t[transaction.transaction_type as keyof typeof t] || transaction.transaction_type}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {transaction.product_name || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {transaction.product_quantity || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {transaction.amount.toFixed(3)} {t.currency}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {transaction.profit.toFixed(3)} {t.currency}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {transaction.notes || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    transaction.status === 'completed' ? 'bg-green-100 text-green-800' : 
                    transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {t[transaction.status as keyof typeof t] || transaction.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
