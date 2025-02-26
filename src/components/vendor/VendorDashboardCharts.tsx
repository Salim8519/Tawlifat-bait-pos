import React, { useState, useMemo } from 'react';
import { useLanguageStore } from '../../store/useLanguageStore';
import { vendorDashboardTranslations } from '../../translations/vendorDashboard';
import { DateRangeType } from '../../services/vendorDashboardService';
import { Info } from 'lucide-react';

interface Props {
  transactions: any[];
  dateRange: DateRangeType;
}

// Colors for charts - using more vibrant colors
const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export function VendorDashboardCharts({ transactions, dateRange }: Props) {
  const { language } = useLanguageStore();
  const t = vendorDashboardTranslations[language];
  const isRtl = language === 'ar';
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  // Prepare data for sales by business chart
  const salesByBusinessData = useMemo(() => {
    const businessMap = new Map<string, number>();
    
    transactions.forEach(transaction => {
      if (transaction.transaction_type === 'product_sale') {
        const businessName = transaction.business_name || 'Unknown';
        const amount = Number(transaction.amount) || 0;
        
        businessMap.set(
          businessName, 
          (businessMap.get(businessName) || 0) + amount
        );
      }
    });
    
    return Array.from(businessMap.entries()).map(([name, value]) => ({
      name,
      value: parseFloat(value.toFixed(3))
    })).sort((a, b) => b.value - a.value);
  }, [transactions]);

  // Prepare data for sales by branch chart
  const salesByBranchData = useMemo(() => {
    const branchMap = new Map<string, number>();
    
    transactions.forEach(transaction => {
      if (transaction.transaction_type === 'product_sale' && transaction.branch_name) {
        const branchKey = `${transaction.business_name || 'Unknown'} - ${transaction.branch_name}`;
        const amount = Number(transaction.amount) || 0;
        
        branchMap.set(
          branchKey, 
          (branchMap.get(branchKey) || 0) + amount
        );
      }
    });
    
    return Array.from(branchMap.entries())
      .map(([name, value]) => ({
        name,
        value: parseFloat(value.toFixed(3))
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Only show top 5 branches
  }, [transactions]);

  // Prepare data for transaction types chart
  const transactionTypesData = useMemo(() => {
    const typeMap = new Map<string, number>();
    
    transactions.forEach(transaction => {
      const type = transaction.transaction_type || 'unknown';
      const amount = Number(transaction.amount) || 0;
      
      typeMap.set(
        type, 
        (typeMap.get(type) || 0) + amount
      );
    });
    
    return Array.from(typeMap.entries()).map(([type, value]) => ({
      name: t[type as keyof typeof t] || type,
      value: parseFloat(value.toFixed(3))
    }));
  }, [transactions, t]);

  // Prepare data for monthly trend chart
  const monthlyTrendData = useMemo(() => {
    const monthMap = new Map<string, number>();
    
    transactions.forEach(transaction => {
      if (transaction.transaction_type === 'product_sale') {
        const date = new Date(transaction.transaction_date);
        const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        const amount = Number(transaction.amount) || 0;
        
        monthMap.set(
          monthKey, 
          (monthMap.get(monthKey) || 0) + amount
        );
      }
    });
    
    return Array.from(monthMap.entries())
      .map(([monthKey, value]) => {
        const [year, month] = monthKey.split('-');
        return {
          month: `${month}/${year.slice(2)}`,
          sales: parseFloat(value.toFixed(3))
        };
      })
      .sort((a, b) => {
        const [aMonth, aYear] = a.month.split('/');
        const [bMonth, bYear] = b.month.split('/');
        return (parseInt(aYear) - parseInt(bYear)) || (parseInt(aMonth) - parseInt(bMonth));
      });
  }, [transactions]);

  // Helper tooltips content
  const tooltips = {
    salesByBusiness: language === 'ar' 
      ? 'يوضح هذا الرسم البياني إجمالي المبيعات لكل متجر. الأعمدة الأطول تعني مبيعات أكثر.' 
      : 'This chart shows your total sales for each business. Taller bars mean more sales.',
    salesByBranch: language === 'ar'
      ? 'يعرض هذا الرسم البياني أفضل 5 فروع من حيث المبيعات. يمكنك معرفة أي الفروع تحقق أداءً أفضل.' 
      : 'This chart displays your top 5 branches by sales. You can see which branches are performing better.',
    transactionTypes: language === 'ar'
      ? 'يوضح هذا الرسم البياني توزيع أنواع المعاملات المختلفة. كل لون يمثل نوعًا مختلفًا من المعاملات.' 
      : 'This chart shows the distribution of different transaction types. Each color represents a different type of transaction.',
    monthlyTrend: language === 'ar'
      ? 'يعرض هذا الرسم البياني اتجاه المبيعات الشهرية بمرور الوقت. يمكنك رؤية كيف تتغير مبيعاتك شهريًا.' 
      : 'This chart shows your monthly sales trend over time. You can see how your sales change month by month.'
  };

  // Format number with currency
  const formatCurrency = (value: number) => {
    return `${value.toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')} ${t.currency}`;
  };

  // Calculate max value for scaling
  const getMaxValue = (data: any[], valueKey: string) => {
    return Math.max(...data.map(item => item[valueKey])) * 1.1;
  };

  // If no transactions, show empty state
  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-gray-500 font-bold">{t.noTransactionsInPeriod}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sales by Business Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">{t.salesByBusiness}</h3>
          <div className="relative">
            <button 
              className="text-gray-400 hover:text-indigo-600 focus:outline-none"
              onMouseEnter={() => setShowTooltip('salesByBusiness')}
              onMouseLeave={() => setShowTooltip(null)}
            >
              <Info size={20} />
            </button>
            {showTooltip === 'salesByBusiness' && (
              <div className="absolute z-10 w-64 p-3 bg-white rounded-lg shadow-lg border border-gray-200 text-sm text-gray-700 right-0">
                {tooltips.salesByBusiness}
              </div>
            )}
          </div>
        </div>
        <p className="text-sm font-medium text-gray-600 mb-4">
          {language === 'ar' 
            ? 'هذا الرسم البياني يوضح إجمالي المبيعات لكل متجر' 
            : 'This chart shows the total sales for each business'}
        </p>
        
        {/* Custom horizontal bar chart */}
        <div className="mt-6 space-y-4">
          {salesByBusinessData.map((item, index) => {
            const maxValue = getMaxValue(salesByBusinessData, 'value');
            const percentage = (item.value / maxValue) * 100;
            
            return (
              <div key={index} className="relative">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{item.name}</span>
                  <span className="text-sm font-bold text-indigo-600">{formatCurrency(item.value)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
                  <div 
                    className="bg-indigo-600 h-4 rounded-full" 
                    style={{ 
                      width: `${percentage}%`,
                      float: isRtl ? 'right' : 'left' 
                    }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top 5 Branches Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">{t.topBranches}</h3>
          <div className="relative">
            <button 
              className="text-gray-400 hover:text-indigo-600 focus:outline-none"
              onMouseEnter={() => setShowTooltip('salesByBranch')}
              onMouseLeave={() => setShowTooltip(null)}
            >
              <Info size={20} />
            </button>
            {showTooltip === 'salesByBranch' && (
              <div className="absolute z-10 w-64 p-3 bg-white rounded-lg shadow-lg border border-gray-200 text-sm text-gray-700 right-0">
                {tooltips.salesByBranch}
              </div>
            )}
          </div>
        </div>
        <p className="text-sm font-medium text-gray-600 mb-4">
          {language === 'ar' 
            ? 'أفضل 5 فروع من حيث المبيعات' 
            : 'Top 5 branches by sales volume'}
        </p>
        
        {/* Custom horizontal bar chart for branches */}
        <div className="mt-6 space-y-4">
          {salesByBranchData.map((item, index) => {
            const maxValue = getMaxValue(salesByBranchData, 'value');
            const percentage = (item.value / maxValue) * 100;
            
            return (
              <div key={index} className="relative">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{item.name}</span>
                  <span className="text-sm font-bold text-green-600">{formatCurrency(item.value)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
                  <div 
                    className="bg-green-500 h-4 rounded-full" 
                    style={{ 
                      width: `${percentage}%`,
                      float: isRtl ? 'right' : 'left' 
                    }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Transaction Types Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">{t.transactionTypeDistribution}</h3>
          <div className="relative">
            <button 
              className="text-gray-400 hover:text-indigo-600 focus:outline-none"
              onMouseEnter={() => setShowTooltip('transactionTypes')}
              onMouseLeave={() => setShowTooltip(null)}
            >
              <Info size={20} />
            </button>
            {showTooltip === 'transactionTypes' && (
              <div className="absolute z-10 w-64 p-3 bg-white rounded-lg shadow-lg border border-gray-200 text-sm text-gray-700 right-0">
                {tooltips.transactionTypes}
              </div>
            )}
          </div>
        </div>
        <p className="text-sm font-medium text-gray-600 mb-4">
          {language === 'ar' 
            ? 'توزيع المعاملات حسب النوع (كل لون يمثل نوع معاملة مختلف)' 
            : 'Distribution of transactions by type (each color represents a different transaction type)'}
        </p>
        
        {/* Custom pie chart representation using colored boxes */}
        <div className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {transactionTypesData.map((item, index) => {
              const total = transactionTypesData.reduce((sum, i) => sum + i.value, 0);
              const percentage = ((item.value / total) * 100).toFixed(1);
              
              return (
                <div key={index} className="flex items-center p-3 border rounded-lg">
                  <div 
                    className="w-4 h-4 rounded-full mr-2" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className="font-medium">{item.name}</span>
                      <span className="font-bold">{percentage}%</span>
                    </div>
                    <div className="text-sm text-gray-600">{formatCurrency(item.value)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Monthly Trend Chart */}
      {monthlyTrendData.length > 1 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800">{t.salesOverTime}</h3>
            <div className="relative">
              <button 
                className="text-gray-400 hover:text-indigo-600 focus:outline-none"
                onMouseEnter={() => setShowTooltip('monthlyTrend')}
                onMouseLeave={() => setShowTooltip(null)}
              >
                <Info size={20} />
              </button>
              {showTooltip === 'monthlyTrend' && (
                <div className="absolute z-10 w-64 p-3 bg-white rounded-lg shadow-lg border border-gray-200 text-sm text-gray-700 right-0">
                  {tooltips.monthlyTrend}
                </div>
              )}
            </div>
          </div>
          <p className="text-sm font-medium text-gray-600 mb-4">
            {language === 'ar' 
              ? 'اتجاه المبيعات الشهرية بمرور الوقت' 
              : 'Monthly sales trend over time'}
          </p>
          
          {/* Custom line chart for monthly trends */}
          <div className="mt-6">
            <div className="relative h-64">
              {/* Y-axis labels */}
              <div className={`absolute top-0 bottom-0 ${isRtl ? 'right-0' : 'left-0'} w-12 flex flex-col justify-between text-xs text-gray-500`}>
                {Array.from({ length: 6 }, (_, i) => {
                  const maxSales = getMaxValue(monthlyTrendData, 'sales');
                  const value = maxSales * (5 - i) / 5;
                  return (
                    <div key={i} className="relative h-0">
                      <span className={`absolute ${isRtl ? 'right-0' : 'left-0'} -translate-y-1/2`}>
                        {formatCurrency(value).split(' ')[0]}
                      </span>
                    </div>
                  );
                })}
              </div>
              
              {/* Chart grid */}
              <div className={`absolute top-0 bottom-0 ${isRtl ? 'left-0 right-14' : 'left-14 right-0'}`}>
                {Array.from({ length: 6 }, (_, i) => (
                  <div 
                    key={i} 
                    className="absolute w-full border-t border-gray-200" 
                    style={{ top: `${i * 20}%` }}
                  ></div>
                ))}
                
                {/* Bars */}
                <div className="absolute top-0 bottom-0 left-0 right-0 flex items-end">
                  <div className={`flex h-full items-end ${isRtl ? 'flex-row-reverse' : 'flex-row'} w-full`}>
                    {monthlyTrendData.map((item, index) => {
                      const maxSales = getMaxValue(monthlyTrendData, 'sales');
                      const height = (item.sales / maxSales) * 100;
                      
                      return (
                        <div 
                          key={index} 
                          className="flex-1 flex flex-col items-center justify-end mx-1"
                        >
                          <div 
                            className="w-full bg-purple-500 rounded-t-sm" 
                            style={{ height: `${height}%` }}
                          ></div>
                          <div className="text-xs mt-1 font-medium transform -rotate-45 origin-top-left">
                            {item.month}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
