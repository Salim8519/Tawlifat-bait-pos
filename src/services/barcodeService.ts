// Interface for barcode data
export interface BarcodeData {
  productId: string;
  vendorId: string;
  name: string;
  price: number;
}

// Generate consistent barcode for same product + vendor combination
export function generateBarcode(data: BarcodeData): string {
  // Create a unique string combining product and vendor IDs
  const uniqueString = `${data.productId}-${data.vendorId}`;
  
  // Use a simple but consistent hash function for browser
  const hash = simpleHash(uniqueString);
  
  // Take first 12 digits (leaving last digit for checksum)
  const barcode = hash.slice(0, 12);
  
  // Calculate and append checksum digit
  return barcode + calculateChecksum(barcode);
}

// Simple hash function that works in browser
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Convert to positive 12-digit string
  const positiveHash = Math.abs(hash).toString();
  return positiveHash.padStart(12, '0').slice(0, 12);
}

// Calculate EAN-13 checksum digit
function calculateChecksum(barcode: string): number {
  let sum = 0;
  
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(barcode[i]);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  
  const checksum = (10 - (sum % 10)) % 10;
  return checksum;
}

// Print barcode using browser print functionality
export async function printBarcode(data: BarcodeData): Promise<boolean> {
  try {
    // Generate barcode if not exists
    const barcode = generateBarcode(data);
    
    // Create print window
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      console.error('Failed to open print window');
      throw new Error('Could not open print window');
    }

    // Generate print content with barcode
    const content = generatePrintContent(barcode, data);
    printWindow.document.write(content);
    printWindow.document.close();

    // Wait for document to fully load
    await new Promise<void>((resolve) => {
      printWindow.onload = () => resolve();
    });

    try {
      // Wait for fonts to load
      await printWindow.document.fonts.ready;
      
      // Additional delay to ensure rendering
      await new Promise(resolve => setTimeout(resolve, 500));

      // Print the window
      printWindow.print();
      
      // Close after printing
      return new Promise<boolean>((resolve) => {
        printWindow.onafterprint = () => {
          printWindow.close();
          resolve(true);
        };
        
        // Fallback if onafterprint is not supported
        setTimeout(() => {
          printWindow.close();
          resolve(true);
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
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Print Barcode</title>
      <link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+39&display=swap" rel="stylesheet">
      <style>
        @page {
          size: 58mm 40mm;
          margin: 0;
        }
        
        @font-face {
          font-family: 'Libre Barcode 39';
          font-style: normal;
          font-weight: 400;
          font-display: block;
          src: url(https://fonts.gstatic.com/s/librebarcode39/v21/8At7Gt6_O5yNS0-K4Nf5U922qRZP.woff2) format('woff2');
        }
        
        body {
          margin: 0;
          padding: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
        }
        
        .barcode-container {
          width: 58mm;
          padding: 2mm;
          text-align: center;
        }
        
        .barcode {
          font-family: 'Libre Barcode 39', cursive;
          font-size: 40px;
          line-height: 1;
          margin: 2mm 0;
          white-space: nowrap;
          height: 15mm;
        }
        
        .product-name {
          font-family: Arial, sans-serif;
          font-size: 12px;
          margin: 1mm 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .price {
          font-family: Arial, sans-serif;
          font-size: 12px;
          font-weight: bold;
          margin: 1mm 0;
        }
        
        .barcode-number {
          font-family: monospace;
          font-size: 11px;
          margin: 1mm 0;
          letter-spacing: 1px;
        }

        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      </style>
    </head>
    <body>
      <div class="barcode-container">
        <div class="barcode">*${barcode}*</div>
        <div class="barcode-number">${barcode}</div>
        <div class="product-name">${data.name}</div>
        <div class="price">${data.price.toFixed(3)} OMR</div>
      </div>
    </body>
    </html>
  `.trim();
}