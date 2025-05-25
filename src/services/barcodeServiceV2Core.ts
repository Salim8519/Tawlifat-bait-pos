/**
 * BarcodeServiceV2Core - Core functionality for barcode generation and printing
 * 
 * This file contains the implementation details of the barcode service.
 * It is imported by barcodeServiceV2.ts which provides the public API.
 */

import { BarcodeDataV2, BarcodeSettingsV2 } from './barcodeServiceV2';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';

/**
 * Format date for display in a compact format
 */
export function formatDate(date: string | undefined): string {
  if (!date) return '';
  
  try {
    // Parse the date string
    const parsedDate = new Date(date);
    
    // Check if the date is valid
    if (isNaN(parsedDate.getTime())) {
      // If it's not a valid date but has a year format, try to extract just the year
      if (date.includes('/')) {
        const parts = date.split('/');
        if (parts.length === 3 && parts[2].length === 4) {
          // Convert YYYY to YY in DD/MM/YYYY format
          return `${parts[0]}/${parts[1]}/${parts[2].slice(2)}`;
        }
      }
      return date; // Return the original string if it's not a valid date
    }
    
    // Format to a compact date format: DD/MM/YY
    const day = parsedDate.getDate().toString().padStart(2, '0');
    const month = (parsedDate.getMonth() + 1).toString().padStart(2, '0');
    const year = parsedDate.getFullYear().toString().slice(2); // Just the last 2 digits of year
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return date; // Return the original string in case of any errors
  }
}

/**
 * Generate QR code SVG
 */
export async function generateQRCodeSVG(
  content: string,
  settings: BarcodeSettingsV2
): Promise<string> {
  const { qrCodeErrorCorrection, darkMode } = settings;
  
  try {
    // Generate QR code as SVG string
    const qrSvg = await QRCode.toString(content, {
      type: 'svg',
      errorCorrectionLevel: qrCodeErrorCorrection,
      color: {
        dark: darkMode ? '#FFFFFF' : '#000000',
        light: darkMode ? '#000000' : '#FFFFFF'
      },
      margin: 0,
      width: settings.qrCodeSize
    });
    
    return qrSvg;
  } catch (error) {
    console.error('Error generating QR code:', error);
    return `<svg width="${settings.qrCodeSize}" height="${settings.qrCodeSize}" viewBox="0 0 100 100">
      <rect width="100" height="100" fill="${darkMode ? 'black' : 'white'}" />
      <text x="50" y="50" font-family="sans-serif" font-size="10" fill="${darkMode ? 'white' : 'black'}" 
        text-anchor="middle" dominant-baseline="middle">QR Error</text>
    </svg>`;
  }
}

/**
 * Generate HTML content for barcode printing
 */
