import React, { useState, useEffect } from 'react';
import { Store, Mail, Phone, AlertTriangle } from 'lucide-react';
import { useLanguageStore } from '../store/useLanguageStore';
import { useAuthStore } from '../store/useAuthStore';
import { vendorSettingsTranslations } from '../translations/vendorSettings';
import { getVendorProfile, updateVendorProfile } from '../services/vendorService';
import type { VendorProfile } from '../types/vendor';

export function VendorSettingsPage() {
  const { language } = useLanguageStore();
  const { user } = useAuthStore();
  const t = vendorSettingsTranslations[language];

  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user?.businessCode) {
      loadProfile();
    }
  }, [user?.businessCode]);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const data = await getVendorProfile(user!.businessCode);
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
      setError(t.errorLoadingProfile);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsSaving(true);

    try {
      const formData = new FormData(e.currentTarget);
      const updates = {
        full_name: formData.get('full_name') as string,
        vendor_business_name: formData.get('business_name') as string,
        his_email: formData.get('email') as string,
      };

      await updateVendorProfile(user!.businessCode, updates);
      setSuccess(true);
      await loadProfile(); // Reload profile to show updated data
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(t.errorSavingProfile);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">{t.loading}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t.settings}</h1>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="flex items-center space-x-4 space-x-reverse mb-6">
            <div className="bg-indigo-100 p-3 rounded-full">
              <Store className="w-6 h-6 text-indigo-600" />
            </div>
            <h2 className="text-lg font-semibold">{t.businessInformation}</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Business Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.businessName} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="business_name"
                defaultValue={profile?.vendor_business_name || ''}
                required
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              />
            </div>

            {/* Owner Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.ownerName} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="full_name"
                defaultValue={profile?.full_name || ''}
                required
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.email} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  defaultValue={profile?.his_email || ''}
                  required
                  className="w-full pr-10 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Business Code (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.businessCode}
              </label>
              <input
                type="text"
                value={profile?.business_code || ''}
                readOnly
                className="w-full px-3 py-2 border rounded-md bg-gray-50"
                dir="ltr"
              />
              <p className="mt-1 text-sm text-gray-500">{t.businessCodeHint}</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="mr-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="rounded-md bg-green-50 p-4">
                <p className="text-sm text-green-700">{t.profileUpdated}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-gray-400"
              >
                {isSaving ? t.saving : t.save}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}