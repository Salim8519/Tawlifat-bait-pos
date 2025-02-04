import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';
import type { CartItem } from '../types/pos';

export interface Receipt {
  receipt_id: string;
  transaction_id: string;
  business_code: string;
  branch_name: string;
  cashier_name: string;
  customer_name?: string;
  customer_phone?: string;
  total_amount: number;
  payment_method: PaymentMethod;
  discount: number;
  coupon_code?: string;
  receipt_note?: string;
  tax_amount: number;
  commission_amount_from_vendors: number;
  vendor_commission_enabled: boolean;
  is_return: boolean;
  return_reason?: string;
  receipt_date: string;
  created_at: string;
  long_text_receipt?: string;
}

export type PaymentMethod = 'cash' | 'card' | 'online';

export interface CreateReceiptData {
  business_code: string;
  branch_name: string;
  cashier_name: string;
  customer_name?: string;
  customer_phone?: string;
  total_amount: number;
  payment_method: PaymentMethod;
  discount: number;
  coupon_code?: string;
  receipt_note?: string;
  tax_amount: number;
  commission_amount_from_vendors: number;
  vendor_commission_enabled: boolean;
  cart_items: CartItem[];
}

async function generateReceiptText(
  data: CreateReceiptData,
  receipt_id: string,
  transaction_id: string,
  language: 'ar' | 'en' = 'ar'
): Promise<string> {
  const locale = language === 'ar' ? arSA : enUS;
  const now = new Date();
  const dateStr = format(now, 'yyyy-MM-dd HH:mm:ss', { locale });
  const currency = language === 'ar' ? 'ر.ع' : 'OMR';

  // Get business settings for header and footer
  const { data: settings, error } = await supabase
    .from('business_settings')
    .select('receipt_header, receipt_footer, business_name')
    .eq('business_code_', data.business_code)
    .single();

  if (error) {
    console.error('Error fetching business settings:', error);
  }

  const headerLines = [
    '='.repeat(40),
    settings?.business_name?.toUpperCase() || '',
    settings?.receipt_header || '',
    '='.repeat(40),
    '',
    `RECEIPT: ${receipt_id}`,
    `TRANSACTION: ${transaction_id}`,
    `DATE: ${dateStr}`,
    `BRANCH: ${data.branch_name}`,
    `CASHIER: ${data.cashier_name}`,
    ''
  ];

  const customerLines = data.customer_name || data.customer_phone ? [
    '-'.repeat(40),
    'CUSTOMER INFORMATION',
    data.customer_name ? `NAME: ${data.customer_name}` : '',
    data.customer_phone ? `PHONE: ${data.customer_phone}` : '',
    '-'.repeat(40),
    ''
  ] : [];

  // Format items table
  const itemLines = [
    'ITEMS',
    '-'.repeat(40),
    'ITEM                  QTY    PRICE    TOTAL',
    '-'.repeat(40)
  ];

  // Add each item with proper spacing
  data.cart_items.forEach(item => {
    const name = item.nameAr.padEnd(20).substring(0, 20);
    const qty = item.quantity.toString().padStart(4);
    const price = item.price.toFixed(3).padStart(8);
    const total = (item.quantity * item.price).toFixed(3).padStart(8);
    itemLines.push(`${name} ${qty} ${price} ${total}`);
    
    // Add item notes if present
    if (item.notes) {
      itemLines.push(`  Note: ${item.notes}`);
    }
  });
  itemLines.push('-'.repeat(40));

  // Calculate and format totals
  const subtotal = data.cart_items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalLines = [
    `SUBTOTAL:${' '.repeat(31)}${subtotal.toFixed(3)}`,
  ];

  if (data.tax_amount > 0) {
    totalLines.push(`TAX:${' '.repeat(35)}${data.tax_amount.toFixed(3)}`);
  }

  if (data.discount > 0) {
    totalLines.push(`DISCOUNT:${' '.repeat(31)}${data.discount.toFixed(3)}`);
  }

  totalLines.push(
    '='.repeat(40),
    `TOTAL:${' '.repeat(33)}${data.total_amount.toFixed(3)} ${currency}`,
    '='.repeat(40),
    '',
    `PAYMENT METHOD: ${data.payment_method.toUpperCase()}`
  );

  if (data.coupon_code) {
    totalLines.push(`COUPON APPLIED: ${data.coupon_code}`);
  }

  const footerLines = [
    '',
    '-'.repeat(40),
    settings?.receipt_footer || '',
    '-'.repeat(40)
  ];

  // Combine all sections
  const allLines = [
    ...headerLines,
    ...customerLines,
    ...itemLines,
    ...totalLines,
    ...footerLines
  ];

  // Return the formatted receipt
  return allLines.filter(Boolean).join('\n');
}

