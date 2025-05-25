/**
 * BarcodeServiceV2 - Enhanced barcode printing service
 * 
 * Features:
 * - Flexible printer size support (Zebra, etc.)
 * - Fine-grained control over spacing and dimensions
 * - Optimized for thermal printers
 * - Customizable barcode formats and styles
 * - QR code support with split layout
 */

import JsBarcode from 'jsbarcode';
import { 
  formatDate, 
  generateBarcodeHTML, 
  convertLegacyData 
} from './barcodeServiceV2Core';

// Core interfaces for barcode data and settings
export interface BarcodeDataV2 {
  // Required fields
  barcode: string;         // Barcode number (required in v2)
  productName: string;     // Product name
  price: number;           // Price
  
  // Optional fields
  businessName?: string;   // Business name
  vendorName?: string;     // Vendor name
  expiryDate?: string;     // Expiry date
  productionDate?: string; // Production date
  currency?: string;       // Currency symbol (default: OMR)
}

export interface BarcodeSettingsV2 {
  // Printer settings
  printerType: string;
  labelWidth: number;
  labelHeight: number;
  
  // Content settings
  showBusinessName: boolean;
  showVendorName: boolean;
  showProductName: boolean;
  showPrice: boolean;
  showExpiryDate: boolean;
  showProductionDate: boolean;
  
  // Barcode settings
  barcodeFormat: string;
  barcodeLineWidth: number;
  barcodeHeight: number;
  displayBarcodeText: boolean;
  
  // Spacing settings
  lineSpacing: number;
  sectionSpacing: number;
  globalSpacing: number;
  
  // Style settings
  textAlignment: string;
  fontFamily: string;
  globalFontWeight: string; // Global font weight setting to control all text thickness
  businessNameFontSize: number;
  businessNameFontWeight: string;
  vendorNameFontSize: number;
  vendorNameFontWeight: string; // Added vendor name font weight
  productNameFontSize: number;
  productNameFontWeight: string;
  barcodeFontSize: number;
  barcodeFontWeight: string;
  priceFontSize: number;
  priceFontWeight: string;
  dateFontSize: number;
  dateFontWeight: string;
  datesFontWeight: string;
  rtl: boolean;
  darkMode: boolean;
  
  // QR code settings
  enableQRCode: boolean;                // Toggle QR code display
  qrCodeContent: 'barcode' | 'custom';  // What data to encode in QR
  qrCodeCustomContent: string;          // Custom data for QR if not using barcode
  qrCodeSize: number;                   // Size of QR code in mm
  qrCodeErrorCorrection: 'L' | 'M' | 'Q' | 'H'; // Error correction level
  qrCodePosition: 'left' | 'right';     // Position of QR code
  splitLayoutRatio: number;             // Ratio of QR to text (e.g., 0.5 for 50/50)
}

// Predefined templates for common printer types
export const PRINTER_TEMPLATES = {
  zebra2x1: {
    printerType: 'zebra',
    labelWidth: 50.8,      // 2 inches in mm
    labelHeight: 25.4,     // 1 inch in mm
    lineSpacing: 1,
    sectionSpacing: 2,
    globalSpacing: 1,
    barcodeWidth: 40,
    barcodeHeight: 10,
    textAlignment: 'center',
  },
  zebra4x2: {
    printerType: 'zebra',
    labelWidth: 101.6,     // 4 inches in mm
    labelHeight: 50.8,     // 2 inches in mm
    lineSpacing: 2,
    sectionSpacing: 4,
    globalSpacing: 1,
    barcodeWidth: 80,
    barcodeHeight: 15,
    textAlignment: 'center',
  },
  dymoSmall: {
    printerType: 'dymo',
    labelWidth: 89,        // Standard Dymo label width
    labelHeight: 36,       // Standard Dymo label height
    lineSpacing: 1,
    sectionSpacing: 2,
    globalSpacing: 1,
    barcodeWidth: 70,
    barcodeHeight: 12,
    textAlignment: 'center',
  },
  brotherStandard: {
    printerType: 'brother',
    labelWidth: 62,        // Standard Brother label width
    labelHeight: 29,       // Standard Brother label height
    lineSpacing: 1,
    sectionSpacing: 2,
    globalSpacing: 1,
    barcodeWidth: 50,
    barcodeHeight: 10,
    textAlignment: 'center',
  }
} as const;

