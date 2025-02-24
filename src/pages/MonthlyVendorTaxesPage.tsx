import { supabase } from '../lib/supabase';
import { useEffect, useState, useMemo } from 'react';
import { useLanguageStore } from '../store/useLanguageStore';
import { useAuthStore } from '../store/useAuthStore';
import { useBusinessStore } from '../store/useBusinessStore';
import { settingsTranslations } from '../translations/settings';
import { VendorAssignment, getVendorAssignments } from '../services/vendorAssignmentService';
import { getVendorMonthlyProfit } from '../services/vendorProfitService';
import { formatCurrency } from '../utils/formatCurrency';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { ChevronDown, X } from 'lucide-react';
import { recordMonthlyTaxTransaction } from '../services/monthlyTaxService';

interface VendorWithProfit extends VendorAssignment {
  monthlyProfit?: number;
  monthlyTax?: number;
  taxStatus?: string;
}

type PaymentMethod = 'cash' | 'card' | 'online';

const MonthlyVendorTaxesPage: React.FC = () => {
  const { language } = useLanguageStore();
  const { businessCode } = useAuthStore();
  const { branches } = useBusinessStore();
  const t = settingsTranslations[language];
  
  const [vendors, setVendors] = useState<VendorWithProfit[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [selectedBusiness, setSelectedBusiness] = useState<string>('');
  const [businessSettings, setBusinessSettings] = useState<any>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [taxHistory, setTaxHistory] = useState<any[]>([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<VendorWithProfit | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('cash');

  // Get current date once when component mounts
  const currentDate = useMemo(() => new Date(), []);

  // Generate years array (from 2025 to current year + 5)
  const years = useMemo(() => {
    const currentYear = currentDate.getFullYear();
    const startYear = 2025;
    const endYear = currentYear + 5;
    return Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);
  }, [currentDate]);

  // Load business settings
  useEffect(() => {
    const loadBusinessSettings = async () => {
      setIsLoadingSettings(true);
      const { data, error } = await supabase
        .from('business_settings')
        .select('extra_tax_monthly_on_vendors')
        .eq('business_code_', businessCode)
        .single();

      if (error) {
        console.error('Error loading business settings:', error);
        setIsLoadingSettings(false);
        return;
      }

      console.log('Loaded business settings:', data);
      setBusinessSettings(data);
      setIsLoadingSettings(false);
    };

    if (businessCode) {
      loadBusinessSettings();
    }
  }, [businessCode]);

  useEffect(() => {
    const loadData = async () => {
      if (!businessCode || isLoadingSettings) {
        return;
      }

      setLoading(true);
      try {
        const data = await getVendorAssignments(businessCode);
        const vendorsWithProfit = await loadVendorProfits(data);
        setVendors(vendorsWithProfit);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading vendors');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [businessCode, selectedMonth, selectedYear, isLoadingSettings]);

  const loadTaxHistory = async () => {
    if (!businessCode) {
      console.log('Cannot load tax history - missing business code');
      return;
    }

    console.log('Loading tax history with params:', {
      businessCode,
      selectedBranch,
      month: selectedMonth,
      year: selectedYear
    });

    const query = supabase
      .from('monthly_tax_history')
      .select('*')
      .eq('owner_business_code', businessCode)
      .eq('month', selectedMonth)
      .eq('year', selectedYear)
      .order('created_at', { ascending: false });

    // Only filter by branch if it's selected
    if (selectedBranch) {
      query.eq('branch_name', selectedBranch);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching tax history:', error);
      return;
    }

    console.log('Loaded tax history:', data?.length, 'records');
    setTaxHistory(data || []);
  };

  useEffect(() => {
    loadTaxHistory();
  }, [businessCode, selectedBranch, selectedMonth, selectedYear]);

  const loadVendorProfits = async (vendorsData: VendorAssignment[]) => {
    // First, fetch tax history for all vendors in this month/year
    const { data: taxHistoryData } = await supabase
      .from('monthly_tax_history')
      .select('*')
      .eq('owner_business_code', businessCode)
      .eq('month', selectedMonth)
      .eq('year', selectedYear);

    console.log('Tax history for current month/year:', taxHistoryData);

    const vendorsWithProfit = await Promise.all(
      vendorsData.map(async (vendor) => {
        try {
          console.log('Loading profit for vendor:', {
            businessCode,
            branchName: vendor.branch_name,
            vendorCode: vendor.vendor_business_code,
            month: selectedMonth,
            year: selectedYear
          });
          
          const profitData = await getVendorMonthlyProfit({
            businessCode,
            branchName: vendor.branch_name,
            vendorCode: vendor.vendor_business_code,
            month: selectedMonth,
            year: selectedYear
          });

          // Find tax status from history for the current month/year
          const taxRecord = taxHistoryData?.find(record => 
            record.vendor_business_code === vendor.vendor_business_code &&
            record.branch_name === vendor.branch_name
          );

          console.log('Found tax record for vendor:', {
            vendorCode: vendor.vendor_business_code,
            taxRecord,
            month: selectedMonth,
            year: selectedYear
          });

          // Calculate monthly tax using the actual percentage from business settings
          const taxPercentage = Number(businessSettings?.extra_tax_monthly_on_vendors || 0);
          const monthlyTax = (profitData.totalAmount * taxPercentage) / 100;

          return { 
            ...vendor, 
            monthlyProfit: profitData.totalAmount,
            monthlyTax,
            taxStatus: taxRecord?.payment_status || 'pending'
          };
        } catch (error) {
          console.error('Error fetching vendor profit:', error);
          return { 
            ...vendor, 
            monthlyProfit: 0,
            monthlyTax: 0,
            taxStatus: 'pending'
          };
        }
      })
    );
    return vendorsWithProfit;
  };

  const formatDate = (date: string) => {
    return format(new Date(date), 'PPP', {
      locale: language === 'ar' ? ar : enUS
    });
  };

  const formatCurrency = (amount: number) => {
    // Always use en-US locale for numbers, but customize the currency display
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'OMR',
      minimumFractionDigits: 3,
      maximumFractionDigits: 3
    }).format(amount);
    
    // For Arabic, just change the currency symbol position
    if (language === 'ar') {
      return formatted.replace('OMR', '').trim() + ' OMR';
    }
    return formatted;
  };

  // Calculate quick stats
  const quickStats = useMemo(() => {
    return vendors.reduce((stats, vendor) => {
      if (!vendor.monthlyProfit || !vendor.monthlyTax) return stats;
      
      return {
        totalProfit: stats.totalProfit + vendor.monthlyProfit,
        totalTax: stats.totalTax + vendor.monthlyTax,
        paidTax: stats.paidTax + (vendor.taxStatus === 'paid' ? vendor.monthlyTax : 0),
        pendingTax: stats.pendingTax + (vendor.taxStatus === 'pending' ? vendor.monthlyTax : 0),
        vendorCount: stats.vendorCount + 1,
        paidCount: stats.paidCount + (vendor.taxStatus === 'paid' ? 1 : 0)
      };
    }, {
      totalProfit: 0,
      totalTax: 0,
      paidTax: 0,
      pendingTax: 0,
      vendorCount: 0,
      paidCount: 0
    });
  }, [vendors]);

  // Extract unique branches and businesses from vendors
  const { uniqueBranches, uniqueBusinesses } = useMemo(() => {
    const branches = new Set<string>();
    const businesses = new Set<string>();

    vendors.forEach(vendor => {
      if (vendor.branch_name) {
        branches.add(vendor.branch_name);
      }
      const businessName = vendor.profile?.vendor_business_name || vendor.vendor_email_identifier;
      if (businessName) {
        businesses.add(businessName);
      }
    });

    return {
      uniqueBranches: Array.from(branches).sort(),
      uniqueBusinesses: Array.from(businesses).sort()
    };
  }, [vendors]);

  const filteredVendors = useMemo(() => {
    return vendors.filter(vendor => {
      const matchesBranch = !selectedBranch || vendor.branch_name === selectedBranch;
      const businessName = vendor.profile?.vendor_business_name || vendor.vendor_email_identifier;
      const matchesBusiness = !selectedBusiness || businessName === selectedBusiness;
      return matchesBranch && matchesBusiness;
    });
  }, [vendors, selectedBranch, selectedBusiness]);

  const handlePayTax = async (vendor: VendorWithProfit) => {
    console.log('Initiating tax payment for vendor:', {
      vendor_code: vendor.vendor_business_code,
      branch: vendor.branch_name,
      monthlyTax: vendor.monthlyTax,
      currentStatus: vendor.taxStatus
    });
    setSelectedVendor(vendor);
    setIsPaymentModalOpen(true);
  };

  const handleConfirmPayment = async () => {
    if (!selectedVendor || !businessCode) {
      console.error('Missing required data:', {
        hasSelectedVendor: !!selectedVendor,
        businessCode
      });
      return;
    }

    const branchName = selectedVendor.branch_name;

    console.log('Confirming tax payment with data:', {
      owner_business_code: businessCode,
      branch_name: branchName,
      vendor_business_code: selectedVendor.vendor_business_code,
      tax_amount: selectedVendor.monthlyTax,
      month: selectedMonth,
      year: selectedYear,
      payment_status: 'paid',
      payment_method: selectedPaymentMethod
    });

    try {
      // Record in monthly_tax_history
      const { data: taxHistoryData, error: taxHistoryError } = await supabase
        .from('monthly_tax_history')
        .insert({
          owner_business_code: businessCode,
          branch_name: branchName,
          vendor_business_code: selectedVendor.vendor_business_code,
          vendor_business_name: selectedVendor.profile?.vendor_business_name || selectedVendor.vendor_email_identifier,
          tax_amount: selectedVendor.monthlyTax,
          payment_status: 'paid',
          month: selectedMonth,
          year: selectedYear,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (taxHistoryError) {
        console.error('Error inserting tax payment:', taxHistoryError);
        throw taxHistoryError;
      }

      // Record in transactions_overall and vendor_transactions
      await recordMonthlyTaxTransaction({
        businessCode,
        branchName,
        vendorCode: selectedVendor.vendor_business_code,
        vendorName: selectedVendor.profile?.vendor_business_name || selectedVendor.vendor_email_identifier,
        amount: selectedVendor.monthlyTax || 0,
        month: selectedMonth,
        year: selectedYear,
        paymentMethod: selectedPaymentMethod
      });

      console.log('Successfully recorded tax payment:', taxHistoryData);
      
      // Close the modal
      setIsPaymentModalOpen(false);
      
      // Refresh data
      const data = await getVendorAssignments(businessCode);
      const vendorsWithProfit = await loadVendorProfits(data);
      setVendors(vendorsWithProfit);
      
      // Refresh tax history
      await loadTaxHistory();
      
    } catch (error) {
      console.error('Error processing payment:', error);
      // Handle error (show toast notification, etc.)
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">{t.loading}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-red-700">{error}</p>
        </div>
    </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">{t.monthlyVendorTaxes}</h1>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Monthly Profit */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">{t.totalMonthlyProfit}</p>
              <h3 className="text-2xl font-bold text-gray-900">
                {formatCurrency(quickStats.totalProfit)} {t.currency}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {quickStats.vendorCount} {t.vendors}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Paid Taxes */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">{t.totalPaidTaxes}</p>
              <h3 className="text-2xl font-bold text-gray-900">
                {formatCurrency(quickStats.paidTax)} {t.currency}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {quickStats.paidCount} {t.paidVendorsCount}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Pending Taxes */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">{t.totalPendingTaxes}</p>
              <h3 className="text-2xl font-bold text-gray-900">
                {formatCurrency(quickStats.pendingTax)} {t.currency}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {quickStats.vendorCount - quickStats.paidCount} {t.pendingVendorsCount}
              </p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Date Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Month Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t.selectMonth}
          </label>
          <div className="relative">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              {Object.entries(t.months).map(([month, name]) => (
                <option key={month} value={month}>
                  {name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Year Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t.selectYear}
          </label>
          <div className="relative">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Other Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Branch Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t.filterByBranch}
          </label>
          <div className="relative">
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">{t.allBranches}</option>
              {uniqueBranches.map((branch) => (
                <option key={branch} value={branch}>
                  {branch}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Business Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t.filterByBusiness}
          </label>
          <div className="relative">
            <select
              value={selectedBusiness}
              onChange={(e) => setSelectedBusiness(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">{t.allBusinesses}</option>
              {uniqueBusinesses.map((business) => (
                <option key={business} value={business}>
                  {business}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {filteredVendors.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-center">{t.noVendorsFound}</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className={`px-6 py-3 ${language === 'ar' ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                    {language === 'ar' ? 'اسم المتجر' : 'Business Name'}
                  </th>
                  <th scope="col" className={`px-6 py-3 ${language === 'ar' ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                    {t.branchName}
                  </th>
                  <th scope="col" className={`px-6 py-3 ${language === 'ar' ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                    {t.assignmentDate}
                  </th>
                  <th scope="col" className={`px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                    {t.monthlyProfit} (OMR)
                  </th>
                  <th scope="col" className={`px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                    {t.monthlyTax} ({businessSettings?.extra_tax_monthly_on_vendors || 0}%)
                  </th>
                  <th scope="col" className={`px-6 py-3 ${language === 'ar' ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                    {t.paymentStatus}
                  </th>
                  <th scope="col" className={`px-6 py-3 ${language === 'ar' ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                    {/* Actions column header */}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredVendors.map((vendor) => (
                  <tr key={`${vendor.vendor_business_code}-${vendor.branch_name}-${vendor.assignment_id}`} className={language === 'ar' ? 'text-right' : 'text-left'}>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                      {vendor.profile?.vendor_business_name || vendor.vendor_email_identifier}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                      {vendor.branch_name}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                      {formatDate(vendor.date_of_assignment)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      {formatCurrency(vendor.monthlyProfit || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      {formatCurrency(vendor.monthlyTax || 0)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${vendor.taxStatus === 'paid' ? 'bg-green-100 text-green-800' : 
                          vendor.taxStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'}`}>
                        {vendor.taxStatus}
                      </span>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                      {vendor.taxStatus !== 'paid' && vendor.monthlyTax !== undefined && vendor.monthlyProfit > 0 && (
                        <button
                          onClick={() => handlePayTax(vendor)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          {t.payTax}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Tax History Section */}
      <div className="mt-8">
        <h2 className={`text-xl font-semibold mb-4 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
          {t.monthlyTaxHistory}
        </h2>
        
        <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className={`px-6 py-3 ${language === 'ar' ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                  {t.branchName}
                </th>
                <th scope="col" className={`px-6 py-3 ${language === 'ar' ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                  {language === 'ar' ? 'اسم المتجر' : 'Business Name'}
                </th>
                <th scope="col" className={`px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                  {t.paymentAmount} (OMR)
                </th>
                <th scope="col" className={`px-6 py-3 ${language === 'ar' ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                  {t.paymentStatus}
                </th>
                <th scope="col" className={`px-6 py-3 ${language === 'ar' ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                  {t.date}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {taxHistory.map((item) => (
                <tr key={`${item.vendor_business_code}-${item.branch_name}-${item.id}`}>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                    {item.branch_name}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                    {item.vendor_business_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    {formatCurrency(item.tax_amount)}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${item.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 
                        item.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'}`}>
                      {item.payment_status}
                    </span>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                    {format(new Date(item.created_at), 'PPP', { locale: language === 'ar' ? ar : enUS })}
                  </td>
                </tr>
              ))}
              {taxHistory.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                    {t.noRecordsFound}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Payment Method Modal */}
      {isPaymentModalOpen && selectedVendor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {t.selectPaymentMethod}
              </h2>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex flex-col gap-3">
                <label className="block text-sm font-medium text-gray-700">
                  {t.paymentMethod}
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    className={`px-4 py-2 rounded-lg border ${
                      selectedPaymentMethod === 'cash'
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'border-gray-300 hover:border-blue-500'
                    }`}
                    onClick={() => setSelectedPaymentMethod('cash')}
                  >
                    {t.cash}
                  </button>
                  <button
                    className={`px-4 py-2 rounded-lg border ${
                      selectedPaymentMethod === 'card'
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'border-gray-300 hover:border-blue-500'
                    }`}
                    onClick={() => setSelectedPaymentMethod('card')}
                  >
                    {t.card}
                  </button>
                  <button
                    className={`px-4 py-2 rounded-lg border ${
                      selectedPaymentMethod === 'online'
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'border-gray-300 hover:border-blue-500'
                    }`}
                    onClick={() => setSelectedPaymentMethod('online')}
                  >
                    {t.online}
                  </button>
                </div>
              </div>

              <div className="mt-6">
                <div className="mb-4">
                  <span className="font-medium">{t.amount}:</span>{' '}
                  <span className="text-lg">
                    {formatCurrency(selectedVendor.monthlyTax || 0)}
                  </span>
                </div>
                <button
                  onClick={handleConfirmPayment}
                  className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  {t.confirmPayment}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default MonthlyVendorTaxesPage;
