import { supabase } from '../lib/supabase';
import { updateCashManually } from './cashTrackingService';

interface BusinessRentalTransaction {
  business_code: string;
  business_name: string;
  vendor_code: string;
  vendor_name: string;
  branch_name: string;
  amount: number;
  payment_method: string;
  transaction_reason?: string;
  cashier_name?: string;
}

export async function recordBusinessRentalIncome({
  business_code,
  business_name,
  vendor_code,
  vendor_name,
  branch_name,
  amount,
  payment_method,
  transaction_reason,
  cashier_name = 'System'
}: BusinessRentalTransaction) {
  // First record in transactions_overall
  const { error } = await supabase
    .from('transactions_overall')
    .insert({
      business_code,
      business_name,
      vendor_code,
      vendor_name,
      branch_name,
      amount, // Positive amount as it's income for the business
      payment_method,
      transaction_type: 'rental_income',
      transaction_reason: transaction_reason || 'Vendor Space Rental Payment',
      currency: 'OMR',
      owner_profit_from_this_transcation: amount, // Full amount is profit
      details: {
        type: 'vendor_rental',
        payment_method,
        vendor_details: {
          code: vendor_code,
          name: vendor_name,
          branch: branch_name
        }
      }
    });

  if (error) {
    console.error('Error recording business rental income:', error);
    throw new Error('Failed to record business transaction');
  }

  // If payment is cash, update cash tracking
  if (payment_method === 'cash') {
    try {
      await updateCashManually(
        business_code,
        branch_name,
        cashier_name,
        amount,
        transaction_reason || 'Vendor Space Rental Payment'
      );
    } catch (cashError) {
      console.error('Error updating cash tracking:', cashError);
      throw new Error('Failed to update cash tracking');
    }
  }
}
