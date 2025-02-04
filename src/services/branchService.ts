import { supabase } from '../lib/supabase';
import type { Branch } from '../types/branch';

export async function getBranches(businessCode: string): Promise<Branch[]> {
  const { data, error } = await supabase
    .from('branches')
    .select('*')
    .eq('business_code', businessCode);

  if (error) {
    console.error('Error fetching branches:', error);
    throw error;
  }

  return data || [];
}

export async function createBranch(branch: Omit<Branch, 'branch_id'>): Promise<Branch> {
  const { data, error } = await supabase
    .from('branches')
    .insert([branch])
    .select()
    .single();

  if (error) {
    console.error('Error creating branch:', error);
    throw error;
  }

  return data;
}

export async function updateBranch(branchId: string, updates: Partial<Omit<Branch, 'branch_id' | 'business_code'>>): Promise<Branch> {
  const { data, error } = await supabase
    .from('branches')
    .update(updates)
    .eq('branch_id', branchId)
    .select()
    .single();

  if (error) {
    console.error('Error updating branch:', error);
    throw error;
  }

  return data;
}

export async function toggleBranchStatus(branchId: string, isActive: boolean): Promise<Branch> {
  try {
    const { data, error } = await supabase
      .from('branches')
      .update({ is_active: isActive })
      .eq('branch_id', branchId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error('Branch not found');
    }

    return data;
  } catch (error) {
    console.error('Error updating branch status:', error);
    throw error;
  }
}