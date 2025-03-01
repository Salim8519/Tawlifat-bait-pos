/**
 * BarcodeServiceV2 - Enhanced barcode printing service
 * 
 * Features:
 * - Flexible printer size support (Zebra, etc.)
 * - Fine-grained control over spacing and dimensions
 * - Optimized for thermal printers
 * - Customizable barcode formats and styles
 */

import JsBarcode from 'jsbarcode';

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
  printerType: 'zebra' | 'dymo' | 'brother' | 'generic';
  labelWidth: number;      // Width in mm
  labelHeight: number;     // Height in mm
  
  // Content settings
  showBusinessName: boolean;
  showVendorName: boolean;
  showProductName: boolean;
  showPrice: boolean;
  showExpiryDate: boolean;
  showProductionDate: boolean;
  
  // Font settings
  fontFamily: string;
  businessNameFontSize: number;
  vendorNameFontSize: number;
  productNameFontSize: number;
  barcodeFontSize: number;
  priceFontSize: number;
  dateFontSize: number;
  
  // Font weight settings
  businessNameFontWeight: 'normal' | 'bold' | 'bolder' | 'lighter' | number;
  productNameFontWeight: 'normal' | 'bold' | 'bolder' | 'lighter' | number;
  priceFontWeight: 'normal' | 'bold' | 'bolder' | 'lighter' | number;
  barcodeFontWeight: 'normal' | 'bold' | 'bolder' | 'lighter' | number;
  datesFontWeight: 'normal' | 'bold' | 'bolder' | 'lighter' | number;
  
  // Spacing settings
  lineSpacing: number;     // Space between lines
  sectionSpacing: number;  // Space between sections
  globalSpacing: number;   // Global spacing factor for all elements
  
  // Barcode settings
  barcodeFormat: 'CODE128' | 'EAN13' | 'UPC' | 'CODE39';
  barcodeWidth: number;    // Width in mm
  barcodeHeight: number;   // Height in mm
  barcodeLineWidth: number;// Line width
  displayBarcodeText: boolean; // Show barcode text
  
  // Style settings
  rtl: boolean;            // Right-to-left text
  darkMode: boolean;       // Dark mode (inverted colors)
  textAlignment: 'left' | 'center' | 'right'; // Text alignment
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
  labelWidth: 50.8,        // 2 inches in mm
  labelHeight: 25.4,       // 1 inch in mm
  
  // Content settings
  showBusinessName: true,
  showVendorName: true,
  showProductName: true,
  showPrice: true,
  showExpiryDate: true,
  showProductionDate: true,
  
  // Font settings
  fontFamily: 'Arial, sans-serif',
  businessNameFontSize: 7,
  vendorNameFontSize: 7,
  productNameFontSize: 8,
  barcodeFontSize: 8,
  priceFontSize: 10,
  dateFontSize: 6,
  
  // Font weight settings
  businessNameFontWeight: 'normal',
  productNameFontWeight: 'bold',
  priceFontWeight: 'bold',
  barcodeFontWeight: 'normal',
  datesFontWeight: 'normal',
  
  // Spacing settings
  lineSpacing: 1,          // Space between lines
  sectionSpacing: 2,       // Space between sections
  globalSpacing: 1,        // Global spacing factor for all elements
  
  // Barcode settings
  barcodeFormat: 'CODE128',
  barcodeWidth: 40,        // Width in mm
  barcodeHeight: 10,       // Height in mm
  barcodeLineWidth: 1,     // Line width
  displayBarcodeText: true,// Show barcode text
  
  // Style settings
  rtl: false,              // Right-to-left text
  darkMode: false,         // Dark mode (inverted colors)
  textAlignment: 'left',   // Text alignment
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
 * Format date for display
 */
function formatDate(date: string | undefined): string {
  if (!date) return '';
  try {
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return date;
  }
}

/**
 * Generate HTML content for barcode printing
 */