export async function createReceipt(data: CreateReceiptData): Promise<Receipt> {
  // Generate a unique transaction ID with prefix TRX and random string
  const transaction_id = `TRX${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
  
  // Use the transaction_id as the receipt_id to ensure 1:1 relationship
  const receipt_id = transaction_id;

  // Generate the formatted receipt text
  const long_text_receipt = await generateReceiptText(data, receipt_id, transaction_id);

  const receiptData = {
    receipt_id,
    transaction_id,
    business_code: data.business_code,
    branch_name: data.branch_name,
    cashier_name: data.cashier_name,
    customer_name: data.customer_name,
    customer_phone: data.customer_phone,
    total_amount: data.total_amount,
    payment_method: data.payment_method,
    discount: data.discount,
    coupon_code: data.coupon_code,
    receipt_note: data.receipt_note,
    tax_amount: data.tax_amount,
    commission_amount_from_vendors: data.commission_amount_from_vendors,
    vendor_commission_enabled: data.vendor_commission_enabled,
    is_return: false,
    receipt_date: new Date().toISOString(),
    long_text_receipt
  };

  const { data: receipt, error } = await supabase
    .from('receipts')
    .insert([receiptData])
    .select()
    .single();

  if (error) {
    console.error('Error creating receipt:', error);
    throw error;
  }

  return receipt;
}

/**
 * Get receipts for a business with efficient filtering
 */
export async function getReceiptsByBusiness(
  businessCode: string,
  filters?: {
    startDate?: string;
    endDate?: string;
    paymentMethod?: PaymentMethod;
    isReturn?: boolean;
    searchQuery?: string;
  }
): Promise<Receipt[]> {
  try {
    let query = supabase
      .from('receipts')
      .select('*')
      .eq('business_code', businessCode)
      .order('receipt_date', { ascending: false });

    // Apply date filters
    if (filters?.startDate) {
      query = query.gte('receipt_date', filters.startDate);
    }
    if (filters?.endDate) {
      // Add one day to include the end date fully
      const nextDay = new Date(filters.endDate);
      nextDay.setDate(nextDay.getDate() + 1);
      query = query.lt('receipt_date', nextDay.toISOString());
    }

    // Apply payment method filter
    if (filters?.paymentMethod) {
      query = query.eq('payment_method', filters.paymentMethod);
    }

    // Apply return status filter
    if (filters?.isReturn !== undefined) {
      query = query.eq('is_return', filters.isReturn);
    }

    // Apply search filter on the database side if it's a receipt ID or phone number
    if (filters?.searchQuery) {
      const searchQuery = filters.searchQuery.toLowerCase();
      if (searchQuery.match(/^[0-9+\s-]+$/)) { // If it's a phone number
        query = query.ilike('customer_phone', `%${searchQuery}%`);
      } else if (searchQuery.startsWith('rcp')) { // If it's a receipt ID
        query = query.ilike('receipt_id', `%${searchQuery}%`);
      }
    }

    // Limit to last 100 records by default for performance
    query = query.limit(100);

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching receipts:', error);
      throw new Error('Failed to fetch receipts');
    }

    return data || [];
  } catch (error) {
    console.error('Error in getReceiptsByBusiness:', error);
    throw error;
  }
}

export async function getReceipt(receiptId: string): Promise<Receipt | null> {
  const { data, error } = await supabase
    .from('receipts')
    .select('*')
    .eq('receipt_id', receiptId)
    .single();

  if (error) {
    console.error('Error fetching receipt:', error);
    throw error;
  }

  return data;
}

export async function createReturnReceipt(
  originalReceiptId: string,
  returnReason: string
): Promise<Receipt> {
  // First get the original receipt
  const originalReceipt = await getReceipt(originalReceiptId);
  if (!originalReceipt) {
    throw new Error('Original receipt not found');
  }

  // Generate new IDs for the return receipt
  const receipt_id = `RTN${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
  const transaction_id = `TRX${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

  const returnReceiptData = {
    ...originalReceipt,
    receipt_id,
    transaction_id,
    is_return: true,
    return_reason: returnReason,
    receipt_date: new Date().toISOString(),
    created_at: new Date().toISOString()
  };

  const { data: receipt, error } = await supabase
    .from('receipts')
    .insert([returnReceiptData])
    .select()
    .single();

  if (error) {
    console.error('Error creating return receipt:', error);
    throw error;
  }

  return receipt;
}