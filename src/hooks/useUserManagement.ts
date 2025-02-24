import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { nanoid } from 'nanoid';

interface CreateUserData {
  email: string;
  password: string;
  full_name: string;
  role: 'admin' | 'owner' | 'manager' | 'cashier' | 'vendor';
  is_vendor: boolean;
  vendor_business_name?: string;
  business_name?: string;
  phone_number?: string;
  main_branch?: string;
}

export function useUserManagement() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createUser = async (userData: CreateUserData) => {
    setLoading(true);
    setError(null);
    
    try {
      // Generate a random business code
      const business_code = nanoid(10);

      // 1. Create auth user using signUp
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            role: userData.role // Store role in auth metadata
          }
        }
      });

      if (authError) throw new Error(authError.message);
      if (!authData.user) throw new Error('Failed to create user');

      // 2. Create profile
      const profileData = {
        user_id: authData.user.id,
        his_email: userData.email,
        full_name: userData.full_name,
        role: userData.role,
        is_vendor: userData.is_vendor,
        business_code: business_code,
        phone_number: userData.phone_number || null,
        main_branch: userData.main_branch || null
      };

      // Add vendor or business name based on is_vendor flag
      if (userData.is_vendor) {
        Object.assign(profileData, {
          'vendor_business _name': userData.vendor_business_name // Note the space in column name
        });
      } else {
        Object.assign(profileData, {
          business_name: userData.business_name
        });
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .insert(profileData);

      if (profileError) {
        console.error('Profile creation error:', profileError);
        throw new Error(profileError.message);
      }

      return { success: true, business_code };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      console.error('Error creating user:', err);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return {
    createUser,
    loading,
    error
  };
}
