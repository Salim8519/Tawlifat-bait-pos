import { supabase } from '../lib/supabase';

export interface CashTracking {
  tracking_id: string;
  business_code: string;
  business_branch_name: string;
  cashier_name: string | null;
  previous_total_cash: number;
  new_total_cash: number;
  cash_additions: number;
  cash_removals: number;
  cash_change_reason: string | null;
  total_returns: number;
  transaction_date: string;
  created_at: string;
}

export interface CreateCashTrackingData {
  business_code: string;
  business_branch_name: string;
  cashier_name?: string;
  previous_total_cash: number;
  new_total_cash: number;
  cash_additions?: number;
  cash_removals?: number;
  cash_change_reason?: string;
  total_returns?: number;
}

/**
 * Generate a unique tracking ID
 */
function generateTrackingId(): string {
  return `CSH${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
}

/**
 * Create a new cash tracking record
 */
export async function createCashTracking(data: CreateCashTrackingData): Promise<CashTracking> {
  const tracking_id = generateTrackingId();
  
  const trackingData = {
    tracking_id,
    business_code: data.business_code,
    business_branch_name: data.business_branch_name,
    cashier_name: data.cashier_name || null,
    previous_total_cash: data.previous_total_cash,
    new_total_cash: data.new_total_cash,
    cash_additions: data.cash_additions || 0,
    cash_removals: data.cash_removals || 0,
    cash_change_reason: data.cash_change_reason || null,
    total_returns: data.total_returns || 0,
    transaction_date: new Date().toISOString().split('T')[0] // Current date in YYYY-MM-DD format
  };

  const { data: record, error } = await supabase
    .from('cash_tracking')
    .insert([trackingData])
    .select()
    .single();

  if (error) {
    console.error('Error creating cash tracking record:', error);
    throw error;
  }

  return record;
}

/**
 * Get cash tracking records for a business
 */
export async function getCashTrackingRecords(
  businessCode: string,
  filters?: {
    branchName?: string;
    startDate?: string;
    endDate?: string;
    cashierName?: string;
  }
): Promise<CashTracking[]> {
  let query = supabase
    .from('cash_tracking')
    .select('*')
    .eq('business_code', businessCode);

  if (filters) {
    if (filters.branchName) {
      query = query.eq('business_branch_name', filters.branchName);
    }
    if (filters.startDate) {
      query = query.gte('transaction_date', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('transaction_date', filters.endDate);
    }
    if (filters.cashierName) {
      query = query.eq('cashier_name', filters.cashierName);
    }
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching cash tracking records:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get the latest cash tracking record for a branch
 */
export async function getLatestCashTracking(
  businessCode: string,
  branchName: string
): Promise<CashTracking | null> {
  const { data, error } = await supabase
    .from('cash_tracking')
    .select('*')
    .eq('business_code', businessCode)
    .eq('business_branch_name', branchName)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') { // No rows returned
      return null;
    }
    console.error('Error fetching latest cash tracking:', error);
    throw error;
  }

  return data;
}

/**
 * Update cash tracking for a sale
 */
export async function updateCashForSale(
  businessCode: string,
  branchName: string,
  cashierName: string,
  saleAmount: number
): Promise<CashTracking> {
  try {
    // Get the latest tracking record
    const latestTracking = await getLatestCashTracking(businessCode, branchName);
  
    // Use the latest total as the previous total
    const previousTotal = latestTracking?.new_total_cash || 0;
    const newTotal = previousTotal + saleAmount;

    // Create new tracking record with previous total
    return createCashTracking({
      business_code: businessCode,
      business_branch_name: branchName,
      cashier_name: cashierName,
      previous_total_cash: previousTotal,
      new_total_cash: newTotal,
      cash_additions: saleAmount,
      cash_change_reason: 'sale'
    });
  } catch (error) {
    console.error('Error updating cash for sale:', error);
    throw error;
  }
}

/**
 * Update cash tracking for a return
 */
export async function updateCashForReturn(
  businessCode: string,
  branchName: string,
  cashierName: string,
  returnAmount: number
): Promise<CashTracking> {
  try {
    // Get the latest tracking record
    const latestTracking = await getLatestCashTracking(businessCode, branchName);
  
    // Use the latest total as the previous total
    const previousTotal = latestTracking?.new_total_cash || 0;
    const newTotal = previousTotal - returnAmount;

    // Create new tracking record with previous total
    return createCashTracking({
      business_code: businessCode,
      business_branch_name: branchName,
      cashier_name: cashierName,
      previous_total_cash: previousTotal,
      new_total_cash: newTotal,
      cash_removals: returnAmount,
      total_returns: returnAmount,
      cash_change_reason: 'return'
    });
  } catch (error) {
    console.error('Error updating cash for return:', error);
    throw error;
  }
}

/**
 * Update cash tracking for manual adjustment (addition or removal)
 */
export async function updateCashManually(
  businessCode: string,
  branchName: string,
  cashierName: string,
  amount: number,
  reason: string
): Promise<CashTracking> {
  try {
    // Get the latest tracking record
    const latestTracking = await getLatestCashTracking(businessCode, branchName);
  
    // Use the latest total as the previous total
    const previousTotal = latestTracking?.new_total_cash || 0;
    const newTotal = previousTotal + amount; // amount can be positive or negative

    // Create new tracking record with previous total
    return createCashTracking({
      business_code: businessCode,
      business_branch_name: branchName,
      cashier_name: cashierName,
      previous_total_cash: previousTotal,
      new_total_cash: newTotal,
      cash_additions: amount > 0 ? amount : 0,
      cash_removals: amount < 0 ? Math.abs(amount) : 0,
      cash_change_reason: reason
    });
  } catch (error) {
    console.error('Error updating cash manually:', error);
    throw error;
  }
}

/**
 * Get cash tracking statistics
 */
export async function getCashTrackingStats(
  businessCode: string,
  branchName?: string,
  startDate?: string,
  endDate?: string
): Promise<{
  totalCashSales: number;
  totalReturns: number;
  totalAdditions: number;
  totalRemovals: number;
  netCashFlow: number;
}> {
  let query = supabase
    .from('cash_tracking')
    .select('*')
    .eq('business_code', businessCode);

  if (branchName) {
    query = query.eq('business_branch_name', branchName);
  }
  if (startDate) {
    query = query.gte('transaction_date', startDate);
  }
  if (endDate) {
    query = query.lte('transaction_date', endDate);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching cash tracking stats:', error);
    throw error;
  }

  const stats = data.reduce((acc, record) => ({
    totalCashSales: acc.totalCashSales + (record.cash_additions || 0),
    totalReturns: acc.totalReturns + (record.total_returns || 0),
    totalAdditions: acc.totalAdditions + (record.cash_additions || 0),
    totalRemovals: acc.totalRemovals + (record.cash_removals || 0),
    netCashFlow: acc.netCashFlow + ((record.cash_additions || 0) - (record.cash_removals || 0))
  }), {
    totalCashSales: 0,
    totalReturns: 0,
    totalAdditions: 0,
    totalRemovals: 0,
    netCashFlow: 0
  });

  return stats;
}