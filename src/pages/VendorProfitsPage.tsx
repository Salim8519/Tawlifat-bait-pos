import React, { useEffect, useState, useMemo } from 'react';
import { useLanguageStore } from '../store/useLanguageStore';
import { useAuthStore } from '../store/useAuthStore';
import { getVendorAssignments, getVendorProfits, getVendorTransactions } from '../services/vendorService';
import type { VendorAssignment } from '../types/vendor';
import { DataTable } from '../components/common/DataTable';
import { DateSelector } from '../components/common/DateSelector';
import { FilterSelect } from '../components/common/FilterSelect';
import { TransactionHistoryModal } from '../components/common/TransactionHistoryModal';
import { VendorPaymentModal } from '../components/common/VendorPaymentModal';
import { History, Loader2 as LoaderIcon, DollarSign } from 'lucide-react';

interface VendorWithProfits extends VendorAssignment {
  vendorProfit?: number;
  ownerProfit?: number;
}

interface VendorTransaction {
  transaction_id: string;
  transaction_date: string;
  transaction_type: string;
  amount: number;
  product_name?: string;
  notes?: string;
  product_quantity?: number;
  unit_price?: number;
  total_price?: number;
}

export function VendorProfitsPage() {
  const { language } = useLanguageStore();
  const { user } = useAuthStore();
  const [vendors, setVendors] = useState<VendorWithProfits[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<VendorTransaction[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedVendorForHistory, setSelectedVendorForHistory] = useState<{
    name: string;
    branch: string;
    code: string;
  } | null>(null);
  const [selectedVendorForPayment, setSelectedVendorForPayment] = useState<{
    name: string;
    branch: string;
    code: string;
  } | null>(null);

  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedVendorName, setSelectedVendorName] = useState('');

  useEffect(() => {
    if (user?.businessCode) {
      loadVendors();
    }
  }, [user?.businessCode, selectedMonth, selectedYear]);

  const loadVendors = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const assignments = await getVendorAssignments(user!.businessCode);

      const vendorsWithProfits = await Promise.all(
        assignments.map(async (vendor) => {
          const profits = await getVendorProfits(
            user!.businessCode,
            vendor.vendor_business_code,
            vendor.branch_name,
            selectedMonth,
            selectedYear
          );
          return {
            ...vendor,
            vendorProfit: profits.vendorProfit,
            ownerProfit: profits.ownerProfit
          };
        })
      );

      setVendors(vendorsWithProfits);
    } catch (err) {
      console.error('Error loading vendors:', err);
      setError(language === 'ar' ? 'حدث خطأ أثناء تحميل البيانات' : 'Error loading vendor data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewHistory = async (vendor: VendorWithProfits) => {
    try {
      const data = await getVendorTransactions(
        user!.businessCode,
        vendor.vendor_business_code,
        vendor.branch_name
      );
      setTransactions(data);
      setSelectedVendorForHistory({
        name: vendor.profile?.vendor_business_name || '',
        branch: vendor.branch_name,
        code: vendor.vendor_business_code
      });
      setIsModalOpen(true);
    } catch (err) {
      console.error('Error loading transactions:', err);
    }
  };

  const branches = useMemo(() =>
    [...new Set(vendors.map(v => v.branch_name))].sort(),
    [vendors]
  );

  const vendorNames = useMemo(() =>
    [...new Set(vendors.map(v => v.profile?.vendor_business_name || ''))].filter(Boolean).sort(),
    [vendors]
  );

  const filteredVendors = useMemo(() =>
    vendors.filter(vendor => {
      const matchesBranch = !selectedBranch || vendor.branch_name === selectedBranch;
      const matchesVendor = !selectedVendorName || vendor.profile?.vendor_business_name === selectedVendorName;
      return matchesBranch && matchesVendor;
    }),
    [vendors, selectedBranch, selectedVendorName]
  );

  const columns = [
    {
      header: language === 'ar' ? 'اسم المورد' : 'Business Name',
      accessor: (row: VendorWithProfits) => row.profile?.vendor_business_name || 'N/A'
    },
    {
      header: language === 'ar' ? 'الفرع' : 'Branch',
      accessor: 'branch_name'
    },
    {
      header: language === 'ar' ? 'أرباح المورد' : 'Vendor Profit',
      accessor: (row: VendorWithProfits) =>
        typeof row.vendorProfit === 'number'
          ? `${row.vendorProfit.toFixed(3)} OMR`
          : 'N/A'
    },
    {
      header: language === 'ar' ? 'أرباح المالك' : 'Owner Profit',
      accessor: (row: VendorWithProfits) =>
        typeof row.ownerProfit === 'number'
          ? `${row.ownerProfit.toFixed(3)} OMR`
          : 'N/A'
    },
    {
      header: language === 'ar' ? 'الإجراءات' : 'Actions',
      accessor: (row: VendorWithProfits) => (
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => handleViewHistory(row)}
            className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title={language === 'ar' ? 'عرض السجل' : 'View History'}
          >
            {language === 'ar' ? 'السجل' : 'History'}
          </button>
          <button
            onClick={() => {
              setSelectedVendorForPayment({
                name: row.profile?.vendor_business_name || '',
                branch: row.branch_name,
                code: row.vendor_business_code
              });
              setIsPaymentModalOpen(true);
            }}
            className="px-3 py-1.5 text-sm font-medium text-green-600 hover:bg-green-50 rounded transition-colors"
            title={language === 'ar' ? 'إدارة الدفعات' : 'Payment Management'}
          >
            {language === 'ar' ? 'الدفعات' : 'Payments'}
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="p-4">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold">
            {language === 'ar' ? 'أرباح الموردين' : 'Vendor Profits'}
          </h1>
          <DateSelector
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            onMonthChange={setSelectedMonth}
            onYearChange={setSelectedYear}
          />
        </div>

        <div className="flex gap-4 items-end">
          <FilterSelect
            value={selectedBranch}
            onChange={setSelectedBranch}
            options={branches}
            label={language === 'ar' ? 'الفرع' : 'Branch'}
            placeholder={language === 'ar' ? 'جميع الفروع' : 'All Branches'}
          />
          <FilterSelect
            value={selectedVendorName}
            onChange={setSelectedVendorName}
            options={vendorNames}
            label={language === 'ar' ? 'المورد' : 'Vendor'}
            placeholder={language === 'ar' ? 'جميع الموردين' : 'All Vendors'}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <LoaderIcon className="w-8 h-8 animate-spin" />
        </div>
      ) : error ? (
        <div className="text-red-500 text-center py-4">
          {error}
        </div>
      ) : filteredVendors.length === 0 ? (
        <div className="text-gray-500 text-center py-4">
          {language === 'ar' ? 'لا يوجد موردين' : 'No vendors found'}
        </div>
      ) : (
        <DataTable
          data={filteredVendors}
          columns={columns}
          className="w-full"
        />
      )}

      {selectedVendorForHistory && (
        <TransactionHistoryModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedVendorForHistory(null);
          }}
          transactions={transactions}
          vendorName={selectedVendorForHistory.name}
          branchName={selectedVendorForHistory.branch}
        />
      )}

      {selectedVendorForPayment && (
        <VendorPaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setSelectedVendorForPayment(null);
            loadVendors(); // Refresh the data after payment
          }}
          vendorName={selectedVendorForPayment.name}
          vendorCode={selectedVendorForPayment.code}
          branchName={selectedVendorForPayment.branch}
          ownerBusinessCode={user!.businessCode}
          ownerBusinessName={user!.businessName || ''}
        />
      )}
    </div>
  );
}