import React, { useState, useEffect } from 'react';
import { Store, Building2, CreditCard, Receipt, Wallet } from 'lucide-react';
import { useLanguageStore } from '../../store/useLanguageStore';
import { vendorDashboardTranslations } from '../../translations/vendorDashboard';
import { StatsBox } from './StatsBox';
import { DateRangeType } from '../../services/vendorDashboardService';

interface TransactionStats {
  totalBusinesses: number;
  totalBranches: number;
  totalAmount: number;
  productSales: number;
  taxAmount: number;
  rentalAmount: number;
  expenseAmount: number;
}

interface Props {
  transactions: any[];
  dateRange: DateRangeType;
}

export function VendorTransactionStats({ transactions, dateRange }: Props) {
  const { language } = useLanguageStore();
  const t = vendorDashboardTranslations[language];
  const [stats, setStats] = useState<TransactionStats>({
    totalBusinesses: 0,
    totalBranches: 0,
    totalAmount: 0,
    productSales: 0,
    taxAmount: 0,
    rentalAmount: 0,
    expenseAmount: 0
  });

  useEffect(() => {
    const uniqueBusinesses = new Set();
    const uniqueBranches = new Set();
    let totalAmount = 0;
    let productSales = 0;
    let taxAmount = 0;
    let rentalAmount = 0;
    let expenseAmount = 0;

    transactions.forEach(transaction => {
      uniqueBusinesses.add(transaction.business_code);
      if (transaction.branch_name) {
        uniqueBranches.add(`${transaction.business_code}-${transaction.branch_name}`);
      }

      const amount = Number(transaction.amount) || 0;
      totalAmount += amount;

      switch (transaction.transaction_type) {
        case 'product_sale':
          productSales += amount;
          break;
        case 'tax':
          taxAmount += amount;
          break;
        case 'rental':
          rentalAmount += amount;
          break;
        case 'expense':
          expenseAmount += amount;
          break;
      }
    });

    setStats({
      totalBusinesses: uniqueBusinesses.size,
      totalBranches: uniqueBranches.size,
      totalAmount,
      productSales,
      taxAmount,
      rentalAmount,
      expenseAmount
    });
  }, [transactions]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatsBox
        title={t.totalBusinesses}
        value={stats.totalBusinesses}
        icon={Building2}
        iconColor="text-blue-600"
      />
      <StatsBox
        title={t.totalBranches}
        value={stats.totalBranches}
        icon={Store}
        iconColor="text-indigo-600"
      />
      <StatsBox
        title={t.totalAmount}
        value={`${stats.totalAmount.toFixed(3)} ${t.currency}`}
        icon={Wallet}
        iconColor="text-green-600"
      />
      <StatsBox
        title={t.productSales}
        value={`${stats.productSales.toFixed(3)} ${t.currency}`}
        icon={Receipt}
        iconColor="text-yellow-600"
      />
    </div>
  );
}
