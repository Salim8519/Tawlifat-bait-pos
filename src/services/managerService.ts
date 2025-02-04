import { supabase } from '../lib/supabase';
import { createClient } from '@supabase/supabase-js';
import type { Profile } from '../types/profile';

// Create a supabase client with service role for admin operations
const supabaseAdmin = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

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
  let userId: string;

  try {
    // First check if user exists
    const { data: userData } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = userData.users.find(u => u.email === data.email);

    if (existingUser) {
      // User exists, update their metadata and password
      userId = existingUser.id;
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        {
          password: data.password,
          user_metadata: {
            role: 'manager',
            business_code: data.business_code
          }
        }
      );

      if (updateError) {
        throw updateError;
      }
    } else {
      // Create new auth user
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
        user_metadata: {
          role: 'manager',
          business_code: data.business_code
        }
      });

      if (authError) {
        throw authError;
      }

      userId = authData.user.id;
    }

    // Create or update profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        user_id: userId,
        full_name: data.full_name,
        his_email: data.email,
        main_branch: data.main_branch,
        phone_number: data.phone_number,
        salary: data.salary,
        role: 'manager',
        business_code: data.business_code,
        working_status: data.working_status
      })
      .select()
      .single();

    if (profileError) {
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
 * Delete manager from profiles table and auth
 */
export async function deleteManager(userId: string): Promise<boolean> {
  try {
    // First verify this is actually a manager
    const { data: profile, error: checkError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (checkError) {
      console.error('Error checking manager profile:', checkError);
      throw checkError;
    }

    if (profile?.role !== 'manager') {
      throw new Error('User is not a manager');
    }

    // Delete specific manager profile
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .match({
        user_id: userId,
        role: 'manager'
      });

    if (profileError) {
      console.error('Error deleting manager profile:', profileError);
      throw profileError;
    }

    // Delete the user from auth.users using admin client
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(
      userId
    );

    if (authError) {
      console.error('Error deleting auth user:', authError);
      throw authError;
    }
    return true;
  } catch (error) {
    console.error('Error in deleteManager:', error);
    throw error;
  }
}