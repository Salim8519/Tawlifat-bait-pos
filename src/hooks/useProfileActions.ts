import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Profile } from './useProfiles';

interface UpdateProfileData {
  full_name?: string;
  role?: 'admin' | 'owner' | 'manager' | 'cashier' | 'vendor';
  is_vendor?: boolean;
  vendor_business_name?: string;
  business_name?: string;
  phone_number?: string;
  main_branch?: string;
  business_code?: string;
}

export function useProfileActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProfile = async (id: string, data: UpdateProfileData) => {
    setLoading(true);
    setError(null);

    try {
      // If changing vendor status, handle business names
      const updateData = { ...data };
      if ('is_vendor' in data) {
        if (data.is_vendor) {
          updateData['vendor_business_name'] = data.vendor_business_name;
          updateData.business_name = null;
        } else {
          updateData['vendor_business_name'] = null;
          updateData.business_name = data.business_name;
        }
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', id);

      if (updateError) throw new Error(updateError.message);

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const deleteProfile = async (profile: Profile) => {
    setLoading(true);
    setError(null);

    try {
      // First, call the delete_user function to remove the auth user
      const { data: deleteAuthData, error: deleteAuthError } = await supabase
        .functions.invoke('delete-user', {
          body: { user_id: profile.user_id }
        });

      if (deleteAuthError) {
        console.error('Error deleting auth user:', deleteAuthError);
        throw new Error(deleteAuthError.message);
      }

      // Then delete the profile
      const { error: deleteProfileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', profile.id);

      if (deleteProfileError) {
        console.error('Error deleting profile:', deleteProfileError);
        throw new Error(deleteProfileError.message);
      }

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      console.error('Error in deleteProfile:', err);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return {
    updateProfile,
    deleteProfile,
    loading,
    error
  };
}
