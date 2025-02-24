import React, { useState, useEffect } from 'react';
import { Calendar, Download } from 'lucide-react';
import { useLanguageStore } from '../store/useLanguageStore';
import { reportTranslations } from '../translations/reports';
import { BranchSelector } from '../components/common/BranchSelector';
import { ReportDateSelector, type ReportDatePeriod } from '../components/reports/ReportDateSelector';
import { startOfDay, endOfDay, format, subDays, subWeeks, subMonths } from 'date-fns';
import { getActiveBranches, type Branch } from '../services/dashboardService';
import { useUserStore } from '../store/useUserStore';
import { TransactionReport } from '../components/reports/transactions/TransactionReport';
import { ReportSelector, type ReportType } from '../components/reports/ReportSelector';

export function ReportsPage() {
  const { language } = useLanguageStore();
  const { userProfile, fetchUserProfile } = useUserStore();
  const t = reportTranslations[language];

  // States for branch and date selection
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<ReportDatePeriod>('today');
  const [selectedReport, setSelectedReport] = useState<ReportType>('transactions');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState(() => {
    const end = endOfDay(new Date());
    const start = startOfDay(end);
    return {
      startDate: format(start, 'yyyy-MM-dd'),
      endDate: format(end, 'yyyy-MM-dd')
    };
  });

  // Ensure user profile is loaded
  useEffect(() => {
    if (!userProfile) {
      fetchUserProfile();
    }
  }, [userProfile, fetchUserProfile]);

  // Fetch branches
  useEffect(() => {
    const fetchBranches = async () => {
      if (!userProfile?.business_code) {
        if (!isLoading) setIsLoading(true);
        return;
      }
      
      try {
        const branchesData = await getActiveBranches(userProfile.business_code);
        setBranches(branchesData);
        setSelectedBranch(userProfile.main_branch || 'all');
      } catch (error) {
        console.error('Error fetching branches:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBranches();
  }, [userProfile?.business_code, userProfile?.main_branch]);

  // Handle period changes
  const handlePeriodChange = (period: ReportDatePeriod) => {
    setSelectedPeriod(period);
    
    if (period !== 'custom') {
      const end = endOfDay(new Date());
      let start = startOfDay(end);

      switch (period) {
        case 'today':
          start = startOfDay(end);
          break;
        case 'yesterday':
          start = startOfDay(subDays(end, 1));
          break;
        case 'last7days':
          start = startOfDay(subDays(end, 7));
          break;
        case 'last30days':
          start = startOfDay(subDays(end, 30));
          break;
        case 'thisWeek':
          start = startOfDay(subWeeks(end, 1));
          break;
        case 'thisMonth':
          start = startOfDay(subMonths(end, 1));
          break;
      }

      setDateRange({
        startDate: format(start, 'yyyy-MM-dd'),
        endDate: format(end, 'yyyy-MM-dd')
      });
    }
  };

  // Handle custom date changes
  const handleCustomDateChange = (startDate: string, endDate: string) => {
    setDateRange({ startDate, endDate });
  };

  const renderReport = () => {
    if (!userProfile?.business_code) return null;

    const commonProps = {
      businessCode: userProfile.business_code,
      selectedBranch,
      branches,
      dateRange,
      onBranchChange: setSelectedBranch
    };

    switch (selectedReport) {
      case 'transactions':
        return <TransactionReport {...commonProps} />;
      case 'sales':
      case 'products':
      case 'inventory':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">{t.comingSoon}</h2>
          </div>
        );
    }
  };

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">{t.loading}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-4">
        <ReportSelector
          selectedReport={selectedReport}
          onReportChange={setSelectedReport}
        />
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <BranchSelector
            branches={branches}
            selectedBranch={selectedBranch}
            onBranchChange={setSelectedBranch}
          />
          <ReportDateSelector
            selectedPeriod={selectedPeriod}
            onPeriodChange={handlePeriodChange}
            onCustomDateChange={handleCustomDateChange}
            customStartDate={dateRange.startDate}
            customEndDate={dateRange.endDate}
          />
        </div>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">{t.loading}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {renderReport()}
        </div>
      )}
    </div>
  );
}