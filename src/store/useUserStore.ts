import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  business_name: string;
  business_code: string;
  main_branch: string;
  role: string;
  is_vendor: boolean;
  working_status: string;
  his_email: string;
  phone_number: number | null;
}

interface UserState {
  userProfile: UserProfile | null;
  setUserProfile: (profile: UserProfile | null) => void;
  fetchUserProfile: () => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
  userProfile: null,
  setUserProfile: (profile) => set({ userProfile: profile }),
  fetchUserProfile: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ userProfile: null });
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        set({ userProfile: null });
        return;
      }

      set({ userProfile: profile });
    } catch (err) {
      console.error('Error in fetchUserProfile:', err);
      set({ userProfile: null });
    }
  }
}));
