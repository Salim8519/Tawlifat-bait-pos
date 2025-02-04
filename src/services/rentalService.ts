import { supabase } from '../lib/supabase';

export interface VendorRental {
  rental_id: string;
  space_name: string;
  vendor_bussnies_code: string;
  vendor_business_name: string;
  owner_business_name: string;
  branch_name_rental: string;
  monthly_rent: number;
  payment_status: 'paid' | 'pending' | 'overdue';
  next_payment_date: string;
  created_at: string;
  updated_at: string;
}

export interface CreateRentalData {
  space_name: string;
  vendor_bussnies_code: string;
  vendor_business_name: string;
  owner_business_name: string;
  branch_name_rental: string;
  monthly_rent: number;
  next_payment_date: string;
}

/**
 * Get all rentals for a business
 */
export async function getRentals(ownerBusinessName: string): Promise<VendorRental[]> {
  const { data, error } = await supabase
    .from('vendor_rentals')
    .select('*')
    .eq('owner_business_name', ownerBusinessName)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching rentals:', error);
    throw error;
  }

  return data || [];
}

/**
 * Create a new rental
 */
export async function createRental(rental: CreateRentalData): Promise<VendorRental> {
  const { data, error } = await supabase
    .from('vendor_rentals')
    .insert([{
      ...rental,
      payment_status: 'pending' // Initial status
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating rental:', error);
    throw error;
  }

  return data;
}

/**
 * Update rental payment status
 */
export async function updateRentalPaymentStatus(
  rentalId: string,
  status: 'paid' | 'pending' | 'overdue',
  nextPaymentDate?: string
): Promise<VendorRental> {
  const updates: Partial<VendorRental> = {
    payment_status: status,
    updated_at: new Date().toISOString()
  };

  if (nextPaymentDate) {
    updates.next_payment_date = nextPaymentDate;
  }

  const { data, error } = await supabase
    .from('vendor_rentals')
    .update(updates)
    .eq('rental_id', rentalId)
    .select()
    .single();

  if (error) {
    console.error('Error updating rental payment status:', error);
    throw error;
  }

  return data;
}

/**
 * Delete a rental
 */
export async function deleteRental(rentalId: string): Promise<boolean> {
  const { error } = await supabase
    .from('vendor_rentals')
    .delete()
    .eq('rental_id', rentalId);

  if (error) {
    console.error('Error deleting rental:', error);
    throw error;
  }

  return true;
}

/**
 * Get rentals by vendor
 */
export async function getRentalsByVendor(vendorBusinessCode: string): Promise<VendorRental[]> {
  const { data, error } = await supabase
    .from('vendor_rentals')
    .select('*')
    .eq('vendor_bussnies_code', vendorBusinessCode)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching vendor rentals:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get rentals by branch
 */
export async function getRentalsByBranch(branchName: string, ownerBusinessName: string): Promise<VendorRental[]> {
  const { data, error } = await supabase
    .from('vendor_rentals')
    .select('*')
    .eq('branch_name_rental', branchName)
    .eq('owner_business_name', ownerBusinessName)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching branch rentals:', error);
    throw error;
  }

  return data || [];
}