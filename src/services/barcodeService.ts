import { useSettingsStore } from '../store/useSettingsStore';

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

// Print barcode using browser print functionality
export async function printBarcode(data: BarcodeData): Promise<boolean> {
  try {
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

    // Generate print content with barcode
    const content = generatePrintContent(barcode, data);
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
function generatePrintContent(barcode: string, data: BarcodeData): string {
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
        @page {
          size: 58mm 40mm;
          margin: 0;
        }
        body {
          margin: 1.5mm;
          font-family: Arial, sans-serif;
          font-size: 8pt;
        }
        .container {
          width: 55mm;
          height: 37mm;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .business-name {
          font-size: 7pt;
          margin-bottom: 0.5mm;
          text-align: center;
          width: 100%;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .product-name {
          font-size: 8pt;
          font-weight: bold;
          margin-bottom: 0.5mm;
          text-align: center;
          width: 100%;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .barcode {
          margin: 0.5mm 0;
        }
        .barcode svg {
          width: 45mm !important;
          height: 12mm !important;
          margin-bottom: 0.3mm;  
        }
        .barcode-number {
          font-size: 6pt;
          text-align: center;
          margin-top: 0.2mm;   
          font-family: monospace;
        }
        .price {
          font-size: 9pt;
          font-weight: bold;
          margin: 0.5mm 0;
        }
        .dates {
          font-size: 6pt;
          display: flex;
          gap: 3mm;
          justify-content: center;
          width: 100%;
          margin-top: 0.5mm;
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
        ${data.vendorName ? `<div class="business-name">${data.vendorName}</div>` : ''}
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
        JsBarcode("#barcode", "${barcode}", {
          format: "CODE128",
          width: 0.5,
          height: 18,
          displayValue: false,
          margin: 0,
          background: "transparent",
          lineColor: "#000",
          fontSize: 6,
          textMargin: 0
        });
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