import { useSettingsStore } from '../store/useSettingsStore';

// Interface for barcode settings
export interface BarcodeSettings {
  businessNameFontSize: number;
  vendorNameFontSize: number;
  productNameFontSize: number;
  barcodeFontSize: number;
  barcodeWidth: number;
  barcodeHeight: number;
  barcodeLineWidth: number;
  priceFontSize: number;
  dateFontSize: number;
}

// Default barcode settings
export const defaultBarcodeSettings: BarcodeSettings = {
  businessNameFontSize: 7,
  vendorNameFontSize: 7,
  productNameFontSize: 8,
  barcodeFontSize: 6,
  barcodeWidth: 45,
  barcodeHeight: 12,
  barcodeLineWidth: 1,
  priceFontSize: 9,
  dateFontSize: 6,
};

// Get cached settings from localStorage or return defaults
export function getCachedBarcodeSettings(): BarcodeSettings {
  try {
    const cached = localStorage.getItem('barcodeSettings');
    if (cached) {
      const parsedSettings = JSON.parse(cached);
      return parsedSettings;
    }
  } catch (error) {
    console.error('Error loading cached barcode settings:', error);
  }
  return defaultBarcodeSettings;
}

// Interface for barcode data
export interface BarcodeData {
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

// Generate a 7-digit barcode
export function generateBarcode(data: BarcodeData): string {
  // If an existing barcode is provided, use it
  if (data.existingBarcode) {
    return data.existingBarcode;
  }
  
  // Create a unique string combining product and vendor IDs
  const uniqueString = `${data.productId}-${data.vendorId}`;
  
  // Generate a 6-digit number (leaving last digit for checksum)
  const baseNumber = generateSixDigitNumber(uniqueString);
  
  // Calculate and append checksum digit
  return baseNumber + calculateChecksum(baseNumber);
}

// Generate a consistent 6-digit number from a string
function generateSixDigitNumber(str: string): string {
  let number = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    number = ((number << 5) - number) + char;
    number = number & number; // Convert to 32-bit integer
  }
  
  // Get last 6 digits, ensuring it starts with 1-9
  const positiveNum = Math.abs(number) % 900000 + 100000;
  return positiveNum.toString();
}

