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
  barcodeDensity: number; // Controls density/spacing between bars (0-1)
  priceFontSize: number;
  dateFontSize: number;
  elementSpacing: number; // Controls spacing between all elements
}

// Default barcode settings
export const defaultBarcodeSettings: BarcodeSettings = {
  businessNameFontSize: 7,
  vendorNameFontSize: 7,
  productNameFontSize: 8,
  barcodeFontSize: 8,
  barcodeWidth: 40,
  barcodeHeight: 15,
  barcodeLineWidth: 1,
  barcodeDensity: 0.8, // Higher default density for more compact barcodes
  priceFontSize: 10,
  dateFontSize: 6,
  elementSpacing: 1 // Default spacing (in mm)
};

// Get cached settings from localStorage or return defaults
export function getCachedBarcodeSettings(): BarcodeSettings {
  try {
    const cached = localStorage.getItem('barcodeSettings');
    if (cached) {
      const parsedSettings = JSON.parse(cached);
      // Ensure all properties exist by merging with defaults
      return { ...defaultBarcodeSettings, ...parsedSettings };
    }
  } catch (error) {
    console.error('Error loading cached barcode settings:', error);
  }
  return { ...defaultBarcodeSettings };
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
    
    // Always get the latest cached settings if not explicitly provided
    const effectiveSettings = settings || getCachedBarcodeSettings();
    
    // Log the settings being used for debugging
    console.log('Using barcode settings:', effectiveSettings);
    
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
      // Increased from 1000ms to 2000ms to ensure barcode is fully initialized
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check if barcode has been properly initialized
      const barcodeInitialized = await new Promise<boolean>((resolve) => {
        printWindow.postMessage({ type: 'CHECK_BARCODE_INITIALIZED' }, '*');
        
        // Add event listener to receive response
        const messageHandler = (event: MessageEvent) => {
          if (event.data && event.data.type === 'BARCODE_INITIALIZED_STATUS') {
            window.removeEventListener('message', messageHandler);
            resolve(event.data.initialized);
          }
        };
        
        window.addEventListener('message', messageHandler);
        
        // Add script to check barcode initialization
        const checkScript = printWindow.document.createElement('script');
        checkScript.innerHTML = `
          window.addEventListener('message', function(event) {
            if (event.data && event.data.type === 'CHECK_BARCODE_INITIALIZED') {
              const barcodeElement = document.querySelector('#barcode svg');
              const initialized = !!barcodeElement;
              event.source.postMessage({ 
                type: 'BARCODE_INITIALIZED_STATUS', 
                initialized: initialized 
              }, '*');
            }
          });
        `;
        printWindow.document.body.appendChild(checkScript);
        
        // Timeout after 3 seconds
        setTimeout(() => resolve(false), 3000);
      });
      
      if (!barcodeInitialized) {
        console.warn('Barcode may not be properly initialized before printing');
      }

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

// Print barcode with explicit settings
export async function printBarcodeWithSettings(data: BarcodeData): Promise<boolean> {
  try {
    // Get the latest cached settings
    const settings = getCachedBarcodeSettings();
    
    // Log the settings for debugging
    console.log('Printing barcode with explicit settings:', settings);
    
    // Use existing barcode or generate new one
    const barcode = data.existingBarcode || generateBarcode(data);
    
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

    // Generate print content with barcode and explicit settings
    const content = generatePrintContentWithExplicitSettings(barcode, data, settings);
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
      await new Promise(resolve => setTimeout(resolve, 2000));

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
    console.error('Failed to print barcode with explicit settings:', error);
    throw error;
  }
}

// Helper function to format dates
function formatDate(date: string | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear().toString().slice(-2);
  return `${day}/${month}/${year}`;
}

// Generate print content with explicit settings
function generatePrintContentWithExplicitSettings(barcode: string, data: BarcodeData, settings: BarcodeSettings): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Product Barcode</title>
      <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
      <style>
        @page {
          size: 58mm 40mm;
          margin: 0;
        }
        body {
          margin: ${settings.elementSpacing * 1.5}mm;
          font-family: Arial, sans-serif;
          font-size: 8pt;
        }
        .container {
          width: 55mm;
          height: 38mm;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: ${settings.elementSpacing}mm;
          overflow: visible;
        }
        .business-name {
          font-size: ${settings.businessNameFontSize}pt;
          margin-bottom: ${settings.elementSpacing}mm;
          text-align: center;
          width: 100%;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .vendor-name {
          font-size: ${settings.vendorNameFontSize}pt;
          margin-bottom: ${settings.elementSpacing}mm;
          text-align: center;
          width: 100%;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .product-name {
          font-size: ${settings.productNameFontSize}pt;
          font-weight: bold;
          margin-bottom: ${settings.elementSpacing}mm;
          text-align: center;
          width: 100%;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .barcode {
          margin: ${settings.elementSpacing}mm 0;
          width: 100%;
          text-align: center;
          min-height: ${settings.barcodeHeight + settings.elementSpacing * 2}mm; /* Ensure space for barcode */
          padding: 0;
          line-height: 0;
          font-size: 0;
          overflow: visible;
        }
        .compact-barcode {
          text-align: center;
          line-height: 0;
          font-size: 0;
          padding: 0;
          margin: 0;
          overflow: visible;
        }
        .compact-barcode svg {
          display: inline-block !important;
          max-width: 100%;
          width: ${settings.barcodeWidth}mm !important;
          height: ${settings.barcodeHeight}mm !important;
          margin: 0 !important;
          padding: 0 !important;
          line-height: 0 !important;
        }
        .barcode-number {
          font-size: ${settings.barcodeFontSize}pt;
          text-align: center;
          margin-top: ${settings.elementSpacing}mm;   
          font-family: monospace;
        }
        .price {
          font-size: ${settings.priceFontSize}pt;
          font-weight: bold;
          margin: ${settings.elementSpacing}mm 0;
        }
        .dates {
          font-size: ${settings.dateFontSize}pt;
          display: flex;
          gap: ${settings.elementSpacing * 3}mm;
          justify-content: center;
          width: 100%;
          margin-top: ${settings.elementSpacing}mm;
          margin-bottom: ${settings.elementSpacing}mm;
        }
        .date {
          display: flex;
          gap: ${settings.elementSpacing}mm;
          align-items: center;
          padding: ${settings.elementSpacing * 0.5}mm;
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
        <div class="barcode compact-barcode">
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
        // Function to initialize the barcode
        const initializeBarcode = () => {
          try {
            if (window.JsBarcode) {
              console.log('Initializing barcode with settings:', {
                barcodeLineWidth: ${settings.barcodeLineWidth},
                barcodeDensity: ${settings.barcodeDensity},
                barcodeWidth: ${settings.barcodeWidth},
                barcodeHeight: ${settings.barcodeHeight},
                barcodeFontSize: ${settings.barcodeFontSize}
              });
              
              // Calculate bar width based on density
              // Higher density = thinner bars with less space
              const calculatedWidth = ${settings.barcodeLineWidth} * (1 - ${settings.barcodeDensity} * 0.8);
              
              // Apply custom CSS to control barcode spacing
              const styleElement = document.createElement('style');
              const scaleValue = 1 + ${settings.barcodeDensity} * 0.3;
              const barcodeWidth = ${settings.barcodeWidth};
              const barcodeHeight = ${settings.barcodeHeight};
              styleElement.innerHTML = 
                '#barcode svg rect { margin: 0 !important; padding: 0 !important; }' +
                '#barcode svg g { transform: scale(' + scaleValue + ') !important; }' +
                '#barcode svg { transform-origin: center !important; display: inline-block !important; }' +
                '.compact-barcode { text-align: center; line-height: 0; font-size: 0; }' +
                '.compact-barcode svg { display: inline-block !important; max-width: 100%; width: ' + barcodeWidth + 'mm !important; height: ' + barcodeHeight + 'mm !important; margin: 0 !important; padding: 0 !important; line-height: 0 !important; }';
              document.head.appendChild(styleElement);
              
              window.JsBarcode("#barcode", "${barcode}", {
                format: "CODE128",
                width: calculatedWidth, // Width adjusted by density
                height: ${settings.barcodeHeight},
                displayValue: false,
                margin: 0, // No margin
                background: "transparent",
                lineColor: "#000",
                fontSize: ${settings.barcodeFontSize},
                textMargin: 0,
                flat: true, // Removes extra space between bars
                valid: () => true // Always consider valid to prevent errors
              });
              
              // Force redraw to apply custom styling
              const barcodeElement = document.getElementById('barcode');
              if (barcodeElement) {
                const svgContent = barcodeElement.innerHTML;
                barcodeElement.innerHTML = svgContent;
              }
            } else {
              console.warn('JsBarcode not available yet, will retry...');
              setTimeout(initializeBarcode, 100);
            }
          } catch (error) {
            console.error('Error initializing barcode:', error);
            // Make sure the barcode number is visible if barcode fails
            const barcodeNumberElement = document.querySelector('.barcode-number');
            if (barcodeNumberElement) {
              barcodeNumberElement.textContent = "${barcode}";
            }
          }
        };
        
        // Try to initialize immediately and also with a delay as backup
        if (document.readyState === 'complete') {
          initializeBarcode();
        } else {
          window.onload = initializeBarcode;
        }
        
        // Add multiple retries with increasing delays to ensure barcode is initialized
        let retryCount = 0;
        const maxRetries = 5;
        const retryInitialization = () => {
          if (retryCount < maxRetries) {
            retryCount++;
            const delay = retryCount * 300; // Increasing delay
            console.log("Retry " + retryCount + "/" + maxRetries + " after " + delay + "ms");
            setTimeout(initializeBarcode, delay);
          }
        };
        
        // Backup initialization with multiple retries
        setTimeout(initializeBarcode, 300);
        setTimeout(retryInitialization, 600);
        setTimeout(retryInitialization, 1200);
      </script>
    </body>
    </html>
  `;
}

// Generate print content with barcode
function generatePrintContent(barcode: string, data: BarcodeData, settings: BarcodeSettings = defaultBarcodeSettings, isPreview: boolean = false): string {
  // Log the settings being used for this print content
  console.log('Generating print content with settings:', settings);
  
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
          margin: ${settings.elementSpacing * 1.5}mm;
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
          ${isPreview ? `padding: ${settings.elementSpacing}mm;` : ''}
          overflow: visible;
        }
        .business-name {
          font-size: ${settings.businessNameFontSize}pt;
          margin-bottom: ${settings.elementSpacing}mm;
          text-align: center;
          width: 100%;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .vendor-name {
          font-size: ${settings.vendorNameFontSize}pt;
          margin-bottom: ${settings.elementSpacing}mm;
          text-align: center;
          width: 100%;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .product-name {
          font-size: ${settings.productNameFontSize}pt;
          font-weight: bold;
          margin-bottom: ${settings.elementSpacing}mm;
          text-align: center;
          width: 100%;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .barcode {
          margin: ${settings.elementSpacing}mm 0;
          width: 100%;
          text-align: center;
          min-height: ${settings.barcodeHeight + settings.elementSpacing * 2}mm; /* Ensure space for barcode */
          padding: 0;
          line-height: 0;
          font-size: 0;
          overflow: visible;
        }
        .compact-barcode {
          text-align: center;
          line-height: 0;
          font-size: 0;
          padding: 0;
          margin: 0;
          overflow: visible;
        }
        .compact-barcode svg {
          display: inline-block !important;
          max-width: 100%;
          width: ${settings.barcodeWidth}mm !important;
          height: ${settings.barcodeHeight}mm !important;
          margin: 0 !important;
          padding: 0 !important;
          line-height: 0 !important;
        }
        .barcode-number {
          font-size: ${settings.barcodeFontSize}pt;
          text-align: center;
          margin-top: ${settings.elementSpacing}mm;   
          font-family: monospace;
        }
        .price {
          font-size: ${settings.priceFontSize}pt;
          font-weight: bold;
          margin: ${settings.elementSpacing}mm 0;
        }
        .dates {
          font-size: ${settings.dateFontSize}pt;
          display: flex;
          gap: ${settings.elementSpacing * 3}mm;
          justify-content: center;
          width: 100%;
          margin-top: ${settings.elementSpacing}mm;
          margin-bottom: ${settings.elementSpacing}mm;
        }
        .date {
          display: flex;
          gap: ${settings.elementSpacing}mm;
          align-items: center;
          padding: ${settings.elementSpacing * 0.5}mm;
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
        <div class="barcode compact-barcode">
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
        // Function to initialize the barcode
        const initializeBarcode = () => {
          try {
            if (window.JsBarcode) {
              console.log('Initializing barcode with settings:', {
                barcodeLineWidth: ${settings.barcodeLineWidth},
                barcodeDensity: ${settings.barcodeDensity},
                barcodeWidth: ${settings.barcodeWidth},
                barcodeHeight: ${settings.barcodeHeight},
                barcodeFontSize: ${settings.barcodeFontSize}
              });
              
              // Calculate bar width based on density
              // Higher density = thinner bars with less space
              const calculatedWidth = ${settings.barcodeLineWidth} * (1 - ${settings.barcodeDensity} * 0.8);
              
              // Apply custom CSS to control barcode spacing
              const styleElement = document.createElement('style');
              const scaleValue = 1 + ${settings.barcodeDensity} * 0.3;
              const barcodeWidth = ${settings.barcodeWidth};
              const barcodeHeight = ${settings.barcodeHeight};
              styleElement.innerHTML = 
                '#barcode svg rect { margin: 0 !important; padding: 0 !important; }' +
                '#barcode svg g { transform: scale(' + scaleValue + ') !important; }' +
                '#barcode svg { transform-origin: center !important; display: inline-block !important; }' +
                '.compact-barcode { text-align: center; line-height: 0; font-size: 0; }' +
                '.compact-barcode svg { display: inline-block !important; max-width: 100%; width: ' + barcodeWidth + 'mm !important; height: ' + barcodeHeight + 'mm !important; margin: 0 !important; padding: 0 !important; line-height: 0 !important; }';
              document.head.appendChild(styleElement);
              
              window.JsBarcode("#barcode", "${barcode}", {
                format: "CODE128",
                width: calculatedWidth, // Width adjusted by density
                height: ${settings.barcodeHeight},
                displayValue: false,
                margin: 0, // No margin
                background: "transparent",
                lineColor: "#000",
                fontSize: ${settings.barcodeFontSize},
                textMargin: 0,
                flat: true, // Removes extra space between bars
                valid: () => true // Always consider valid to prevent errors
              });
              
              // Force redraw to apply custom styling
              const barcodeElement = document.getElementById('barcode');
              if (barcodeElement) {
                const svgContent = barcodeElement.innerHTML;
                barcodeElement.innerHTML = svgContent;
              }
            } else {
              console.warn('JsBarcode not available yet, will retry...');
              setTimeout(initializeBarcode, 100);
            }
          } catch (error) {
            console.error('Error initializing barcode:', error);
            // Make sure the barcode number is visible if barcode fails
            const barcodeNumberElement = document.querySelector('.barcode-number');
            if (barcodeNumberElement) {
              barcodeNumberElement.textContent = "${barcode}";
            }
          }
        };
        
        // Try to initialize immediately and also with a delay as backup
        if (document.readyState === 'complete') {
          initializeBarcode();
        } else {
          window.onload = initializeBarcode;
        }
        
        // Add multiple retries with increasing delays to ensure barcode is initialized
        let retryCount = 0;
        const maxRetries = 5;
        const retryInitialization = () => {
          if (retryCount < maxRetries) {
            retryCount++;
            const delay = retryCount * 300; // Increasing delay
            console.log("Retry " + retryCount + "/" + maxRetries + " after " + delay + "ms");
            setTimeout(initializeBarcode, delay);
          }
        };
        
        // Backup initialization with multiple retries
        setTimeout(initializeBarcode, 300);
        setTimeout(retryInitialization, 600);
        setTimeout(retryInitialization, 1200);
      </script>
    </body>
    </html>
  `;
}

export const generateBarcodeImage = async (
  barcode: string,
  settings: BarcodeSettings = getCachedBarcodeSettings()
): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      // Log the settings being used
      console.log('Generating barcode image with settings:', settings);
      
      // Create a temporary canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Create a temporary SVG element to hold the barcode
      const svg = document.createElement('div');
      svg.className = 'compact-barcode';
      svg.innerHTML = '<svg id="temp-barcode"></svg>';
      document.body.appendChild(svg);

      // Use JsBarcode to generate the barcode
      try {
        // Calculate bar width based on density
        // Higher density = thinner bars with less space
        const calculatedWidth = settings.barcodeLineWidth * (1 - settings.barcodeDensity * 0.8);
        
        // Apply custom CSS to control barcode spacing
        const styleElement = document.createElement('style');
        const scaleValue = 1 + settings.barcodeDensity * 0.3;
        const barcodeWidth = settings.barcodeWidth;
        const barcodeHeight = settings.barcodeHeight;
        styleElement.innerHTML = 
          '#temp-barcode svg rect { margin: 0 !important; padding: 0 !important; }' +
          '#temp-barcode svg g { transform: scale(' + scaleValue + ') !important; }' +
          '#temp-barcode svg { transform-origin: center !important; display: inline-block !important; }' +
          '.compact-barcode { text-align: center; line-height: 0; font-size: 0; }' +
          '.compact-barcode svg { display: inline-block !important; max-width: 100%; width: ' + barcodeWidth + 'mm !important; height: ' + barcodeHeight + 'mm !important; margin: 0 !important; padding: 0 !important; line-height: 0 !important; }';
        document.head.appendChild(styleElement);
        
        window.JsBarcode("#temp-barcode", barcode, {
          format: "CODE128",
          width: calculatedWidth, // Width adjusted by density
          height: settings.barcodeHeight,
          displayValue: false,
          margin: 0, // No margin
          background: "transparent",
          lineColor: "#000",
          fontSize: settings.barcodeFontSize,
          textMargin: 0,
          flat: true, // Removes extra space between bars
          valid: () => true // Always consider valid to prevent errors
        });
        
        // Force redraw to apply custom styling
        const barcodeElement = document.getElementById('temp-barcode');
        if (barcodeElement) {
          const svgContent = barcodeElement.innerHTML;
          barcodeElement.innerHTML = svgContent;
        }
      } catch (error) {
        document.body.removeChild(svg);
        reject(new Error(`Failed to generate barcode: ${error}`));
        return;
      }

      // Get the SVG data
      const svgData = new XMLSerializer().serializeToString(svg);
      document.body.removeChild(svg);

      // Convert SVG to image
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        resolve(dataUrl);
      };
      img.onerror = () => {
        reject(new Error('Failed to load SVG as image'));
      };
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    } catch (error) {
      reject(new Error(`Error generating barcode image: ${error}`));
    }
  });
};