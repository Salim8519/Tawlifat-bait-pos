import { supabase } from '../lib/supabase';

export interface RentalStats {
  totalSpaces: number;
  totalPaid: number;
  totalPending: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
}

export async function getRentalStats(
  businessCode: string,
  month: number,
  year: number
): Promise<RentalStats> {
  // Get all rentals
  const { data: spaces } = await supabase
    .from('vendor_rentals')
    .select('rental_id, rent_amount')
    .eq('owner_business_code', businessCode);

  // Get payment history for the month
  const { data: payments } = await supabase
    .from('vendor_rentals_history')
    .select('*')
    .eq('owner_business_code', businessCode)
    .eq('month', month)
    .eq('year', year);

  const totalSpaces = spaces?.length || 0;
  const totalPaid = payments?.filter(p => p.payment_status === 'paid').length || 0;
  const totalPending = totalSpaces - totalPaid;
  const paidAmount = payments?.reduce((sum, p) => 
    p.payment_status === 'paid' ? sum + (p.tax_amount || 0) : sum, 0) || 0;
  const totalAmount = spaces?.reduce((sum, s) => sum + (s.rent_amount || 0), 0) || 0;
  const pendingAmount = totalAmount - paidAmount;

  return {
    totalSpaces,
    totalPaid,
    totalPending,
    totalAmount,
    paidAmount,
    pendingAmount
  };
}
