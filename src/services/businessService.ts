import { supabase } from '../lib/supabase';
import type { Profile } from '../types/profile';
import type { Branch } from '../types/branch';

export async function getUsersByBusinessCode(businessCode: string): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('business_code', businessCode);

  if (error) {
    console.error('Error fetching users by business code:', error);
    return [];
  }

  return data || [];
}

export async function getBranchesByBusinessCode(businessCode: string): Promise<Branch[]> {
  console.log('Fetching branches for business code:', businessCode);
  const { data, error } = await supabase
    .from('branches')
    .select('*')
    .eq('business_code', businessCode);

  if (error) {
    console.error('Error fetching branches:', error);
    return [];
  }

  console.log('Supabase branches response:', { businessCode, data, error });
  return data || [];
}

export async function validateBusinessAccess(profile: Profile): Promise<boolean> {
  if (!profile.role || !profile.business_code) {
    console.error('Missing required profile fields:', { role: profile.role, business_code: profile.business_code });
    return false;
  }

  // For vendors, just verify they have is_vendor flag
  if (profile.role === 'vendor' && !profile.is_vendor) {
    console.error('Invalid vendor profile: is_vendor flag not set');
    return false;
  }

  // For admin role, always allow access
  if (profile.role === 'admin') {
    console.log('Admin access granted');
    return true;
  }

  // For any other role, allow access if they have a business code
  console.log('Default access granted for role:', profile.role);
  return true;
}