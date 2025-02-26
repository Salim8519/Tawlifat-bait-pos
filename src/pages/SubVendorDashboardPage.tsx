import React, { useState, useEffect } from 'react';
import { Store, Calendar } from 'lucide-react';
import { useLanguageStore } from '../store/useLanguageStore';
import { useAuthStore } from '../store/useAuthStore';
import { vendorDashboardTranslations } from '../translations/vendorDashboard';
import { getVendorAssignmentsByVendor } from '../services/vendorService';
import { DateRangeType, fetchVendorDashboardTransactions } from '../services/vendorDashboardService';
import { VendorAssignmentBoxes } from '../components/vendor/VendorAssignmentBoxes';
import { VendorDashboardCharts } from '../components/vendor/VendorDashboardCharts';
import { VendorTransactionFilters } from '../components/vendor/VendorTransactionFilters';
import { VendorTransactionStats } from '../components/vendor/VendorTransactionStats';
import type { VendorAssignment } from '../types/vendor';

export function SubVendorDashboardPage() {
  const { language } = useLanguageStore();
  const { user } = useAuthStore();
  const t = vendorDashboardTranslations[language];
  
  const [assignments, setAssignments] = useState<VendorAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState<DateRangeType>('this_month');
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<string | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.businessCode) {
      loadAssignments();
      loadTransactions();
    }
  }, [user?.businessCode, dateRange, customStartDate, customEndDate]);

  const loadAssignments = async () => {
    try {
      setIsLoading(true);
      const data = await getVendorAssignmentsByVendor(user!.businessCode);
      setAssignments(data);
    } catch (error) {
      console.error('Error loading assignments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTransactions = async () => {
    try {
      // Don't load if we're in custom mode and don't have both dates
      if (dateRange === 'custom' && (!customStartDate || !customEndDate)) {
        return;
      }

      setIsLoading(true);
      setError(null);
      const data = await fetchVendorDashboardTransactions({
        vendorCode: user!.businessCode,
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

  const handleDateRangeChange = (newRange: DateRangeType) => {
    setDateRange(newRange);
    // Reset custom dates when switching away from custom range
    if (newRange !== 'custom') {
      setCustomStartDate(null);
      setCustomEndDate(null);
    }
  };

  const filteredTransactions = React.useMemo(() => {
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

  const handleBusinessChange = (businessCode: string | null) => {
    setSelectedBusiness(businessCode);
    setSelectedBranch(null); // Reset branch when business changes
  };

  if (isLoading && assignments.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">{t.loading}</p>
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <Store className="w-16 h-16 text-gray-400" />
        <p className="text-gray-500">{t.noAssignments}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t.dashboard}</h1>
      </div>

      {/* Vendor Assignments */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <VendorAssignmentBoxes assignments={assignments} />
        </div>
      </div>

      {/* Transaction Stats */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <VendorTransactionStats 
            transactions={filteredTransactions}
            dateRange={dateRange}
          />
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">{t.salesAnalytics}</h2>
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
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
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
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

        {error ? (
          <div className="text-red-600 text-center py-4">{error}</div>
        ) : isLoading ? (
          <div className="text-center py-4">{t.loading}</div>
        ) : (
          <VendorDashboardCharts 
            transactions={filteredTransactions} 
            dateRange={dateRange} 
          />
        )}
      </div>
    </div>
  );
}