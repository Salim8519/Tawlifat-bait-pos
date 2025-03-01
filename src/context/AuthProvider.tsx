import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { getProfile } from '../services/profileService';
import { LoadingScreen } from '../components/common/LoadingScreen';
import { useLanguageStore } from '../store/useLanguageStore';

interface AuthContextType {
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  isLoading: true,
  isAuthenticated: false,
});

export const useAuthContext = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { user, setUser } = useAuthStore();
  const { language } = useLanguageStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Function to check if current path is public
  const isPublicPath = (path: string): boolean => {
    const publicPaths = ['/login', '/reset-password', '/update-password'];
    return publicPaths.some(publicPath => path.startsWith(publicPath));
  };

  // Function to handle authentication state change
  const handleAuthChange = async (session: any) => {
    setIsLoading(true);

    try {
      if (session?.user) {
        const profile = await getProfile(session.user.id);
        
        if (profile) {
          setUser({
            id: session.user.id,
            email: session.user.email!,
            name: profile.full_name || '',
            role: profile.role || 'user',
            businessCode: profile.business_code || '',
            main_branch: profile.main_branch || undefined
          });
          setIsAuthenticated(true);
        } else {
          // Profile not found, log out
          console.warn('User profile not found, logging out');
          await supabase.auth.signOut();
          setUser(null);
          setIsAuthenticated(false);
          if (!isPublicPath(location.pathname)) {
            navigate('/login', { replace: true });
          }
        }
      } else {
        // No session, user is not authenticated
        setUser(null);
        setIsAuthenticated(false);
        if (!isPublicPath(location.pathname)) {
          navigate('/login', { replace: true });
        }
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
      setUser(null);
      setIsAuthenticated(false);
      if (!isPublicPath(location.pathname)) {
        navigate('/login', { replace: true });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Initial session check and subscription to auth changes
  useEffect(() => {
    // Check current session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      await handleAuthChange(session);
    };

    checkSession();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        await handleAuthChange(session);
      }
    );

    // Periodic session check (every 5 minutes)
    const intervalId = setInterval(checkSession, 5 * 60 * 1000);

    return () => {
      subscription?.unsubscribe();
      clearInterval(intervalId);
    };
  }, []);

  // Check authentication when location changes
  useEffect(() => {
    // If we're on a protected route and not authenticated, redirect to login
    if (!isLoading && !isAuthenticated && !isPublicPath(location.pathname)) {
      navigate('/login', { replace: true });
    }
  }, [location.pathname, isAuthenticated, isLoading]);

  // Show loading screen during initial authentication check
  if (isLoading) {
    const loadingMessage = language === 'ar' ? 'جاري التحميل...' : 'Loading...';
    return <LoadingScreen message={loadingMessage} />;
  }

  return (
    <AuthContext.Provider value={{ isLoading, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};
