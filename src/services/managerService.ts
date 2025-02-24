import { supabase } from '../lib/supabase';
import type { Profile } from '../types/profile';

export type WorkingStatus = 'working' | 'vacation' | 'sick' | 'absent' | 'suspended';

export interface ManagerProfile extends Profile {
  working_status: WorkingStatus;
}

export interface CreateManagerData {
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
 * Get all managers for a business
 */
export async function getManagers(businessCode: string): Promise<ManagerProfile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('business_code', businessCode)
    .eq('role', 'manager')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching managers:', error);
    throw error;
  }

  return data || [];
}

/**
 * Create a new manager with auth and profile
 */
export async function createManager(data: CreateManagerData): Promise<ManagerProfile> {
  try {
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
          role: 'manager',
          business_code: data.business_code
        }
      }
    });

    if (signUpError) {
      throw signUpError;
    }

    if (!authData.user) {
      throw new Error('Failed to create auth user');
    }

    // Create profile - RLS policies will ensure proper access
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: authData.user.id,
        full_name: data.full_name,
        his_email: data.email,
        main_branch: data.main_branch,
        phone_number: data.phone_number,
        salary: data.salary,
        role: 'manager',
        business_code: data.business_code,
        working_status: data.working_status,
        business_name: creatorProfile.business_name // Add business name from creator's profile
      })
      .select()
      .single();

    if (profileError) {
      console.error('Error creating manager profile:', profileError);
      throw profileError;
    }

    return profile;
  } catch (error) {
    console.error('Error in createManager:', error);
    throw error;
  }
}

/**
 * Update manager profile
 */
export async function updateManager(
  userId: string,
  updates: Partial<Omit<ManagerProfile, 'id' | 'user_id' | 'role' | 'business_code'>>
): Promise<ManagerProfile> {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('user_id', userId)
    .eq('role', 'manager')
    .select()
    .single();

  if (error) {
    console.error('Error updating manager:', error);
    throw error;
  }

  return data;
}

/**
 * Update manager working status
 */
export async function updateManagerStatus(
  userId: string,
  status: WorkingStatus
): Promise<ManagerProfile> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ working_status: status })
    .eq('user_id', userId)
    .eq('role', 'manager')
    .select()
    .single();

  if (error) {
    console.error('Error updating manager status:', error);
    throw error;
  }

  return data;
}

/**
 * Delete manager from profiles table
 * Note: Auth user will remain but won't have access to any data
 */
export async function deleteManager(userId: string): Promise<boolean> {
  try {
    // First verify this is actually a manager from our business
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, business_code')
      .eq('user_id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching manager profile:', profileError);
      throw profileError;
    }

    if (!profile || profile.role !== 'manager') {
      throw new Error('User is not a manager');
    }

    // Delete the profile - RLS policies will ensure only managers from the same business can be deleted
    const { error: deleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('user_id', userId)
      .eq('role', 'manager');

    if (deleteError) {
      console.error('Error deleting manager profile:', deleteError);
      throw deleteError;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteManager:', error);
    throw error;
  }
}