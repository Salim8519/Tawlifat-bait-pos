import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useLanguageStore } from '../store/useLanguageStore';
import { vendorDashboardTranslations } from '../translations/vendorDashboard';
import { VendorRental, VendorRentalHistory, getVendorRentalsForVendor, getVendorRentalHistory } from '../services/vendorRentalsService';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { Filter, Calendar } from 'lucide-react';

export function VendorRentalsPage() {
  const { user } = useAuthStore();
  const { language } = useLanguageStore();
  const t = vendorDashboardTranslations[language];
  const isRtl = language === 'ar';
  const dateLocale = language === 'ar' ? ar : enUS;

  const [rentals, setRentals] = useState<VendorRental[]>([]);
  const [rentalHistory, setRentalHistory] = useState<VendorRentalHistory[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<VendorRentalHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [availableMonths, setAvailableMonths] = useState<number[]>([]);

  useEffect(() => {
    async function fetchData() {
      if (!user?.businessCode) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Fetch both rentals and rental history
        const [rentalsData, historyData] = await Promise.all([
          getVendorRentalsForVendor(user.businessCode),
          getVendorRentalHistory(user.businessCode)
        ]);
        
        setRentals(rentalsData);
        setRentalHistory(historyData);
        setFilteredHistory(historyData);
        
        // Extract available years and months for filtering
        if (historyData.length > 0) {
          const years = [...new Set(historyData.map(item => item.year))].sort((a, b) => b - a);
          setAvailableYears(years);
          setSelectedYear(years[0] || null);
          
          const months = [...new Set(historyData
            .filter(item => item.year === years[0])
            .map(item => item.month))].sort((a, b) => b - a);
          setAvailableMonths(months);
        }
      } catch (err) {
        console.error('Error fetching vendor rentals:', err);
        setError('Failed to load rental data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user?.businessCode]);

  // Apply filters when year or month changes
  useEffect(() => {
    if (!rentalHistory.length) return;
    
    let filtered = [...rentalHistory];
    
    if (selectedYear !== null) {
      filtered = filtered.filter(item => item.year === selectedYear);
      
      // Update available months when year changes
      const months = [...new Set(rentalHistory
        .filter(item => item.year === selectedYear)
        .map(item => item.month))].sort((a, b) => b - a);
      setAvailableMonths(months);
      
      // Reset month selection if current selection is not available
      if (selectedMonth !== null && !months.includes(selectedMonth)) {
        setSelectedMonth(null);
      }
    }
    
    if (selectedMonth !== null) {
      filtered = filtered.filter(item => item.month === selectedMonth);
    }
    
    setFilteredHistory(filtered);
  }, [selectedYear, selectedMonth, rentalHistory]);

  // Format month/year
  const formatMonthYear = (month: number, year: number) => {
    // Create a date object for the first day of the month
    const date = new Date(year, month - 1, 1);
    return format(date, 'MMMM yyyy', { locale: dateLocale });
  };
  
  // Format month name
  const formatMonth = (month: number) => {
    const date = new Date(2000, month - 1, 1);
    return format(date, 'MMMM', { locale: dateLocale });
  };

  // Format payment status
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')} ${t.currency}`;
  };

  // Handle filter changes
  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const year = e.target.value === '' ? null : parseInt(e.target.value, 10);
    setSelectedYear(year);
    setSelectedMonth(null); // Reset month when year changes
  };
  
  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMonth(e.target.value === '' ? null : parseInt(e.target.value, 10));
  };
  
  const clearFilters = () => {
    setSelectedYear(null);
    setSelectedMonth(null);
  };

  if (!user?.businessCode) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">{t.noBusinessCode}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">{t.loading}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8 text-indigo-700">{t.myRentals}</h1>
      
      {/* Current Rentals */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-gray-100">
        <h2 className="text-xl font-semibold text-indigo-600 flex items-center mb-4">
          <Calendar className="w-5 h-5 mr-2" />
          {t.myRentals}
        </h2>
        
        {rentals.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <p className="text-gray-500">{t.noRentalsFound}</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className={`min-w-full divide-y divide-gray-200 ${isRtl ? 'text-right' : 'text-left'}`}>
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.spaceName}
                  </th>
                  <th scope="col" className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.branchName}
                  </th>
                  <th scope="col" className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.ownerBusiness}
                  </th>
                  <th scope="col" className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.rentAmount}
                  </th>
                  <th scope="col" className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.date}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rentals.map((rental) => (
                  <tr key={rental.rental_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-indigo-600">{rental.space_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{rental.branch_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{rental.owner_business_name || rental.owner_business_code}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{formatCurrency(rental.rent_amount)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {format(new Date(rental.created_at), 'PPP', { locale: dateLocale })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Rental History */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h2 className="text-xl font-semibold text-indigo-600 flex items-center mb-4 sm:mb-0">
            <Filter className="w-5 h-5 mr-2" />
            {t.rentalHistory}
          </h2>
          
          {/* Filters */}
          <div className={`flex flex-wrap gap-3 ${isRtl ? 'sm:justify-start' : 'sm:justify-end'}`}>
            {availableYears.length > 0 && (
              <div className="flex items-center">
                <label htmlFor="year-filter" className="text-sm font-medium text-gray-700 mr-2">
                  {t.filterByYear}
                </label>
                <select
                  id="year-filter"
                  value={selectedYear?.toString() || ''}
                  onChange={handleYearChange}
                  className="form-select rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-sm"
                >
                  <option value="">{t.allYears}</option>
                  {availableYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            )}
            
            {selectedYear && availableMonths.length > 0 && (
              <div className="flex items-center">
                <label htmlFor="month-filter" className="text-sm font-medium text-gray-700 mr-2">
                  {t.filterByMonth}
                </label>
                <select
                  id="month-filter"
                  value={selectedMonth?.toString() || ''}
                  onChange={handleMonthChange}
                  className="form-select rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-sm"
                >
                  <option value="">{t.allMonths}</option>
                  {availableMonths.map(month => (
                    <option key={month} value={month}>{formatMonth(month)}</option>
                  ))}
                </select>
              </div>
            )}
            
            {(selectedYear || selectedMonth) && (
              <button
                onClick={clearFilters}
                className="px-3 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors"
              >
                {t.clearFilters}
              </button>
            )}
          </div>
        </div>
        
        {filteredHistory.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <p className="text-gray-500">
              {(selectedYear || selectedMonth) 
                ? t.noRecordsForPeriod
                : t.noRentalHistoryFound}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className={`min-w-full divide-y divide-gray-200 ${isRtl ? 'text-right' : 'text-left'}`}>
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.monthYear}
                  </th>
                  <th scope="col" className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.branchName}
                  </th>
                  <th scope="col" className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.ownerBusiness}
                  </th>
                  <th scope="col" className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.amount}
                  </th>
                  <th scope="col" className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.paymentStatus}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredHistory.map((history) => (
                  <tr key={history.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-indigo-600">
                        {formatMonthYear(history.month, history.year)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{history.branch_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{history.owner_business_name || history.owner_business_code}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{formatCurrency(history.tax_amount)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(history.payment_status)}`}>
                        {t[history.payment_status as keyof typeof t] || history.payment_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
