import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';
import type { BusinessSettings } from '../types/businessSettings';
import type { Receipt } from './receiptService';
import type { CartItem } from '../types/pos';

// Constants for printer sizes
const PRINTER_SIZES = {
  NARROW: { width: '57mm', contentWidth: '55mm', fontSize: 9 },
  MEDIUM: { width: '80mm', contentWidth: '78mm', fontSize: 11 },
  WIDE: { width: '85mm', contentWidth: '82mm', fontSize: 12 },
  DEFAULT: { width: '80mm', contentWidth: '78mm', fontSize: 11 }
};

// Storage key for remembered printer size - match the cookie name for consistency
const PRINTER_SIZE_STORAGE_KEY = 'preferred_printer_size';

/**
 * Interface for receipt printing options
 */
interface PrintOptions {
  padding?: string;
  margin?: string;
}

/**
 * Gets business settings for receipt customization
 */
async function getBusinessSettings(businessCode: string): Promise<BusinessSettings | null> {
  try {
    const { data, error } = await supabase
      .from('business_settings')
      .select('*')
      .eq('business_code_', businessCode)
      .single();

    if (error) {
      console.error('Error fetching business settings:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Exception fetching business settings:', error);
    return null;
  }
}

/**
 * Formats currency values consistently
 */
function formatCurrency(amount: number): string {
  return `${amount.toFixed(3)} OMR`;
}

/**
 * Formats date and time in Arabic locale
 */
function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'PPpp', { locale: arSA });
}

/**
 * Detects optimal printer size based on device capabilities
 * Uses localStorage for persistence if available
 */
function detectPrinterSize(): { width: string; contentWidth: string; fontSize: number } {
  // Try to get from localStorage first
  try {
    const savedSize = localStorage.getItem(PRINTER_SIZE_STORAGE_KEY);
    if (savedSize) {
      try {
        // Try to parse as JSON (new format)
        const parsed = JSON.parse(savedSize);
        return parsed;
      } catch (e) {
        // If not valid JSON, it might be the old cookie format (just the width)
        // Convert old format to new format
        if (savedSize === '57mm') {
          return PRINTER_SIZES.NARROW;
        } else if (savedSize === '80mm') {
          return PRINTER_SIZES.MEDIUM;
        } else if (savedSize === '85mm') {
          return PRINTER_SIZES.WIDE;
        } else if (savedSize.includes('mm')) {
          return { 
            width: savedSize, 
            contentWidth: `calc(${savedSize} - 2mm)`, 
            fontSize: PRINTER_SIZES.DEFAULT.fontSize 
          };
        } else if (savedSize !== 'auto') {
          // Numeric value without mm
          return { 
            width: `${savedSize}mm`, 
            contentWidth: `calc(${savedSize}mm - 2mm)`, 
            fontSize: PRINTER_SIZES.DEFAULT.fontSize 
          };
        }
      }
    }
    
    // Also check for cookies for backward compatibility
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      cookie = cookie.trim();
      if (cookie.indexOf(`${PRINTER_SIZE_STORAGE_KEY}=`) === 0) {
        const value = cookie.substring(`${PRINTER_SIZE_STORAGE_KEY}=`.length);
        if (value === '57mm') {
          return PRINTER_SIZES.NARROW;
        } else if (value === '80mm') {
          return PRINTER_SIZES.MEDIUM;
        } else if (value === '85mm') {
          return PRINTER_SIZES.WIDE;
        } else if (value.includes('mm')) {
          return { 
            width: value, 
            contentWidth: `calc(${value} - 2mm)`, 
            fontSize: PRINTER_SIZES.DEFAULT.fontSize 
          };
        } else if (value !== 'auto') {
          // Numeric value without mm
          return { 
            width: `${value}mm`, 
            contentWidth: `calc(${value}mm - 2mm)`, 
            fontSize: PRINTER_SIZES.DEFAULT.fontSize 
          };
        }
      }
    }
  } catch (e) {
    console.log('Could not read from storage', e);
  }

  // Use matchMedia to detect screen width
  try {
    if (window.matchMedia('(max-width: 60mm)').matches) {
      return PRINTER_SIZES.NARROW;
    } else if (window.matchMedia('(max-width: 82mm)').matches) {
      return PRINTER_SIZES.MEDIUM;
    } else {
      return PRINTER_SIZES.WIDE;
    }
  } catch (e) {
    console.log('Error using matchMedia for detection', e);
    return PRINTER_SIZES.DEFAULT;
  }
}

/**
 * Saves detected printer size to localStorage and cookies for future use
 */
function savePrinterSize(size: { width: string; contentWidth: string; fontSize: number }): void {
  try {
    // Save to localStorage as JSON
    localStorage.setItem(PRINTER_SIZE_STORAGE_KEY, JSON.stringify(size));
    
    // Also save to cookie for backward compatibility
    // Extract the numeric part from the width for cookie storage
    let widthValue = size.width;
    if (widthValue.includes('mm')) {
      widthValue = widthValue.replace('mm', '');
    }
    
    // Set cookie with the width value
    document.cookie = `${PRINTER_SIZE_STORAGE_KEY}=${widthValue};path=/;max-age=${365 * 24 * 60 * 60}`;
  } catch (e) {
    console.log('Could not save to storage', e);
  }
}

