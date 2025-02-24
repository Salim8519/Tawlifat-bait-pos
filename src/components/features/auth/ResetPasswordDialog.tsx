import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useLanguageStore } from '../../../store/useLanguageStore';
import { loginTranslations } from '../../../translations/login';
import { resetPasswordRequest } from '../../../services/passwordService';

interface ResetPasswordDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ResetPasswordDialog({ isOpen, onClose }: ResetPasswordDialogProps) {
  const { language } = useLanguageStore();
  const t = loginTranslations[language];
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const { error } = await resetPasswordRequest(email);
    
    setIsLoading(false);
    if (error) {
      setError(error);
    } else {
      setSuccess(true);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md relative" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-xl font-semibold mb-4">{t.resetPassword}</h2>

        {success ? (
          <div className="text-green-600 mb-4">
            {t.resetPasswordSuccess}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700">
                {t.email}
              </label>
              <input
                id="reset-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {isLoading ? t.sending : t.sendResetLink}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
