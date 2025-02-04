import { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useBusinessStore } from '../store/useBusinessStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { createTransaction } from '../services/transactionService';
import type { CartItem, Customer } from '../types/pos';
import type { Transaction, TransactionDetails } from '../types/transaction';

export function useTransaction() {
  const { user } = useAuthStore();
  const { getCurrentBranch } = useBusinessStore();
  const { settings } = useSettingsStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processTransaction = async (
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
      setError('No branch selected');
      return null;
    }

    try {
      setIsProcessing(true);
      setError(null);

      // Calculate totals
      const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const taxAmount = settings.tax_enabled ? (subtotal * settings.tax_rate / 100) : 0;
      const totalAmount = subtotal + taxAmount - discount;

      // Group items by vendor for commission calculation
      const vendorItems = new Map<string, CartItem[]>();
      cart.forEach(item => {
        if (item.vendorId) {
          const items = vendorItems.get(item.vendorId) || [];
          items.push(item);
          vendorItems.set(item.vendorId, items);
        }
      });

      // Calculate vendor commissions
      let totalCommission = 0;
      const vendorCommissions = new Map<string, number>();
      if (settings.vendor_commission_enabled) {
        vendorItems.forEach((items, vendorId) => {
          const vendorSubtotal = items.reduce((sum, item) => {
            const profit = item.vendorPrice ? (item.price - item.vendorPrice) * item.quantity : 0;
            return sum + profit;
          }, 0);

          if (vendorSubtotal >= settings.minimum_commission_amount) {
            const commission = vendorSubtotal * (settings.default_commission_rate / 100);
            vendorCommissions.set(vendorId, commission);
            totalCommission += commission;
          }
        });
      }

      // Prepare transaction details
      const details: TransactionDetails = {
        products: cart.map(item => ({
          id: item.id,
          name: item.nameAr,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity,
          vendorPrice: item.vendorPrice,
          vendorId: item.vendorId
        })),
        customer: customer ? {
          id: customer.id,
          name: customer.name,
          phone: customer.phone
        } : undefined,
        notes,
        discount,
        tax: taxAmount,
        vendorCommissions: Object.fromEntries(vendorCommissions),
        totalCommission
      };

      // Create main sale transaction
      const transaction: Omit<Transaction, 'transaction_id'> = {
        business_code: user.businessCode,
        business_name: settings.business_name || '',
        branch_name: currentBranch.branch_name,
        payment_method: paymentMethod,
        transaction_type: 'sale',
        transaction_reason: 'Regular sale',
        amount: totalAmount,
        currency: 'OMR',
        transaction_date: new Date().toISOString(),
        details
      };

      const result = await createTransaction(transaction);
      return result;
    } catch (err) {
      console.error('Error processing transaction:', err);
      setError(err instanceof Error ? err.message : 'Failed to process transaction');
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    processTransaction,
    isProcessing,
    error
  };
}