function generateBarcodeHTML(
  data: BarcodeDataV2,
  settings: BarcodeSettingsV2,
  autoPrint: boolean = false
): string {
  const {
    barcode,
    productName,
    price,
    businessName,
    vendorName,
    expiryDate,
    productionDate,
    currency = 'OMR'
  } = data;

  const {
    printerType,
    labelWidth,
    labelHeight,
    fontFamily,
    businessNameFontSize,
    vendorNameFontSize,
    productNameFontSize,
    barcodeFontSize,
    priceFontSize,
    dateFontSize,
    lineSpacing,
    sectionSpacing,
    globalSpacing,
    barcodeWidth,
    barcodeHeight,
    showBusinessName,
    showVendorName,
    showProductName,
    showPrice,
    showExpiryDate,
    showProductionDate,
    rtl,
    darkMode,
    textAlignment,
    businessNameFontWeight,
    productNameFontWeight,
    priceFontWeight,
    barcodeFontWeight,
    datesFontWeight,
    // other settings...
  } = settings;

  // Calculate dimensions and scaling
  const contentWidth = `${labelWidth}mm`;
  const contentHeight = `${labelHeight}mm`;
  
  // Format dates
  const formattedExpiryDate = formatDate(expiryDate);
  const formattedProductionDate = formatDate(productionDate);
  
  // Prepare CSS variables for dynamic styling
  const cssVariables = `
    --font-family: ${fontFamily};
    --business-name-font-size: ${businessNameFontSize}pt;
    --vendor-name-font-size: ${vendorNameFontSize}pt;
    --product-name-font-size: ${productNameFontSize}pt;
    --barcode-font-size: ${barcodeFontSize}pt;
    --price-font-size: ${priceFontSize}pt;
    --date-font-size: ${dateFontSize}pt;
    --line-spacing: ${lineSpacing}mm;
    --section-spacing: ${sectionSpacing}mm;
    --global-spacing: ${globalSpacing}mm;
    --barcode-width: ${barcodeWidth}mm;
    --barcode-height: ${barcodeHeight}mm;
    --content-width: ${contentWidth};
    --content-height: ${contentHeight};
    --text-color: ${darkMode ? 'white' : 'black'};
    --bg-color: ${darkMode ? 'black' : 'white'};
    --text-align: ${textAlignment};
    --direction: ${rtl ? 'rtl' : 'ltr'};
    --business-name-font-weight: ${businessNameFontWeight};
    --product-name-font-weight: ${productNameFontWeight};
    --price-font-weight: ${priceFontWeight};
    --barcode-font-weight: ${barcodeFontWeight};
    --dates-font-weight: ${datesFontWeight};
  `;

  // Base CSS styles
  const styles = `
    @media print {
      @page {
        size: ${labelWidth}mm ${labelHeight}mm;
        margin: 0;
      }
      
      body {
        margin: 0;
        padding: 0;
      }
    }
    
    .barcode-container {
      font-family: var(--font-family);
      width: var(--content-width);
      height: var(--content-height);
      padding: 1mm;
      box-sizing: border-box;
      background-color: var(--bg-color);
      color: var(--text-color);
      direction: var(--direction);
      text-align: var(--text-align);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    
    .business-info {
      margin-bottom: calc(var(--section-spacing) * var(--global-spacing));
    }
    
    .business-name {
      font-size: var(--business-name-font-size);
      font-weight: var(--business-name-font-weight);
      margin-bottom: calc(var(--line-spacing) * var(--global-spacing));
    }
    
    .vendor-name {
      font-size: var(--vendor-name-font-size);
      margin-bottom: calc(var(--line-spacing) * var(--global-spacing));
    }
    
    .product-info {
      margin-bottom: calc(var(--section-spacing) * var(--global-spacing));
    }
    
    .product-name {
      font-size: var(--product-name-font-size);
      font-weight: var(--product-name-font-weight);
      margin-bottom: calc(var(--line-spacing) * var(--global-spacing));
      word-wrap: break-word;
    }
    
    .barcode-section {
      text-align: center; /* Always center the barcode SVG itself */
      margin-bottom: calc(var(--section-spacing) * var(--global-spacing));
    }
    
    .barcode-section svg {
      max-width: 100%;
      height: auto;
    }
    
    .barcode-text {
      font-size: var(--barcode-font-size);
      font-weight: var(--barcode-font-weight);
      margin-top: calc(var(--line-spacing) * var(--global-spacing));
      text-align: var(--text-align); /* Apply the text alignment to the barcode text */
    }
    
    .price-section {
      font-size: var(--price-font-size);
      font-weight: var(--price-font-weight);
      margin-bottom: calc(var(--section-spacing) * var(--global-spacing));
    }
    
    .dates-section {
      font-size: var(--date-font-size);
      font-weight: var(--dates-font-weight);
      display: flex;
      flex-direction: row;
      justify-content: center;
      gap: 3mm;
      margin-top: calc(var(--line-spacing) * var(--global-spacing));
      white-space: nowrap;
      width: 100%;
    }
    
    .date-item {
      display: inline-block;
    }
    
    .expiry-date {
      color: ${darkMode ? '#ff6666' : '#ff0000'};
    }
  `;

  // Prepare dates content - only create this once
  let datesContent = '';
  const showDates = (showExpiryDate && formattedExpiryDate) || (showProductionDate && formattedProductionDate);
  
  if (showDates) {
    const prodDate = showProductionDate && formattedProductionDate ? 
      `<span class="date-item production-date">Prod: ${formattedProductionDate}</span>` : '';
    
    const expDate = showExpiryDate && formattedExpiryDate ? 
      `<span class="date-item expiry-date">Exp: ${formattedExpiryDate}</span>` : '';
    
    datesContent = `
      <div class="dates-section">
        ${prodDate}
        ${expDate}
      </div>
    `;
  }

  // Create the script with or without auto-print functionality
  let scriptContent = `
    <script>
      window.onload = function() {
        JsBarcode("#barcode", "${barcode}", {
          format: "${settings.barcodeFormat}",
          width: ${settings.barcodeLineWidth},
          height: ${settings.barcodeHeight},
          displayValue: false, // Always hide the built-in text
          margin: 0,
          background: "${darkMode ? 'black' : 'white'}",
          lineColor: "${darkMode ? 'white' : 'black'}"
        });
  `;

  // Add auto-print functionality if requested
  if (autoPrint) {
    scriptContent += `
        // Auto-print after rendering
        setTimeout(() => {
          window.print();
          setTimeout(() => {
            window.close();
          }, 500);
        }, 500);
    `;
  }

  scriptContent += `
      };
    </script>
  `;

  // Construct HTML content
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Barcode Print</title>
      <style>
        :root {
          ${cssVariables}
        }
        ${styles}
      </style>
      <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
    </head>
    <body>
      <div class="barcode-container">
        ${showBusinessName && businessName ? `
          <div class="business-info">
            <div class="business-name">${businessName}</div>
            ${showVendorName && vendorName ? `<div class="vendor-name">${vendorName}</div>` : ''}
          </div>
        ` : ''}
        
        ${showProductName ? `
          <div class="product-info">
            <div class="product-name">${productName}</div>
          </div>
        ` : ''}
        
        <div class="barcode-section">
          <svg id="barcode"></svg>
          ${settings.displayBarcodeText ? `<div class="barcode-text">${barcode}</div>` : ''}
        </div>
        
        ${showPrice ? `
          <div class="price-section">
            ${price.toFixed(3)} ${currency}
          </div>
        ` : ''}
        
        ${datesContent}
      </div>
      
      ${scriptContent}
    </body>
    </html>
  `;
}

/**
 * Print barcode with given data and settings
 */
export async function printBarcodeV2(
  data: BarcodeDataV2,
  settings: Partial<BarcodeSettingsV2> = {}
): Promise<boolean> {
  try {
    // Merge with cached settings
    const mergedSettings = {
      ...getCachedBarcodeSettingsV2(),
      ...settings
    };
    
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

/**
 * Compatibility function for old barcode service
 */
export function convertLegacyData(
  legacyData: {
    productId: string;
    vendorId: string;
    name: string;
    price: number;
    businessName?: string;
    vendorName?: string;
    expiryDate?: string;
    productionDate?: string;
    existingBarcode?: string;
  }
): BarcodeDataV2 {
  return {
    barcode: legacyData.existingBarcode || `${legacyData.productId}${legacyData.vendorId}`.substring(0, 12),
    productName: legacyData.name,
    price: legacyData.price,
    businessName: legacyData.businessName,
    vendorName: legacyData.vendorName,
    expiryDate: legacyData.expiryDate,
    productionDate: legacyData.productionDate
  };
}
