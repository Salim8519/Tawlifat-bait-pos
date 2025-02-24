import React, { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { Store, AlertCircle } from 'lucide-react';
import { useLanguageStore } from '../store/useLanguageStore';
import { loginTranslations } from '../translations/login';
import { useAuthStore } from '../store/useAuthStore';
import { useAuth } from '../hooks/useAuth';
import { getRedirectPath } from '../services/profileService';
import { checkRateLimit, sanitizeInput, validateEmail } from '../services/securityService';

export function LoginPage() {
  const { language } = useLanguageStore();
  const t = loginTranslations[language];
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { signIn, isLoading, error } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  // Redirect if already logged in
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    // Sanitize inputs
    const sanitizedEmail = sanitizeInput(email);
    
    // Validate email format
    if (!validateEmail(sanitizedEmail)) {
      setLocalError('Invalid email format');
      return;
    }

    // Check rate limiting
    const { blocked, remainingAttempts } = checkRateLimit(sanitizedEmail);
    if (blocked) {
      setLocalError('Too many login attempts. Please try again in 15 minutes.');
      return;
    }

    // Proceed with login
    const { user, profile } = await signIn(sanitizedEmail, password);
    if (user && profile) {
      const redirectPath = getRedirectPath(profile);
      navigate(redirectPath);
    } else if (remainingAttempts > 0) {
      setLocalError(`Login failed. ${remainingAttempts} attempts remaining.`);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value.toLowerCase()); // Convert to lowercase for consistency
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Store className="w-12 h-12 text-indigo-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          {t.title}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit} autoComplete="off">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                {t.email}
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={handleEmailChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  autoComplete="off"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  {t.password}
                </label>
                <Link
                  to="/reset-password"
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                  {t.forgotPassword}
                </Link>
              </div>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  autoComplete="off"
                />
              </div>
            </div>

            {(error || localError) && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="mr-3">
                    <p className="text-sm text-red-700">{localError || error}</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {isLoading ? t.loggingIn : t.login}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}