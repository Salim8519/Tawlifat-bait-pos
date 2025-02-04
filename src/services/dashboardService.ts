import { supabase } from '../lib/supabase';

export interface Branch {
  branch_id: string;
  branch_name: string;
  business_code: string;
  is_active: boolean;
}

export interface TransactionOverall {
  transaction_id: string;
  transaction_reason: string | null;
  vendor_name: string | null;
  business_name: string;
  details: any | null;
  transaction_date: string;
  amount: number;
  currency: string;
  business_code: string;
  payment_method: string;
  transaction_type: string;
  branch_name: string;
  vendor_code: string | null;
}

export interface BranchInsights {
  branch: Branch;
  totalTransactions: number;
  totalAmount: number;
  cashTransactions: number;
  cardTransactions: number;
  onlineTransactions: number;
  recentTransactions: TransactionOverall[];
}

export interface TransactionInsights {
  totalTransactions: number;
  totalAmount: number;
  averageAmount: number;
  transactionsByType: {
    [key: string]: {
      count: number;
      amount: number;
    };
  };
  transactionsByPaymentMethod: {
    [key: string]: {
      count: number;
      amount: number;
    };
  };
  dailyTransactions: {
    date: string;
    count: number;
    amount: number;
  }[];
  topVendors: {
    vendor_name: string;
    total_transactions: number;
    total_amount: number;
  }[];
  hourlyDistribution: {
    hour: number;
    count: number;
    amount: number;
  }[];
  recentTransactions: any[];
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

export async function getBranchInsights(
  businessCode: string,
  branchName: string,
  startDate?: string,
  endDate?: string
): Promise<BranchInsights | null> {
  console.log('Getting branch insights:', {
    businessCode,
    branchName,
    startDate,
    endDate
  });

  try {
    // Get branch details
    console.log('Fetching active branch details...');
    const { data: branch, error: branchError } = await supabase
      .from('branches')
      .select('*')
      .eq('business_code', businessCode)
      .eq('branch_name', branchName)
      .eq('is_active', true)
      .single();

    if (branchError) {
      console.error('Error fetching branch:', branchError);
      throw branchError;
    }

    if (!branch) {
      console.log('Active branch not found');
      return null;
    }

    console.log('Found active branch:', branch);

    // Build the base query
    console.log('Fetching transactions...');
    let query = supabase
      .from('transactions_overall')
      .select('*')
      .eq('business_code', businessCode)
      .eq('branch_name', branchName);

    // Add date filters if provided
    if (startDate) {
      query = query.gte('transaction_date', startDate);
    }
    if (endDate) {
      query = query.lte('transaction_date', endDate);
    }

    // Get transactions
    const { data: transactions, error: transactionError } = await query
      .order('transaction_date', { ascending: false });

    if (transactionError) {
      console.error('Error fetching transactions:', transactionError);
      throw transactionError;
    }

    const transactionsList = transactions || [];
    console.log('Found transactions:', transactionsList.length);

    // Calculate insights
    const insights: BranchInsights = {
      branch,
      totalTransactions: transactionsList.length,
      totalAmount: transactionsList.reduce((sum, t) => sum + Number(t.amount), 0),
      cashTransactions: transactionsList.filter(t => t.payment_method === 'cash').length,
      cardTransactions: transactionsList.filter(t => t.payment_method === 'card').length,
      onlineTransactions: transactionsList.filter(t => t.payment_method === 'online').length,
      recentTransactions: transactionsList.slice(0, 5) // Get 5 most recent transactions
    };

    console.log('Calculated insights:', insights);
    return insights;

  } catch (error) {
    console.error('Error getting branch insights:', error);
    throw error;
  }
}

export async function getCombinedBranchInsights(
  businessCode: string,
  startDate?: string,
  endDate?: string
): Promise<BranchInsights | null> {
  console.log('Getting combined branch insights:', {
    businessCode,
    startDate,
    endDate
  });

  try {
    // Get all active branches
    const { data: branches, error: branchError } = await supabase
      .from('branches')
      .select('*')
      .eq('business_code', businessCode)
      .eq('is_active', true);

    if (branchError) {
      console.error('Error fetching branches:', branchError);
      throw branchError;
    }

    if (!branches || branches.length === 0) {
      console.log('No active branches found');
      return null;
    }

    // Build the base query for all transactions
    console.log('Fetching transactions for all branches...');
    let query = supabase
      .from('transactions_overall')
      .select('*')
      .eq('business_code', businessCode);

    // Add date filters if provided
    if (startDate) {
      query = query.gte('transaction_date', startDate);
    }
    if (endDate) {
      query = query.lte('transaction_date', endDate);
    }

    // Get transactions
    const { data: transactions, error: transactionError } = await query
      .order('transaction_date', { ascending: false });

    if (transactionError) {
      console.error('Error fetching transactions:', transactionError);
      throw transactionError;
    }

    const transactionsList = transactions || [];
    console.log('Found transactions:', transactionsList.length);

    // Calculate combined insights
    const insights: BranchInsights = {
      branch: {
        branch_id: 'all',
        branch_name: 'All Branches',
        business_code: businessCode,
        is_active: true
      },
      totalTransactions: transactionsList.length,
      totalAmount: transactionsList.reduce((sum, t) => sum + Number(t.amount), 0),
      cashTransactions: transactionsList.filter(t => t.payment_method === 'cash').length,
      cardTransactions: transactionsList.filter(t => t.payment_method === 'card').length,
      onlineTransactions: transactionsList.filter(t => t.payment_method === 'online').length,
      recentTransactions: transactionsList.slice(0, 5) // Get 5 most recent transactions
    };

    console.log('Calculated combined insights:', insights);
    return insights;

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
      query = query.gte('transaction_date', startDate);
    }
    if (endDate) {
      query = query.lte('transaction_date', endDate);
    }

    const { data: transactions, error: transactionError } = await query;

    if (transactionError) {
      console.error('Error fetching transactions:', transactionError);
      throw transactionError;
    }

    const transactionsList = transactions || [];
    console.log('Found transactions:', transactionsList.length);

    const insights = {
      totalBranches: branches?.length || 0,
      totalTransactions: transactionsList.length,
      totalAmount: transactionsList.reduce((sum, t) => sum + Number(t.amount), 0),
      byPaymentMethod: {
        cash: transactionsList.filter(t => t.payment_method === 'cash').length,
        card: transactionsList.filter(t => t.payment_method === 'card').length,
        online: transactionsList.filter(t => t.payment_method === 'online').length,
      },
      byType: {
        sales: transactionsList.filter(t => t.transaction_type === 'sale').length,
        returns: transactionsList.filter(t => t.transaction_type === 'return').length,
        other: transactionsList.filter(t => !['sale', 'return'].includes(t.transaction_type)).length,
      }
    };

    console.log('Calculated overall insights:', insights);
    return insights;

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
): Promise<TransactionInsights> {
  console.log('Getting detailed transaction insights:', {
    businessCode,
    branchName,
    startDate,
    endDate
  });

  try {
    // Build the base query
    let query = supabase
      .from('transactions_overall')
      .select('*')
      .eq('business_code', businessCode);

    // Add branch filter if specified
    if (branchName) {
      query = query.eq('branch_name', branchName);
    }

    // Add date filters if provided
    if (startDate) {
      query = query.gte('transaction_date', startDate);
    }
    if (endDate) {
      query = query.lte('transaction_date', endDate);
    }

    const { data: transactions, error } = await query;

    if (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }

    const transactionsList = transactions || [];

    // Helper function to group transactions by a key
    const groupBy = (key: string) => {
      return transactionsList.reduce((acc, transaction) => {
        const value = transaction[key];
        if (!acc[value]) {
          acc[value] = { count: 0, amount: 0 };
        }
        acc[value].count++;
        acc[value].amount += Number(transaction.amount);
        return acc;
      }, {} as { [key: string]: { count: number; amount: number } });
    };

    // Calculate daily transactions
    const dailyTransactions = transactionsList.reduce((acc, transaction) => {
      const date = transaction.transaction_date.split('T')[0];
      const existing = acc.find(d => d.date === date);
      if (existing) {
        existing.count++;
        existing.amount += Number(transaction.amount);
      } else {
        acc.push({
          date,
          count: 1,
          amount: Number(transaction.amount)
        });
      }
      return acc;
    }, [] as { date: string; count: number; amount: number }[])
    .sort((a, b) => a.date.localeCompare(b.date));

    // Calculate hourly distribution
    const hourlyDistribution = transactionsList.reduce((acc, transaction) => {
      const hour = new Date(transaction.transaction_date).getHours();
      const existing = acc.find(h => h.hour === hour);
      if (existing) {
        existing.count++;
        existing.amount += Number(transaction.amount);
      } else {
        acc.push({
          hour,
          count: 1,
          amount: Number(transaction.amount)
        });
      }
      return acc;
    }, [] as { hour: number; count: number; amount: number }[])
    .sort((a, b) => a.hour - b.hour);

    // Calculate top vendors
    const vendorStats = transactionsList
      .filter(t => t.vendor_name)
      .reduce((acc, transaction) => {
        const vendor = transaction.vendor_name;
        if (!acc[vendor]) {
          acc[vendor] = {
            vendor_name: vendor,
            total_transactions: 0,
            total_amount: 0
          };
        }
        acc[vendor].total_transactions++;
        acc[vendor].total_amount += Number(transaction.amount);
        return acc;
      }, {} as { [key: string]: { vendor_name: string; total_transactions: number; total_amount: number } });

    const topVendors = Object.values(vendorStats)
      .sort((a, b) => b.total_amount - a.total_amount)
      .slice(0, 5);

    const insights: TransactionInsights = {
      totalTransactions: transactionsList.length,
      totalAmount: transactionsList.reduce((sum, t) => sum + Number(t.amount), 0),
      averageAmount: transactionsList.length > 0
        ? transactionsList.reduce((sum, t) => sum + Number(t.amount), 0) / transactionsList.length
        : 0,
      transactionsByType: groupBy('transaction_type'),
      transactionsByPaymentMethod: groupBy('payment_method'),
      dailyTransactions,
      topVendors,
      hourlyDistribution,
      recentTransactions: transactionsList
        .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())
        .slice(0, 5)
    };

    console.log('Calculated detailed insights:', insights);
    return insights;
  } catch (error) {
    console.error('Error getting detailed transaction insights:', error);
    throw error;
  }
}
