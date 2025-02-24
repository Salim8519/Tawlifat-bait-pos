import { supabase } from '../lib/supabase';
import { vendorTransactionService } from './vendorTransactionService';
import { createCashTracking } from './cashTrackingService';

export interface MonthlyTaxPaymentDetails {
  businessCode: string;
  branchName: string;
  vendorCode: string;
  vendorName: string;
  amount: number;
  month: number;
  year: number;
  paymentMethod: 'cash' | 'card' | 'online';
}

export const recordMonthlyTaxTransaction = async (details: MonthlyTaxPaymentDetails) => {
  try {
    const { businessCode, branchName, vendorCode, vendorName, amount, month, year, paymentMethod } = details;

    // Get owner's business name from vendor_assignments
    const { data: assignmentData } = await supabase
      .from('vendor_assignments')
      .select('owner_business_name')
      .eq('owner_business_code', businessCode)
      .eq('vendor_business_code', vendorCode)
      .eq('branch_name', branchName)
      .maybeSingle();

    const ownerBusinessName = assignmentData?.owner_business_name || businessCode;

    // If payment method is cash, update cash tracking
    if (paymentMethod === 'cash') {
      // Get latest cash tracking to get current cash total
      const { data: latestCashTracking } = await supabase
        .from('cash_tracking')
        .select('new_total_cash')
        .eq('business_code', businessCode)
        .eq('business_branch_name', branchName)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const previousTotal = latestCashTracking?.new_total_cash || 0;
      const newTotal = previousTotal + amount;

      // Create cash tracking record without creating a transaction
      const { error: cashTrackingError } = await supabase
        .from('cash_tracking')
        .insert([{
          tracking_id: `TAX${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
          business_code: businessCode,
          business_branch_name: branchName,
          previous_total_cash: previousTotal,
          new_total_cash: newTotal,
          cash_additions: amount,
          cash_removals: 0,
          cash_change_reason: `دفع ضريبة شهرية من المورد ${vendorName} لشهر ${month}/${year}`,
          total_returns: 0,
          transaction_date: new Date().toISOString().split('T')[0]
        }]);

      if (cashTrackingError) {
        console.error('Error creating cash tracking record:', cashTrackingError);
        throw cashTrackingError;
      }
    }

    // Format the transaction date to the first day of the month
    const transactionDate = new Date(year, month - 1, 1).toISOString().split('T')[0];

    // Generate a text transaction ID for vendor_transactions
    const textTransactionId = `tax_${businessCode}_${vendorCode}_${month}_${year}_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;

    // Record the tax deduction in vendor_transactions using the service
    await vendorTransactionService.createTransaction({
      business_code: businessCode,
      business_name: ownerBusinessName,
      branch_name: branchName,
      vendor_code: vendorCode,
      vendor_name: vendorName,
      transaction_date: transactionDate,
      transaction_type: 'tax',
      amount: -amount, // Negative amount to show deduction
      profit: -amount, // Tax reduces profit
      status: 'completed',
      transaction_id: textTransactionId,
      notes: `دفع ضريبة شهرية لشهر ${month}/${year}`,
      tax_period: `${year}-${String(month).padStart(2, '0')}`,
      tax_description: `دفع ضريبة شهرية لشهر ${month}/${year}`
    });

    // Record in transactions_overall with a UUID
    const { data, error } = await supabase
      .from('transactions_overall')
      .insert({
        business_code: businessCode,
        business_name: ownerBusinessName,
        branch_name: branchName,
        transaction_type: 'tax',
        transaction_reason: `دفع ضريبة شهرية لشهر ${month}/${year}`,
        amount: amount,
        currency: 'OMR',
        owner_profit_from_this_transcation: amount,
        payment_method: paymentMethod,
        vendor_code: vendorCode,
        vendor_name: vendorName,
        details: {
          month,
          year,
          taxType: 'monthly',
          description: `دفع ضريبة شهرية من المورد ${vendorName} (${vendorCode})`,
          vendor_transaction_id: textTransactionId,
          payment_method: paymentMethod
        }
      })
      .select()
      .single();

    if (error) {
      console.error('Error recording tax transaction:', error);
      throw error;
    }

    console.log('Successfully recorded tax transactions:', {
      vendorTransaction: 'completed',
      overallTransaction: data
    });
    return data;
  } catch (error) {
    console.error('Error in recordMonthlyTaxTransaction:', error);
    throw error;
  }
};
