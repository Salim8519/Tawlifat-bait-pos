import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';

// Demo users with different roles
const demoUsers = [
  {
    id: 'owner1',
    name: 'أحمد محمد',
    role: 'owner',
    email: 'owner@demo.com',
    username: 'owner',
    password: 'owner123'
  },
  {
    id: 'vendor1',
    name: 'علي سالم',
    role: 'sub_vendor',
    email: 'vendor@demo.com',
    username: 'vendor',
    password: 'vendor123'
  },
  {
    id: 'cashier1',
    name: 'فاطمة أحمد',
    role: 'cashier',
    email: 'cashier@demo.com',
    username: 'cashier',
    password: 'cashier123'
  },
  {
    id: 'admin1',
    name: 'Admin',
    role: 'super_admin',
    email: 'admin@demo.com',
    username: 'admin',
    password: 'admin123'
  }
] as const;

interface AuthState {
  user: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      login: (username, password) => {
        const user = demoUsers.find(u => 
          u.username === username && u.password === password
        );
        
        if (user) {
          const { password: _, ...userWithoutPassword } = user;
          set({ user: userWithoutPassword });
          return true;
        }
        return false;
      },
      logout: () => set({ user: null })
    }),
    {
      name: 'auth-storage'
    }
  )
);