/**
 * Generates responsive CSS for receipt printing
 */
function generateResponsiveCSS(
  printerSize: { width: string; contentWidth: string; fontSize: number },
  options: PrintOptions = {}
): string {
  const padding = options.padding || '2mm';
  const margin = options.margin || '0';
  
  return `
    @page {
      size: ${printerSize.width} auto;
      margin: ${margin};
    }
    
    body {
      width: ${printerSize.width};
      margin: 0;
      padding: 0;
      font-family: 'Noto Sans Arabic', sans-serif;
      font-size: ${printerSize.fontSize}px;
      line-height: 1.2;
      width: ${printerSize.width};
      background-color: white;
      color: black;
      text-align: center;
    }
    
    .receipt {
      width: ${printerSize.contentWidth};
      margin: 0 auto;
      padding: ${padding};
    }
    
    .logo {
      max-width: ${printerSize.width === PRINTER_SIZES.NARROW.width ? '35px' : '100px'};
      height: auto;
      margin: 1mm auto;
      display: block;
    }
    
    .header, .footer {
      text-align: center;
      margin: 1mm 0;
      font-size: ${printerSize.fontSize - 1}px;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    
    .business-name {
      font-size: ${printerSize.fontSize + 1}px;
      font-weight: bold;
      text-align: center;
      margin: 1mm 0;
      word-wrap: break-word;
    }
    
    .section {
      margin: 1mm 0;
      padding: 1mm 0;
      border-top: 1px dashed #000;
      text-align: center;
    }
    
    .items {
      margin: 1mm 0;
      text-align: right;
    }
    
    .item {
      margin: 0.5mm 0;
      padding-bottom: 0.5mm;
      border-bottom: 1px dotted #000;
    }
    
    .item-name {
      font-weight: bold;
      font-size: ${printerSize.fontSize}px;
      text-align: right;
      word-wrap: break-word;
    }
    
    .item-details {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: 0.5mm 0;
      font-size: ${printerSize.fontSize - 1}px;
    }
    
    .item-notes {
      font-size: ${Math.max(printerSize.fontSize - 2, 7)}px;
      color: #666;
      padding-right: 1mm;
      word-wrap: break-word;
    }
    
    .item-quantity {
      color: #666;
      white-space: nowrap;
    }
    
    .totals {
      margin: 1mm 0;
    }
    
    .total {
      font-weight: bold;
      font-size: ${printerSize.fontSize + 2}px;
      margin: 1mm 0;
      padding: 1mm 0;
      border-top: 1px solid #000;
      border-bottom: 1px solid #000;
    }
    
    .flex {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: 0.5mm 0;
      font-size: ${printerSize.fontSize - 1}px;
    }
    
    .text-left { text-align: left; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    
    .small {
      font-size: ${Math.max(printerSize.fontSize - 2, 7)}px;
      color: #666;
    }
  `;
}

/**
 * Generates the receipt HTML content
 */
