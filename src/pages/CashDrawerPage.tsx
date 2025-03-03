import React, { useState, useEffect, useMemo } from 'react';
import { DollarSign, PlusCircle, MinusCircle, History, Calendar } from 'lucide-react';
import { useLanguageStore } from '../store/useLanguageStore';
import { useAuthStore } from '../store/useAuthStore';
import { useBusinessStore } from '../store/useBusinessStore';
import { format, startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';
import { cashDrawerTranslations } from '../translations/cashDrawer';
import { CashTransaction } from '../components/cash/CashTransaction';
import { CashBalanceChart } from '../components/cash/CashBalanceChart';
import { DateRangePicker } from '../components/common/DateRangePicker';
import { getCashTrackingRecords, updateCashManually } from '../services/cashTrackingService';
import type { CashTracking } from '../services/cashTrackingService';
import { supabase } from '../lib/supabase';

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  reason: string;
  date: string;
  balanceAfter: number;
}

interface CashStats {
  totalSales: number;
  totalReturns: number;
  totalManualAdditions: number;
  totalManualRemovals: number;
}

export function CashDrawerPage() {
  const { language } = useLanguageStore();
  const { user } = useAuthStore();
  const { getCurrentBranch } = useBusinessStore();
  const t = cashDrawerTranslations[language];
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cashRecords, setCashRecords] = useState<CashTracking[]>([]);
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'custom'>('today');
  const [customStartDate, setCustomStartDate] = useState(format(startOfDay(new Date()), 'yyyy-MM-dd'));
  const [customEndDate, setCustomEndDate] = useState(format(endOfDay(new Date()), 'yyyy-MM-dd'));
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [branches, setBranches] = useState<{ branch_id: string; branch_name: string }[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const currentBranch = getCurrentBranch();

  useEffect(() => {
    const fetchUserAndBranches = async () => {
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, main_branch')
          .eq('user_id', user?.id)
          .single();

        if (profileError) throw profileError;

        if (profile.role === 'cashier') {
          setSelectedBranch(profile.main_branch);
        } else {
          const { data: branchesData, error: branchesError } = await supabase
            .from('branches')
            .select('branch_id, branch_name')
            .eq('business_code', user?.businessCode)
            .eq('is_active', true);

          if (branchesError) throw branchesError;

          setBranches(branchesData || []);
          setSelectedBranch(currentBranch?.branch_name || branchesData[0]?.branch_name);
        }
      } catch (err) {
        console.error('Error fetching user or branches:', err);
        setError(t.errorLoadingRecords);
      }
    };

    fetchUserAndBranches();
  }, [user?.id, user?.businessCode, currentBranch]);

  useEffect(() => {
    if (user?.businessCode && selectedBranch) {
      loadCashRecords();
    }
  }, [user?.businessCode, selectedBranch, dateFilter]);

  const loadCashRecords = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { startDate, endDate } = getDateRange(dateFilter);

      const records = await getCashTrackingRecords(user!.businessCode, {
        branchName: selectedBranch,
        startDate,
        endDate
      });

      setCashRecords(records);
    } catch (err) {
      console.error('Error loading cash records:', err);
      setError(t.errorLoadingRecords);
    } finally {
      setIsLoading(false);
    }
  };

  // Get date range based on filter
  const getDateRange = (filter: 'today' | 'week' | 'month' | 'custom') => {
    const now = new Date();
    switch (filter) {
      case 'today':
        return {
          startDate: format(startOfDay(now), 'yyyy-MM-dd'),
          endDate: format(endOfDay(now), 'yyyy-MM-dd')
        };
      case 'week':
        return {
          startDate: format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
          endDate: format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
        };
      case 'month':
        return {
          startDate: format(startOfMonth(now), 'yyyy-MM-dd'),
          endDate: format(endOfMonth(now), 'yyyy-MM-dd')
        };
      case 'custom':
        return {
          startDate: customStartDate,
          endDate: customEndDate
        };
    }
  };

  // Handle custom date changes
  const handleStartDateChange = (date: string) => {
    setCustomStartDate(date);
    setDateFilter('custom');
  };

  const handleEndDateChange = (date: string) => {
    setCustomEndDate(date);
    setDateFilter('custom');
  };

  const stats = useMemo<CashStats>(() => {
    return cashRecords.reduce((acc, record) => {
      if (record.cash_change_reason === 'sale') {
        acc.totalSales += record.cash_additions || 0;
      } else if (record.cash_change_reason === 'return') {
        acc.totalReturns += record.cash_removals || 0;
      } else {
        if (record.cash_additions > 0) {
          acc.totalManualAdditions += record.cash_additions;
        }
        if (record.cash_removals > 0) {
          acc.totalManualRemovals += record.cash_removals;
        }
      }
      return acc;
    }, {
      totalSales: 0,
      totalReturns: 0,
      totalManualAdditions: 0,
      totalManualRemovals: 0
    });
  }, [cashRecords]);

  // Convert cash tracking records to transactions format for charts
  const transactions = useMemo(() => {
    return cashRecords.map(record => ({
      id: record.tracking_id,
      type: record.cash_additions > 0 ? 'deposit' : 'withdrawal',
      amount: record.cash_additions > 0 ? record.cash_additions : record.cash_removals,
      reason: record.cash_change_reason || '',
      date: record.created_at,
      balanceAfter: record.new_total_cash
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Sort by date ascending
  }, [cashRecords]);

  const currentBalance = useMemo(() => {
    return cashRecords[0]?.new_total_cash || 0;
  }, [cashRecords]);

  const totalDeposits = useMemo(() => {
    return cashRecords.reduce((sum, record) => sum + (record.cash_additions || 0), 0);
  }, [cashRecords]);

  const totalWithdrawals = useMemo(() => {
    return cashRecords.reduce((sum, record) => sum + (record.cash_removals || 0), 0);
  }, [cashRecords]);

  const handleTransaction = async (type: 'deposit' | 'withdrawal', amount: number, reason: string) => {
    try {
      if (!selectedBranch) {
        throw new Error('No branch selected');
      }

      // First record in transactions_overall
      const { data: businessData } = await supabase
        .from('profiles')
        .select('business_name')
        .eq('business_code', user!.businessCode)
        .single();

      const businessName = businessData?.business_name || user!.businessCode;

      await supabase
        .from('transactions_overall')
        .insert({
          business_code: user!.businessCode,
          business_name: businessName,
          branch_name: selectedBranch,
          transaction_type: type === 'deposit' ? 'cash_addition' : 'cash_removal',
          transaction_reason: reason,
          amount: amount,
          currency: 'OMR',
          owner_profit_from_this_transcation: type === 'withdrawal' ? -amount : amount, // Match amount for deposits, negative for withdrawals
          payment_method: 'cash',
          details: {
            type,
            cashier: user!.name,
            description: reason
          }
        });

      // Then update cash tracking
      await updateCashManually(
        user!.businessCode,
        selectedBranch,
        user!.name,
        type === 'deposit' ? amount : -amount,
        reason
      );

      await loadCashRecords();
    } catch (err) {
      console.error('Error processing transaction:', err);
      throw err;
    }
  };

  return (
    <div className="p-6">
      <div className="space-y-6">
        {/* Header and Filters */}
        <div className="flex justify-between items-start">
          <h1 className="text-2xl font-bold">{t.cashDrawer}</h1>
          
          <div className="flex flex-col gap-4">
            {/* Branch Selection - Enhanced with better visibility */}
            {(user?.role === 'owner' || user?.role === 'manager') && branches.length > 0 && (
              <div className="bg-indigo-50 p-4 rounded-lg border-2 border-indigo-200 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center gap-2">
                  <label className="font-semibold text-indigo-700 whitespace-nowrap">
                    {language === 'ar' ? 'اختر الفرع:' : 'Select Branch:'}
                  </label>
                  <select
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    className="flex-1 border-2 border-indigo-300 rounded-md px-3 py-2 bg-white text-indigo-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {branches.map(branch => (
                      <option key={branch.branch_id} value={branch.branch_name}>
                        {branch.branch_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Quick Filter Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setDateFilter('today');
                  setShowCustomRange(false);
                }}
                className={`px-4 py-2 rounded-md transition-colors ${
                  dateFilter === 'today' && !showCustomRange
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {t.today}
              </button>
              <button
                onClick={() => {
                  setDateFilter('week');
                  setShowCustomRange(false);
                }}
                className={`px-4 py-2 rounded-md transition-colors ${
                  dateFilter === 'week' && !showCustomRange
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {t.thisWeek}
              </button>
              <button
                onClick={() => {
                  setDateFilter('month');
                  setShowCustomRange(false);
                }}
                className={`px-4 py-2 rounded-md transition-colors ${
                  dateFilter === 'month' && !showCustomRange
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {t.thisMonth}
              </button>
              <button
                onClick={() => setShowCustomRange(!showCustomRange)}
                className={`px-4 py-2 rounded-md transition-colors flex items-center gap-2 ${
                  showCustomRange
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                <Calendar className="w-4 h-4" />
                {language === 'ar' ? 'تاريخ مخصص' : 'Custom Range'}
              </button>
            </div>

            {/* Custom Date Range Picker */}
            {showCustomRange && (
              <div className="bg-white p-4 rounded-lg shadow-lg border">
                <DateRangePicker
                  startDate={customStartDate}
                  endDate={customEndDate}
                  onStartDateChange={handleStartDateChange}
                  onEndDateChange={handleEndDateChange}
                  maxDate={format(new Date(), 'yyyy-MM-dd')}
                  minDate={format(subMonths(new Date(), 12), 'yyyy-MM-dd')}
                />
              </div>
            )}
          </div>
        </div>

        {/* New Transaction Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">{t.newTransaction}</h2>
          <CashTransaction onTransaction={handleTransaction} />
        </div>

        {/* Display date range info */}
        <div className="text-sm text-gray-600">
          {(() => {
            const { startDate, endDate } = getDateRange(dateFilter);
            return `${t.showing}: ${format(new Date(startDate), 'dd/MM/yyyy')} - ${format(new Date(endDate), 'dd/MM/yyyy')}`;
          })()}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div className="mr-4">
                <h3 className="text-lg font-semibold">{t.currentBalance}</h3>
                <p className="text-3xl font-bold mt-1">
                  {currentBalance.toFixed(3)} {t.currency}
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

          {/* Additional Stats */}
          <div className="col-span-full grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500">{t.totalSales}</h3>
              <p className="mt-2 text-lg font-semibold text-gray-900">
                {stats.totalSales.toFixed(3)} {t.currency}
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500">{t.totalReturns}</h3>
              <p className="mt-2 text-lg font-semibold text-red-600">
                {stats.totalReturns.toFixed(3)} {t.currency}
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500">{t.manualAdditions}</h3>
              <p className="mt-2 text-lg font-semibold text-green-600">
                {stats.totalManualAdditions.toFixed(3)} {t.currency}
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500">{t.manualRemovals}</h3>
              <p className="mt-2 text-lg font-semibold text-yellow-600">
                {stats.totalManualRemovals.toFixed(3)} {t.currency}
              </p>
            </div>
          </div>

          {/* Cash Balance Chart */}
          <div className="bg-white rounded-lg shadow p-6 col-span-full">
            <CashBalanceChart 
              cashRecords={cashRecords}
              language={language}
            />
          </div>

        </div>

        {/* Transaction History */}
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">{t.loading}</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        ) : (
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
                      {t.cashier}
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
                      {t.previousBalance}
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t.newBalance}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {cashRecords.map((record, index) => (
                    <tr key={record.tracking_id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(record.created_at).toLocaleDateString(
                          language === 'ar' ? 'ar' : 'en-US',
                          { dateStyle: 'medium' }
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.cashier_name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          record.cash_additions > 0
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {record.cash_additions > 0 ? t.deposit : t.withdrawal}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {(record.cash_additions || record.cash_removals).toFixed(3)} {t.currency}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm ${
                          record.cash_change_reason === 'sale' ? 'text-green-600' :
                          record.cash_change_reason === 'return' ? 'text-red-600' :
                          'text-gray-500'
                        }`}>
                          {record.cash_change_reason === 'sale' ? t.sale :
                           record.cash_change_reason === 'return' ? t.return :
                           record.cash_change_reason}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.previous_total_cash.toFixed(3)} {t.currency}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.new_total_cash.toFixed(3)} {t.currency}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* Summary Section */}
              <div className="p-4 border-t bg-gray-50">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">{t.netCashFlow}</h4>
                    <p className={`mt-1 text-lg font-semibold ${
                      stats.totalSales + stats.totalManualAdditions - stats.totalReturns - stats.totalManualRemovals > 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      {(stats.totalSales + stats.totalManualAdditions - stats.totalReturns - stats.totalManualRemovals).toFixed(3)} {t.currency}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">{t.totalTransactions}</h4>
                    <p className="mt-1 text-lg font-semibold text-gray-900">
                      {cashRecords.length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}