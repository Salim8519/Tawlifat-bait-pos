import { useReportData } from '../../../hooks/useReportData';
import { supabase } from '../../../lib/supabase';
import type { Transaction, TransactionSummary, TransactionFilters, TransactionStats } from './types';
import { startOfDay, endOfDay, parseISO } from 'date-fns';

interface UseTransactionReportProps {
  businessCode: string;
  branchName: string;
  startDate: string;
  endDate: string;
  filters?: TransactionFilters;
}

export function useTransactionReport({
  businessCode,
  branchName,
  startDate,
  endDate,
  filters = {}
}: UseTransactionReportProps) {
  return useReportData({
    fetchData: async () => {
      // Parse dates and set proper time boundaries
      const start = startOfDay(parseISO(startDate));
      const end = endOfDay(parseISO(endDate));

      console.log('Fetching transactions for date range:', {
        start: start.toISOString(),
        end: end.toISOString(),
        businessCode,
        branchName
      });

      let query = supabase
        .from('transactions_overall')
        .select('*')
        .eq('business_code', businessCode)
        .gte('transaction_date', start.toISOString())
        .lte('transaction_date', end.toISOString());

      // Add branch filtering if specific branch selected
      if (branchName !== 'all') {
        query = query.eq('branch_name', branchName);
      }

      // Apply filters
      if (filters.paymentMethod) {
        query = query.eq('payment_method', filters.paymentMethod);
      }
      if (filters.transactionType) {
        query = query.eq('transaction_type', filters.transactionType);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.vendorCode) {
        query = query.eq('vendor_code', filters.vendorCode);
      }
      if (filters.minAmount) {
        query = query.gte('amount', filters.minAmount);
      }
      if (filters.maxAmount) {
        query = query.lte('amount', filters.maxAmount);
      }
      if (filters.searchTerm) {
        query = query.or(`customer_name.ilike.%${filters.searchTerm}%,customer_phone.ilike.%${filters.searchTerm}%`);
      }

      // Apply sorting
      const sortBy = filters.sortBy || 'transaction_date';
      const sortOrder = filters.sortOrder || 'desc';
      query = query.order(sortBy === 'date' ? 'transaction_date' : sortBy, { ascending: sortOrder === 'asc' });

      // Limit initial fetch to maximum 1000 records for performance
      query = query.limit(1000);

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching transactions:', error);
        throw error;
      }

      console.log('Fetched transactions:', data?.length || 0);

      const transactions = data as Transaction[];
      
      // Initialize summary object
      const summary: TransactionSummary = {
        totalTransactions: 0,
        totalAmount: 0,
        totalProfit: 0,
        ownerTransactions: { count: 0, amount: 0, profit: 0 },
        vendorTransactions: { count: 0, amount: 0, profit: 0 },
        byPaymentMethod: {},
        byTransactionType: {},
        byStatus: {},
        byBranch: {},
        byVendor: {},
        recentTransactions: transactions // Show all transactions for the period
      };

      // Helper function to update stats
      const updateStats = (stats: TransactionStats, transaction: Transaction) => {
        stats.count++;
        stats.amount += Number(transaction.amount) || 0;
        stats.profit += Number(transaction.owner_profit_from_this_transcation) || 0;
      };

      // Process transactions
      transactions.forEach(transaction => {
        // Update total counts
        summary.totalTransactions++;
        summary.totalAmount += Number(transaction.amount) || 0;
        summary.totalProfit += Number(transaction.owner_profit_from_this_transcation) || 0;

        // Update owner/vendor splits
        if (transaction.vendor_code) {
          updateStats(summary.vendorTransactions, transaction);
        } else {
          updateStats(summary.ownerTransactions, transaction);
        }

        // Update payment method stats
        if (!summary.byPaymentMethod[transaction.payment_method]) {
          summary.byPaymentMethod[transaction.payment_method] = { count: 0, amount: 0, profit: 0 };
        }
        updateStats(summary.byPaymentMethod[transaction.payment_method], transaction);

        // Update transaction type stats
        if (!summary.byTransactionType[transaction.transaction_type]) {
          summary.byTransactionType[transaction.transaction_type] = { count: 0, amount: 0, profit: 0 };
        }
        updateStats(summary.byTransactionType[transaction.transaction_type], transaction);

        // Update status stats
        if (!summary.byStatus[transaction.status]) {
          summary.byStatus[transaction.status] = { count: 0, amount: 0, profit: 0 };
        }
        updateStats(summary.byStatus[transaction.status], transaction);

        // Update branch stats
        if (!summary.byBranch[transaction.branch_name]) {
          summary.byBranch[transaction.branch_name] = { count: 0, amount: 0, profit: 0 };
        }
        updateStats(summary.byBranch[transaction.branch_name], transaction);

        // Update vendor stats
        if (transaction.vendor_code) {
          if (!summary.byVendor[transaction.vendor_code]) {
            summary.byVendor[transaction.vendor_code] = { count: 0, amount: 0, profit: 0 };
          }
          updateStats(summary.byVendor[transaction.vendor_code], transaction);
        }
      });

      console.log('Processed summary:', summary);
      return summary;
    },
    dependencies: [businessCode, branchName, startDate, endDate, JSON.stringify(filters)]
  });
}
