import { supabase } from '../lib/supabase';

export interface VendorRental {
  rental_id: number;
  owner_business_code: string;
  vendor_business_code: string;
  vendor_business_name: string;
  space_name: string;
  branch_name: string;
  rent_amount: number;
  created_at: string;
}

interface CreateVendorRental {
  owner_business_code: string;
  vendor_business_code: string;
  vendor_business_name: string;
  space_name: string;
  branch_name: string;
  rent_amount: number;
}

type UpdateVendorRental = Partial<CreateVendorRental>;

export async function getVendorRentals(businessCode: string): Promise<VendorRental[]> {
  const { data, error } = await supabase
    .from('vendor_rentals')
    .select('*')
    .eq('owner_business_code', businessCode)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching vendor rentals:', error);
    throw error;
  }

  return data || [];
}

export async function createVendorRental(rental: CreateVendorRental) {
  const { data, error } = await supabase
    .from('vendor_rentals')
    .insert([rental])
    .select()
    .single();

  if (error) {
    console.error('Error creating vendor rental:', error);
    throw error;
  }

  return data;
}

export async function updateVendorRental(rentalId: number, updates: UpdateVendorRental) {
  const { data, error } = await supabase
    .from('vendor_rentals')
    .update(updates)
    .eq('rental_id', rentalId)
    .select()
    .single();

  if (error) {
    console.error('Error updating vendor rental:', error);
    throw error;
  }

  return data;
}

export async function deleteVendorRental(rentalId: number) {
  const { error } = await supabase
    .from('vendor_rentals')
    .delete()
    .eq('rental_id', rentalId);

  if (error) {
    console.error('Error deleting vendor rental:', error);
    throw error;
  }
}
