import React, { useState, useEffect } from 'react';
import { useLanguageStore } from '../../store/useLanguageStore'; 
import { posTranslations } from '../../translations/pos';
import type { PaymentMethod } from './PaymentMethods'; 
import { Share2, Printer } from 'lucide-react';
import { usePrintReceipt } from '../../hooks/usePrintReceipt';
import type { Receipt } from '../../services/receiptService';

interface Props {
  total: number;
  subtotal: number;
  discount: number;
  taxAmount: number;
  paymentMethod: PaymentMethod;
  customer: { name: string; phone: string; } | null;
  settings: any;
  cart: any[];
  receiptId: string;
  branchName: string;
  cashierName: string;
  couponCode?: string;
  notes?: string;
  onConfirm: () => void;
  onCancel: () => void;
  receipt?: Receipt;
}

export function ConfirmationPage({ 
  total, 
  subtotal,
  discount,
  taxAmount,
  paymentMethod, 
  customer, 
  settings,
  cart,
  receiptId,
  branchName,
  cashierName,
  couponCode,
  notes,
  onConfirm, 
  onCancel,
  receipt
}: Props) {
  const { language } = useLanguageStore();
  const t = posTranslations[language];
  const [cashConfirmed, setCashConfirmed] = useState(false);
  const [cashReceived, setCashReceived] = useState(total.toFixed(3));
  const [changeDue, setChangeDue] = useState(0);
  const [cashError, setCashError] = useState<string | null>(null);
  const { print, isPrinting, selectedPrinterWidth, setSelectedPrinterWidth } = usePrintReceipt();

  const handleCashAmountChange = (amount: string) => {
    console.log('Cash amount changed:', amount);
    setCashReceived(amount);
    setCashError(null);
    
    const receivedAmount = parseFloat(amount);
    if (!isNaN(receivedAmount) && receivedAmount >= total) {
      setChangeDue(receivedAmount - total);
    } else {
      setChangeDue(0);
    }
  };

  const getWhatsAppNumber = (phone: string) => {
    // Extract last 8 digits and add Oman country code
    const digits = phone.replace(/\D/g, '').slice(-8);
    return `968${digits}`;
  };

  const handlePrintReceipt = async () => {
    if (!receipt) return;
    await print(receipt, cart);
  };

  const shareToWhatsApp = () => {
    if (!customer?.phone) return;
    
    // Get business details from settings
    const businessName = settings?.business_name || '';
    const header = settings?.receipt_header?.trim().split('\n').join('\n   ') || '';
    const footer = settings?.receipt_footer?.trim().split('\n').join('\n   ') || '';
    
    const whatsAppReceipt = [
      `🏪 *${businessName || 'My Store'}*\n`,
      header ? [
        '',
        '   ' + header,
        ''
      ].join('\n') : '',
      '🧾 *فاتورة المشتريات / Purchase Receipt*',
      `📅 ${new Date().toLocaleDateString('ar')}`,
      `🏷️ #${receiptId}`,
      `🏬 ${branchName}`,
      `👤 ${cashierName}`,
      '',
      customer ? [
        '👥 *العميل / Customer*',
        `   ${customer.name}`,
        `   📱 ${customer.phone}`,
        ''
      ].join('\n') : '',
      '🛍️ *المنتجات / Items*',
      cart.map(item => (
        `   ${item.nameAr}\n   ${item.quantity} x ${item.price.toFixed(3)} = ${(item.quantity * item.price).toFixed(3)} ${t.currency}`
      )).join('\n\n'),
      '',
      '💰 *الحساب / Bill*',
      `   المجموع الفرعي / Subtotal: ${subtotal.toFixed(3)} ${t.currency}`,
      discount > 0 ? `   الخصم / Discount: -${discount.toFixed(3)} ${t.currency}` : '',
      couponCode ? `   🎟️ ${couponCode}` : '',
      settings?.tax_enabled ? `   الضريبة / Tax (${settings.tax_rate}%): ${taxAmount.toFixed(3)} ${t.currency}` : '',
      '',
      `💵 *المجموع النهائي / Total:* ${total.toFixed(3)} ${t.currency}`,
      `💳 *طريقة الدفع / Payment:* ${
        paymentMethod === 'cash' ? 'نقدي / Cash' :
        paymentMethod === 'credit' ? 'بطاقة / Card' :
        'دفع إلكتروني / Online'
      }`,
      notes ? [
        '',
        '📝 *ملاحظات / Notes*',
        `   ${notes}`
      ].join('\n') : '',
      '',
      footer ? [
        '',
        footer.split('\n').map(line => '   ' + line).join('\n'),
        ''
      ].join('\n') : '',
      '',
      '🙏 *شكراً لتسوقكم معنا*',
      '*Thank you for shopping with us*'
    ].join('\n');
    
    const number = getWhatsAppNumber(customer.phone);
    const message = encodeURIComponent(whatsAppReceipt);
    const url = `https://web.whatsapp.com/send?phone=${number}&text=${message}`;
    
    console.log('WhatsApp Message Preview:', whatsAppReceipt);
    
    window.open(url, '_blank');
  };

  const handleConfirm = () => {
    console.log('Confirming payment:', {
      paymentMethod,
      cashConfirmed,
      cashReceived,
      total
    });

    // For cash payments, validate both the checkbox and amount
    if (paymentMethod === 'cash') {
      console.log('Validating cash payment...');
      
      if (!cashConfirmed) {
        console.log('Cash not confirmed, showing alert');
        alert(t.confirmCashRequired);
        return;
      }

      const receivedAmount = parseFloat(cashReceived);
      console.log('Received amount:', receivedAmount);
      
      if (isNaN(receivedAmount) || receivedAmount < total) {
        console.log('Invalid amount, setting error');
        setCashError(t.insufficientCash);
        return;
      }

      console.log('Cash payment validated successfully');
    }
    
    console.log('Calling onConfirm...');
    onConfirm();
  };

  useEffect(() => {
    if (paymentMethod === 'cash') {
      console.log('Setting initial cash amount:', total.toFixed(3));
      setCashReceived(total.toFixed(3));
      setChangeDue(0);
      setCashConfirmed(false); // Reset confirmation when amount changes
    }
  }, [total, paymentMethod]);

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-semibold mb-4">
          {t.confirmPayment}
        </h2>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-700">{t.total}:</span>
            <span className="text-xl font-bold">
              {total.toFixed(3)} {t.currency}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-700">{t.paymentMethod}:</span>
            <span className="font-medium">
              {paymentMethod === 'cash' ? t.cashPayment :
               paymentMethod === 'credit' ? t.creditPayment :
               t.onlinePayment}
            </span>
          </div>

          <div className="flex space-x-2 space-x-reverse">
            {receipt && (
              <>
                <div className="flex flex-col">
                  <label className="text-sm text-gray-700 mb-1">
                    {t.printerSize}:
                  </label>
                  <select
                    value={selectedPrinterWidth}
                    onChange={(e) => setSelectedPrinterWidth(e.target.value as any)}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="57mm">{t.printerSize57mm}</option>
                    <option value="80mm">{t.printerSize80mm}</option>
                    <option value="85mm">{t.printerSize85mm}</option>
                  </select>
                </div>
                <button
                  onClick={handlePrintReceipt}
                  disabled={isPrinting}
                  className="flex items-center justify-center flex-1 px-4 py-2 text-sm text-indigo-600 border border-indigo-600 rounded-md hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  <Printer className="w-4 h-4 ml-2" />
                  {t.printReceipt}
                </button>
              </>
            )}
            
            {customer?.phone && (
              <button
                onClick={shareToWhatsApp}
                className="flex items-center justify-center flex-1 px-4 py-2 text-sm text-green-600 border border-green-600 rounded-md hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                <Share2 className="w-4 h-4 ml-2" />
                {t.shareToWhatsApp}
              </button>
            )}
          </div>

          {paymentMethod === 'cash' && (
            <div className="space-y-4 border-t pt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.cashReceived}
                </label>
                <input
                  type="number"
                  value={cashReceived}
                  onChange={(e) => handleCashAmountChange(e.target.value)}
                  min={total}
                  step="0.001"
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  dir="ltr"
                />
                {cashError && (
                  <p className="mt-1 text-sm text-red-600">{cashError}</p>
                )}
              </div>

              {changeDue > 0 && (
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>{t.changeDue}:</span>
                  <span className="text-green-600">
                    {changeDue.toFixed(3)} {t.currency}
                  </span>
                </div>
              )}

              <label className="flex items-center space-x-2 space-x-reverse cursor-pointer">
                <input
                  type="checkbox"
                  checked={cashConfirmed}
                  onChange={(e) => {
                    console.log('Cash confirmed changed:', e.target.checked);
                    setCashConfirmed(e.target.checked);
                  }}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
                />
                <span className="text-sm font-medium text-gray-700">
                  {t.confirmCashMessage}
                </span>
              </label>
            </div>
          )}

          <div className="flex justify-end space-x-2 space-x-reverse pt-4 border-t">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              {t.cancel}
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              {t.confirm}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}