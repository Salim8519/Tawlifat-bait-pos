import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';

export interface Profile {
  business_code: string | null;
  business_name: string | null;
  full_name: string | null;
  phone_number: number | null;
  working_status: string | null;
  is_vendor: boolean | null;
  his_email: string | null;
  id: string;
  user_id: string;
  created_at: string | null;
  salary: number | null;
  "vendor_business _name": string | null;
  role: string | null;
  main_branch: string | null;
}

export function useProfiles() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    async function fetchProfiles() {
      try {
        if (!user) {
          console.warn('No authenticated user found');
          setError('Please sign in to view profiles');
          setLoading(false);
          return;
        }

        console.log('Fetching profiles for user role:', user.role);
        
        // Only fetch if user is admin
        if (user.role !== 'admin') {
          setError('Access denied: Admin role required');
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('*');

        console.log('Supabase response:', { data, error });

        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }

        if (!data) {
          console.warn('No data returned from Supabase');
          setProfiles([]);
          return;
        }

        console.log('Fetched profiles:', data);
        setProfiles(data);
      } catch (err) {
        console.error('Error in fetchProfiles:', err);
        setError(err instanceof Error ? err.message : 'An error occurred while fetching profiles');
      } finally {
        setLoading(false);
      }
    }

    fetchProfiles();
  }, [user]);

  return { profiles, loading, error };
}
