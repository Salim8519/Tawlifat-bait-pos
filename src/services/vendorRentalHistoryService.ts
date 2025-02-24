import { supabase } from '../lib/supabase';

export type PaymentStatus = 'pending' | 'paid' | 'overdue';

export interface VendorRentalHistory {
  id: number;
  owner_business_code: string;
  vendor_business_code: string;
  vendor_business_name: string;
  branch_name: string;
  month: number;
  year: number;
  tax_amount: number;
  payment_status: PaymentStatus;
  created_at: string;
  updated_at: string;
}

interface CreateRentalHistory {
  owner_business_code: string;
  vendor_business_code: string;
  vendor_business_name: string;
  branch_name: string;
  month: number;
  year: number;
  tax_amount: number;
}

export async function getRentalHistory(
  businessCode: string,
  month: number,
  year: number
): Promise<VendorRentalHistory[]> {
  const { data, error } = await supabase
    .from('vendor_rentals_history')
    .select('*')
    .eq('owner_business_code', businessCode)
    .eq('month', month)
    .eq('year', year)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching rental history:', error);
    throw error;
  }

  return data || [];
}

export async function createRentalHistory(history: CreateRentalHistory) {
  const { data, error } = await supabase
    .from('vendor_rentals_history')
    .insert([{
      ...history,
      payment_status: 'pending'
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating rental history:', error);
    throw error;
  }

  return data;
}

export async function updatePaymentStatus(
  id: number,
  status: PaymentStatus
) {
  const { data, error } = await supabase
    .from('vendor_rentals_history')
    .update({ payment_status: status })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating payment status:', error);
    throw error;
  }

  return data;
}

export async function checkExistingPayment(
  ownerBusinessCode: string,
  vendorBusinessCode: string,
  branchName: string,
  month: number,
  year: number
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('vendor_rentals_history')
      .select('*')
      .eq('owner_business_code', ownerBusinessCode)
      .eq('vendor_business_code', vendorBusinessCode)
      .eq('month', month)
      .eq('year', year)
      .eq('payment_status', 'paid');

    if (error) {
      console.error('Error checking existing payment:', error);
      throw new Error('Failed to check existing payment');
    }

    // Check branch name match in JavaScript to handle special characters
    return data?.some(payment => 
      payment.branch_name === branchName && 
      payment.payment_status === 'paid'
    ) || false;
  } catch (err) {
    console.error('Error in checkExistingPayment:', err);
    return false; // Return false on error to allow the payment to proceed
  }
}