export function generateBarcodeHTML(
  data: BarcodeDataV2,
  settings: BarcodeSettingsV2,
  autoPrint: boolean = false
): string {
  const {
    barcode = '',
    productName = '',
    price = 0,
    businessName = '',
    productionDate = '',
    expiryDate = '',
    currency = 'OMR',
  } = data;

  const {
    barcodeFormat = 'CODE128',
    barcodeWidth = 40,
    barcodeHeight = 15,
    barcodeLineWidth = 1,
    displayBarcodeText = true,
    
    // QR code settings
    qrCodeContent = 'barcode',
    qrCodeCustomContent = '',
    qrCodeSize = 30,
    qrCodeErrorCorrection = 'M',
    qrCodePosition = 'right',
    splitLayoutRatio = 0.5,
    priceAlignment,
    t = {
      productionDate: 'Prod',
      expiryDate: 'Exp'
    },
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
  const contentWidth = `${settings.labelWidth}mm`;
  const contentHeight = `${settings.labelHeight}mm`;
  
  // Format dates
  const formattedExpiryDate = formatDate(expiryDate);
  const formattedProductionDate = formatDate(productionDate);
  
  // Prepare CSS variables for dynamic styling
  const cssVariables = `
    --font-family: ${settings.fontFamily};
    --business-name-font-size: ${settings.businessNameFontSize}pt;
    --vendor-name-font-size: ${settings.vendorNameFontSize}pt;
    --product-name-font-size: ${settings.productNameFontSize}pt;
    --barcode-font-size: ${settings.barcodeFontSize}pt;
    --price-font-size: ${settings.priceFontSize}pt;
    --date-font-size: ${settings.dateFontSize}pt;
    --line-spacing: ${settings.lineSpacing}mm;
    --section-spacing: ${settings.sectionSpacing}mm;
    --global-spacing: ${settings.globalSpacing}mm;
    --barcode-width: ${settings.barcodeLineWidth}mm;
    --barcode-height: ${settings.barcodeHeight}mm;
    --content-width: ${contentWidth};
    --content-height: ${contentHeight};
    --text-color: ${settings.darkMode ? 'white' : 'black'};
    --bg-color: ${settings.darkMode ? 'black' : 'white'};
    --text-align: ${settings.textAlignment};
    --direction: ${settings.rtl ? 'rtl' : 'ltr'};
    --global-font-weight: ${settings.globalFontWeight};
    --business-name-font-weight: ${settings.businessNameFontWeight};
    --product-name-font-weight: ${settings.productNameFontWeight};
    --price-font-weight: ${settings.priceFontWeight};
    --barcode-font-weight: ${settings.barcodeFontWeight};
    --dates-font-weight: ${settings.datesFontWeight};
    --qr-code-size: ${settings.qrCodeSize}mm;
    --split-layout-ratio: ${settings.splitLayoutRatio};
  `;

  // Base CSS styles
  const styles = `
    @media print {
      @page {
        size: ${settings.labelWidth}mm ${settings.labelHeight}mm;
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
    
    @font-face {
      font-family: 'Sans-Serif-Normal';
      src: local('Segoe UI'), local('Helvetica Neue'), local('Roboto'), local('Open Sans');
      font-weight: normal;
      font-style: normal;
      unicode-range: U+0600-06FF, U+0750-077F, U+08A0-08FF, U+FB50-FDFF, U+FE70-FEFF, U+0000-00FF;
    }
    
    @font-face {
      font-family: 'Sans-Serif-Bold';
      src: local('Segoe UI Bold'), local('Helvetica Neue Bold'), local('Roboto Bold'), local('Open Sans Bold');
      font-weight: bold;
      font-style: normal;
      unicode-range: U+0600-06FF, U+0750-077F, U+08A0-08FF, U+FB50-FDFF, U+FE70-FEFF, U+0000-00FF;
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
    
    /* Split layout for QR code */
    .split-layout {
      flex-direction: row;
      justify-content: flex-start;
      align-items: stretch;
    }
    
    /* RTL support for split layout */
    html[dir="rtl"] .split-layout {
      flex-direction: row-reverse;
    }
    
    .qr-section {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 2mm;
      box-sizing: border-box;
    }
    
    .qr-code {
      width: var(--qr-code-size);
      height: var(--qr-code-size);
      max-width: 100%;
      max-height: 100%;
      margin: 0 auto;
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    
    .qr-code canvas {
      width: 100%;
      height: auto;
      max-width: 100%;
      shape-rendering: crispEdges;
    }
    
    .qr-code svg {
      width: 100%;
      height: 100%;
      shape-rendering: crispEdges;
    }
    
    .qr-code-text {
      font-size: var(--barcode-font-size);
      font-weight: var(--barcode-font-weight);
      margin-top: 2mm;
      text-align: center;
      letter-spacing: -0.2px;
    }
    
    .text-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 1mm;
      box-sizing: border-box;
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
      text-align: var(--text-align);
      max-height: calc(var(--product-name-font-size) * 2.8);
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      line-height: 1.4;
      letter-spacing: -0.2px;
      padding-bottom: 0.15em;
    }
    
    /* RTL-specific adjustments for Arabic text */
    [dir="rtl"] .product-name {
      padding-top: 0.1em;
      line-height: 1.5;
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
      display: flex;
      justify-content: center;
      align-items: baseline;
    }
    
    .price {
      font-size: var(--price-font-size);
      font-weight: var(--price-font-weight);
    }
    
    .currency {
      font-size: var(--price-font-size);
      margin-left: 1mm;
      font-weight: var(--price-font-weight);
      align-self: baseline;
    }
    
    .dates-container {
      display: flex;
      justify-content: space-between;
      margin-top: 1mm;
      font-size: var(--date-font-size);
      font-weight: var(--dates-font-weight);
      width: 100%;
    }
    
    .dates-stacked {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-top: 1mm;
      font-size: var(--date-font-size);
      font-weight: var(--dates-font-weight);
      width: 100%;
    }
    
    .dates-stacked .date-item {
      margin: 0.5mm 0;
      text-align: center;
      font-weight: var(--dates-font-weight);
    }
    
    .date-item {
      white-space: nowrap;
      font-weight: var(--dates-font-weight);
    }
    
    .expiry-date {
      color: ${settings.darkMode ? '#ffffff' : '#000000'};
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
    
    .qr-error {
      color: red;
      text-align: center;
      margin: 10px 0;
      display: none;
      font-size: 12px;
    }
  `;

  // Prepare dates content if enabled
  let datesContent = '';
  
  if (settings.showExpiryDate || settings.showProductionDate) {
    // Shorter date labels
    const productionDateLabel = t?.productionDate || 'Prod';
    const expiryDateLabel = t?.expiryDate || 'Exp';
    
    datesContent = `
      ${barcodeFormat === 'QR' ? `
        <div class="dates-stacked">
          ${settings.showProductionDate ? `<div class="date-item">${productionDateLabel}: ${formattedProductionDate}</div>` : ''}
          ${settings.showExpiryDate ? `<div class="date-item">${expiryDateLabel}: ${formattedExpiryDate}</div>` : ''}
        </div>
      ` : `
        <div class="dates-container">
          ${settings.showProductionDate ? `<div class="date-item">${productionDateLabel}: ${formattedProductionDate}</div>` : ''}
          ${settings.showExpiryDate ? `<div class="date-item">${expiryDateLabel}: ${formattedExpiryDate}</div>` : ''}
        </div>
      `}
    `;
  }

  // Format price to remove trailing zeros
  const formatPrice = (price: number): string => {
    // Convert to string with fixed decimal places
    const priceStr = price.toFixed(3);
    
    // If price is a whole number, return without decimal part
    if (price % 1 === 0) {
      return price.toString();
    }
    
    // Remove trailing zeros
    return priceStr.replace(/\.?0+$/, '');
  };

  // Prepare formatted price
  const formattedPrice = formatPrice(price);

  // Format product name to fit within two lines
  const formatProductName = (name: string, maxLength: number = 40): string => {
    if (!name) return '';
    
    // If product name is already short enough, return as is
    if (name.length <= maxLength) return name;
    
    // Calculate an appropriate font size modifier based on length
    const fontSizeModifier = Math.max(0.7, 1 - ((name.length - maxLength) / 100));
    
    // Apply the font size modifier as an inline style
    return `<span style="font-size: ${fontSizeModifier.toFixed(2)}em;">${name}</span>`;
  };

  // Prepare formatted product name
  const formattedProductName = formatProductName(productName);

  // Create the script with or without auto-print functionality
  let scriptContent = `
    <script>
      window.onload = async function() {
        try {
          ${barcodeFormat !== 'QR' ? `
          // Generate barcode
          JsBarcode("#barcode", "${validatedBarcode}", {
            format: "${barcodeFormat}",
            width: ${settings.barcodeLineWidth},
            height: ${settings.barcodeHeight},
            displayValue: false, // Always hide the built-in text
            margin: 0,
            background: "${settings.darkMode ? 'black' : 'white'}",
            lineColor: "${settings.darkMode ? 'white' : 'black'}",
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
              if (path.getAttribute("fill") === "${settings.darkMode ? 'white' : 'black'}") {
                // This is a bar element
                const currentWidth = parseFloat(path.getAttribute("width") || "1");
                // Add a tiny bit of width to each bar for better printing
                path.setAttribute("width", (currentWidth + 0.1).toString());
              }
            });
          }
          
          document.getElementById('barcode-error').style.display = 'none';
          ` : ''}
          
          // Generate QR code if QR format is selected
          if (${barcodeFormat === 'QR'}) {
            try {
              const qrContent = "${qrCodeContent === 'barcode' ? validatedBarcode : qrCodeCustomContent.replace(/"/g, '\\"')}";
              const qrOptions = {
                errorCorrectionLevel: "${qrCodeErrorCorrection}",
                margin: 0,
                color: {
                  dark: "${settings.darkMode ? '#FFFFFF' : '#000000'}",
                  light: "${settings.darkMode ? '#000000' : '#FFFFFF'}"
                },
                width: ${qrCodeSize}
              };
              
              // Calculate optimal QR code size based on container
              const container = document.querySelector('.qr-code');
              if (container) {
                const containerWidth = container.clientWidth;
                const containerHeight = container.clientHeight;
                const maxSize = Math.min(containerWidth, containerHeight);
                
                // Adjust QR code size if needed to fit container
                if (maxSize > 0 && maxSize < ${qrCodeSize}) {
                  qrOptions.width = maxSize;
                  console.log('Adjusted QR size to fit container:', maxSize);
                }
              }
              
              // Generate QR code
              await QRCode.toCanvas(document.getElementById('qr-canvas'), qrContent, qrOptions);
              document.getElementById('qr-error').style.display = 'none';
            } catch (qrError) {
              console.error('Error generating QR code:', qrError);
              document.getElementById('qr-error').style.display = 'block';
              document.getElementById('qr-error').textContent = 'QR Error: ' + qrError.message;
            }
          }
        } catch (error) {
          console.error('Error generating barcode:', error);
          document.getElementById('barcode-error').style.display = 'block';
          document.getElementById('barcode-error').textContent = 'Error: ' + error.message;
          
          // For preview, show a fallback message
          if (!${autoPrint}) {
            document.getElementById('barcode-fallback').style.display = 'block';
          }
        }
        
        // Auto-print functionality if requested
        if (${autoPrint}) {
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

  // Determine layout based on QR code settings
  const isQREnabled = barcodeFormat === 'QR';
  const qrPosition = qrCodePosition;
  const qrSectionWidth = isQREnabled && (qrPosition === 'left' || qrPosition === 'right') ? `${splitLayoutRatio * 100}%` : '0';
  const textSectionWidth = isQREnabled && (qrPosition === 'left' || qrPosition === 'right') ? `${(1 - splitLayoutRatio) * 100}%` : '100%';
  
  // Prepare QR code content
  const qrCodeContentValue = qrCodeContent === 'barcode' ? validatedBarcode : qrCodeCustomContent;
  
  // Construct HTML content with split layout if QR code is enabled
  return `
    <!DOCTYPE html>
    <html ${settings.rtl ? 'dir="rtl"' : ''}>
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
      <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.1/build/qrcode.min.js"></script>
    </head>
    <body>
      <div class="barcode-container ${isQREnabled && (qrPosition === 'left' || qrPosition === 'right') ? 'split-layout' : ''}">
        ${isQREnabled && qrPosition === 'left' ? `
          <div class="qr-section" style="width: ${qrSectionWidth};">
            <div class="qr-code">
              <canvas id="qr-canvas"></canvas>
              <div id="qr-error" class="qr-error"></div>
              ${settings.displayBarcodeText ? `<div class="qr-code-text">${validatedBarcode}</div>` : ''}
            </div>
          </div>
        ` : ''}
        
        <div class="text-section" style="width: ${textSectionWidth};">
          ${settings.showBusinessName && businessName ? `
            <div class="business-info">
              <div class="business-name">${businessName}</div>
              ${settings.showVendorName && data.vendorName ? `<div class="vendor-name">${data.vendorName}</div>` : ''}
            </div>
          ` : ''}
          
          ${settings.showProductName ? `
            <div class="product-info">
              <div class="product-name">${formattedProductName}</div>
            </div>
          ` : ''}
          
          <div class="barcode-section">
            ${!isQREnabled ? `<svg id="barcode"></svg>` : ''}
            ${isQREnabled && qrPosition === 'center' ? `
              <div class="qr-code" style="margin: 0 auto;">
                <canvas id="qr-canvas"></canvas>
                <div id="qr-error" class="qr-error"></div>
                ${settings.displayBarcodeText ? `<div class="qr-code-text">${validatedBarcode}</div>` : ''}
              </div>
            ` : ''}
            <div id="barcode-error" class="barcode-error"></div>
            <div id="barcode-fallback" class="barcode-fallback">
              ${barcodeFormat === 'UPC' ? 
                `UPC format requires exactly 12 digits (current: ${barcode.length} digits)` : 
                barcodeFormat === 'EAN13' ? 
                `EAN13 format requires exactly 13 digits (current: ${barcode.length} digits)` :
                `Invalid barcode format`
              }
            </div>
            ${!isQREnabled && settings.displayBarcodeText ? `<div class="barcode-text">${validatedBarcode}</div>` : ''}
          </div>
          
          ${settings.showPrice ? `
            <div class="price-section" style="text-align: ${settings.priceAlignment};">
              <div class="price">${formattedPrice}</div>
              <div class="currency">${currency || 'OMR'}</div>
            </div>
          ` : ''}
          
          ${(settings.showExpiryDate || settings.showProductionDate) ? `
            ${barcodeFormat === 'QR' ? `
              <div class="dates-stacked">
                ${settings.showProductionDate ? `<div class="date-item">${t?.productionDate || 'Prod'}: ${formattedProductionDate}</div>` : ''}
                ${settings.showExpiryDate ? `<div class="date-item">${t?.expiryDate || 'Exp'}: ${formattedExpiryDate}</div>` : ''}
              </div>
            ` : `
              <div class="dates-container">
                ${settings.showProductionDate ? `<div class="date-item">${t?.productionDate || 'Prod'}: ${formattedProductionDate}</div>` : ''}
                ${settings.showExpiryDate ? `<div class="date-item">${t?.expiryDate || 'Exp'}: ${formattedExpiryDate}</div>` : ''}
              </div>
            `}
          ` : ''}
        </div>
        
        ${isQREnabled && qrPosition === 'right' ? `
          <div class="qr-section" style="width: ${qrSectionWidth};">
            <div class="qr-code">
              <canvas id="qr-canvas"></canvas>
              <div id="qr-error" class="qr-error"></div>
              ${settings.displayBarcodeText ? `<div class="qr-code-text">${validatedBarcode}</div>` : ''}
            </div>
          </div>
        ` : ''}
      </div>
      
      ${scriptContent}
    </body>
    </html>
  `;
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
