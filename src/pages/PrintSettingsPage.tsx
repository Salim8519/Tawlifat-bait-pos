import React, { useState, useEffect } from 'react';
import { useLanguageStore } from '../store/useLanguageStore';
import { Printer, Save } from 'lucide-react';
import { useSettingsStore } from '../store/useSettingsStore';
import { printSettingsTranslations } from '../translations/printSettings';
import { 
  generateBarcodePreview, 
  type BarcodeSettings, 
  type BarcodeData, 
  defaultBarcodeSettings,
  getCachedBarcodeSettings
} from '../services/barcodeService';

// Add TypeScript declaration for JsBarcode
declare global {
  interface Window {
    JsBarcode: (selector: string | HTMLElement, data: string, options?: any) => void;
  }
}

export function PrintSettingsPage() {
  const { language } = useLanguageStore();
  const translations = printSettingsTranslations[language];
  const [settings, setSettings] = useState<BarcodeSettings>(defaultBarcodeSettings);
  const [previewKey, setPreviewKey] = useState(0); // Used to force preview refresh
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  // Load settings from cache on mount
  useEffect(() => {
    const loadSettings = () => {
      try {
        const cachedSettings = getCachedBarcodeSettings();
        setSettings(cachedSettings);
      } catch (error) {
        console.error('Error loading barcode settings:', error);
        // Use defaults if there's an error
        setSettings(defaultBarcodeSettings);
      }
    };

    loadSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('saving');
    try {
      // Save to localStorage
      localStorage.setItem('barcodeSettings', JSON.stringify(settings));
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(defaultBarcodeSettings);
    setPreviewKey(prev => prev + 1);
  };

  // Add constraints to settings to prevent invalid values
  const validateSettings = (newSettings: BarcodeSettings): BarcodeSettings => {
    return {
      ...newSettings,
      // Ensure barcode line width is within valid range
      barcodeLineWidth: Math.max(0.5, Math.min(3, newSettings.barcodeLineWidth)),
      // Ensure barcode dimensions are reasonable
      barcodeWidth: Math.max(20, Math.min(100, newSettings.barcodeWidth)),
      barcodeHeight: Math.max(10, Math.min(50, newSettings.barcodeHeight)),
      // Ensure font sizes are reasonable
      barcodeFontSize: Math.max(6, Math.min(16, newSettings.barcodeFontSize)),
      businessNameFontSize: Math.max(6, Math.min(14, newSettings.businessNameFontSize)),
      vendorNameFontSize: Math.max(6, Math.min(14, newSettings.vendorNameFontSize)),
      productNameFontSize: Math.max(6, Math.min(14, newSettings.productNameFontSize)),
      priceFontSize: Math.max(6, Math.min(14, newSettings.priceFontSize)),
      dateFontSize: Math.max(6, Math.min(14, newSettings.dateFontSize))
    };
  };

  // Update settings with validation
  const updateSettings = (newSettings: Partial<BarcodeSettings>) => {
    setSettings(prev => validateSettings({...prev, ...newSettings}));
  };

  // Sample data for preview
  const sampleData: BarcodeData = {
    productId: 'SAMPLE-001',
    vendorId: 'VENDOR-001',
    name: 'Sample Product',
    price: 25.300,
    businessName: 'Business Name',
    vendorName: 'Vendor Name',
    expiryDate: '2025-12-31',
    productionDate: '2025-01-01',
    existingBarcode: '6002909'
  };

  useEffect(() => {
    // Update preview when settings change
    const updatePreview = () => {
      const previewContainer = document.getElementById('preview-container');
      if (!previewContainer) return;
      
      // Generate preview content
      const previewContent = generateBarcodePreview(sampleData, settings);
      previewContainer.innerHTML = previewContent;
      
      // Initialize barcode after content is loaded
      const initializeBarcode = () => {
        try {
          // Get the barcode element from the preview
          const barcodeElement = previewContainer.querySelector('#barcode');
          if (!barcodeElement) {
            console.warn('Barcode element not found in preview');
            return;
          }
          
          if (typeof window.JsBarcode === 'function') {
            // Generate the barcode
            window.JsBarcode(barcodeElement, sampleData.existingBarcode || '6002909', {
              format: "CODE128",
              width: settings.barcodeLineWidth,
              height: settings.barcodeHeight,
              displayValue: false,
              margin: 0,
              background: "transparent",
              lineColor: "#000"
            });
          } else {
            console.warn('JsBarcode not available, retrying...');
            // If JsBarcode isn't loaded yet, try again in 100ms
            setTimeout(initializeBarcode, 100);
          }
        } catch (error) {
          console.error('Error initializing barcode:', error);
          // Fallback - display the barcode number in a more visible way
          const barcodeNumber = previewContainer.querySelector('.barcode-number');
          if (barcodeNumber) {
            (barcodeNumber as HTMLElement).style.fontSize = '12pt';
            (barcodeNumber as HTMLElement).style.fontWeight = 'bold';
          }
        }
      };
      
      // Try to initialize immediately, but also set a backup timeout
      initializeBarcode();
      setTimeout(initializeBarcode, 300);
    };
    
    // Run update preview
    updatePreview();
  }, [settings, previewKey]);

  return (
    <div className="p-6 max-w-4xl mx-auto" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Printer className="w-6 h-6" />
            {translations.title}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {translations.description}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            {translations.resetDefaults}
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md flex items-center gap-2
              ${saveStatus === 'saving' ? 'bg-blue-400' : 
                saveStatus === 'success' ? 'bg-green-500' :
                saveStatus === 'error' ? 'bg-red-500' :
                'bg-blue-600 hover:bg-blue-700'}`}
          >
            <Save className="w-4 h-4" />
            {saveStatus === 'saving' ? translations.saving :
             saveStatus === 'success' ? translations.saved :
             saveStatus === 'error' ? translations.error :
             translations.saveChanges}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Settings Panel */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            {translations.barcodeSettings}
          </h2>
          
          <div className="space-y-4">
            {/* Business Information Section */}
            <div className="border-b pb-4 mb-4">
              <h3 className="text-md font-medium text-gray-800 mb-3">
                {translations.businessInformation || "Business Information"}
              </h3>
              
              {/* Business Name Font Size */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {translations.businessNameFont}
                </label>
                <input
                  type="number"
                  value={settings.businessNameFontSize}
                  onChange={(e) => updateSettings({
                    businessNameFontSize: Number(e.target.value)
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              {/* Vendor Name Font Size */}
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700">
                  {translations.vendorNameFont}
                </label>
                <input
                  type="number"
                  value={settings.vendorNameFontSize}
                  onChange={(e) => updateSettings({
                    vendorNameFontSize: Number(e.target.value)
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              {/* Product Name Font Size */}
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700">
                  {translations.productNameFont}
                </label>
                <input
                  type="number"
                  value={settings.productNameFontSize}
                  onChange={(e) => updateSettings({
                    productNameFontSize: Number(e.target.value)
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Barcode Properties Section */}
            <div className="border-b pb-4 mb-4">
              <h3 className="text-md font-medium text-gray-800 mb-3">
                {translations.barcodeProperties || "Barcode Properties"}
              </h3>
              
              {/* Barcode Width */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {translations.barcodeWidth}
                </label>
                <input
                  type="number"
                  value={settings.barcodeWidth}
                  onChange={(e) => updateSettings({
                    barcodeWidth: Number(e.target.value)
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              {/* Barcode Height */}
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700">
                  {translations.barcodeHeight}
                </label>
                <input
                  type="number"
                  value={settings.barcodeHeight}
                  onChange={(e) => updateSettings({
                    barcodeHeight: Number(e.target.value)
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              
              {/* Barcode Font Size */}
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700">
                  {translations.barcodeFont || "Barcode Font Size"}
                </label>
                <input
                  type="number"
                  value={settings.barcodeFontSize}
                  onChange={(e) => updateSettings({
                    barcodeFontSize: Number(e.target.value)
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              
              {/* Barcode Line Width/Density */}
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700">
                  {translations.barcodeLineWidth || "Barcode Line Width"}
                </label>
                <input
                  type="number"
                  min="0.5"
                  max="3"
                  step="0.1"
                  value={settings.barcodeLineWidth}
                  onChange={(e) => updateSettings({
                    barcodeLineWidth: Number(e.target.value)
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Additional Information Section */}
            <div>
              <h3 className="text-md font-medium text-gray-800 mb-3">
                {translations.additionalInformation || "Additional Information"}
              </h3>
              
              {/* Price Font Size */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {translations.priceFont}
                </label>
                <input
                  type="number"
                  value={settings.priceFontSize}
                  onChange={(e) => updateSettings({
                    priceFontSize: Number(e.target.value)
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              
              {/* Date Font Size */}
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700">
                  {translations.dateFont || "Date Font Size"}
                </label>
                <input
                  type="number"
                  value={settings.dateFontSize}
                  onChange={(e) => updateSettings({
                    dateFontSize: Number(e.target.value)
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            {translations.preview}
          </h2>
          <div className="border rounded-lg p-4 bg-gray-50">
            <div id="preview-container" className="w-full">
              {/* Preview will be rendered here */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
