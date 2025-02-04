import { supabase } from '../lib/supabase';

export interface Customer {
  customer_id?: string;
  customer_name: string;
  phone_number: string;
  number_of_orders: number;
  last_order?: string;
  business_code: string;
}

/**
 * Get all customers for a business
 */
export async function getCustomers(businessCode: string): Promise<Customer[]> {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('business_code', businessCode)
    .order('customer_name', { ascending: true });

  if (error) {
    console.error('Error fetching customers:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get a customer by phone number
 */
export async function getCustomerByPhone(phoneNumber: string, businessCode: string): Promise<Customer | null> {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('phone_number', phoneNumber)
    .eq('business_code', businessCode)
    .single();

  if (error) {
    if (error.code === 'PGRST116') { // No rows returned
      return null;
    }
    console.error('Error fetching customer:', error);
    throw error;
  }

  return data;
}

/**
 * Create a new customer
 */
export async function createCustomer(customer: Omit<Customer, 'customer_id'>): Promise<Customer> {
  const { data, error } = await supabase
    .from('customers')
    .insert([{
      ...customer,
      number_of_orders: 0 // Initialize with 0 orders
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating customer:', error);
    throw error;
  }

  return data;
}

/**
 * Update customer information
 */
export async function updateCustomer(
  customerId: string,
  updates: Partial<Omit<Customer, 'customer_id' | 'business_code'>>
): Promise<Customer> {
  const { data, error } = await supabase
    .from('customers')
    .update(updates)
    .eq('customer_id', customerId)
    .select()
    .single();

  if (error) {
    console.error('Error updating customer:', error);
    throw error;
  }

  return data;
}

/**
 * Delete a customer
 */
export async function deleteCustomer(customerId: string): Promise<boolean> {
  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('customer_id', customerId);

  if (error) {
    console.error('Error deleting customer:', error);
    throw error;
  }

  return true;
}

/**
 * Increment customer's order count and update last order date
 */
export async function incrementCustomerOrders(customerId: string): Promise<Customer> {
  const { data, error } = await supabase
    .from('customers')
    .update({
      number_of_orders: supabase.rpc('increment_orders'),
      last_order: new Date().toISOString()
    })
    .eq('customer_id', customerId)
    .select()
    .single();

  if (error) {
    console.error('Error incrementing customer orders:', error);
    throw error;
  }

  return data;
}

/**
 * Search customers by name or phone
 */
export async function searchCustomers(
  query: string,
  businessCode: string
): Promise<Customer[]> {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('business_code', businessCode)
    .or(`customer_name.ilike.%${query}%,phone_number.ilike.%${query}%`)
    .order('customer_name', { ascending: true });

  if (error) {
    console.error('Error searching customers:', error);
    throw error;
  }

  return data || [];
}

/**
 * Updates customer order information after a successful purchase
 * @param customerId The UUID of the customer
 * @param businessCode The business code
 * @returns Promise<void>
 */
export async function updateCustomerOrderInfo(
  customerId: string,
  businessCode: string
): Promise<void> {
  try {
    // First get the current number of orders
    const { data: currentData, error: fetchError } = await supabase
      .from('customers')
      .select('number_of_orders')
      .match({
        customer_id: customerId,
        business_code: businessCode
      })
      .single();

    if (fetchError) {
      console.error('Error fetching customer data:', fetchError);
      throw new Error('Failed to fetch customer data');
    }

    // Then update with the incremented value
    const { error: updateError } = await supabase
      .from('customers')
      .update({
        number_of_orders: (currentData?.number_of_orders || 0) + 1,
        last_order: new Date().toISOString()
      })
      .match({
        customer_id: customerId,
        business_code: businessCode
      });

    if (updateError) {
      console.error('Error updating customer order info:', updateError);
      throw new Error('Failed to update customer order information');
    }
  } catch (error) {
    console.error('Error in updateCustomerOrderInfo:', error);
    throw error;
  }
}