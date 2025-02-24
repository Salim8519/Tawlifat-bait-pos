import { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useBusinessStore } from '../store/useBusinessStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { createTransaction } from '../services/transactionService';
import type { CartItem, Customer } from '../types/pos';
import type { Transaction, TransactionDetails } from '../types/transaction';
import { supabase } from '../lib/supabase';

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

      // Get original product data for accurate vendor prices
      const { data: products } = await supabase
        .from('products')
        .select('*')
        .in('product_id', cart.map(item => item.id));

      cart.forEach(item => {
        if (item.vendorId) {
          const items = vendorItems.get(item.vendorId) || [];
          // Find original product data to get accurate vendor price
          const originalProduct = products?.find(p => p.product_id.toString() === item.id);
          if (originalProduct) {
            items.push({
              ...item,
              vendorPrice: originalProduct.price // Use original price as vendor price
            });
          } else {
            console.error('Original product not found:', item.id);
            items.push(item);
          }
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
          vendorId: item.vendorId,
          vendorName: item.vendorName,
          businessCodeIfVendor: item.businessCodeIfVendor
        })),
        customer: customer ? {
          id: customer.id,
          name: customer.name,
          phone: customer.phone
        } : undefined,
        notes,
        discount,
        tax: taxAmount,
        subtotal,
        totalAmount,
        vendorCommissions: Object.fromEntries(vendorCommissions),
        totalCommission,
        couponCode
      };

      // Create transactions for each vendor's products
      for (const [vendorId, items] of vendorItems) {
        // Calculate vendor transaction amount including tax
        const vendorSubtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const vendorTaxAmount = settings.tax_enabled ? (vendorSubtotal * settings.tax_rate / 100) : 0;
        const vendorTotalAmount = vendorSubtotal + vendorTaxAmount;
        const vendorCommission = vendorCommissions.get(vendorId) || 0;
        const vendorInfo = items[0]; // Get vendor info from first item

        console.log(`Creating vendor transaction for ${vendorId}:`, {
          subtotal: vendorSubtotal,
          tax: vendorTaxAmount,
          total: vendorTotalAmount,
          commission: vendorCommission,
          items: items.length
        });

        const vendorTransaction: Omit<Transaction, 'transaction_id'> = {
          business_code: user.businessCode,
          business_name: settings.business_name || '',
          branch_name: currentBranch.branch_name,
          payment_method: paymentMethod,
          transaction_type: 'vendor_sale',
          transaction_reason: 'Vendor product sale',
          amount: vendorTotalAmount, // Now includes tax
          currency: 'OMR',
          transaction_date: new Date().toISOString(),
          vendor_code: vendorId,
          vendor_name: vendorInfo.vendorName || '',
          owner_profit_from_this_transcation: items.reduce((sum, item) => {
            // Calculate base profit (selling price - vendor price)
            const baseProfit = item.vendorPrice ? (item.price - item.vendorPrice) * item.quantity : 0;
            
            // Calculate proportional tax for this item if tax is enabled
            const itemTax = settings.tax_enabled 
              ? (item.price * item.quantity * settings.tax_rate / 100) 
              : 0;
            
            // Total profit is base profit plus tax
            return sum + baseProfit + itemTax;
          }, 0),
          details: {
            products: items.map(item => ({
              id: item.id,
              name: item.nameAr,
              quantity: item.quantity,
              price: item.price,
              total: item.price * item.quantity,
              vendorPrice: item.vendorPrice
            })),
            commission: vendorCommission,
            subtotal: vendorSubtotal,
            tax: vendorTaxAmount,
            total: vendorTotalAmount,
            customer: customer ? {
              id: customer.id,
              name: customer.name,
              phone: customer.phone
            } : undefined,
            notes,
            discount: (discount / totalAmount) * vendorTotalAmount, // Proportional discount
            couponCode
          }
        };

        await createTransaction(vendorTransaction);
      }

      // Create transaction for non-vendor products
      const nonVendorItems = cart.filter(item => !item.vendorId);
      if (nonVendorItems.length > 0) {
        // Calculate non-vendor transaction amount including tax
        const nonVendorSubtotal = nonVendorItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const nonVendorTaxAmount = settings.tax_enabled ? (nonVendorSubtotal * settings.tax_rate / 100) : 0;
        const nonVendorTotalAmount = nonVendorSubtotal + nonVendorTaxAmount;
        
        console.log('Creating non-vendor transaction:', {
          items: nonVendorItems.length,
          subtotal: nonVendorSubtotal,
          tax: nonVendorTaxAmount,
          total: nonVendorTotalAmount
        });

        const nonVendorTransaction: Omit<Transaction, 'transaction_id'> = {
          business_code: user.businessCode,
          business_name: settings.business_name || '',
          branch_name: currentBranch.branch_name,
          payment_method: paymentMethod,
          transaction_type: 'sale',
          transaction_reason: 'Regular sale',
          amount: nonVendorTotalAmount, // Now includes tax
          currency: 'OMR',
          transaction_date: new Date().toISOString(),
          // For non-vendor products, entire amount plus tax is profit since it's owner's product
          owner_profit_from_this_transcation: settings.tax_enabled 
            ? nonVendorTotalAmount 
            : nonVendorSubtotal,
          details: {
            products: nonVendorItems.map(item => ({
              id: item.id,
              name: item.nameAr,
              quantity: item.quantity,
              price: item.price,
              total: item.price * item.quantity
            })),
            customer: customer ? {
              id: customer.id,
              name: customer.name,
              phone: customer.phone
            } : undefined,
            notes,
            discount: (discount / totalAmount) * nonVendorTotalAmount, // Proportional discount
            tax: nonVendorTaxAmount,
            subtotal: nonVendorSubtotal,
            total: nonVendorTotalAmount,
            couponCode
          }
        };

        await createTransaction(nonVendorTransaction);
      }

      // Return the last created transaction (either vendor or non-vendor)
      return {
        transaction_id: 'completed',
        business_code: user.businessCode,
        business_name: settings.business_name || '',
        branch_name: currentBranch.branch_name,
        payment_method: paymentMethod,
        transaction_type: 'sale',
        transaction_reason: 'Regular sale',
        amount: totalAmount,
        currency: 'OMR',
        transaction_date: new Date().toISOString(),
        details: {
          totalAmount,
          subtotal,
          tax: taxAmount,
          discount,
          totalCommission
        }
      };
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