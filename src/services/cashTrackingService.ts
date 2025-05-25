import { supabase } from '../lib/supabase';
import { createTransaction } from './transactionService';

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
 * Create a new cash tracking record and corresponding transaction
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

  // Start transaction
  const { data: record, error } = await supabase
    .from('cash_tracking')
    .insert([trackingData])
    .select()
    .single();

  if (error) {
    console.error('Error creating cash tracking record:', error);
    throw error;
  }

  // Create corresponding transaction in transactions_overall
  if (data.cash_additions > 0) {
    await createTransaction({
      business_code: data.business_code,
      business_name: await getBusinessName(data.business_code),
      branch_name: data.business_branch_name,
      transaction_type: 'cash_addition',
      amount: data.cash_additions,
      payment_method: 'cash',
      transaction_reason: data.cash_change_reason || 'Cash Addition',
      owner_profit_from_this_transcation: data.cash_additions,
      details: {
        previous_total_cash: data.previous_total_cash,
        new_total_cash: data.new_total_cash,
        cashier_name: data.cashier_name,
        tracking_id: tracking_id
      }
    });
  }

  if (data.cash_removals > 0) {
    await createTransaction({
      business_code: data.business_code,
      business_name: await getBusinessName(data.business_code),
      branch_name: data.business_branch_name,
      transaction_type: 'cash_removal',
      amount: -data.cash_removals,
      payment_method: 'cash',
      transaction_reason: data.cash_change_reason || 'Cash Removal',
      owner_profit_from_this_transcation: -data.cash_removals,
      details: {
        previous_total_cash: data.previous_total_cash,
        new_total_cash: data.new_total_cash,
        cashier_name: data.cashier_name,
        tracking_id: tracking_id
      }
    });
  }

  if (data.total_returns > 0) {
    await createTransaction({
      business_code: data.business_code,
      business_name: await getBusinessName(data.business_code),
      branch_name: data.business_branch_name,
      transaction_type: 'cash_return',
      amount: -data.total_returns,
      payment_method: 'cash',
      transaction_reason: 'Product Return',
      owner_profit_from_this_transcation: -data.total_returns,
      details: {
        previous_total_cash: data.previous_total_cash,
        new_total_cash: data.new_total_cash,
        cashier_name: data.cashier_name,
        tracking_id: tracking_id
      }
    });
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

    // Create new tracking record WITHOUT creating a transaction
    const { data: record, error } = await supabase
      .from('cash_tracking')
      .insert([{
        tracking_id: generateTrackingId(),
        business_code: businessCode,
        business_branch_name: branchName,
        cashier_name: cashierName,
        previous_total_cash: previousTotal,
        new_total_cash: newTotal,
        cash_additions: saleAmount,
        cash_removals: 0,
        cash_change_reason: 'sale',
        total_returns: 0,
        transaction_date: new Date().toISOString().split('T')[0]
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating cash tracking record:', error);
      throw error;
    }

    return record;
  } catch (error) {
    console.error('Error updating cash for sale:', error);
    throw error;
  }
}

/**
 * Update cash tracking for a return
 * @param businessCode The business code
 * @param branchName The branch name
 * @param cashierName The cashier processing the return
 * @param returnAmount The total return amount (including product price and commission)
 * @param commissionAmount The commission amount included in the return
 */
export async function updateCashForReturn(
  businessCode: string,
  branchName: string,
  cashierName: string,
  returnAmount: number,
  commissionAmount: number = 0
): Promise<CashTracking> {
  try {
    // Get the latest tracking record
    const latestTracking = await getLatestCashTracking(businessCode, branchName);
  
    // Use the latest total as the previous total
    const previousTotal = latestTracking?.new_total_cash || 0;
    const newTotal = previousTotal - returnAmount;

    // Create new tracking record with previous total - without creating transactions
    // The transactions are now created in ReturnProductsPage.tsx to avoid duplication
    const result = await supabase
      .from('cash_tracking')
      .insert({
        tracking_id: generateTrackingId(),
        business_code: businessCode,
        business_branch_name: branchName,
        cashier_name: cashierName,
        previous_total_cash: previousTotal,
        new_total_cash: newTotal,
        cash_additions: 0,
        cash_removals: returnAmount,
        cash_change_reason: commissionAmount > 0 ? 'return with commission' : 'return',
        total_returns: returnAmount,
        transaction_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
      })
      .select('*')
      .single();
      
    if (result.error) {
      throw result.error;
    }
      
    return result.data;
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
  console.log('[cashTrackingService] updateCashManually called with', {
    businessCode,
    branchName,
    cashierName,
    amount,
    reason
  });

  if (!businessCode) {
    console.error('[cashTrackingService] Missing business code');
    throw new Error('Business code is required for cash tracking');
  }

  if (!branchName) {
    console.error('[cashTrackingService] Missing branch name');
    throw new Error('Branch name is required for cash tracking');
  }

  try {
    // Get latest cash tracking to get current cash total
    console.log('[cashTrackingService] Fetching latest cash tracking for', { businessCode, branchName });
    const { data: latestCashTracking, error: fetchError } = await supabase
      .from('cash_tracking')
      .select('new_total_cash')
      .eq('business_code', businessCode)
      .eq('business_branch_name', branchName)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // Log and throw if it's not a "no rows returned" error
      console.error('[cashTrackingService] Error fetching latest cash tracking:', fetchError);
      throw fetchError;
    }

    const previousTotal = latestCashTracking?.new_total_cash || 0;
    const newTotal = previousTotal + amount;
    
    console.log('[cashTrackingService] Cash calculation', {
      previousTotal,
      amount,
      newTotal
    });

    // Create cash tracking record without creating a transaction
    const trackingId = `MANUAL${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    console.log('[cashTrackingService] Creating new cash tracking record with ID:', trackingId);
    
    const { data: record, error } = await supabase
      .from('cash_tracking')
      .insert([{
        tracking_id: trackingId,
        business_code: businessCode,
        business_branch_name: branchName,
        cashier_name: cashierName,
        previous_total_cash: previousTotal,
        new_total_cash: newTotal,
        cash_additions: amount > 0 ? amount : 0,
        cash_removals: amount < 0 ? Math.abs(amount) : 0,
        cash_change_reason: reason,
        total_returns: 0,
        transaction_date: new Date().toISOString().split('T')[0]
      }])
      .select()
      .single();

    if (error) {
      console.error('[cashTrackingService] Error creating cash tracking record:', error);
      throw error;
    }

    console.log('[cashTrackingService] Cash tracking record created successfully:', record);
    return record;
  } catch (error) {
    console.error('[cashTrackingService] Error updating cash manually:', error);
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

// Helper function to get business name
async function getBusinessName(businessCode: string): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('business_name')
      .eq('business_code', businessCode)
      .in('role', ['owner', 'manager']) // Get either owner or manager profile
      .limit(1); // Ensure we only get one row

    if (error) {
      console.error('Error fetching business name:', error);
      return businessCode; // Fallback to business code if error
    }

    // If no data or empty array, return business code
    if (!data || data.length === 0) {
      return businessCode;
    }

    return data[0].business_name || businessCode;
  } catch (err) {
    console.error('Error in getBusinessName:', err);
    return businessCode; // Fallback to business code if any error
  }
}