import { useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { getBusinessSettings } from '../services/settingsService';

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
        const data = await getBusinessSettings(user.businessCode);
        setSettings(data);
      } catch (err) {
        console.error('Error loading business settings:', err);
        setError(err instanceof Error ? err.message : 'Failed to load settings');
      } finally {
        setIsLoading(false);
      }
    };

    if (!settings) {
      loadSettings();
    }
  }, [user?.businessCode]);

  return {
    settings,
    isLoading,
    error
  };
}