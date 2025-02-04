import { supabase } from '../lib/supabase';
import type { Transaction, TransactionFilter } from '../types/transaction';

/**
 * Create a new transaction record
 */
export async function createTransaction(transaction: Omit<Transaction, 'transaction_id'>): Promise<Transaction> {
  const { data, error } = await supabase
    .from('transactions_overall')
    .insert([{
      ...transaction,
      details: JSON.stringify(transaction.details),
      transaction_date: transaction.transaction_date || new Date().toISOString()
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating transaction:', error);
    throw error;
  }

  return {
    ...data,
    details: JSON.parse(data.details)
  };
}

/**
 * Get transactions with optional filtering
 */
export async function getTransactions(filter?: TransactionFilter): Promise<Transaction[]> {
  let query = supabase
    .from('transactions_overall')
    .select('*');

  // Apply filters
  if (filter) {
    if (filter.businessCode) {
      query = query.eq('business_code', filter.businessCode);
    }
    if (filter.vendorCode) {
      query = query.eq('vendor_code', filter.vendorCode);
    }
    if (filter.branchName) {
      query = query.eq('branch_name', filter.branchName);
    }
    if (filter.transactionType) {
      query = query.eq('transaction_type', filter.transactionType);
    }
    if (filter.paymentMethod) {
      query = query.eq('payment_method', filter.paymentMethod);
    }
    if (filter.startDate) {
      query = query.gte('transaction_date', filter.startDate);
    }
    if (filter.endDate) {
      query = query.lte('transaction_date', filter.endDate);
    }
    if (filter.minAmount) {
      query = query.gte('amount', filter.minAmount);
    }
    if (filter.maxAmount) {
      query = query.lte('amount', filter.maxAmount);
    }
  }

  const { data, error } = await query.order('transaction_date', { ascending: false });

  if (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }

  // Parse JSON details for each transaction
  return data.map(transaction => ({
    ...transaction,
    details: JSON.parse(transaction.details)
  }));
}

/**
 * Get transaction statistics
 */
export async function getTransactionStats(businessCode: string, startDate?: string, endDate?: string) {
  let query = supabase
    .from('transactions_overall')
    .select('*')
    .eq('business_code', businessCode);

  if (startDate) {
    query = query.gte('transaction_date', startDate);
  }
  if (endDate) {
    query = query.lte('transaction_date', endDate);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching transaction stats:', error);
    throw error;
  }

  // Calculate statistics
  const stats = {
    totalTransactions: data.length,
    totalAmount: data.reduce((sum, t) => sum + t.amount, 0),
    byType: {} as Record<string, { count: number; amount: number }>,
    byPaymentMethod: {} as Record<string, { count: number; amount: number }>,
  };

  // Group by transaction type
  data.forEach(transaction => {
    // By type
    if (!stats.byType[transaction.transaction_type]) {
      stats.byType[transaction.transaction_type] = { count: 0, amount: 0 };
    }
    stats.byType[transaction.transaction_type].count++;
    stats.byType[transaction.transaction_type].amount += transaction.amount;

    // By payment method
    if (!stats.byPaymentMethod[transaction.payment_method]) {
      stats.byPaymentMethod[transaction.payment_method] = { count: 0, amount: 0 };
    }
    stats.byPaymentMethod[transaction.payment_method].count++;
    stats.byPaymentMethod[transaction.payment_method].amount += transaction.amount;
  });

  return stats;
}

/**
 * Get vendor transactions and statistics
 */
export async function getVendorTransactions(vendorCode: string, filter?: TransactionFilter) {
  const transactions = await getTransactions({
    ...filter,
    vendorCode
  });

  // Calculate vendor-specific statistics
  const stats = {
    totalSales: 0,
    totalReturns: 0,
    totalRefunds: 0,
    netAmount: 0
  };

  transactions.forEach(transaction => {
    switch (transaction.transaction_type) {
      case 'sale':
        stats.totalSales += transaction.amount;
        stats.netAmount += transaction.amount;
        break;
      case 'return':
        stats.totalReturns += Math.abs(transaction.amount);
        stats.netAmount -= Math.abs(transaction.amount);
        break;
      case 'refund':
        stats.totalRefunds += Math.abs(transaction.amount);
        stats.netAmount -= Math.abs(transaction.amount);
        break;
    }
  });

  return {
    transactions,
    stats
  };
}

/**
 * Get daily transaction totals for a date range
 */
export async function getDailyTransactions(
  businessCode: string,
  startDate: string,
  endDate: string
): Promise<Array<{ date: string; total: number; count: number }>> {
  const { data, error } = await supabase
    .from('transactions_overall')
    .select('transaction_date, amount')
    .eq('business_code', businessCode)
    .gte('transaction_date', startDate)
    .lte('transaction_date', endDate);

  if (error) {
    console.error('Error fetching daily transactions:', error);
    throw error;
  }

  // Group by date and calculate totals
  const dailyTotals = data.reduce((acc, transaction) => {
    const date = transaction.transaction_date.split('T')[0];
    if (!acc[date]) {
      acc[date] = { total: 0, count: 0 };
    }
    acc[date].total += transaction.amount;
    acc[date].count++;
    return acc;
  }, {} as Record<string, { total: number; count: number }>);

  // Convert to array and sort by date
  return Object.entries(dailyTotals)
    .map(([date, { total, count }]) => ({ date, total, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}