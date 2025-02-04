import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  businessCode: string;
}

interface AuthState {
  user: User | null;
  businessCode: string | null;
  setUser: (user: User | null) => void;
  setBusinessCode: (code: string | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      businessCode: null,
      setUser: (user) => set({ 
        user,
        businessCode: user?.businessCode || null
      }),
      setBusinessCode: (code) => set({ businessCode: code }),
    }),
    {
      name: 'auth-storage'
    }
  )
);