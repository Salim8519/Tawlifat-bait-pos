import { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useBusinessStore } from '../store/useBusinessStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useLanguageStore } from '../store/useLanguageStore';
import { useTransaction } from './useTransaction';
import { posTranslations } from '../translations/pos';
import { createReceipt } from '../services/receiptService';
import { createSoldProducts } from '../services/soldProductService';
import type { CartItem, Customer } from '../types/pos';
import type { CreateReceiptData } from '../services/receiptService';

export function useReceipt() {
  const { user } = useAuthStore();
  const { getCurrentBranch } = useBusinessStore();
  const { settings } = useSettingsStore();
  const { language } = useLanguageStore();
  const t = posTranslations[language];
  const { processTransaction } = useTransaction();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receiptText, setReceiptText] = useState<string | null>(null);

  const processReceipt = async (
    cart: CartItem[],
    customer: Customer | null,
    paymentMethod: 'cash' | 'card' | 'online',
    discount: number,
    couponCode?: string,
    notes?: string
  ) => {
    if (!user || !settings) {
      setError('Missing user or settings data');
      return null;
    }

    const currentBranch = getCurrentBranch();
    if (!currentBranch) {
      setError(t.noBranchSelected);
      return null;
    }

    try {
      setIsProcessing(true);
      setError(null);

      // First process the transaction
      const transaction = await processTransaction(
        cart,
        customer,
        paymentMethod,
        discount,
        couponCode,
        notes
      );

      if (!transaction) {
        throw new Error('Failed to process transaction');
      }

      // Calculate totals
      const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      // Calculate tax if enabled
      const taxAmount = settings.tax_enabled ? (subtotal * settings.tax_rate / 100) : 0;

      // Calculate vendor commissions if enabled
      let commissionAmount = 0;
      if (settings.vendor_commission_enabled) {
        const vendorProducts = cart.filter(item => item.vendorId);
        const vendorSubtotal = vendorProducts.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        if (vendorSubtotal >= settings.minimum_commission_amount) {
          commissionAmount = vendorSubtotal * (settings.default_commission_rate / 100);
        }
      }

      // Calculate final total
      const totalAmount = subtotal + taxAmount - discount;

      const receiptData: CreateReceiptData = {
        business_code: user.businessCode,
        branch_name: currentBranch.branch_name,
        cashier_name: user.name,
        customer_name: customer?.name,
        customer_phone: customer?.phone,
        total_amount: totalAmount,
        payment_method: paymentMethod,
        discount,
        coupon_code: couponCode,
        receipt_note: notes,
        tax_amount: taxAmount,
        commission_amount_from_vendors: commissionAmount,
        vendor_commission_enabled: settings.vendor_commission_enabled,
        cart_items: cart
      };

      const receipt = await createReceipt(receiptData);
      
      // Create sold products records
      const soldProducts = await createSoldProducts(
        receipt.receipt_id,
        cart,
        user.businessCode,
        currentBranch.branch_name,
        settings.vendor_commission_enabled,
        settings.default_commission_rate,
        settings.minimum_commission_amount,
        settings.tax_enabled,
        settings.tax_rate
      );

      console.log('Transaction processed:', transaction);
      console.log('Receipt created:', receipt);
      console.log('Sold products created:', soldProducts);

      // Store the receipt text
      if (receipt.long_text_receipt) {
        setReceiptText(receipt.long_text_receipt);
      }

      return receipt;
    } catch (err) {
      console.error('Error processing receipt:', err);
      setError(err instanceof Error ? err.message : 'Failed to process receipt');
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    processReceipt,
    isProcessing,
    error,
    receiptText
  };
}