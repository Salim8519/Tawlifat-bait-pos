import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';

/**
 * Checks if the current session is valid and handles session expiration
 * @returns Promise<boolean> - True if session is valid, false otherwise
 */
export async function checkAuthSession(): Promise<boolean> {
  try {
    // Get current session from Supabase
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error checking session:', error);
      return false;
    }
    
    // Get current user from store
    const { user } = useAuthStore.getState();
    
    // If no session but user exists in store, session has expired
    if (!data.session && user) {
      console.log('Session expired, clearing auth state');
      // Clear auth state
      useAuthStore.getState().setUser(null);
      
      // Clear any persisted state that might be causing issues
      localStorage.removeItem('auth-storage');
      sessionStorage.removeItem('redirectPath');
      
      return false;
    }
    
    // If session exists but no user in store, restore user from session
    if (data.session && !user) {
      console.log('Session exists but no user in store, session might be valid but state is inconsistent');
      return false;
    }
    
    // Session is valid
    return !!data.session;
  } catch (error) {
    console.error('Failed to check auth session:', error);
    return false;
  }
}

/**
 * Utility function to clear all Supabase cookies
 * Helps resolve issues with stale cookies in Chrome
 */
export function clearSupabaseCookies(): void {
  document.cookie.split(';').forEach(cookie => {
    const [name] = cookie.split('=');
    if (name.trim().startsWith('sb-')) {
      document.cookie = `${name.trim()}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    }
  });
}

/**
 * Saves the current path for redirect after login
 * @param path - The path to save
 */
export function saveRedirectPath(path: string): void {
  if (path && path !== '/login' && !path.includes('reset-password')) {
    sessionStorage.setItem('redirectPath', path);
  }
}

/**
 * Gets the saved redirect path or returns default
 * @param defaultPath - Default path to return if no saved path
 * @returns The path to redirect to
 */
export function getRedirectPath(defaultPath: string = '/dashboard'): string {
  const savedPath = sessionStorage.getItem('redirectPath');
  if (savedPath) {
    sessionStorage.removeItem('redirectPath');
    return savedPath;
  }
  return defaultPath;
}
