import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Configure Supabase client with options to handle cookie issues in Chrome
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // Keep session alive between page refreshes
    storageKey: 'supabase-auth', // Use a custom storage key
    storage: {
      getItem: (key) => {
        try {
          const storedSession = localStorage.getItem(key);
          if (!storedSession) return null;
          return JSON.parse(storedSession);
        } catch (error) {
          console.error('Error retrieving auth session:', error);
          return null;
        }
      },
      setItem: (key, value) => {
        try {
          localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
          console.error('Error storing auth session:', error);
        }
      },
      removeItem: (key) => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.error('Error removing auth session:', error);
        }
      },
    },
    autoRefreshToken: true, // Automatically refresh token if it expires
    detectSessionInUrl: false, // Don't detect session in URL to avoid issues with hash router
  },
  global: {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  },
});

// Add event listener for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth state changed:', event);
  
  if (event === 'SIGNED_OUT') {
    // Clear any persisted state that might be causing issues
    localStorage.removeItem('auth-storage');
    sessionStorage.clear();
    
    // Clear any Supabase cookies
    document.cookie.split(';').forEach(cookie => {
      const [name] = cookie.split('=');
      if (name.trim().startsWith('sb-')) {
        document.cookie = `${name.trim()}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      }
    });
  }
});