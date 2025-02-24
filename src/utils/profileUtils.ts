import { Profile } from '../hooks/useProfiles';

export function getBusinessName(profile: Profile): string {
  if (!profile) return 'No profile data';
  
  // Debug logging
  console.log('Profile business data:', {
    id: profile.id,
    is_vendor: profile.is_vendor,
    vendor_business_name: profile['vendor_business _name'],
    business_name: profile.business_name,
    all_keys: Object.keys(profile)
  });

  if (profile.is_vendor) {
    // The column name has a space in it
    const vendorName = profile['vendor_business _name'];
    console.log('Vendor name from column:', vendorName);
    return vendorName || 'No vendor business name';
  }

  return profile.business_name || 'No business name';
}
