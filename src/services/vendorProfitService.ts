import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

interface GetVendorProfitParams {
  businessCode: string;
  branchName: string;
  vendorCode: string;
  startDate?: Date;
  endDate?: Date;
}

interface GetVendorMonthlyProfitParams {
  businessCode: string;
  branchName: string;
  vendorCode: string;
  month: number;
  year: number;
}

interface VendorPeriodProfit {
  totalAmount: number;
  transactionCount: number;
}

/**
 * Get vendor's profit for a specific period
 * If no period is specified, returns profit for the current month
 */
export const getVendorPeriodProfit = async ({
  businessCode,
  branchName,
  vendorCode,
  startDate,
  endDate
}: GetVendorProfitParams): Promise<VendorPeriodProfit> => {
  try {
    // Format dates as YYYY-MM-DD to avoid timezone issues
    const formattedStartDate = startDate ? format(startDate, 'yyyy-MM-dd') : undefined;
    const formattedEndDate = endDate ? format(endDate, 'yyyy-MM-dd') : undefined;

    console.log('Fetching profits with params:', {
      businessCode,
      branchName,
      vendorCode,
      startDate: formattedStartDate,
      endDate: formattedEndDate
    });

    let query = supabase
      .from('vendor_transactions')
      .select('profit')
      .eq('business_code', businessCode)
      .eq('branch_name', branchName)
      .eq('vendor_code', vendorCode)
      .eq('status', 'completed') // Only include completed transactions
      .eq('transaction_type', 'product_sale'); // Only include product sale transactions

    if (formattedStartDate) {
      query = query.gte('transaction_date', formattedStartDate);
    }
    if (formattedEndDate) {
      query = query.lte('transaction_date', formattedEndDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching vendor profit:', error);
      return { totalAmount: 0, transactionCount: 0 };
    }

    console.log('Fetched transactions:', data);

    const totalAmount = data.reduce((sum, transaction) => {
      const profit = Number(transaction.profit) || 0;
      console.log('Processing transaction profit:', profit);
      return sum + profit;
    }, 0);

    console.log('Calculated total profit:', totalAmount);

    return {
      totalAmount,
      transactionCount: data.length
    };
  } catch (error) {
    console.error('Error in getVendorPeriodProfit:', error);
    return { totalAmount: 0, transactionCount: 0 };
  }
};

/**
 * Get vendor's profit for a specific month and year
 */
export const getVendorMonthlyProfit = async ({
  businessCode,
  branchName,
  vendorCode,
  month,
  year
}: GetVendorMonthlyProfitParams): Promise<VendorPeriodProfit> => {
  console.log('Getting monthly profit for:', {
    businessCode,
    branchName,
    vendorCode,
    month,
    year
  });

  // Create date objects for the start and end of the specified month
  const startDate = new Date(year, month - 1, 1); // month is 0-based in Date constructor
  const endDate = new Date(year, month, 0); // Last day of the month

  console.log('Date range:', {
    startDate: format(startDate, 'yyyy-MM-dd'),
    endDate: format(endDate, 'yyyy-MM-dd')
  });

  return getVendorPeriodProfit({
    businessCode,
    branchName,
    vendorCode,
    startDate,
    endDate
  });
};
