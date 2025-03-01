import { useState } from 'react';
import { 
  printBarcodeV2, 
  generateBarcodePreview, 
  getCachedBarcodeSettingsV2, 
  saveBarcodeSettingsV2,
  applyPrinterTemplate,
  type BarcodeDataV2, 
  type BarcodeSettingsV2,
  PRINTER_TEMPLATES
} from '../services/barcodeServiceV2';

/**
 * Enhanced barcode service hook for version 2
 * Provides a simple interface for barcode printing with advanced settings
 */
export const useBarcodeServiceV2 = () => {
  const [isPrinting, setIsPrinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<BarcodeSettingsV2>(getCachedBarcodeSettingsV2());

  /**
   * Print a barcode with the given data and optional settings override
   */
  const printBarcode = async (
    data: BarcodeDataV2, 
    settingsOverride: Partial<BarcodeSettingsV2> = {}
  ): Promise<boolean> => {
    setIsPrinting(true);
    setError(null);
    
    try {
      console.log('Printing barcode with data:', data);
      
      // Merge current settings with any overrides
      const mergedSettings = { ...settings, ...settingsOverride };
      
      // Print the barcode
      const success = await printBarcodeV2(data, mergedSettings);
      
      return success;
    } catch (err) {
      console.error('Error printing barcode:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setIsPrinting(false);
    }
  };

  /**
   * Get a preview of the barcode as HTML
   */
  const getPreview = (
    data: BarcodeDataV2, 
    settingsOverride: Partial<BarcodeSettingsV2> = {}
  ): string => {
    try {
      // Merge current settings with any overrides
      const mergedSettings = { ...settings, ...settingsOverride };
      
      // Generate preview HTML
      return generateBarcodePreview(data, mergedSettings);
    } catch (err) {
      console.error('Error generating barcode preview:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return '';
    }
  };

  /**
   * Update barcode settings
   */
  const updateSettings = (newSettings: Partial<BarcodeSettingsV2>): void => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
      saveBarcodeSettingsV2(updatedSettings);
    } catch (err) {
      console.error('Error updating barcode settings:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  /**
   * Apply a printer template to current settings
   */
  const applyTemplate = (templateName: keyof typeof PRINTER_TEMPLATES): void => {
    try {
      const updatedSettings = applyPrinterTemplate(templateName, settings);
      setSettings(updatedSettings);
      saveBarcodeSettingsV2(updatedSettings);
    } catch (err) {
      console.error('Error applying printer template:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  /**
   * Reset settings to defaults
   */
  const resetSettings = (): void => {
    try {
      // Clear cached settings
      localStorage.removeItem('barcodeSettingsV2');
      
      // Reset to defaults
      const defaultSettings = getCachedBarcodeSettingsV2();
      setSettings(defaultSettings);
    } catch (err) {
      console.error('Error resetting barcode settings:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  /**
   * Export settings to JSON file
   */
  const exportSettings = (): string => {
    try {
      // Create a JSON string of the current settings
      return JSON.stringify(settings, null, 2);
    } catch (err) {
      console.error('Error exporting barcode settings:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return '';
    }
  };

  /**
   * Import settings from JSON string
   * @returns true if import was successful, false otherwise
   */
  const importSettings = (jsonString: string): boolean => {
    try {
      // Parse the JSON string
      const importedSettings = JSON.parse(jsonString);
      
      // Validate that it's a valid settings object
      if (!importedSettings || typeof importedSettings !== 'object') {
        throw new Error('Invalid settings format');
      }
      
      // Merge with default settings to ensure all properties exist
      const mergedSettings = { ...getCachedBarcodeSettingsV2(), ...importedSettings };
      
      // Update settings
      setSettings(mergedSettings);
      saveBarcodeSettingsV2(mergedSettings);
      
      return true;
    } catch (err) {
      console.error('Error importing barcode settings:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  };

  return {
    printBarcode,
    getPreview,
    updateSettings,
    applyTemplate,
    resetSettings,
    exportSettings,
    importSettings,
    settings,
    isPrinting,
    error,
    printerTemplates: PRINTER_TEMPLATES
  };
};
