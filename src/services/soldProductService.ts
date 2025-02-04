import { supabase } from '../lib/supabase';
import type { CartItem } from '../types/pos';

export interface SoldProduct {
  sold_product_id: string;
  receipt_id: string;
  product_name: string;
  quantity: number;
  unit_price_original: number;
  unit_price_by_bussniess: number | null;
  total_price: number;
  vendor_code_if_by_vendor?: string;
  business_code: string;
  business_bracnh_name: string;
  comission_for_bussnies_from_vendor?: number;
  created_at: string;
}

export async function createSoldProducts(
  receiptId: string,
  cartItems: CartItem[],
  businessCode: string,
  branchName: string,
  vendorCommissionEnabled: boolean,
  commissionRate: number,
  minCommissionAmount: number
): Promise<SoldProduct[]> {
  // Get the original products to access their original data
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .in('product_id', cartItems.map(item => item.id));

  const soldProducts = cartItems.map(item => {
    // Find the original product data
    const originalProduct = products?.find(p => p.product_id.toString() === item.id);
    if (!originalProduct) {
      console.error('Original product not found:', item.id);
      return null;
    }

    // Determine if it's a vendor product
    const isVendorProduct = Boolean(originalProduct.business_code_if_vendor);
    
    // For vendor products:
    // - unit_price_original is the original price in products table
    // - unit_price_by_bussniess is the final price with commission
    // For business products:
    // - unit_price_original is the same as unit_price_by_bussniess
    const originalPrice = originalProduct.price;
    const businessPrice = item.price; // This is already includes commission from POS service
    
    // Calculate commission if it's a vendor product and commission is enabled
    const commission = calculateCommission(
      originalPrice,
      businessPrice,
      isVendorProduct,
      vendorCommissionEnabled,
      minCommissionAmount
    );
    
    return {
      sold_product_id: crypto.randomUUID(),
      receipt_id: receiptId,
      product_name: item.nameAr,
      quantity: item.quantity,
      unit_price_original: originalPrice,
      unit_price_by_bussniess: businessPrice,
      total_price: businessPrice * item.quantity,
      vendor_code_if_by_vendor: originalProduct.business_code_if_vendor || null,
      business_code: businessCode,
      business_bracnh_name: branchName,
      comission_for_bussnies_from_vendor: commission,
      created_at: new Date().toISOString()
    };
  }).filter(Boolean) as SoldProduct[];

  const { data, error } = await supabase
    .from('sold_products')
    .insert(soldProducts)
    .select();

  if (error) {
    console.error('Error creating sold products:', error);
    throw error;
  }

  return data || [];
}

function calculateCommission(
  originalPrice: number,
  businessPrice: number,
  isVendorProduct: boolean,
  vendorCommissionEnabled: boolean,
  minCommissionAmount: number
): number | null {
  // Return null if:
  // 1. Not a vendor product
  // 2. Commission is not enabled
  if (!isVendorProduct || !vendorCommissionEnabled) {
    return null;
  }

  // No commission if original price is below minimum amount
  if (originalPrice < minCommissionAmount) {
    return 0;
  }

  // Commission is the difference between business price and original price
  return businessPrice - originalPrice;
}