// Default settings
export const DEFAULT_BARCODE_SETTINGS: BarcodeSettingsV2 = {
  // Printer settings (default to Zebra 2x1)
  printerType: 'zebra',
  labelWidth: 50,         // Width in mm
  labelHeight: 30,        // Height in mm
  
  // Content settings
  showBusinessName: true,
  showVendorName: true,
  showProductName: true,
  showPrice: true,
  showExpiryDate: true,
  showProductionDate: true,
  
  // Font settings
  fontFamily: 'Segoe UI, Helvetica Neue, Roboto, Open Sans, sans-serif',
  businessNameFontSize: 10,
  businessNameFontWeight: 'bold',
  vendorNameFontSize: 8,
  vendorNameFontWeight: 'normal',
  productNameFontSize: 9,
  productNameFontWeight: 'bold',
  barcodeFontSize: 8,
  barcodeFontWeight: 'bold',
  priceFontSize: 10,
  priceFontWeight: 'bold',
  dateFontSize: 7,
  dateFontWeight: 'normal',
  datesFontWeight: 'normal',
  
  // Spacing settings
  lineSpacing: 1,         // Space between lines
  sectionSpacing: 2,      // Space between sections
  globalSpacing: 1,       // Global spacing factor for all elements
  
  // Barcode settings
  barcodeFormat: 'CODE128',
  barcodeLineWidth: 2,     // Increased line width for better print quality
  barcodeHeight: 10,       // Height in mm
  displayBarcodeText: true,// Show barcode text
  
  // Style settings
  rtl: false,             // Right-to-left text
  darkMode: false,         // Dark mode (inverted colors)
  textAlignment: 'left',   // Text alignment
  globalFontWeight: 'bold', // Default to bold for better print quality
  
  // QR code settings
  enableQRCode: false,
  qrCodeContent: 'barcode',
  qrCodeCustomContent: '',
  qrCodeSize: 25,
  qrCodeErrorCorrection: 'M',
  qrCodePosition: 'left',
  splitLayoutRatio: 0.5,
};

/**
 * Get cached barcode settings or return defaults
 */
export function getCachedBarcodeSettingsV2(): BarcodeSettingsV2 {
  try {
    const cached = localStorage.getItem('barcodeSettingsV2');
    if (cached) {
      const parsedSettings = JSON.parse(cached);
      // Ensure all properties exist by merging with defaults
      return { ...DEFAULT_BARCODE_SETTINGS, ...parsedSettings };
    }
  } catch (error) {
    console.error('Error loading cached barcode settings:', error);
  }
  return { ...DEFAULT_BARCODE_SETTINGS };
}

/**
 * Save barcode settings to localStorage
 */
export function saveBarcodeSettingsV2(settings: Partial<BarcodeSettingsV2>): void {
  try {
    const currentSettings = getCachedBarcodeSettingsV2();
    const newSettings = { ...currentSettings, ...settings };
    localStorage.setItem('barcodeSettingsV2', JSON.stringify(newSettings));
  } catch (error) {
    console.error('Error saving barcode settings:', error);
  }
}

/**
 * Apply printer template to current settings
 */
export function applyPrinterTemplate(
  templateName: keyof typeof PRINTER_TEMPLATES,
  currentSettings: BarcodeSettingsV2 = getCachedBarcodeSettingsV2()
): BarcodeSettingsV2 {
  const template = PRINTER_TEMPLATES[templateName];
  return { ...currentSettings, ...template };
}

/**
 * Print barcode with given data and settings
 */
export async function printBarcodeV2(
  data: BarcodeDataV2,
  settings: Partial<BarcodeSettingsV2> = {}
): Promise<boolean> {
  try {
    // Log barcode data for debugging
    console.log('Printing barcode with data:', {
      barcode: data.barcode,
      format: settings.barcodeFormat || getCachedBarcodeSettingsV2().barcodeFormat
    });
    
    // Merge with cached settings
    const mergedSettings = {
      ...getCachedBarcodeSettingsV2(),
      ...settings
    };
    
    // Validate barcode format requirements
    const format = mergedSettings.barcodeFormat;
    if (format === 'UPC' && !/^\d{12}$/.test(data.barcode)) {
      console.warn(`UPC format requires exactly 12 digits. Current value: ${data.barcode}`);
    } else if (format === 'EAN13' && !/^\d{13}$/.test(data.barcode)) {
      console.warn(`EAN13 format requires exactly 13 digits. Current value: ${data.barcode}`);
    }
    
    // Generate HTML content with auto-print enabled
    const htmlContent = generateBarcodeHTML(data, mergedSettings, true);
    
    // Open new window and print
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      console.error('Failed to open print window. Popup blocker enabled?');
      return false;
    }
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Directly trigger the print dialog without waiting for user action
    setTimeout(() => {
      printWindow.focus(); // Focus the window to ensure print dialog appears in front
      printWindow.print(); // Open the system print dialog immediately
    }, 300);
    
    return true;
  } catch (error) {
    console.error('Error printing barcode:', error);
    return false;
  }
}

/**
 * Generate barcode preview HTML (returns HTML string)
 */
export function generateBarcodePreview(
  data: BarcodeDataV2,
  settings: Partial<BarcodeSettingsV2> = {}
): string {
  // Merge with cached settings
  const mergedSettings = {
    ...getCachedBarcodeSettingsV2(),
    ...settings
  };
  
  // Generate HTML content with auto-print disabled
  return generateBarcodeHTML(data, mergedSettings, false);
}

// Re-export convertLegacyData from core
export { convertLegacyData };