// Calculate checksum digit for 6-digit number
function calculateChecksum(barcode: string): number {
  let sum = 0;
  
  for (let i = 0; i < 6; i++) {
    const digit = parseInt(barcode[i]);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  
  const checksum = (10 - (sum % 10)) % 10;
  return checksum;
}

// Generate barcode preview content
export function generateBarcodePreview(data: BarcodeData, settings?: BarcodeSettings): string {
  const barcode = data.existingBarcode || generateBarcode(data);
  const effectiveSettings = settings || getCachedBarcodeSettings();
  return generatePrintContent(barcode, data, effectiveSettings, true);
}

// Print barcode using browser print functionality
export async function printBarcode(data: BarcodeData, settings?: BarcodeSettings): Promise<boolean> {
  try {
    // Use existing barcode or generate new one
    const barcode = data.existingBarcode || generateBarcode(data);
    const effectiveSettings = settings || getCachedBarcodeSettings();
    
    // Try to detect if we're in an iframe
    const isInIframe = window !== window.parent;
    
    // If in iframe, try to open in parent window
    const targetWindow = isInIframe ? window.parent : window;
    
    // Create print window
    const printWindow = targetWindow.open('', '_blank', 'width=600,height=600');
    if (!printWindow) {
      console.error('Failed to open print window');
      throw new Error('Could not open print window');
    }

    // Generate print content with barcode
    const content = generatePrintContent(barcode, data, effectiveSettings, false);
    printWindow.document.write(content);
    printWindow.document.close();

    // Wait for document and fonts to load
    await new Promise<void>((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 50;
      const checkLoaded = () => {
        attempts++;
        if (attempts > maxAttempts) {
          reject(new Error('Timeout waiting for document to load'));
          return;
        }

        if (printWindow.document.readyState === 'complete') {
          resolve();
        } else {
          setTimeout(checkLoaded, 100);
        }
      };
      
      printWindow.onload = () => checkLoaded();
      checkLoaded();
    });

    try {
      // Wait for fonts to load
      await printWindow.document.fonts.ready;
      
      // Additional delay for reliable rendering
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Print the window
      printWindow.print();
      
      // Close after printing
      return new Promise<boolean>((resolve) => {
        let closed = false;
        
        printWindow.onafterprint = () => {
          if (!closed) {
            closed = true;
            printWindow.close();
            resolve(true);
          }
        };
        
        // Fallback if onafterprint is not supported
        setTimeout(() => {
          if (!closed) {
            closed = true;
            printWindow.close();
            resolve(true);
          }
        }, 1000);
      });
    } catch (error) {
      console.error('Print error:', error);
      printWindow.close();
      throw error;
    }
  } catch (error) {
    console.error('Failed to print barcode:', error);
    throw error;
  }
}

// Generate print content with barcode
function generatePrintContent(barcode: string, data: BarcodeData, settings: BarcodeSettings = defaultBarcodeSettings, isPreview: boolean = false): string {
  const formatDate = (date: string | undefined) => {
    if (!date) return '';
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear().toString().slice(-2);
    return `${day}/${month}/${year}`;
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Product Barcode</title>
      <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
      <style>
        ${isPreview ? '' : `
        @page {
          size: 58mm 40mm;
          margin: 0;
        }`}
        body {
          margin: 1.5mm;
          font-family: Arial, sans-serif;
          font-size: 8pt;
          ${isPreview ? 'background-color: white;' : ''}
        }
        .container {
          width: ${isPreview ? '100%' : '55mm'};
          height: ${isPreview ? 'auto' : '38mm'};
          display: flex;
          flex-direction: column;
          align-items: center;
          ${isPreview ? 'padding: 8px;' : ''}
          overflow: visible;
        }
        .business-name {
          font-size: ${settings.businessNameFontSize}pt;
          margin-bottom: 0.5mm;
          text-align: center;
          width: 100%;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .vendor-name {
          font-size: ${settings.vendorNameFontSize}pt;
          margin-bottom: 0.5mm;
          text-align: center;
          width: 100%;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .product-name {
          font-size: ${settings.productNameFontSize}pt;
          font-weight: bold;
          margin-bottom: 0.5mm;
          text-align: center;
          width: 100%;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .barcode {
          margin: 1mm 0;
          width: 100%;
          text-align: center;
          min-height: ${settings.barcodeHeight + 5}mm; /* Ensure space for barcode */
        }
        .barcode svg {
          width: ${settings.barcodeWidth}mm !important;
          height: ${settings.barcodeHeight}mm !important;
          margin-bottom: 0.5mm;
          display: inline-block !important;
        }
        .barcode-number {
          font-size: ${settings.barcodeFontSize}pt;
          text-align: center;
          margin-top: 0.2mm;   
          font-family: monospace;
        }
        .price {
          font-size: ${settings.priceFontSize}pt;
          font-weight: bold;
          margin: 0.5mm 0;
        }
        .dates {
          font-size: ${settings.dateFontSize}pt;
          display: flex;
          gap: 3mm;
          justify-content: center;
          width: 100%;
          margin-top: 1mm;
          margin-bottom: 1mm;
        }
        .date {
          display: flex;
          gap: 1mm;
          align-items: center;
        }
        .date-label {
          color: #666;
        }
        .expiry-label {
          color: #ff0000;
        }
        .expiry-date {
          color: #ff0000 !important;
        }
      </style>
    </head>
    <body>
      <div class="container">
        ${data.businessName ? `<div class="business-name">${data.businessName}</div>` : ''}
        ${data.vendorName ? `<div class="vendor-name">${data.vendorName}</div>` : ''}
        <div class="product-name">${data.name}</div>
        <div class="barcode">
          <svg id="barcode"></svg>
          <div class="barcode-number">${barcode}</div>
        </div>
        <div class="price">${data.price.toFixed(3)} OMR</div>
        <div class="dates">
          ${data.productionDate ? `
            <div class="date">
              <span class="date-label">Prd:</span>
              <span>${formatDate(data.productionDate)}</span>
            </div>
          ` : ''}
          ${data.expiryDate ? `
            <div class="date">
              <span class="expiry-label">Exp:</span>
              <span class="expiry-date">${formatDate(data.expiryDate)}</span>
            </div>
          ` : ''}
        </div>
      </div>
      <script>
        // Wait for DOM and JsBarcode to be ready
        function initBarcode() {
          if (typeof JsBarcode === 'undefined') {
            // If JsBarcode isn't available yet, try again in 100ms
            setTimeout(initBarcode, 100);
            return;
          }
          
          try {
            JsBarcode("#barcode", "${barcode}", {
              format: "CODE128",
              width: ${Math.max(0.5, Math.min(3, settings.barcodeLineWidth))}, // Constrain values
              height: ${Math.max(10, Math.min(50, settings.barcodeHeight))},
              displayValue: false,
              margin: 0,
              background: "transparent",
              lineColor: "#000",
              fontSize: ${settings.barcodeFontSize},
              textMargin: 0
            });
          } catch (e) {
            console.error("Error generating barcode:", e);
            // Fallback - display the barcode number in a more visible way
            var barcodeNumber = document.querySelector('.barcode-number');
            if (barcodeNumber) {
              barcodeNumber.style.fontSize = '12pt';
              barcodeNumber.style.fontWeight = 'bold';
            }
          }
        }
        
        // Try to initialize immediately and also with a delay as backup
        if (document.readyState === 'complete') {
          initBarcode();
        } else {
          window.onload = initBarcode;
        }
        // Backup initialization
        setTimeout(initBarcode, 300);
      </script>
    </body>
    </html>
  `;
}

function generateBarcodeImage(barcode: string): string {
  // This function should generate a barcode image from the given barcode string
  // For demonstration purposes, it returns a placeholder image
  return 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
}