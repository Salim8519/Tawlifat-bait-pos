import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';
import type { BusinessSettings } from '../types/businessSettings';
import type { Receipt } from './receiptService';
import type { CartItem } from '../types/pos';

async function getBusinessSettings(businessCode: string): Promise<BusinessSettings | null> {
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
}

function formatCurrency(amount: number): string {
  return `${amount.toFixed(3)} OMR`;
}

function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'PPpp', { locale: arSA });
}

export async function printReceipt(
  receipt: Receipt,
  cartItems: CartItem[],
  printerWidth: '57mm' | '80mm' | '85mm' = '80mm'
): Promise<boolean> {
  try {
    // Get business settings
    const settings = await getBusinessSettings(receipt.business_code);
    
    // Calculate sizes based on printer width
    const fontSize = printerWidth === '57mm' ? 9 : 12;
    const headerFontSize = printerWidth === '57mm' ? 8 : 11;
    const totalsFontSize = printerWidth === '57mm' ? 11 : 14;
    const qrSize = printerWidth === '57mm' ? 80 : 120;
    const contentWidth = printerWidth === '57mm' ? '45mm' : printerWidth === '80mm' ? '72mm' : '76mm';
    
    // Generate receipt HTML
    const receiptHtml = `
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Receipt #${receipt.receipt_id}</title>
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;700&display=swap" rel="stylesheet">
        <style>
          @page {
            size: ${printerWidth} auto;
            margin: 0mm !important;
            padding: 0mm !important;
          }
          
          @media print {
            html, body {
              width: ${printerWidth};
              margin: 0 !important;
              padding: 0 !important;
            }
            
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
              zoom: 100% !important;
              transform: none !important;
              transform-origin: unset !important;
            }
            
            .receipt {
              page-break-inside: avoid;
              width: ${contentWidth};
              transform: none !important;
            }
            
            .item {
              page-break-inside: avoid;
            }
          }
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            margin: 0;
            padding: 1mm;
            font-family: 'Noto Sans Arabic', sans-serif;
            font-size: ${fontSize}px;
            line-height: 1.2;
            width: ${printerWidth};
            background-color: white;
            color: black;
            text-align: center;
            font-weight: bold;
          }
          
          .receipt {
            width: ${contentWidth};
            margin: 0 auto;
            padding: 0 1mm;
          }
          
          .logo {
            width: ${printerWidth === '57mm' ? '35px' : '100px'};
            height: auto;
            margin: 1mm auto;
            display: block;
          }
          
          .header, .footer {
            text-align: center;
            margin: 1mm 0;
            font-size: ${headerFontSize}px;
            white-space: pre-wrap;
            word-wrap: break-word;
            font-weight: bold;
          }
          
          .business-name {
            font-size: ${fontSize + 1}px;
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
            font-size: ${fontSize}px;
            text-align: right;
            word-wrap: break-word;
          }
          
          .item-details {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin: 0.5mm 0;
            font-size: ${fontSize - 1}px;
            font-weight: bold;
          }
          
          .item-notes {
            font-size: ${fontSize - 2}px;
            color: #000000;
            padding-right: 1mm;
            word-wrap: break-word;
            font-weight: bold;
          }
          
          .item-quantity {
            color: #000000;
            white-space: nowrap;
            font-weight: bold;
          }
          
          .totals {
            margin: 1mm 0;
          }
          
          .total {
            font-weight: bold;
            font-size: ${totalsFontSize}px;
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
            font-size: ${fontSize - 1}px;
            font-weight: bold;
          }
          
          .text-left { text-align: left; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          
          .small {
            font-size: ${fontSize - 2}px;
            color: #000000;
            font-weight: bold;
          }
          
          .qr-code {
            width: ${qrSize}px;
            height: ${qrSize}px;
            margin: 2mm auto;
            display: block;
          }
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

    // Create a new window and print
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Could not open print window');
    }
    
    printWindow.document.write(receiptHtml);
    printWindow.document.close();
    
    return true;
  } catch (error) {
    console.error('Error printing receipt:', error);
    return false;
  }
}
