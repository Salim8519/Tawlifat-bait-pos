import { useEffect, useState } from 'react';
import { Store, Receipt, Tag, Users, Percent, AlertTriangle, Upload, Image } from 'lucide-react';
import { useLanguageStore } from '../store/useLanguageStore';
import { useAuthStore } from '../store/useAuthStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { settingsTranslations } from '../translations/settings';
import { VendorCommissionSettings } from '../components/settings/VendorCommissionSettings';
import { useBusinessSettings } from '../hooks/useBusinessSettings';
import { updateBusinessSettings } from '../services/settingsService';
import { useImageUpload } from '../hooks/useImageUpload';
import type { BusinessSettings } from '../types/settings';

export function SettingsPage() {
  const { language } = useLanguageStore();
  const { user } = useAuthStore();
  const { settings, setSettings } = useSettingsStore();
  const t = settingsTranslations[language];

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { upload, isUploading } = useImageUpload();
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [forceUpdate, setForceUpdate] = useState(0);

  // Use the hook to manage settings
  const { isLoading: isLoadingSettings, settings: currentSettings } = useBusinessSettings();

  const refreshImage = () => setForceUpdate(prev => prev + 1);

  const getUncachedLogoUrl = (url: string) => {
    if (!url) return null;
    const timestamp = new Date().getTime();
    return `${url}?t=${timestamp}`;
  };

  useEffect(() => {
    if (settings?.url_logo_of_business) {
      setLogoPreview(settings.url_logo_of_business);
      refreshImage();
    }
  }, [settings?.url_logo_of_business]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    try {
      const previewUrl = URL.createObjectURL(file);
      setLogoPreview(previewUrl);

      const uploadedUrl = await upload(file);
      console.log('Uploaded logo URL:', uploadedUrl);

      if (!uploadedUrl) {
        throw new Error('Failed to upload logo');
      }

      if (settings) {
        setSettings({
          ...settings,
          url_logo_of_business: uploadedUrl
        });

        await updateBusinessSettings(user!.businessCode, {
          url_logo_of_business: uploadedUrl
        });

        setLogoPreview(uploadedUrl);
        refreshImage();
        console.log('Logo URL saved to settings');
      }
    } catch (err) {
      console.error('Error uploading logo:', err);
      setError(t.errorUploadingLogo);
      setLogoPreview(null);
      if (settings?.url_logo_of_business) {
        setLogoPreview(settings.url_logo_of_business);
        refreshImage();
      }
    }
  };

  const handleSave = async (newSettings: Partial<BusinessSettings>) => {
    if (!user?.businessCode) return;
    
    setIsSaving(true);
    setError(null);
    
    try {
      console.log('Saving settings:', newSettings);
      const updatedSettings = await updateBusinessSettings(user.businessCode, newSettings);
      setSettings(updatedSettings);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingSettings) {
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
        <button
          onClick={() => handleSave({
            receipt_header: settings.receipt_header,
            receipt_footer: settings.receipt_footer,
            url_logo_of_business: settings.url_logo_of_business,
            loyalty_system_enabled: settings.loyalty_system_enabled,
            vendor_commission_enabled: settings.vendor_commission_enabled,
            default_commission_rate: settings.default_commission_rate,
            minimum_commission_amount: settings.minimum_commission_amount,
            tax_enabled: settings.tax_enabled,
            tax_rate: settings.tax_rate,
            extra_tax_monthly_on_vendors: settings.extra_tax_monthly_on_vendors
          })}
          disabled={isSaving}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-gray-400"
        >
          {isSaving ? t.saving : t.saveSettings}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow divide-y">
        {/* Product Types Settings */}
        <div className="p-6">
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-4">
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

          <div className="flex items-center space-x-3 space-x-reverse mb-6">
            <Image className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-medium">{t.businessLogo}</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-start space-x-4 space-x-reverse">
              {/* Logo Preview */}
              <div className="w-32 h-32 border-2 border-gray-300 rounded-lg overflow-hidden flex items-center justify-center bg-gray-50">
                {logoPreview ? (
                  <div className="relative w-full h-full">
                    <img
                      src={getUncachedLogoUrl(logoPreview)}
                      alt="Business logo"
                      className="w-full h-full object-contain"
                      key={forceUpdate}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setLogoPreview(null);
                        if (settings) {
                          setSettings({
                            ...settings,
                            url_logo_of_business: null
                          });
                        }
                      }}
                      className="absolute top-1 right-1 bg-red-100 text-red-600 rounded-full p-1 hover:bg-red-200"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <Store className="w-12 h-12 text-gray-400" />
                )}
              </div>

              {/* Upload Button */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.uploadLogo}
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500">
                        <span>{t.chooseFile}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="sr-only"
                          disabled={isUploading}
                        />
                      </label>
                    </div>
                    <p className="text-xs text-gray-500">
                      {isUploading ? t.uploading : t.uploadInstructions}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center space-x-3 space-x-reverse mb-4">
            <Tag className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-medium">{t.productTypes}</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.receiptHeader}:
              </label>
              <textarea
                value={settings.receipt_header || ''}
                onChange={(e) => setSettings({
                  ...settings,
                  receipt_header: e.target.value
                })}
                rows={2}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.receiptFooter}:
              </label>
              <textarea
                value={settings.receipt_footer || ''}
                onChange={(e) => setSettings({
                  ...settings,
                  receipt_footer: e.target.value
                })}
                rows={2}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              />
            </div>

            <div>
              <label className="flex items-center space-x-2 space-x-reverse">
                <input
                  type="checkbox"
                  checked={!!settings.url_logo_of_business}
                  onChange={(e) => setSettings({
                    ...settings,
                    url_logo_of_business: e.target.checked ? '' : null
                  })}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-gray-700">{t.showLogo}</span>
              </label>
            </div>
          </div>
        </div>

        {/* Loyalty System Settings */}
        <div className="p-6">
          <div className="flex items-center space-x-3 space-x-reverse mb-4">
            <Users className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-medium">{t.loyaltySystem}</h2>
          </div>
          
          <div>
            <label className="flex items-center space-x-2 space-x-reverse">
              <input
                type="checkbox"
                checked={settings.loyalty_system_enabled}
                onChange={(e) => setSettings({
                  ...settings,
                  loyalty_system_enabled: e.target.checked
                })}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm font-medium text-gray-700">{t.enableLoyalty}</span>
            </label>
          </div>
        </div>

        {/* Vendor Commission Settings */}
        <VendorCommissionSettings 
          settings={settings}
          onUpdate={(updates) => {
            setSettings({
              ...settings,
              ...updates
            });
          }}
        />

        {/* Tax Settings */}
        <div className="p-6">
          <div className="flex items-center space-x-3 space-x-reverse mb-4">
            <Percent className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-medium">{t.tax}</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="flex items-center space-x-2 space-x-reverse">
                <input
                  type="checkbox"
                  checked={settings.tax_enabled}
                  onChange={(e) => setSettings({
                    ...settings,
                    tax_enabled: e.target.checked
                  })}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-gray-700">{t.enableTax}</span>
              </label>
            </div>

            {settings.tax_enabled && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.taxPercentage}:
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={settings.tax_rate || 0}
                  onChange={(e) => setSettings({
                    ...settings,
                    tax_rate: parseFloat(e.target.value)
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  dir="ltr"
                />
              </div>
            )}

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
          </div>
        </div>

        {/* Monthly Vendor Tax Settings */}
        <div className="p-6">
          <div className="flex items-center space-x-3 space-x-reverse mb-4">
            <Percent className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-medium">{t.monthlyVendorTax}</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-medium text-gray-700 mb-2">
                {t.monthlyVendorTax}
              </h3>
              <div className="relative mt-1 rounded-md shadow-sm w-48">
                <input
                  type="number"
                  value={settings.extra_tax_monthly_on_vendors || ''}
                  onChange={(e) => setSettings({
                    ...settings,
                    extra_tax_monthly_on_vendors: parseFloat(e.target.value)
                  })}
                  className="block w-full rounded-md border-gray-300 pl-3 pr-10 py-2 text-base focus:border-blue-500 focus:ring-blue-500"
                  placeholder="0.00"
                  step="0.1"
                  min="0"
                />
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <span className="text-gray-500 text-base">%</span>
                </div>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                {t.monthlyVendorTaxDescription}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}