import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { getProfile } from '../services/profileService';
import { validateBusinessAccess } from '../services/businessService';
import type { Profile } from '../types/profile';

export function useAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setUser } = useAuthStore();

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw error;
      }
      
      if (data.user) {
        const profile = await getProfile(data.user.id);
        if (profile) {
          console.log('Profile loaded:', profile);
          // Validate business access
          const hasAccess = await validateBusinessAccess(profile);
          console.log('Business access validated:', hasAccess);
          if (!hasAccess) {
            throw new Error('Invalid business code or no access to this business');
          }

          console.log('Setting user with business code:', profile.business_code);
          setUser({
            id: data.user.id,
            email: data.user.email!,
            name: profile.full_name || '',
            role: profile.role || 'user',
            businessCode: profile.business_code || ''
          });
        }
        return { user: data.user, profile };
      }

      return { user: null, profile: null };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return { user: null, profile: null };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Clear business and branch state before signing out
      localStorage.removeItem('business-storage');
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      setUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };


  return {
    signIn,
    signOut,
    isLoading,
    error
  };
}