import React, { useState, useEffect } from 'react';
import { useLanguageStore } from '../store/useLanguageStore';
import { Printer, Save, RotateCcw, Sliders, Type, Ruler, Maximize, Eye } from 'lucide-react';
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
    jsBarcodeRetryCount?: number;
  }
}

export function BarcodePrintSettingsPage() {
  const { language } = useLanguageStore();
  const translations = printSettingsTranslations[language];
  const [settings, setSettings] = useState<BarcodeSettings>({
    ...defaultBarcodeSettings,
    elementSpacing: 1,
    barcodeDensity: 0.8
  });
  const [previewKey, setPreviewKey] = useState(0); // Used to force preview refresh
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [activeTab, setActiveTab] = useState<'dimensions' | 'fontSizes' | 'spacing' | 'appearance'>('dimensions');
  const [isPreviewUpdating, setIsPreviewUpdating] = useState(false);

  // Load settings from cache on mount
  useEffect(() => {
    const loadSettings = () => {
      try {
        const cachedSettings = getCachedBarcodeSettings();
        console.log('Loaded cached barcode settings:', cachedSettings);
        setSettings(cachedSettings);
      } catch (error) {
        console.error('Error loading barcode settings:', error);
        // Use defaults if there's an error
        setSettings({
          ...defaultBarcodeSettings,
          elementSpacing: 1,
          barcodeDensity: 0.8
        });
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
      
      // Log for debugging
      console.log('Saved barcode settings:', settings);
      
      // Show success message
      setSaveStatus('success');
      
      // Reset status after a delay
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSettings({
      ...defaultBarcodeSettings,
      elementSpacing: 1,
      barcodeDensity: 0.8
    });
    setPreviewKey(prev => prev + 1);
    setIsPreviewUpdating(true);
    setTimeout(() => setIsPreviewUpdating(false), 500);
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
      // Ensure barcode density is within valid range
      barcodeDensity: Math.max(0, Math.min(1, newSettings.barcodeDensity)),
      // Ensure font sizes are reasonable
      barcodeFontSize: Math.max(6, Math.min(16, newSettings.barcodeFontSize)),
      businessNameFontSize: Math.max(6, Math.min(14, newSettings.businessNameFontSize)),
      vendorNameFontSize: Math.max(6, Math.min(14, newSettings.vendorNameFontSize)),
      productNameFontSize: Math.max(6, Math.min(14, newSettings.productNameFontSize)),
      priceFontSize: Math.max(6, Math.min(14, newSettings.priceFontSize)),
      dateFontSize: Math.max(6, Math.min(14, newSettings.dateFontSize)),
      // Ensure element spacing is reasonable
      elementSpacing: Math.max(0.2, Math.min(5, newSettings.elementSpacing))
    };
  };

  // Update settings with validation
  const updateSettings = (newSettings: Partial<BarcodeSettings>) => {
    setSettings(prev => validateSettings({...prev, ...newSettings}));
    setIsPreviewUpdating(true);
    setTimeout(() => setIsPreviewUpdating(false), 500);
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
            console.warn('JsBarcode not available');
            // Only retry a limited number of times to avoid console flooding
            if (!window.jsBarcodeRetryCount) {
              window.jsBarcodeRetryCount = 0;
            }
            
            if (window.jsBarcodeRetryCount < 5) {
              window.jsBarcodeRetryCount++;
              setTimeout(initializeBarcode, 500);
            } else {
              console.error('Failed to load JsBarcode after multiple attempts');
            }
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
      
      // Try to initialize immediately
      initializeBarcode();
      // Reset retry count for next update
      window.jsBarcodeRetryCount = 0;
    };
    
    // Run update preview
    updatePreview();
  }, [settings, previewKey]);

  // Helper function to render a slider with number input
  const renderSlider = (
    label: string, 
    value: number, 
    onChange: (value: number) => void, 
    min: number, 
    max: number, 
    step: number,
    helpText?: string,
    displayUnit?: string,
    isHighlighted?: boolean
  ) => {
    return (
      <div className={`mb-4 p-3 rounded-md ${isHighlighted ? 'bg-blue-50 border border-blue-200' : ''}`}>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
        <div className="flex items-center">
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex items-center ml-3">
            <input
              type="number"
              min={min}
              max={max}
              step={step}
              value={value}
              onChange={(e) => onChange(Number(e.target.value))}
              className="w-16 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
            {displayUnit && <span className="ml-1 text-sm text-gray-500">{displayUnit}</span>}
          </div>
        </div>
        {helpText && (
          <p className="mt-1 text-xs text-gray-500">
            {helpText}
          </p>
        )}
      </div>
    );
  };

  // Helper function to render a tab button
  const renderTabButton = (
    tabId: 'dimensions' | 'fontSizes' | 'spacing' | 'appearance', 
    label: string, 
    icon: React.ReactNode
  ) => {
    const isActive = activeTab === tabId;
    return (
      <button
        onClick={() => setActiveTab(tabId)}
        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors
          ${isActive 
            ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-500' 
            : 'text-gray-600 hover:bg-gray-100'}`}
      >
        {icon}
        {label}
      </button>
    );
  };

  return (
    <div className="p-6 max-w-6xl mx-auto" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-lg shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Printer className="w-6 h-6 text-blue-600" />
            {translations.title}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {translations.description}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            {translations.resetDefaults}
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md flex items-center gap-2 transition-colors
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

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Settings Panel */}
        <div className="lg:col-span-3 bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b overflow-x-auto">
            {renderTabButton('dimensions', translations.dimensions, <Maximize className="w-4 h-4" />)}
            {renderTabButton('fontSizes', translations.fontSizes, <Type className="w-4 h-4" />)}
            {renderTabButton('spacing', translations.spacing, <Sliders className="w-4 h-4" />)}
            {renderTabButton('appearance', translations.appearance, <Eye className="w-4 h-4" />)}
          </div>
          
          {/* Tab Content */}
          <div className="p-6">
            {/* Dimensions Tab */}
            {activeTab === 'dimensions' && (
              <div>
                <div className="mb-4">
                  <h3 className="text-md font-medium text-gray-800 mb-2 flex items-center">
                    <Maximize className="w-4 h-4 mr-2 text-blue-500" />
                    {translations.dimensions}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">{translations.dimensionsHelp}</p>
                </div>
                
                {renderSlider(
                  translations.barcodeWidth,
                  settings.barcodeWidth,
                  (value) => updateSettings({ barcodeWidth: value }),
                  20, 100, 1,
                  undefined,
                  "mm"
                )}
                
                {renderSlider(
                  translations.barcodeHeight,
                  settings.barcodeHeight,
                  (value) => updateSettings({ barcodeHeight: value }),
                  10, 50, 1,
                  undefined,
                  "mm"
                )}
                
                {renderSlider(
                  translations.barcodeLineWidth,
                  settings.barcodeLineWidth,
                  (value) => updateSettings({ barcodeLineWidth: value }),
                  0.5, 3, 0.1
                )}
              </div>
            )}
            
            {/* Font Sizes Tab */}
            {activeTab === 'fontSizes' && (
              <div>
                <div className="mb-4">
                  <h3 className="text-md font-medium text-gray-800 mb-2 flex items-center">
                    <Type className="w-4 h-4 mr-2 text-blue-500" />
                    {translations.fontSizes}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">{translations.fontSizesHelp}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3 border-b pb-2">
                      {translations.businessInformation}
                    </h4>
                    
                    {renderSlider(
                      translations.businessNameFont,
                      settings.businessNameFontSize,
                      (value) => updateSettings({ businessNameFontSize: value }),
                      6, 14, 0.5,
                      undefined,
                      "pt"
                    )}
                    
                    {renderSlider(
                      translations.vendorNameFont,
                      settings.vendorNameFontSize,
                      (value) => updateSettings({ vendorNameFontSize: value }),
                      6, 14, 0.5,
                      undefined,
                      "pt"
                    )}
                    
                    {renderSlider(
                      translations.productNameFont,
                      settings.productNameFontSize,
                      (value) => updateSettings({ productNameFontSize: value }),
                      6, 14, 0.5,
                      undefined,
                      "pt"
                    )}
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3 border-b pb-2">
                      {translations.additionalInformation}
                    </h4>
                    
                    {renderSlider(
                      translations.barcodeFont,
                      settings.barcodeFontSize,
                      (value) => updateSettings({ barcodeFontSize: value }),
                      6, 16, 0.5,
                      undefined,
                      "pt"
                    )}
                    
                    {renderSlider(
                      translations.priceFont,
                      settings.priceFontSize,
                      (value) => updateSettings({ priceFontSize: value }),
                      6, 14, 0.5,
                      undefined,
                      "pt"
                    )}
                    
                    {renderSlider(
                      translations.dateFont,
                      settings.dateFontSize,
                      (value) => updateSettings({ dateFontSize: value }),
                      6, 14, 0.5,
                      undefined,
                      "pt"
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Spacing Tab */}
            {activeTab === 'spacing' && (
              <div>
                <div className="mb-4">
                  <h3 className="text-md font-medium text-gray-800 mb-2 flex items-center">
                    <Sliders className="w-4 h-4 mr-2 text-blue-500" />
                    {translations.spacing}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">{translations.spacingHelp}</p>
                </div>
                
                {renderSlider(
                  translations.elementSpacing,
                  settings.elementSpacing,
                  (value) => updateSettings({ elementSpacing: value }),
                  0.2, 5, 0.1,
                  translations.elementSpacingHelp,
                  "mm",
                  true
                )}
              </div>
            )}
            
            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <div>
                <div className="mb-4">
                  <h3 className="text-md font-medium text-gray-800 mb-2 flex items-center">
                    <Eye className="w-4 h-4 mr-2 text-blue-500" />
                    {translations.appearance}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">{translations.appearanceHelp}</p>
                </div>
                
                {renderSlider(
                  translations.barcodeDensity,
                  settings.barcodeDensity,
                  (value) => updateSettings({ barcodeDensity: value }),
                  0, 1, 0.05,
                  translations.barcodeDensityHelp,
                  "%",
                  true
                )}
              </div>
            )}
          </div>
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="border-b p-4">
            <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-600" />
              {translations.preview}
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              {translations.previewNote}
            </p>
          </div>
          
          <div className="p-6">
            {isPreviewUpdating && (
              <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10">
                <p className="text-sm text-gray-600">{translations.previewUpdating}</p>
              </div>
            )}
            <div className="border rounded-lg p-4 bg-gray-50 relative">
              <div id="preview-container" className="w-full">
                {/* Preview will be rendered here */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
