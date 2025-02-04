import React, { useState, useEffect } from 'react';
import { useLanguageStore } from '../store/useLanguageStore';
import { useUserStore } from '../store/useUserStore';
import { dashboardTranslations } from '../translations/dashboard';
import {
  ShoppingBag,
  CreditCard,
  DollarSign,
  TrendingUp,
  Building2,
  Calendar,
  RefreshCcw,
  AlertCircle,
  Package
} from 'lucide-react';
import {
  getBranchesWithInsights,
  getBranchInsights,
  getOverallBusinessInsights,
  getCombinedBranchInsights,
  getDetailedTransactionInsights,
  type Branch,
  type BranchInsights,
  type TransactionInsights
} from '../services/dashboardService';
import { format, subDays, startOfToday } from 'date-fns';
import { enUS, arSA } from 'date-fns/locale';
import { TransactionCharts } from '../components/dashboard/TransactionCharts';

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  trend?: string;
  onClick?: () => void;
}

function StatCard({ icon: Icon, label, value, trend, onClick }: StatCardProps) {
  return (
    <div 
      className={`bg-white p-6 rounded-lg shadow-sm border border-gray-100 ${onClick ? 'cursor-pointer hover:border-blue-500 transition-colors' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="p-2 bg-blue-50 rounded-lg">
          <Icon className="w-6 h-6 text-blue-500" />
        </div>
      </div>
      <h3 className="mt-4 text-sm font-medium text-gray-600">{label}</h3>
      <p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p>
      {trend && <p className="mt-2 text-sm text-gray-500">{trend}</p>}
    </div>
  );
}

export function DashboardPage() {
  const { language } = useLanguageStore();
  const { userProfile, fetchUserProfile } = useUserStore();
  const t = dashboardTranslations[language];
  const [selectedBranch, setSelectedBranch] = useState<string | null>('all');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchInsights, setBranchInsights] = useState<BranchInsights | null>(null);
  const [overallInsights, setOverallInsights] = useState<any>(null);
  const [detailedInsights, setDetailedInsights] = useState<TransactionInsights | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{
    startDate: string;
    endDate: string;
  }>({
    startDate: format(subDays(startOfToday(), 30), 'yyyy-MM-dd'),
    endDate: format(startOfToday(), 'yyyy-MM-dd')
  });

  // Fetch user profile if not available
  useEffect(() => {
    if (!userProfile) {
      console.log('No user profile found, fetching...');
      fetchUserProfile();
    } else {
      console.log('User profile available:', {
        businessCode: userProfile.business_code,
        role: userProfile.role
      });
    }
  }, [userProfile, fetchUserProfile]);

  // Load branches and initial insights
  useEffect(() => {
    async function loadData() {
      setError(null);
      console.log('Loading dashboard data...', {
        businessCode: userProfile?.business_code,
        dateRange
      });

      if (!userProfile?.business_code) {
        console.log('No business code available, skipping data load');
        return;
      }

      try {
        setIsLoading(true);
        console.log('Fetching branches...');
        // Get branches
        const branchesData = await getBranchesWithInsights(userProfile.business_code);
        console.log('Fetched branches:', branchesData);
        
        if (!branchesData || branchesData.length === 0) {
          setError('No active branches found for this business');
          setIsLoading(false);
          return;
        }

        setBranches(branchesData);

        console.log('Fetching overall insights...');
        // Get overall insights
        const overall = await getOverallBusinessInsights(
          userProfile.business_code,
          dateRange.startDate,
          dateRange.endDate
        );
        console.log('Fetched overall insights:', overall);
        setOverallInsights(overall);

        // If there are branches, select the first one
        if (branchesData.length > 0) {
          console.log('Setting initial branch:', branchesData[0].branch_name);
          setSelectedBranch(branchesData[0].branch_name);
          const insights = await getBranchInsights(
            userProfile.business_code,
            branchesData[0].branch_name,
            dateRange.startDate,
            dateRange.endDate
          );
          console.log('Fetched initial branch insights:', insights);
          setBranchInsights(insights);
        } else {
          console.log('No branches found');
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setError(error instanceof Error ? error.message : 'Error loading dashboard data');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [userProfile?.business_code, dateRange]);

  // Load branch insights when selected branch changes
  useEffect(() => {
    async function loadBranchInsights() {
      console.log('Loading branch insights...', {
        businessCode: userProfile?.business_code,
        selectedBranch,
        dateRange
      });

      if (!userProfile?.business_code) {
        console.log('Missing business code for branch insights');
        return;
      }

      try {
        setIsLoading(true);
        // Get branch-specific or combined insights
        if (selectedBranch === 'all') {
          const insights = await getCombinedBranchInsights(
            userProfile.business_code,
            dateRange.startDate,
            dateRange.endDate
          );
          console.log('Fetched combined branch insights:', insights);
          setBranchInsights(insights);
        } else if (selectedBranch) {
          const insights = await getBranchInsights(
            userProfile.business_code,
            selectedBranch,
            dateRange.startDate,
            dateRange.endDate
          );
          console.log('Fetched branch insights:', insights);
          setBranchInsights(insights);
        }

        // Get detailed transaction insights
        const detailed = await getDetailedTransactionInsights(
          userProfile.business_code,
          selectedBranch === 'all' ? null : selectedBranch,
          dateRange.startDate,
          dateRange.endDate
        );
        console.log('Fetched detailed insights:', detailed);
        setDetailedInsights(detailed);
      } catch (error) {
        console.error('Error loading insights:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadBranchInsights();
  }, [selectedBranch, userProfile?.business_code, dateRange]);

  const refreshData = () => {
    setDateRange({
      startDate: format(subDays(startOfToday(), 30), 'yyyy-MM-dd'),
      endDate: format(startOfToday(), 'yyyy-MM-dd')
    });
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4" />
        <p className="text-gray-500">{t.loading}</p>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="text-red-500 mb-4">
          <AlertCircle className="w-12 h-12" />
        </div>
        <p className="text-gray-700 font-medium">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {t.refresh}
        </button>
      </div>
    );
  }

  // Show no data state
  if (!branches.length) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="text-gray-400 mb-4">
          <Package className="w-12 h-12" />
        </div>
        <p className="text-gray-700 font-medium">{t.noData}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t.dashboard}</h1>
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
            onClick={refreshData}
            className="p-2 hover:bg-gray-100 rounded-full"
            title={t.refresh}
          >
            <RefreshCcw className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Branch selector */}
      <div className="flex gap-4 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedBranch('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
            selectedBranch === 'all'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {t.allBranches}
        </button>
        {branches.map(branch => (
          <button
            key={branch.branch_name}
            onClick={() => setSelectedBranch(branch.branch_name)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
              selectedBranch === branch.branch_name
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {branch.branch_name}
          </button>
        ))}
      </div>

      {/* Overall stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Building2}
          label={t.totalBranches}
          value={branches.length.toString()}
        />
        <StatCard
          icon={ShoppingBag}
          label={t.totalTransactions}
          value={overallInsights?.totalTransactions.toString() || '0'}
        />
        <StatCard
          icon={DollarSign}
          label={t.totalAmount}
          value={`${overallInsights?.totalAmount.toFixed(2) || '0'} ${t.currency}`}
        />
        <StatCard
          icon={TrendingUp}
          label={t.averagePerTransaction}
          value={`${overallInsights?.totalTransactions ? (overallInsights.totalAmount / overallInsights.totalTransactions).toFixed(2) : '0'} ${t.currency}`}
        />
      </div>

      {/* Selected branch stats */}
      {branchInsights && (
        <div>
          <h2 className="text-xl font-semibold mb-4">{branchInsights.branch.branch_name} {t.insights}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard
              icon={ShoppingBag}
              label={t.branchTransactions}
              value={branchInsights.totalTransactions.toString()}
            />
            <StatCard
              icon={DollarSign}
              label={t.branchAmount}
              value={`${branchInsights.totalAmount.toFixed(2)} ${t.currency}`}
            />
            <StatCard
              icon={CreditCard}
              label={t.paymentMethods}
              value={`${t.cash}: ${branchInsights.cashTransactions}`}
              trend={`${t.card}: ${branchInsights.cardTransactions} | ${t.online}: ${branchInsights.onlineTransactions}`}
            />
          </div>
        </div>
      )}

      {/* Transaction charts */}
      {detailedInsights && (
        <TransactionCharts
          insights={detailedInsights}
          language={language}
          currency={t.currency}
        />
      )}

      {/* Recent transactions */}
      {branchInsights?.recentTransactions.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">{t.recentTransactions}</h3>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.date}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.type}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.amount}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.paymentMethod}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {branchInsights.recentTransactions.map((transaction) => (
                  <tr key={transaction.transaction_id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(transaction.transaction_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.transaction_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.amount.toFixed(2)} {transaction.currency}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.payment_method}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}