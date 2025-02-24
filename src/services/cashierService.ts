import { supabase } from '../lib/supabase';
import type { Profile } from '../types/profile';

// Remove admin client - we'll use standard supabase client

export type WorkingStatus = 'working' | 'vacation' | 'sick' | 'absent' | 'suspended';

export interface CashierProfile extends Profile {
  working_status: WorkingStatus;
  business_name: string;
}

export interface CreateCashierData {
  email: string;
  password: string;
  working_status: WorkingStatus;
  full_name: string;
  main_branch: string;
  salary: number;
  business_code: string;
  phone_number?: string;
}

/**
 * Get all cashiers for a business
 */
export async function getCashiers(businessCode: string): Promise<CashierProfile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('business_code', businessCode)
    .eq('role', 'cashier')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching cashiers:', error);
    throw error;
  }

  return data || [];
}

/**
 * Check if a user exists in auth by email
 */
export async function checkUserExists(email: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('his_email', email)
    .maybeSingle();

  if (error) {
    console.error('Error checking user:', error);
    throw error;
  }

  return !!data;
}

/**
 * Create a new cashier with auth and profile
 */
export async function createCashier(data: CreateCashierData): Promise<CashierProfile> {
  try {
    // Check if user already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('his_email', data.email)
      .maybeSingle();

    if (existingProfile) {
      throw new Error('A user with this email already exists');
    }

    // Get business name from creator's profile
    const { data: creatorProfile, error: creatorError } = await supabase
      .from('profiles')
      .select('business_name')
      .eq('business_code', data.business_code)
      .eq('role', 'owner')
      .single();

    if (creatorError) {
      console.error('Error fetching business name:', creatorError);
      throw creatorError;
    }

    // Create new auth user using public API
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          role: 'cashier',
          business_code: data.business_code
        }
      }
    });

    if (signUpError) {
      throw signUpError;
    }

    if (!authData.user) {
      throw new Error('Failed to create cashier account');
    }

    // Create profile using RLS policies
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: authData.user.id,
        full_name: data.full_name,
        his_email: data.email,
        main_branch: data.main_branch,
        phone_number: data.phone_number,
        salary: data.salary,
        role: 'cashier',
        business_code: data.business_code,
        working_status: data.working_status,
        business_name: creatorProfile.business_name // Add business name from creator's profile
      })
      .select()
      .single();

    if (profileError) {
      console.error('Error creating cashier profile:', profileError);
      throw profileError;
    }

    return profile;
  } catch (error) {
    console.error('Error in createCashier:', error);
    throw error;
  }
}

/**
 * Update cashier profile
 */
export async function updateCashier(
  userId: string,
  updates: Partial<Omit<CashierProfile, 'id' | 'user_id' | 'role' | 'business_code'>>
): Promise<CashierProfile> {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('user_id', userId)
    .eq('role', 'cashier')
    .select()
    .single();

  if (error) {
    console.error('Error updating cashier:', error);
    throw error;
  }

  return data;
}

/**
 * Update cashier working status
 */
export async function updateCashierStatus(
  userId: string,
  status: WorkingStatus
): Promise<CashierProfile> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ working_status: status })
    .eq('user_id', userId)
    .eq('role', 'cashier')
    .select()
    .single();

  if (error) {
    console.error('Error updating cashier status:', error);
    throw error;
  }

  return data;
}

/**
 * Delete cashier from profiles table
 * Note: Auth user will remain but won't have access to any data
 */
export async function deleteCashier(userId: string): Promise<boolean> {
  try {
    // First verify this is actually a cashier from our business
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, business_code')
      .eq('user_id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching cashier profile:', profileError);
      throw profileError;
    }

    if (!profile || profile.role !== 'cashier') {
      throw new Error('User is not a cashier');
    }

    // Delete the profile - RLS policies will ensure only cashiers from the same business can be deleted
    const { error: deleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('user_id', userId)
      .eq('role', 'cashier');

    if (deleteError) {
      console.error('Error deleting cashier profile:', deleteError);
      throw deleteError;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteCashier:', error);
    throw error;
  }
}