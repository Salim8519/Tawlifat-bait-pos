import { supabase } from '../lib/supabase';

export interface Branch {
  branch_id: string;
  branch_name: string;
  business_code: string;
  is_active: boolean;
}

export type TransactionType = 
  | 'vendor_withdrawal' 
  | 'vendor_sale' 
  | 'vendor_deposit' 
  | 'sale' 
  | 'rental_income'
  | 'cash_addition'
  | 'cash_removal';

export type PaymentMethod = 
  | 'online'
  | 'card'
  | 'cash'
  | 'tax_deduction'
  | string;

export interface Transaction {
  transaction_id: string;
  business_code: string;
  business_name: string;
  branch_name: string;
  transaction_type: TransactionType;
  payment_method: PaymentMethod;
  amount: number;
  owner_profit_from_this_transcation: number | null;
  transaction_date: string;
  transaction_reason: string | null;
  vendor_name: string | null;
  vendor_code: string | null;
  currency: string;
  details: any | null;
}

export interface TransactionSummary {
  totalAmount: number;
  totalProfit: number;
  transactionCount: number;
  byPaymentMethod: {
    [key in PaymentMethod]?: {
      amount: number;
      count: number;
      profit: number;
    };
  };
  byTransactionType: {
    [key in TransactionType]?: {
      amount: number;
      count: number;
      profit: number;
    };
  };
  topVendors: {
    vendor_name: string;
    total_amount: number;
    total_profit: number;
    transaction_count: number;
  }[];
}

export async function getTransactionSummary(
  businessCode: string,
  startDate: string,
  endDate: string,
  branchName?: string
): Promise<TransactionSummary> {
  try {
    let query = supabase
      .from('transactions_overall')
      .select('*')
      .eq('business_code', businessCode)
      .gte('transaction_date', `${startDate}T00:00:00`)
      .lte('transaction_date', `${endDate}T23:59:59`);

    if (branchName && branchName !== 'all') {
      query = query.eq('branch_name', branchName);
    }

    const { data: transactions, error } = await query;

    if (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }

    const summary: TransactionSummary = {
      totalAmount: 0,
      totalProfit: 0,
      transactionCount: 0,
      byPaymentMethod: {
        cash: { amount: 0, count: 0, profit: 0 },
        card: { amount: 0, count: 0, profit: 0 },
        online: { amount: 0, count: 0, profit: 0 },
        tax_deduction: { amount: 0, count: 0, profit: 0 }
      },
      byTransactionType: {
        vendor_withdrawal: { amount: 0, count: 0, profit: 0 },
        vendor_sale: { amount: 0, count: 0, profit: 0 },
        vendor_deposit: { amount: 0, count: 0, profit: 0 },
        sale: { amount: 0, count: 0, profit: 0 },
        rental_income: { amount: 0, count: 0, profit: 0 },
        cash_addition: { amount: 0, count: 0, profit: 0 },
        cash_removal: { amount: 0, count: 0, profit: 0 }
      },
      topVendors: []
    };

    const vendorStats: { [key: string]: { 
      vendor_name: string;
      total_amount: number;
      total_profit: number;
      transaction_count: number;
    }} = {};

    (transactions || []).forEach((t: Transaction) => {
      // Convert string amounts to numbers and round to 2 decimal places
      const amount = Number(Number(t.amount).toFixed(2));
      const profit = Number(Number(t.owner_profit_from_this_transcation || amount).toFixed(2));
      
      // Update totals
      summary.totalAmount = Number((summary.totalAmount + amount).toFixed(2));
      summary.totalProfit = Number((summary.totalProfit + profit).toFixed(2));
      summary.transactionCount++;

      // Update payment method stats
      if (t.payment_method) {
        if (!summary.byPaymentMethod[t.payment_method]) {
          summary.byPaymentMethod[t.payment_method] = { amount: 0, count: 0, profit: 0 };
        }
        const method = summary.byPaymentMethod[t.payment_method]!;
        method.amount = Number((method.amount + amount).toFixed(2));
        method.count++;
        method.profit = Number((method.profit + profit).toFixed(2));
      }

      // Update transaction type stats
      if (t.transaction_type) {
        if (!summary.byTransactionType[t.transaction_type]) {
          summary.byTransactionType[t.transaction_type] = { amount: 0, count: 0, profit: 0 };
        }
        const type = summary.byTransactionType[t.transaction_type]!;
        type.amount = Number((type.amount + amount).toFixed(2));
        type.count++;
        type.profit = Number((type.profit + profit).toFixed(2));
      }

      // Update vendor stats - including business-owned products
      const isBusinessProduct = !t.vendor_name && t.transaction_type === 'sale';
      const vendorKey = isBusinessProduct ? 'BUSINESS_PRODUCTS' : t.vendor_name;
      
      if (vendorKey) {
        if (!vendorStats[vendorKey]) {
          vendorStats[vendorKey] = {
            vendor_name: vendorKey,
            total_amount: 0,
            total_profit: 0,
            transaction_count: 0
          };
        }
        vendorStats[vendorKey].total_amount = Number((vendorStats[vendorKey].total_amount + amount).toFixed(2));
        vendorStats[vendorKey].total_profit = Number((vendorStats[vendorKey].total_profit + profit).toFixed(2));
        vendorStats[vendorKey].transaction_count++;
      }
    });

    // Convert vendor stats to sorted array
    summary.topVendors = Object.values(vendorStats)
      .sort((a, b) => b.total_amount - a.total_amount)
      .slice(0, 5);

    console.log('Transaction Summary:', summary);
    return summary;
  } catch (error) {
    console.error('Error in getTransactionSummary:', error);
    throw error;
  }
}

