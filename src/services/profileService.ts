import { supabase } from '../lib/supabase';
import type { Profile } from '../types/profile';

export async function getUserMainBranch(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('main_branch')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching user main branch:', error);
    return null;
  }

  return data?.main_branch || null;
}
export async function getProfile(userId: string): Promise<Profile | null> {
  console.log('Fetching profile for user:', userId);

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  console.log('Profile data retrieved:', {
    userId,
    role: data?.role,
    mainBranch: data?.main_branch,
    businessCode: data?.business_code
  });
  return data;
}

export function getRedirectPath(profile: Profile): string {
  if (!profile.role) {
    return '/setup-profile';
  }

  const role = profile.role.toLowerCase();
  console.log('Determining redirect path for role:', role);

  switch (role) {
    case 'admin':
      return '/admin/dashboard';
    case 'owner':
      return '/dashboard';
    case 'cashier':
      return '/pos';
    case 'vendor': {
      // Vendor should go to sub-vendor dashboard
      console.log('Redirecting vendor to sub-vendor dashboard');
      return '/dashboard';
    }
    default:
      console.log('Using default redirect to dashboard');
      return '/dashboard';
  }
}