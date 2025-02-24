import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

interface VendorSpacePayment {
  owner_business_code: string;
  owner_business_name: string;
  vendor_business_code: string;
  vendor_business_name: string;
  branch_name: string;
  amount: number;
  month: number;
  year: number;
}

export async function recordVendorSpacePayment(payment: VendorSpacePayment) {
  const transactionId = `RENT_${uuidv4()}`;
  const transactionDate = new Date();
  const taxPeriod = `${payment.month}/${payment.year}`;

  // Calculate rental period dates
  const startDate = new Date(payment.year, payment.month - 1, 1); // First day of the month
  const endDate = new Date(payment.year, payment.month, 0); // Last day of the month

  // Record as a loss (negative amount) for the vendor
  const { error } = await supabase
    .from('vendor_transactions')
    .insert({
      transaction_id: transactionId,
      transaction_type: 'rental',
      transaction_date: transactionDate.toISOString(),
      business_code: payment.owner_business_code,
      business_name: payment.owner_business_name,
      vendor_code: payment.vendor_business_code,
      vendor_name: payment.vendor_business_name,
      branch_name: payment.branch_name,
      amount: -payment.amount, // Negative amount for vendor expense
      profit: -payment.amount, // Loss for vendor
      tax_period: taxPeriod,
      tax_description: `Rent payment for ${payment.branch_name} - ${taxPeriod}`,
      status: 'completed',
      rental_start_date: startDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
      rental_end_date: endDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
      rental_period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`
    });

  if (error) {
    console.error('Error recording vendor space payment:', error);
    throw new Error('Failed to record vendor payment');
  }

  return { transactionId };
}
