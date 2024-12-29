import React from 'react';
import { Percent } from 'lucide-react';
import { useLanguageStore } from '../../store/useLanguageStore';
import { settingsTranslations } from '../../translations/settings';
import { useSettingsStore } from '../../store/useSettingsStore';

export function VendorCommissionSettings() {
  const { language } = useLanguageStore();
  const t = settingsTranslations[language];
  const { vendorCommission, updateVendorCommission } = useSettingsStore();

  return (
    <div className="p-6 bg-white rounded-lg shadow divide-y">
      <div className="flex items-center space-x-3 space-x-reverse mb-4">
        <Percent className="w-5 h-5 text-indigo-600" />
        <h2 className="text-lg font-medium">{t.vendorCommission}</h2>
      </div>
      
      <div className="pt-4 space-y-4">
        <div>
          <label className="flex items-center space-x-2 space-x-reverse">
            <input
              type="checkbox"
              checked={vendorCommission.isEnabled}
              onChange={(e) => updateVendorCommission({ isEnabled: e.target.checked })}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm font-medium text-gray-700">{t.enableCommission}</span>
          </label>
        </div>

        {vendorCommission.isEnabled && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.defaultCommission}
              </label>
              <div className="flex items-center">
                <input
                  type="number"
                  value={vendorCommission.percentage}
                  onChange={(e) => updateVendorCommission({ percentage: parseFloat(e.target.value) })}
                  min="0"
                  max="100"
                  step="0.1"
                  className="w-24 px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  dir="ltr"
                />
                <span className="mr-2">%</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.minimumAmount}
              </label>
              <div className="flex items-center">
                <input
                  type="number"
                  value={vendorCommission.minimumAmount}
                  onChange={(e) => updateVendorCommission({ minimumAmount: parseFloat(e.target.value) })}
                  min="0"
                  step="0.1"
                  className="w-32 px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  dir="ltr"
                />
                <span className="mr-2">{t.currency}</span>
              </div>
              <p className="mt-1 text-sm text-gray-500">{t.minimumAmountHint}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}