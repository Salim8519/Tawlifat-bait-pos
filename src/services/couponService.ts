import { supabase } from '../lib/supabase';

export interface Coupon {
  coupon_id: string;
  business_code: string;
  coupon_code: string;
  discount_type: 'fixed' | 'percentage';
  discount_value: number;
  number_of_uses: number;
  max_uses: number | null;
  expiry_date: string | null;
  min_purchase_amount: number;
  max_purchase_amount: number;
  created_at: string;
}

export interface CreateCouponData {
  business_code: string;
  coupon_code: string;
  discount_type: 'fixed' | 'percentage';
  discount_value: number;
  max_uses?: number | null;
  expiry_date?: string | null;
  min_purchase_amount?: number;
  max_purchase_amount?: number;
}

/**
 * Get all coupons for a business
 */
export async function getCoupons(businessCode: string): Promise<Coupon[]> {
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('business_code', businessCode)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching coupons:', error);
    throw error;
  }

  return data || [];
}

/**
 * Create a new coupon
 */
export async function createCoupon(couponData: CreateCouponData): Promise<Coupon> {
  // Let Supabase handle UUID generation by not including coupon_id
  const { data, error } = await supabase
    .from('coupons')
    .insert({
      coupon_id: crypto.randomUUID(), // Explicitly provide a UUID
      business_code: couponData.business_code,
      coupon_code: couponData.coupon_code,
      discount_type: couponData.discount_type,
      discount_value: couponData.discount_value,
      max_uses: couponData.max_uses || null,
      expiry_date: couponData.expiry_date || null,
      min_purchase_amount: couponData.min_purchase_amount || 0,
      max_purchase_amount: couponData.max_purchase_amount || 0,
      is_active: couponData.is_active ?? true,
      number_of_uses: 0 // Initialize with 0 uses
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating coupon:', error);
    throw error;
  }

  return data;
}

/**
 * Update an existing coupon
 */
export async function updateCoupon(
  couponId: string,
  updates: Partial<Omit<Coupon, 'coupon_id' | 'business_code' | 'created_at'>>
): Promise<Coupon> {
  const { data, error } = await supabase
    .from('coupons')
    .update(updates)
    .eq('coupon_id', couponId)
    .select()
    .single();

  if (error) {
    console.error('Error updating coupon:', error);
    throw error;
  }

  return data;
}

/**
 * Delete a coupon
 */
export async function deleteCoupon(couponId: string): Promise<boolean> {
  const { error } = await supabase
    .from('coupons')
    .delete()
    .eq('coupon_id', couponId);

  if (error) {
    console.error('Error deleting coupon:', error);
    throw error;
  }

  return true;
}

/**
 * Generate a unique coupon code
 */
export function generateCouponCode(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Validate a coupon code
 */
export async function validateCoupon(code: string, businessCode: string): Promise<Coupon | null> {
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('business_code', businessCode)
    .eq('coupon_code', code)
    .eq('is_active', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') { // No rows returned
      return null;
    }
    throw error;
  }

  if (!data) return null;

  // Check if coupon is expired
  if (data.expiry_date && new Date(data.expiry_date) < new Date()) {
    return null;
  }

  // Check if max uses is reached
  if (data.max_uses && data.number_of_uses >= data.max_uses) {
    return null;
  }

  return data;
}