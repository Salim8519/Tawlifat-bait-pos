import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { checkAuthSession, saveRedirectPath } from '../services/authCheckService';

/**
 * Hook to check authentication status and redirect if needed
 * @param redirectTo - Path to redirect to if not authenticated
 * @returns Object containing authentication state
 */
export function useAuthCheck(redirectTo: string = '/login') {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      setIsChecking(true);
      try {
        // Check if session is valid
        const isValid = await checkAuthSession();
        
        setIsAuthenticated(isValid && !!user);
        
        // If not authenticated, save current path and redirect
        if (!isValid || !user) {
          // Save current path for redirect after login
          const currentPath = location.pathname + location.search + location.hash;
          saveRedirectPath(currentPath);
          
          // Redirect to login
          navigate(redirectTo, { replace: true });
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
    
    // Set up periodic checks
    const intervalId = setInterval(async () => {
      const isValid = await checkAuthSession();
      setIsAuthenticated(isValid && !!user);
      
      if (!isValid || !user) {
        // Save current path for redirect after login
        const currentPath = location.pathname + location.search + location.hash;
        saveRedirectPath(currentPath);
        
        // Redirect to login
        navigate(redirectTo, { replace: true });
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(intervalId);
  }, [user, navigate, redirectTo, location]);

  return {
    isChecking,
    isAuthenticated
  };
}
