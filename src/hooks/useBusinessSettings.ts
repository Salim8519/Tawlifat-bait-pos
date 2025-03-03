import { useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { getBusinessSettings, createBusinessSettings } from '../services/settingsService';

export function useBusinessSettings() {
  const { user } = useAuthStore();
  const { 
    settings,
    isLoading,
    error,
    setSettings,
    setIsLoading,
    setError
  } = useSettingsStore();

  useEffect(() => {
    const loadSettings = async () => {
      if (!user?.businessCode) return;

      try {
        setIsLoading(true);
        setError(null);
        let data = await getBusinessSettings(user.businessCode);
        
        // If no settings exist, create default settings
        if (!data) {
          console.log('Creating default settings for business:', user.businessCode);
          try {
            data = await createBusinessSettings(user.businessCode);
            if (!data) {
              throw new Error('Failed to create default settings');
            }
          } catch (createError) {
            console.error('Error creating default settings:', createError);
            // Provide fallback default settings to prevent UI errors
            data = {
              business_code_: user.businessCode,
              setting_id: 'temp-' + Date.now(),
              default_commission_rate: 10,
              tax_rate: 0,
              tax_enabled: false,
              receipt_header: '',
              receipt_footer: '',
              url_logo_of_business: null,
              loyalty_system_enabled: false,
              vendor_commission_enabled: false,
              minimum_commission_amount: 0,
              extra_tax_monthly_on_vendors: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
          }
        }
        
        setSettings(data);
      } catch (err) {
        console.error('Error loading business settings:', err);
        setError(err instanceof Error ? err.message : 'Failed to load settings');
      } finally {
        setIsLoading(false);
      }
    };

    // Only load if settings are null or business code changed
    if (!settings || settings.business_code_ !== user?.businessCode) {
      loadSettings();
    }
  }, [user?.businessCode]);

  return {
    settings,
    isLoading,
    error
  };
}