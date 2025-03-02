import { supabase } from '../lib/supabase';
import type { Profile } from '../types/profile';
import type { Branch } from '../types/branch';

/**
 * Gets the business name for a given business code
 * This function tries multiple sources to find the business name
 * @param businessCode The business code to look up
 * @returns The business name or a default value if not found
 */
export async function getBusinessName(businessCode: string): Promise<string> {
  try {
    // Try to get business name from any profile with this business code first
    // This is more reliable than filtering by role which can cause 406 errors
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('business_name')
      .eq('business_code', businessCode)
      .order('created_at', { ascending: true })
      .limit(1);

    if (!profileError && profileData && profileData.length > 0 && profileData[0].business_name) {
      console.log(`Found business name from profile: ${profileData[0].business_name}`);
      return profileData[0].business_name;
    }

    // If no profile found or error occurred, try business_settings table
    const { data: settingsData, error: settingsError } = await supabase
      .from('business_settings')
      .select('business_name')
      .eq('business_code', businessCode)
      .maybeSingle();

    if (!settingsError && settingsData && settingsData.business_name) {
      console.log(`Found business name from business_settings: ${settingsData.business_name}`);
      return settingsData.business_name;
    }

    // If we still don't have a valid name, return a default
    console.log(`No business name found for code: ${businessCode}, using default`);
    return 'Unknown Business';
  } catch (error) {
    console.error('Error in getBusinessName:', error);
    return 'Unknown Business';
  }
}

/**
 * Ensures a valid business name is available for operations
 * If the provided businessName is empty, it fetches from the database
 * @param businessCode The business code to look up
 * @param currentBusinessName Optional current business name
 * @returns A valid business name
 */
export async function ensureBusinessName(
  businessCode: string, 
  currentBusinessName?: string
): Promise<string> {
  // If we already have a valid business name, use it
  if (currentBusinessName && currentBusinessName.trim() !== '') {
    console.log(`Using provided business name: ${currentBusinessName}`);
    return currentBusinessName;
  }
  
  console.log(`No business name provided, looking up for business code: ${businessCode}`);
  
  // Otherwise fetch from database using our multi-step lookup process
  try {
    const businessName = await getBusinessName(businessCode);
    
    // If we got a valid business name, return it
    if (businessName && businessName !== 'Unknown Business') {
      console.log(`Found business name from database: ${businessName}`);
      return businessName;
    }
    
    // If we still don't have a valid name, use a fallback with the business code
    const fallbackName = `Business-${businessCode}`;
    console.log(`No business name found in database, using fallback: ${fallbackName}`);
    return fallbackName;
  } catch (error) {
    console.error('Error ensuring business name:', error);
    // Use a fallback with the business code
    const fallbackName = `Business-${businessCode}`;
    console.log(`Exception occurred, using fallback: ${fallbackName}`);
    return fallbackName;
  }
}

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