function generateReceiptHTML(
  receipt: Receipt, 
  cartItems: CartItem[], 
  settings: BusinessSettings | null,
  printerSize: { width: string; contentWidth: string; fontSize: number }
): string {
  const qrSize = printerSize.width === PRINTER_SIZES.NARROW.width ? 80 : 120;
  
  return `
    <!DOCTYPE html>
    <html dir="rtl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Receipt #${receipt.receipt_id}</title>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;700&display=swap" rel="stylesheet">
      <style>
        ${generateResponsiveCSS(printerSize)}
      </style>
    </head>
    <body>
      <div class="receipt">
        ${settings?.url_logo_of_business ? `
          <img src="${settings.url_logo_of_business}" alt="${settings?.business_name || ''}" class="logo">
        ` : ''}
        
        <div class="business-name">
          ${settings?.business_name || ''}
        </div>
        
        ${settings?.receipt_header ? `
          <div class="header">${settings.receipt_header}</div>
        ` : ''}
        
        <div class="section">
          <div class="flex">
            <span>رقم الفاتورة:</span>
            <span>#${receipt.receipt_id}</span>
          </div>
          <div class="flex">
            <span>التاريخ:</span>
            <span>${formatDateTime(receipt.receipt_date)}</span>
          </div>
          <div class="flex">
            <span>الفرع:</span>
            <span>${receipt.branch_name}</span>
          </div>
          <div class="flex">
            <span>الكاشير:</span>
            <span>${receipt.cashier_name}</span>
          </div>
        </div>
        
        ${receipt.customer_name || receipt.customer_phone ? `
          <div class="section">
            <div class="text-center small">معلومات العميل / Customer Info</div>
            ${receipt.customer_name ? `
              <div class="flex">
                <span>العميل:</span>
                <span>${receipt.customer_name}</span>
              </div>
            ` : ''}
            ${receipt.customer_phone ? `
              <div class="flex">
                <span>رقم الهاتف:</span>
                <span>${receipt.customer_phone}</span>
              </div>
            ` : ''}
          </div>
        ` : ''}
        
        <div class="section">
          <div class="text-center small">المنتجات / Items</div>
          <div class="items">
            ${cartItems.map(item => `
              <div class="item">
                <div class="item-name">${item.nameAr}</div>
                <div class="item-details">
                  <span class="item-quantity">${item.quantity} x ${item.price.toFixed(3)}</span>
                  <span>${(item.quantity * item.price).toFixed(3)} OMR</span>
                </div>
                ${item.notes ? `
                  <div class="item-notes">${item.notes}</div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        </div>
        
        <div class="section">
          <div class="text-center small">الحساب / Bill</div>
          <div class="totals">
            <div class="flex">
              <span>المجموع الفرعي:</span>
              <span>${formatCurrency(receipt.total_amount)}</span>
            </div>
            
            ${receipt.discount > 0 ? `
              <div class="flex">
                <span>الخصم:</span>
                <span>-${formatCurrency(receipt.discount)}</span>
              </div>
            ` : ''}
            
            ${receipt.coupon_code ? `
              <div class="flex small">
                <span>كوبون:</span>
                <span>${receipt.coupon_code}</span>
              </div>
            ` : ''}
            
            ${receipt.tax_amount > 0 ? `
              <div class="flex">
                <span>الضريبة (${settings?.tax_rate || 0}%):</span>
                <span>${formatCurrency(receipt.tax_amount)}</span>
              </div>
            ` : ''}
            
            <div class="total flex">
              <span>المجموع النهائي:</span>
              <span>${formatCurrency(receipt.total_amount)}</span>
            </div>
            
            <div class="flex small">
              <span>طريقة الدفع:</span>
              <span>${
                receipt.payment_method === 'cash' ? 'نقدي / Cash' :
                receipt.payment_method === 'card' ? 'بطاقة / Card' :
                'دفع إلكتروني / Online'
              }</span>
            </div>
          </div>
        </div>
        
        ${receipt.receipt_note ? `
          <div class="section">
            <div class="text-center small">ملاحظات / Notes</div>
            <div class="text-center">
              ${receipt.receipt_note}
            </div>
          </div>
        ` : ''}
        
        ${settings?.receipt_footer ? `
          <div class="section">
            <div class="footer">${settings.receipt_footer}</div>
          </div>
        ` : ''}
        
        <div class="section text-center">
          <div class="small">
            شكراً لتسوقكم معنا
            <br>
            Thank you for shopping with us
          </div>
        </div>
      </div>
      
      <script>
        window.onload = () => {
          window.print();
          setTimeout(() => {
            window.close();
          }, 500);
        };
      </script>
    </body>
    </html>
  `;
}

/**
 * Main function to print a receipt with auto-detection of printer size
 * Maintains backward compatibility with the original function
 */
export async function printReceiptV2(
  receipt: Receipt,
  cartItems: CartItem[],
  printerWidth?: string,
  options: PrintOptions = {}
): Promise<boolean> {
  try {
    // Get business settings
    const settings = await getBusinessSettings(receipt.business_code);
    
    // Determine printer size (auto-detect or use provided width)
    let printerSize;
    
    if (printerWidth) {
      // Use provided width if specified
      switch (printerWidth) {
        case '57mm':
          printerSize = PRINTER_SIZES.NARROW;
          break;
        case '80mm':
          printerSize = PRINTER_SIZES.MEDIUM;
          break;
        case '85mm':
          printerSize = PRINTER_SIZES.WIDE;
          break;
        default:
          printerSize = { 
            width: printerWidth.includes('mm') ? printerWidth : `${printerWidth}mm`, 
            contentWidth: printerWidth.includes('mm') 
              ? `calc(${printerWidth} - 2mm)` 
              : `calc(${printerWidth}mm - 2mm)`, 
            fontSize: PRINTER_SIZES.DEFAULT.fontSize 
          };
      }
    } else {
      // Auto-detect printer size
      printerSize = detectPrinterSize();
      // Save for future use
      savePrinterSize(printerSize);
    }
    
    // Generate receipt HTML with responsive CSS that includes the options
    const css = generateResponsiveCSS(printerSize, options);
    const receiptHtml = generateReceiptHTML(receipt, cartItems, settings, printerSize)
      .replace('</style>', `${css}</style>`);
    
    // Create a new window and print
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Could not open print window. Please check if pop-ups are blocked.');
    }
    
    printWindow.document.write(receiptHtml);
    printWindow.document.close();
    
    return true;
  } catch (error) {
    console.error('Error printing receipt:', error);
    return false;
  }
}

// For backward compatibility
export async function printReceipt(
  receipt: Receipt,
  cartItems: CartItem[],
  printerWidth: '57mm' | '80mm' | '85mm' = '80mm'
): Promise<boolean> {
  return printReceiptV2(receipt, cartItems, printerWidth);
}
