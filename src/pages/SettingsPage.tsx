import React, { useState } from 'react';
import { Store, Receipt, Tag, Users, Percent } from 'lucide-react';
import { useLanguageStore } from '../store/useLanguageStore';
import { settingsTranslations } from '../translations/settings';
import { VendorCommissionSettings } from '../components/settings/VendorCommissionSettings';

interface StoreSettings {
  allowedProductTypes: {
    food: boolean;
    nonFood: boolean;
  };
  defaultProductType: 'food' | 'non-food';
  loyaltySystem: boolean;
  taxEnabled: boolean;
  taxPercentage: number;
  receipt: {
    header: string;
    footer: string;
    showLogo: boolean;
  };
}

const defaultSettings: StoreSettings = {
  allowedProductTypes: {
    food: true,
    nonFood: true,
  },
  defaultProductType: 'non-food',
  loyaltySystem: true,
  taxEnabled: false,
  taxPercentage: 5,
  receipt: {
    header: 'متجر السعادة',
    footer: 'شكراً لزيارتكم',
    showLogo: true,
  },
};

export function SettingsPage() {
  const { language } = useLanguageStore();
  const t = settingsTranslations[language];

  const [settings, setSettings] = useState<StoreSettings>(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    // Show success message
    alert(t.settingsSaved);
  };

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t.settings}</h1>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-gray-400"
        >
          {isSaving ? t.saving : t.saveSettings}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow divide-y">
        {/* Product Types Settings */}
        <div className="p-6">
          <div className="flex items-center space-x-3 space-x-reverse mb-4">
            <Tag className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-medium">{t.productTypes}</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium text-gray-700">{t.allowedProducts}:</label>
              <div className="space-y-2">
                <label className="flex items-center space-x-2 space-x-reverse">
                  <input
                    type="checkbox"
                    checked={settings.allowedProductTypes.food}
                    onChange={(e) => setSettings({
                      ...settings,
                      allowedProductTypes: {
                        ...settings.allowedProductTypes,
                        food: e.target.checked
                      }
                    })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>{t.foodProducts}</span>
                </label>
                <label className="flex items-center space-x-2 space-x-reverse">
                  <input
                    type="checkbox"
                    checked={settings.allowedProductTypes.nonFood}
                    onChange={(e) => setSettings({
                      ...settings,
                      allowedProductTypes: {
                        ...settings.allowedProductTypes,
                        nonFood: e.target.checked
                      }
                    })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>{t.nonFoodProducts}</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.defaultProductType}:
              </label>
              <select
                value={settings.defaultProductType}
                onChange={(e) => setSettings({
                  ...settings,
                  defaultProductType: e.target.value as 'food' | 'non-food'
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                disabled={!settings.allowedProductTypes.food && !settings.allowedProductTypes.nonFood}
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              >
                <option value="food" disabled={!settings.allowedProductTypes.food}>
                  {t.foodProducts}
                </option>
                <option value="non-food" disabled={!settings.allowedProductTypes.nonFood}>
                  {t.nonFoodProducts}
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* Receipt Settings */}
        <div className="p-6">
          <div className="flex items-center space-x-3 space-x-reverse mb-4">
            <Receipt className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-medium">{t.receipt}</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.receiptHeader}:
              </label>
              <textarea
                value={settings.receipt.header}
                onChange={(e) => setSettings({
                  ...settings,
                  receipt: {
                    ...settings.receipt,
                    header: e.target.value
                  }
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
                value={settings.receipt.footer}
                onChange={(e) => setSettings({
                  ...settings,
                  receipt: {
                    ...settings.receipt,
                    footer: e.target.value
                  }
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
                  checked={settings.receipt.showLogo}
                  onChange={(e) => setSettings({
                    ...settings,
                    receipt: {
                      ...settings.receipt,
                      showLogo: e.target.checked
                    }
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
                checked={settings.loyaltySystem}
                onChange={(e) => setSettings({
                  ...settings,
                  loyaltySystem: e.target.checked
                })}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm font-medium text-gray-700">{t.enableLoyalty}</span>
            </label>
          </div>
        </div>

        {/* Vendor Commission Settings */}
        <VendorCommissionSettings />

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
                  checked={settings.taxEnabled}
                  onChange={(e) => setSettings({
                    ...settings,
                    taxEnabled: e.target.checked
                  })}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-gray-700">{t.enableTax}</span>
              </label>
            </div>

            {settings.taxEnabled && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.taxPercentage}:
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={settings.taxPercentage}
                  onChange={(e) => setSettings({
                    ...settings,
                    taxPercentage: parseFloat(e.target.value)
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  dir="ltr"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}