import React, { useMemo, useState, useEffect } from 'react';
import { useLanguageStore } from '../../store/useLanguageStore';
import { vendorDashboardTranslations } from '../../translations/vendorDashboard';
import { format, getYear, getMonth } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { fetchVendorDashboardTransactions } from '../../services/vendorDashboardService';
import { useAuthStore } from '../../store/useAuthStore';
import { ChevronDown, Calendar } from 'lucide-react';

interface Props {
  initialTransactions?: any[];
}

export function VendorMonthlyProfitTable({ initialTransactions }: Props) {
  const { language } = useLanguageStore();
  const { user } = useAuthStore();
  const t = vendorDashboardTranslations[language];
  const isRtl = language === 'ar';
  const dateLocale = language === 'ar' ? ar : enUS;

  // State for month/year selection
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [transactions, setTransactions] = useState<any[]>(initialTransactions || []);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Generate years and months for selectors
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => currentYear - i);
  }, []);

  const months = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => i);
  }, []);

  // Fetch transactions for the selected month and year
  useEffect(() => {
    if (!user?.businessCode) return;
    
    const fetchTransactionsForMonth = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Create date range for the selected month
        const startDate = new Date(selectedYear, selectedMonth, 1);
        const endDate = new Date(selectedYear, selectedMonth + 1, 0); // Last day of month
        
        const data = await fetchVendorDashboardTransactions({
          vendorCode: user.businessCode,
          dateRange: 'custom',
          customStartDate: startDate,
          customEndDate: endDate
        });
        
        setTransactions(data);
      } catch (err) {
        console.error('Error fetching transactions for profit table:', err);
        setError(t.errorLoadingTransactions);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTransactionsForMonth();
  }, [selectedYear, selectedMonth, user?.businessCode]);

  // Calculate monthly profit by business and branch
  const profitData = useMemo(() => {
    const profitMap = new Map<string, Map<string, number>>();
    
    transactions.forEach(transaction => {
      const businessCode = transaction.business_code || 'unknown';
      const branchName = transaction.branch_name || 'unknown';
      const businessName = transaction.business_name || businessCode;
      const amount = Number(transaction.amount) || 0;
      
      // Create a unique key for the business+branch combination
      const key = `${businessCode}|${branchName}`;
      
      if (!profitMap.has(key)) {
        profitMap.set(key, new Map<string, any>());
        profitMap.get(key)!.set('businessCode', businessCode);
        profitMap.get(key)!.set('businessName', businessName);
        profitMap.get(key)!.set('branchName', branchName);
        profitMap.get(key)!.set('amount', 0);
      }
      
      const currentAmount = profitMap.get(key)!.get('amount');
      profitMap.get(key)!.set('amount', currentAmount + amount);
    });
    
    // Convert to array and sort by amount (highest first)
    return Array.from(profitMap.values())
      .map(entry => ({
        businessCode: entry.get('businessCode'),
        businessName: entry.get('businessName'),
        branchName: entry.get('branchName'),
        amount: parseFloat(entry.get('amount').toFixed(3))
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  // Format month name
  const formatMonthName = (monthIndex: number) => {
    const date = new Date();
    date.setMonth(monthIndex);
    return format(date, 'MMMM', { locale: dateLocale });
  };

  // Format currency - always use English numbers
  const formatCurrency = (value: number) => {
    // Always use English locale for numbers, but keep the currency symbol based on language
    return `${value.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} ${t.currency}`;
  };

  // Handle month and year changes
  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMonth(parseInt(e.target.value));
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedYear(parseInt(e.target.value));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2 text-gray-600">{t.loading}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
        <p>{error}</p>
      </div>
    );
  }

  const totalProfit = profitData.reduce((sum, item) => sum + item.amount, 0);
  const monthYearTitle = `${formatMonthName(selectedMonth)} ${selectedYear}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold text-gray-800">{t.monthlyProfitByBusiness}</h3>
          <p className="text-sm text-gray-600">{t.monthlyProfitDescription}</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <div className="flex items-center border rounded-md px-3 py-2 bg-white shadow-sm">
              <Calendar className="h-4 w-4 text-gray-500 mr-2" />
              <select
                value={selectedMonth}
                onChange={handleMonthChange}
                className="appearance-none bg-transparent pr-8 focus:outline-none text-sm"
              >
                {months.map((month) => (
                  <option key={month} value={month}>
                    {formatMonthName(month)}
                  </option>
                ))}
              </select>
              <ChevronDown className="h-4 w-4 text-gray-500 absolute right-3" />
            </div>
          </div>
          
          <div className="relative">
            <div className="flex items-center border rounded-md px-3 py-2 bg-white shadow-sm">
              <select
                value={selectedYear}
                onChange={handleYearChange}
                className="appearance-none bg-transparent pr-8 focus:outline-none text-sm"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <ChevronDown className="h-4 w-4 text-gray-500 absolute right-3" />
            </div>
          </div>
        </div>
      </div>
      
      {profitData.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center text-gray-500">
          {t.noTransactionsInPeriod}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow">
          <div className="px-6 py-4 bg-indigo-50 border-b border-gray-200">
            <h4 className="font-medium text-indigo-700">{monthYearTitle}</h4>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.businessName}
                  </th>
                  <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.branchName}
                  </th>
                  <th scope="col" className="px-6 py-3 text-end text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.profit}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {profitData.map((item, index) => (
                  <tr 
                    key={`${item.businessCode}-${item.branchName}`}
                    className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.businessName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.branchName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-end">
                      <span className={item.amount >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                        {formatCurrency(item.amount)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={2} className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-end">
                    {t.totalAmount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-end">
                    <span className={totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatCurrency(totalProfit)}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
