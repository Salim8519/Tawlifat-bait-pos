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
  owner_business_name?: string;
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

export async function getVendorRentalsForVendor(vendorBusinessCode: string): Promise<VendorRental[]> {
  const { data: rentalsData, error: rentalsError } = await supabase
    .from('vendor_rentals')
    .select('*')
    .eq('vendor_business_code', vendorBusinessCode)
    .order('created_at', { ascending: false });

  if (rentalsError) {
    console.error('Error fetching vendor rentals for vendor:', rentalsError);
    throw rentalsError;
  }

  if (!rentalsData || rentalsData.length === 0) {
    return [];
  }

  const ownerBusinessCodes = [...new Set(rentalsData.map(rental => rental.owner_business_code))];
  
  const { data: assignmentsData, error: assignmentsError } = await supabase
    .from('vendor_assignments')
    .select('owner_business_code, owner_business_name')
    .in('owner_business_code', ownerBusinessCodes)
    .eq('vendor_business_code', vendorBusinessCode);

  if (assignmentsError) {
    console.error('Error fetching vendor assignments:', assignmentsError);
  }

  const businessNameMap = new Map<string, string>();
  
  if (assignmentsData && assignmentsData.length > 0) {
    assignmentsData.forEach(assignment => {
      businessNameMap.set(assignment.owner_business_code, assignment.owner_business_name);
    });
  }

  const enrichedRentals = rentalsData.map(rental => ({
    ...rental,
    owner_business_name: businessNameMap.get(rental.owner_business_code) || rental.owner_business_code
  }));

  return enrichedRentals;
}

export interface VendorRentalHistory {
  id: number;
  vendor_business_code: string;
  vendor_business_name: string;
  owner_business_code: string;
  branch_name: string;
  month: number;
  year: number;
  tax_amount: number;
  payment_status: 'pending' | 'paid' | 'overdue';
  created_at: string;
  updated_at: string;
  owner_business_name?: string;
}

export async function getVendorRentalHistory(vendorBusinessCode: string): Promise<VendorRentalHistory[]> {
  const { data: historyData, error: historyError } = await supabase
    .from('vendor_rentals_history')
    .select('*')
    .eq('vendor_business_code', vendorBusinessCode)
    .order('year', { ascending: false })
    .order('month', { ascending: false });

  if (historyError) {
    console.error('Error fetching vendor rental history:', historyError);
    throw historyError;
  }

  if (!historyData || historyData.length === 0) {
    return [];
  }

  const ownerBusinessCodes = [...new Set(historyData.map(history => history.owner_business_code))];
  
  const { data: assignmentsData, error: assignmentsError } = await supabase
    .from('vendor_assignments')
    .select('owner_business_code, owner_business_name')
    .in('owner_business_code', ownerBusinessCodes)
    .eq('vendor_business_code', vendorBusinessCode);

  if (assignmentsError) {
    console.error('Error fetching vendor assignments:', assignmentsError);
  }

  const businessNameMap = new Map<string, string>();
  
  if (assignmentsData && assignmentsData.length > 0) {
    assignmentsData.forEach(assignment => {
      businessNameMap.set(assignment.owner_business_code, assignment.owner_business_name);
    });
  }

  const enrichedHistory = historyData.map(history => ({
    ...history,
    owner_business_name: businessNameMap.get(history.owner_business_code) || history.owner_business_code
  }));

  return enrichedHistory;
}
