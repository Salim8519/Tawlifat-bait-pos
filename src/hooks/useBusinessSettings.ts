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
          data = await createBusinessSettings(user.businessCode);
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