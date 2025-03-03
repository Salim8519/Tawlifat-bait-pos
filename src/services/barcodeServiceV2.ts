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
  fontFamily: 'Arial, sans-serif',
  businessNameFontSize: 10,
  businessNameFontWeight: 'bold',
  vendorNameFontSize: 8,
  productNameFontSize: 9,
  productNameFontWeight: 'bold',
  barcodeFontSize: 8,
  barcodeFontWeight: 'bold',
  priceFontSize: 10,
  priceFontWeight: 'bold',
  dateFontSize: 7,
  dateFontWeight: 'bold',
  datesFontWeight: 'bold',
  
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
    barcodeLineWidth,
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
    globalFontWeight,
    businessNameFontWeight,
    productNameFontWeight,
    priceFontWeight,
    barcodeFontWeight,
    datesFontWeight,
    barcodeFormat,
    // other settings...
  } = settings;

  // Validate barcode format
  let validatedBarcode = barcode;
  let formatError = false;
  let errorMessage = '';

  // Format-specific validation
  if (barcodeFormat === 'UPC') {
    // UPC requires exactly 12 digits
    const upcRegex = /^\d{12}$/;
    if (!upcRegex.test(barcode)) {
      // If not valid, pad with zeros or truncate to make it 12 digits
      validatedBarcode = barcode.replace(/\D/g, ''); // Remove non-digits
      if (validatedBarcode.length < 12) {
        validatedBarcode = validatedBarcode.padStart(12, '0');
      } else if (validatedBarcode.length > 12) {
        validatedBarcode = validatedBarcode.substring(0, 12);
      }
      console.warn(`UPC format requires exactly 12 digits. Original: ${barcode}, Modified: ${validatedBarcode}`);
    }
  } else if (barcodeFormat === 'EAN13') {
    // EAN13 requires exactly 13 digits
    const ean13Regex = /^\d{13}$/;
    if (!ean13Regex.test(barcode)) {
      validatedBarcode = barcode.replace(/\D/g, ''); // Remove non-digits
      if (validatedBarcode.length < 13) {
        validatedBarcode = validatedBarcode.padStart(13, '0');
      } else if (validatedBarcode.length > 13) {
        validatedBarcode = validatedBarcode.substring(0, 13);
      }
      console.warn(`EAN13 format requires exactly 13 digits. Original: ${barcode}, Modified: ${validatedBarcode}`);
    }
  }

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
    --barcode-width: ${barcodeLineWidth}mm;
    --barcode-height: ${barcodeHeight}mm;
    --content-width: ${contentWidth};
    --content-height: ${contentHeight};
    --text-color: ${darkMode ? 'white' : 'black'};
    --bg-color: ${darkMode ? 'black' : 'white'};
    --text-align: ${textAlignment};
    --direction: ${rtl ? 'rtl' : 'ltr'};
    --global-font-weight: ${globalFontWeight};
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
        -webkit-print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      
      /* Improve print quality */
      * {
        text-rendering: optimizeLegibility;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
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
      letter-spacing: -0.2px; /* Tighten letter spacing for better print */
    }
    
    .vendor-name {
      font-size: var(--vendor-name-font-size);
      font-weight: var(--global-font-weight); /* Apply global font weight */
      margin-bottom: calc(var(--line-spacing) * var(--global-spacing));
      letter-spacing: -0.2px;
    }
    
    .product-info {
      margin-bottom: calc(var(--section-spacing) * var(--global-spacing));
    }
    
    .product-name {
      font-size: var(--product-name-font-size);
      font-weight: var(--product-name-font-weight);
      margin-bottom: calc(var(--line-spacing) * var(--global-spacing));
      word-wrap: break-word;
      letter-spacing: -0.2px;
    }
    
    .barcode-section {
      text-align: center; /* Always center the barcode SVG itself */
      margin-bottom: calc(var(--section-spacing) * var(--global-spacing));
    }
    
    .barcode-section svg {
      max-width: 100%;
      height: auto;
      /* Make barcode lines darker and crisper */
      shape-rendering: crispEdges;
    }
    
    .barcode-text {
      font-size: var(--barcode-font-size);
      font-weight: var(--barcode-font-weight);
      margin-top: calc(var(--line-spacing) * var(--global-spacing));
      text-align: var(--text-align); /* Apply the text alignment to the barcode text */
      letter-spacing: -0.2px;
    }
    
    .price-section {
      font-size: var(--price-font-size);
      font-weight: var(--price-font-weight);
      margin-bottom: calc(var(--section-spacing) * var(--global-spacing));
      letter-spacing: -0.2px;
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
      letter-spacing: -0.2px;
    }
    
    .date-item {
      display: inline-block;
    }
    
    .expiry-date {
      color: ${darkMode ? '#ffffff' : '#000000'};
      font-weight: var(--dates-font-weight);
    }
    
    .barcode-error {
      color: red;
      text-align: center;
      margin: 10px 0;
      display: none;
      font-size: 12px;
    }
    .barcode-fallback {
      border: 1px dashed #ccc;
      padding: 10px;
      text-align: center;
      margin: 10px 0;
      display: none;
      font-size: 14px;
      background-color: #f8f8f8;
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
        try {
          JsBarcode("#barcode", "${validatedBarcode}", {
            format: "${barcodeFormat}",
            width: ${settings.barcodeLineWidth},
            height: ${settings.barcodeHeight},
            displayValue: false, // Always hide the built-in text
            margin: 0,
            background: "${darkMode ? 'black' : 'white'}",
            lineColor: "${darkMode ? 'white' : 'black'}",
            // Improve print quality with these settings
            textMargin: 0,
            fontSize: 0, // We'll use our own text display
            valid: function(valid) {
              if (!valid) {
                console.error("Invalid barcode format");
                document.getElementById('barcode-error').style.display = 'block';
              }
            }
          });
          
          // Apply additional SVG optimizations for print
          const svgElement = document.querySelector("#barcode");
          if (svgElement) {
            // Make sure paths have no anti-aliasing
            const paths = svgElement.querySelectorAll("path, rect");
            paths.forEach(path => {
              path.setAttribute("shape-rendering", "crispEdges");
              // Make lines slightly thicker for better printing
              if (path.getAttribute("fill") === "${darkMode ? 'white' : 'black'}") {
                // This is a bar element
                const currentWidth = parseFloat(path.getAttribute("width") || "1");
                // Add a tiny bit of width to each bar for better printing
                path.setAttribute("width", (currentWidth + 0.1).toString());
              }
            });
          }
          
          document.getElementById('barcode-error').style.display = 'none';
        } catch (error) {
          console.error('Error generating barcode:', error);
          document.getElementById('barcode-error').style.display = 'block';
          document.getElementById('barcode-error').textContent = 'Error: ' + error.message;
          
          // For preview, show a fallback message
          if (!autoPrint) {
            document.getElementById('barcode-fallback').style.display = 'block';
          }
        }
        
        // Auto-print functionality if requested
        if (autoPrint) {
          // Auto-print after rendering
          setTimeout(() => {
            window.focus(); // Focus the window to ensure print dialog appears in front
            window.print(); // Directly open the system print dialog
            setTimeout(() => {
              window.close();
            }, 500);
          }, 300);
        }
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
          <div id="barcode-error" class="barcode-error"></div>
          <div id="barcode-fallback" class="barcode-fallback">
            ${barcodeFormat === 'UPC' ? 
              `UPC format requires exactly 12 digits (current: ${barcode.length} digits)` : 
              barcodeFormat === 'EAN13' ? 
              `EAN13 format requires exactly 13 digits (current: ${barcode.length} digits)` :
              `Invalid barcode format`
            }
          </div>
          ${settings.displayBarcodeText ? `<div class="barcode-text">${validatedBarcode}</div>` : ''}
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
