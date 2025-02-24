import { supabase } from '../lib/supabase';
import type { Product } from '../types/product';
import { useSettingsStore } from '../store/useSettingsStore';

function calculatePriceWithCommission(
  product: Product,
  settings: any
): { finalPrice: number; vendorPrice: number | null } {
  // Only apply commission to vendor products if enabled in settings
  if (!settings?.vendor_commission_enabled || !product.business_code_if_vendor) {
    return { finalPrice: product.price, vendorPrice: null };
  }

  // Check if the price meets minimum commission amount
  if (product.price < (settings.minimum_commission_amount || 0)) {
    return { finalPrice: product.price, vendorPrice: product.price };
  }

  // Calculate commission
  const commission = (product.price * settings.default_commission_rate) / 100;
  return { 
    finalPrice: product.price + commission,
    vendorPrice: product.price
  };
}

export async function getAvailableProducts(businessCode: string, branchName?: string): Promise<Product[]> {
  try {
    let query = supabase
      .from('products')
      .select(`
        product_id,
        product_name,
        barcode,
        type,
        price,
        quantity,
        trackable,
        expiry_date,
        business_code_of_owner,
        business_code_if_vendor,
        business_name_of_product,
        branch_name,
        current_page,
        accepted,
        image_url,
        description
      `)
      .eq('current_page', 'products')
      .eq('accepted', true)
      .gt('quantity', 0)
      .or(`business_code_of_owner.eq.${businessCode},business_code_if_vendor.not.is.null`);

    // Add branch filter if specified
    if (branchName) {
      query = query.eq('branch_name', branchName);
    }

    const { data: products, error } = await query;

    if (error) {
      console.error('Error fetching available products:', error);
      throw error;
    }

    // Filter and process products
    const currentDate = new Date();
    const filteredProducts = products
      ?.filter(product => {
        // For food products, check expiry date
        if (product.type === 'food' && product.expiry_date) {
          return new Date(product.expiry_date) > currentDate;
        }
        return true;
      })
      .map(product => {
        const settings = useSettingsStore.getState();
        const { finalPrice, vendorPrice } = calculatePriceWithCommission(product, settings);
        
        return {
          ...product,
          price: finalPrice,
          vendorPrice: vendorPrice
        };
      });

    // Log vendor products for debugging
    console.log('Vendor Products:', 
      filteredProducts.filter(p => p.business_code_if_vendor)
        .map(p => ({
          name: p.product_name,
          vendor_code: p.business_code_if_vendor,
          vendor_name: p.business_name_of_product,
          price: p.price,
          vendor_price: p.vendorPrice
        }))
    );

    return filteredProducts || [];
  } catch (error) {
    console.error('Error in getAvailableProducts:', error);
    throw error;
  }
}

export async function updateProductQuantity(productId: number, newQuantity: number): Promise<void> {
  const { error } = await supabase
    .from('products')
    .update({ quantity: newQuantity })
    .eq('product_id', productId);

  if (error) {
    console.error('Error updating product quantity:', error);
    throw error;
  }
}