export async function getBranchesWithInsights(businessCode: string): Promise<Branch[]> {
  console.log('Fetching active branches with insights for business:', businessCode);
  
  const { data: branches, error } = await supabase
    .from('branches')
    .select('*')
    .eq('business_code', businessCode)
    .eq('is_active', true)
    .order('branch_name', { ascending: true });

  if (error) {
    console.error('Error fetching branches:', error);
    throw error;
  }

  console.log('Found active branches:', branches?.length || 0);
  return branches || [];
}

export async function getActiveBranches(businessCode: string): Promise<Branch[]> {
  try {
    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .eq('business_code', businessCode)
      .eq('is_active', true)
      .order('branch_name', { ascending: true });

    if (error) {
      console.error('Error fetching branches:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getActiveBranches:', error);
    return [];
  }
}

export async function getBranchInsights(
  businessCode: string,
  branchName: string,
  startDate?: string,
  endDate?: string
): Promise<TransactionSummary | null> {
  console.log('Getting branch insights:', {
    businessCode,
    branchName,
    startDate,
    endDate
  });

  try {
    // Get branch details
    const { data: branch, error: branchError } = await supabase
      .from('branches')
      .select('*')
      .eq('business_code', businessCode)
      .eq('branch_name', branchName)
      .eq('is_active', true)
      .single();

    if (branchError || !branch) {
      console.error('Error or no branch found:', branchError);
      return null;
    }

    // Build the transactions query
    let query = supabase
      .from('transactions_overall')
      .select('*')
      .eq('business_code', businessCode)
      .eq('branch_name', branchName);

    if (startDate) {
      query = query.gte('transaction_date', `${startDate}T00:00:00`);
    }
    if (endDate) {
      query = query.lte('transaction_date', `${endDate}T23:59:59`);
    }

    // Get transactions
    const { data: transactions, error: transactionError } = await query
      .order('transaction_date', { ascending: false });

    if (transactionError) {
      console.error('Error fetching transactions:', transactionError);
      throw transactionError;
    }

    const transactionsList = transactions || [];
    console.log(`Found ${transactionsList.length} transactions for branch ${branchName}`);

    const summary: TransactionSummary = {
      totalAmount: 0,
      totalProfit: 0,
      transactionCount: 0,
      byPaymentMethod: {},
      byTransactionType: {},
      topVendors: []
    };

    const vendorStats: { [key: string]: { 
      vendor_name: string;
      total_amount: number;
      total_profit: number;
      transaction_count: number;
    }} = {};

    transactionsList.forEach((t: Transaction) => {
      const profit = t.owner_profit_from_this_transcation ?? t.amount;
      
      // Update totals
      summary.totalAmount += t.amount;
      summary.totalProfit += profit;
      summary.transactionCount++;

      // Update payment method stats
      if (!summary.byPaymentMethod[t.payment_method]) {
        summary.byPaymentMethod[t.payment_method] = { amount: 0, count: 0, profit: 0 };
      }
      summary.byPaymentMethod[t.payment_method]!.amount += t.amount;
      summary.byPaymentMethod[t.payment_method]!.count++;
      summary.byPaymentMethod[t.payment_method]!.profit += profit;

      // Update transaction type stats
      if (!summary.byTransactionType[t.transaction_type]) {
        summary.byTransactionType[t.transaction_type] = { amount: 0, count: 0, profit: 0 };
      }
      summary.byTransactionType[t.transaction_type]!.amount += t.amount;
      summary.byTransactionType[t.transaction_type]!.count++;
      summary.byTransactionType[t.transaction_type]!.profit += profit;

      // Update vendor stats - including business-owned products
      const isBusinessProduct = !t.vendor_name && t.transaction_type === 'sale';
      const vendorKey = isBusinessProduct ? 'BUSINESS_PRODUCTS' : t.vendor_name;
      
      if (vendorKey) {
        if (!vendorStats[vendorKey]) {
          vendorStats[vendorKey] = {
            vendor_name: vendorKey,
            total_amount: 0,
            total_profit: 0,
            transaction_count: 0
          };
        }
        vendorStats[vendorKey].total_amount += t.amount;
        vendorStats[vendorKey].total_profit += profit;
        vendorStats[vendorKey].transaction_count++;
      }
    });

    // Convert vendor stats to sorted array
    summary.topVendors = Object.values(vendorStats)
      .sort((a, b) => b.total_amount - a.total_amount)
      .slice(0, 5);

    return summary;
  } catch (error) {
    console.error('Error getting branch insights:', error);
    throw error;
  }
}

export async function getCombinedBranchInsights(
  businessCode: string,
  startDate?: string,
  endDate?: string,
  language: string = 'en'
): Promise<TransactionSummary | null> {
  console.log('Getting combined branch insights:', {
    businessCode,
    startDate,
    endDate,
    language
  });

  try {
    // Get all active branches for this business
    const { data: branches, error: branchError } = await supabase
      .from('branches')
      .select('*')
      .eq('business_code', businessCode)
      .eq('is_active', true);

    if (branchError || !branches || branches.length === 0) {
      console.error('Error or no branches found:', branchError);
      return null;
    }

    // Get branch names for the IN clause
    const branchNames = branches.map(b => b.branch_name);

    // Build the transactions query
    let query = supabase
      .from('transactions_overall')
      .select('*')
      .eq('business_code', businessCode)
      .in('branch_name', branchNames);

    if (startDate) {
      query = query.gte('transaction_date', `${startDate}T00:00:00`);
    }
    if (endDate) {
      query = query.lte('transaction_date', `${endDate}T23:59:59`);
    }

    // Get transactions
    const { data: transactions, error: transactionError } = await query
      .order('transaction_date', { ascending: false });

    if (transactionError) {
      console.error('Error fetching transactions:', transactionError);
      throw transactionError;
    }

    const transactionsList = transactions || [];
    console.log(`Found ${transactionsList.length} transactions across ${branchNames.length} branches`);

    const allBranchesText = language === 'ar' ? 'جميع الفروع' : 'All Branches';

    const summary: TransactionSummary = {
      totalAmount: 0,
      totalProfit: 0,
      transactionCount: 0,
      byPaymentMethod: {},
      byTransactionType: {},
      topVendors: []
    };

    const vendorStats: { [key: string]: { 
      vendor_name: string;
      total_amount: number;
      total_profit: number;
      transaction_count: number;
    }} = {};

    transactionsList.forEach((t: Transaction) => {
      const profit = t.owner_profit_from_this_transcation ?? t.amount;
      
      // Update totals
      summary.totalAmount += t.amount;
      summary.totalProfit += profit;
      summary.transactionCount++;

      // Update payment method stats
      if (!summary.byPaymentMethod[t.payment_method]) {
        summary.byPaymentMethod[t.payment_method] = { amount: 0, count: 0, profit: 0 };
      }
      summary.byPaymentMethod[t.payment_method]!.amount += t.amount;
      summary.byPaymentMethod[t.payment_method]!.count++;
      summary.byPaymentMethod[t.payment_method]!.profit += profit;

      // Update transaction type stats
      if (!summary.byTransactionType[t.transaction_type]) {
        summary.byTransactionType[t.transaction_type] = { amount: 0, count: 0, profit: 0 };
      }
      summary.byTransactionType[t.transaction_type]!.amount += t.amount;
      summary.byTransactionType[t.transaction_type]!.count++;
      summary.byTransactionType[t.transaction_type]!.profit += profit;

      // Update vendor stats - including business-owned products
      const isBusinessProduct = !t.vendor_name && t.transaction_type === 'sale';
      const vendorKey = isBusinessProduct ? 'BUSINESS_PRODUCTS' : t.vendor_name;
      
      if (vendorKey) {
        if (!vendorStats[vendorKey]) {
          vendorStats[vendorKey] = {
            vendor_name: vendorKey,
            total_amount: 0,
            total_profit: 0,
            transaction_count: 0
          };
        }
        vendorStats[vendorKey].total_amount += t.amount;
        vendorStats[vendorKey].total_profit += profit;
        vendorStats[vendorKey].transaction_count++;
      }
    });

    // Convert vendor stats to sorted array
    summary.topVendors = Object.values(vendorStats)
      .sort((a, b) => b.total_amount - a.total_amount)
      .slice(0, 5);

    return summary;
  } catch (error) {
    console.error('Error getting combined branch insights:', error);
    throw error;
  }
}

export async function getOverallBusinessInsights(
  businessCode: string,
  startDate?: string,
  endDate?: string
) {
  console.log('Getting overall business insights:', {
    businessCode,
    startDate,
    endDate
  });

  try {
    // First get active branches count
    console.log('Fetching active branches count...');
    const { data: branches, error: branchError } = await supabase
      .from('branches')
      .select('branch_id')
      .eq('business_code', businessCode)
      .eq('is_active', true);

    if (branchError) {
      console.error('Error fetching branches:', branchError);
      throw branchError;
    }

    console.log('Found active branches:', branches?.length || 0);

    console.log('Fetching transactions...');
    let query = supabase
      .from('transactions_overall')
      .select('*')
      .eq('business_code', businessCode);

    if (startDate) {
      query = query.gte('transaction_date', `${startDate}T00:00:00`);
    }
    if (endDate) {
      query = query.lte('transaction_date', `${endDate}T23:59:59`);
    }

    const { data: transactions, error: transactionError } = await query;

    if (transactionError) {
      console.error('Error fetching transactions:', transactionError);
      throw transactionError;
    }

    const transactionsList = transactions || [];
    console.log('Found transactions:', transactionsList.length);

    const summary: TransactionSummary = {
      totalAmount: 0,
      totalProfit: 0,
      transactionCount: 0,
      byPaymentMethod: {},
      byTransactionType: {},
      topVendors: []
    };

    const vendorStats: { [key: string]: { 
      vendor_name: string;
      total_amount: number;
      total_profit: number;
      transaction_count: number;
    }} = {};

    transactionsList.forEach((t: Transaction) => {
      const profit = t.owner_profit_from_this_transcation ?? t.amount;
      
      // Update totals
      summary.totalAmount += t.amount;
      summary.totalProfit += profit;
      summary.transactionCount++;

      // Update payment method stats
      if (!summary.byPaymentMethod[t.payment_method]) {
        summary.byPaymentMethod[t.payment_method] = { amount: 0, count: 0, profit: 0 };
      }
      summary.byPaymentMethod[t.payment_method]!.amount += t.amount;
      summary.byPaymentMethod[t.payment_method]!.count++;
      summary.byPaymentMethod[t.payment_method]!.profit += profit;

      // Update transaction type stats
      if (!summary.byTransactionType[t.transaction_type]) {
        summary.byTransactionType[t.transaction_type] = { amount: 0, count: 0, profit: 0 };
      }
      summary.byTransactionType[t.transaction_type]!.amount += t.amount;
      summary.byTransactionType[t.transaction_type]!.count++;
      summary.byTransactionType[t.transaction_type]!.profit += profit;

      // Update vendor stats - including business-owned products
      const isBusinessProduct = !t.vendor_name && t.transaction_type === 'sale';
      const vendorKey = isBusinessProduct ? 'BUSINESS_PRODUCTS' : t.vendor_name;
      
      if (vendorKey) {
        if (!vendorStats[vendorKey]) {
          vendorStats[vendorKey] = {
            vendor_name: vendorKey,
            total_amount: 0,
            total_profit: 0,
            transaction_count: 0
          };
        }
        vendorStats[vendorKey].total_amount += t.amount;
        vendorStats[vendorKey].total_profit += profit;
        vendorStats[vendorKey].transaction_count++;
      }
    });

    // Convert vendor stats to sorted array
    summary.topVendors = Object.values(vendorStats)
      .sort((a, b) => b.total_amount - a.total_amount)
      .slice(0, 5);

    console.log('Calculated overall insights:', summary);
    return summary;

  } catch (error) {
    console.error('Error getting overall business insights:', error);
    throw error;
  }
}

export async function getDetailedTransactionInsights(
  businessCode: string,
  branchName: string | null = null,
  startDate?: string,
  endDate?: string
): Promise<TransactionSummary> {
  console.log('Getting detailed transaction insights:', {
    businessCode,
    branchName,
    startDate,
    endDate
  });

  try {
    // First get active branches for this business
    const { data: branches } = await supabase
      .from('branches')
      .select('branch_name')
      .eq('business_code', businessCode)
      .eq('is_active', true);

    if (!branches || branches.length === 0) {
      throw new Error('No active branches found');
    }

    // Build the transactions query
    let query = supabase
      .from('transactions_overall')
      .select('*')
      .eq('business_code', businessCode);

    // If specific branch, filter by it, otherwise use all active branches
    if (branchName) {
      query = query.eq('branch_name', branchName);
    } else {
      query = query.in('branch_name', branches.map(b => b.branch_name));
    }

    if (startDate) {
      query = query.gte('transaction_date', `${startDate}T00:00:00`);
    }
    if (endDate) {
      query = query.lte('transaction_date', `${endDate}T23:59:59`);
    }

    const { data: transactions, error } = await query;

    if (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }

    const transactionsList = transactions || [];
    console.log(`Found ${transactionsList.length} transactions for analysis`);

    const summary: TransactionSummary = {
      totalAmount: 0,
      totalProfit: 0,
      transactionCount: 0,
      byPaymentMethod: {},
      byTransactionType: {},
      topVendors: []
    };

    const vendorStats: { [key: string]: { 
      vendor_name: string;
      total_amount: number;
      total_profit: number;
      transaction_count: number;
    }} = {};

    transactionsList.forEach((t: Transaction) => {
      const profit = t.owner_profit_from_this_transcation ?? t.amount;
      
      // Update totals
      summary.totalAmount += t.amount;
      summary.totalProfit += profit;
      summary.transactionCount++;

      // Update payment method stats
      if (!summary.byPaymentMethod[t.payment_method]) {
        summary.byPaymentMethod[t.payment_method] = { amount: 0, count: 0, profit: 0 };
      }
      summary.byPaymentMethod[t.payment_method]!.amount += t.amount;
      summary.byPaymentMethod[t.payment_method]!.count++;
      summary.byPaymentMethod[t.payment_method]!.profit += profit;

      // Update transaction type stats
      if (!summary.byTransactionType[t.transaction_type]) {
        summary.byTransactionType[t.transaction_type] = { amount: 0, count: 0, profit: 0 };
      }
      summary.byTransactionType[t.transaction_type]!.amount += t.amount;
      summary.byTransactionType[t.transaction_type]!.count++;
      summary.byTransactionType[t.transaction_type]!.profit += profit;

      // Update vendor stats - including business-owned products
      const isBusinessProduct = !t.vendor_name && t.transaction_type === 'sale';
      const vendorKey = isBusinessProduct ? 'BUSINESS_PRODUCTS' : t.vendor_name;
      
      if (vendorKey) {
        if (!vendorStats[vendorKey]) {
          vendorStats[vendorKey] = {
            vendor_name: vendorKey,
            total_amount: 0,
            total_profit: 0,
            transaction_count: 0
          };
        }
        vendorStats[vendorKey].total_amount += t.amount;
        vendorStats[vendorKey].total_profit += profit;
        vendorStats[vendorKey].transaction_count++;
      }
    });

    // Convert vendor stats to sorted array
    summary.topVendors = Object.values(vendorStats)
      .sort((a, b) => b.total_amount - a.total_amount)
      .slice(0, 5);

    console.log('Calculated detailed insights:', summary);
    return summary;
  } catch (error) {
    console.error('Error getting detailed transaction insights:', error);
    throw error;
  }
}
