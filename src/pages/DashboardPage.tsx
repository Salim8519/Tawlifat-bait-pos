import React, { useState, useEffect } from 'react';
import { useLanguageStore } from '../store/useLanguageStore';
import { useUserStore } from '../store/useUserStore';
import { useAuthStore } from '../store/useAuthStore';
import { useTranslation } from 'react-i18next';
import { dashboardTranslations } from '../translations/dashboard';
import { RefreshCcw, AlertCircle, Package } from 'lucide-react';
import {
  getBranchesWithInsights,
  getBranchInsights,
  getOverallBusinessInsights,
  getCombinedBranchInsights,
  getDetailedTransactionInsights,
  type Branch,
  type BranchInsights,
  type TransactionInsights,
  getActiveBranches,
  getTransactionSummary,
  type TransactionSummary
} from '../services/dashboardService';
import { 
  startOfDay, 
  endOfDay, 
  subDays, 
  subWeeks,
  subMonths,
  format 
} from 'date-fns';
import { BranchSelector } from '../components/common/BranchSelector';
import { DateRangeSelector, type DateRangePeriod } from '../components/common/DateRangeSelector';
import { QuickInsights } from '../components/dashboard/QuickInsights';
import { formatCurrency } from '../utils/formatters';

export function DashboardPage() {
  const { language } = useLanguageStore();
  const { userProfile, fetchUserProfile } = useUserStore();
  const { user } = useAuthStore();
  const { t, i18n } = useTranslation();
  const [insights, setInsights] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [branchesCount, setBranchesCount] = useState(0);
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<DateRangePeriod>('today');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchInsights, setBranchInsights] = useState<BranchInsights | null>(null);
  const [overallInsights, setOverallInsights] = useState<any>(null);
  const [detailedInsights, setDetailedInsights] = useState<TransactionInsights | null>(null);
  const [transactionSummary, setTransactionSummary] = useState<TransactionSummary | null>(null);
  const [branchData, setBranchData] = useState<Array<{
    branch_name: string;
    total_amount: number;
    total_profit: number;
    transaction_count: number;
  }> | null>(null);
  const [transactionTrend, setTransactionTrend] = useState<Array<{
    date: string;
    count: number;
  }> | null>(null);
  const [dateRange, setDateRange] = useState(() => {
    const end = endOfDay(new Date());
    const start = startOfDay(subDays(end, 1));
    return {
      startDate: format(start, 'yyyy-MM-dd'),
      endDate: format(end, 'yyyy-MM-dd')
    };
  });

  // Fetch user profile if not available
  useEffect(() => {
    console.log('User Profile Effect:', { userProfile, isLoading });
    if (!userProfile) {
      fetchUserProfile();
    }
  }, [userProfile, fetchUserProfile, isLoading]);

  useEffect(() => {
    i18n.changeLanguage(language);
  }, [language]);

  const updatePeriod = (period: DateRangePeriod) => {
    console.log('Updating period:', period);
    setSelectedPeriod(period);
    
    if (period !== 'custom') {
      const end = endOfDay(new Date());
      let start = startOfDay(end);

      switch (period) {
        case 'day':
          start = startOfDay(subDays(end, 1));
          break;
        case 'week':
          start = startOfDay(subWeeks(end, 1));
          break;
        case 'month':
          start = startOfDay(subMonths(end, 1));
          break;
        case '3months':
          start = startOfDay(subMonths(end, 3));
          break;
      }

      setDateRange({
        startDate: format(start, 'yyyy-MM-dd'),
        endDate: format(end, 'yyyy-MM-dd')
      });
    }
  };

  const handleCustomDateChange = (startDate: string, endDate: string) => {
    console.log('Custom date change:', { startDate, endDate });
    setDateRange({ startDate, endDate });
    setSelectedPeriod('custom');
  };

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Get business code from auth store or user profile
        const businessCode = user?.businessCode || userProfile?.business_code;
        
        if (!businessCode) {
          console.error('No business code available');
          setError('No business code available. Please log in again.');
          setIsLoading(false);
          return;
        }
        
        // Get daily transaction counts for the period
        const startDate = new Date(dateRange.startDate);
        const endDate = new Date(dateRange.endDate);
        const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
        
        const dailyPromises = Array.from({ length: days + 1 }, (_, index) => {
          const currentDate = new Date(startDate);
          currentDate.setDate(startDate.getDate() + index);
          const dateStr = format(currentDate, 'yyyy-MM-dd');
          
          return getTransactionSummary(
            businessCode,
            dateStr,
            dateStr,
            selectedBranch === 'all' ? undefined : selectedBranch
          );
        });

        const [summaryData, branchesData, dailyData] = await Promise.all([
          getTransactionSummary(
            businessCode,
            dateRange.startDate,
            dateRange.endDate,
            selectedBranch === 'all' ? undefined : selectedBranch
          ),
          selectedBranch === 'all' ? Promise.all(
            branches.map(branch => 
              getTransactionSummary(
                businessCode,
                dateRange.startDate,
                dateRange.endDate,
                branch.branch_name
              )
            )
          ) : null,
          Promise.all(dailyPromises)
        ]);

        setTransactionSummary(summaryData);
        
        if (branchesData) {
          setBranchData(
            branchesData.map((data, index) => ({
              branch_name: branches[index].branch_name,
              total_amount: data.totalAmount,
              total_profit: data.totalProfit,
              transaction_count: data.transactionCount
            }))
          );
        } else {
          setBranchData(null);
        }

        // Set transaction trend data
        setTransactionTrend(
          dailyData.map((data, index) => {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + index);
            return {
              date: format(currentDate, 'yyyy-MM-dd'),
              count: data.transactionCount
            };
          })
        );
        
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
        setBranchData(null);
        setTransactionTrend(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (branches.length > 0) {
      fetchDashboardData();
    }
  }, [selectedBranch, dateRange, branches, user, userProfile]);

  // Fetch branches
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        // Get business code from auth store or user profile
        const businessCode = user?.businessCode || userProfile?.business_code;
        
        if (!businessCode) {
          console.error('No business code available for fetching branches');
          return;
        }
        
        const data = await getActiveBranches(businessCode);
        setBranches(data);
        setBranchesCount(data.length);
      } catch (err) {
        console.error('Error fetching branches:', err);
      }
    };

    fetchBranches();
  }, [user, userProfile]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 bg-red-50 rounded-lg">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-800 mb-2">
            {t('errorTitle')}
          </h3>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900">{t('dashboard')}</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            {new Date().toLocaleDateString(language === 'ar' ? 'ar' : 'en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
            title={t('refresh')}
          >
            <RefreshCcw className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-100 overflow-hidden">
          <div className="p-1">
            <DateRangeSelector
              selectedPeriod={selectedPeriod}
              onPeriodChange={updatePeriod}
              onCustomDateChange={handleCustomDateChange}
              customStartDate={dateRange.startDate}
              customEndDate={dateRange.endDate}
            />
          </div>
        </div>
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl shadow-sm border border-purple-100 overflow-hidden">
          <div className="p-1">
            <BranchSelector
              branches={branches}
              selectedBranch={selectedBranch}
              onBranchChange={setSelectedBranch}
            />
          </div>
        </div>
      </div>

      {/* Graphs Section */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4" />
            <p className="text-gray-500">{t('loading')}</p>
          </div>
        ) : transactionSummary ? (
          <QuickInsights 
            data={transactionSummary} 
            selectedBranch={selectedBranch}
            branchData={branchData ?? undefined}
            transactionTrend={transactionTrend ?? undefined}
          />
        ) : (
          <div className="text-center text-gray-500">
            <p>{t('noDataAvailable')}</p>
          </div>
        )}
      </div>

      {/* Top Vendors & Products Table */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">
          {t('topVendorsTable.title')}
        </h3>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          ) : !transactionSummary?.topVendors?.length ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>{t('noData')}</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('topVendorsTable.columns.name')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('topVendorsTable.columns.transactions')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('topVendorsTable.columns.amount')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('topVendorsTable.columns.profit')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactionSummary.topVendors.map((vendor, index) => (
                  <tr 
                    key={vendor.vendor_name}
                    className={`${
                      vendor.vendor_name === 'BUSINESS_PRODUCTS' 
                        ? 'bg-blue-50 hover:bg-blue-100 font-semibold' 
                        : index % 2 === 0 
                          ? 'bg-white hover:bg-gray-50' 
                          : 'bg-gray-50 hover:bg-gray-100'
                    } transition-colors duration-150`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Package className="w-5 h-5 text-gray-400 mr-2" />
                        <span>
                          {vendor.vendor_name === 'BUSINESS_PRODUCTS' 
                            ? t('businessProducts')
                            : vendor.vendor_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      {vendor.transaction_count.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      {formatCurrency(vendor.total_amount)}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap font-medium">
                      {formatCurrency(vendor.total_profit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}