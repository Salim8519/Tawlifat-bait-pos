import { supabase } from '../lib/supabase';
import type { Product, ProductFilter } from '../types/product';

export interface VendorProductsFilter {
  businessCode: string;
  vendorBusinessCode: string;
  branchName?: string;
}

function calculatePriceWithCommission(
  product: Product,
  settings: any
): { finalPrice: number; vendorPrice: number | null } {
  // Only apply commission to vendor products if enabled in settings
  if (!settings || !settings.vendor_commission_enabled || !product.business_code_if_vendor) {
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

export async function getProducts(filters: ProductFilter = {}): Promise<Product[]> {
  try {
    console.log('Getting products with filters:', filters); // Debug log

    // SECURITY CHECK: Must have business code
    if (!filters.businessCode) {
      console.error('No business code provided for product query');
      throw new Error('Business code is required');
    }

    // Start building the query
    let query = supabase
      .from('products')
      .select('*')
      .eq('business_code_of_owner', filters.businessCode);

    // Apply additional filters
    if (filters.page) {
      query = query.eq('current_page', filters.page);
    }
    
    if (filters.type) {
      query = query.eq('type', filters.type);
    }
    
    // Handle accepted status
    if (filters.accepted !== undefined) {
      query = query.eq('accepted', filters.accepted);
    } else if (filters.page === 'upcoming_products') {
      // For upcoming products, show non-accepted by default
      query = query.eq('accepted', false);
    }
    
    if (filters.searchQuery) {
      query = query.ilike('product_name', `%${filters.searchQuery}%`);
    }

    if (filters.branchName) {
      query = query.eq('branch_name', filters.branchName);
    }

    const { data: products, error } = await query;

    if (error) {
      console.error('Error fetching products:', error);
      throw error;
    }

    if (!products) {
      console.log('No products found for business:', filters.businessCode);
      return [];
    }

    console.log(`Found ${products.length} products for business:`, filters.businessCode); // Debug log
    return products;
  } catch (error) {
    console.error('Error in getProducts:', error);
    throw error;
  }
}

export async function getVendorProducts(filter: VendorProductsFilter): Promise<Product[]> {
  try {
    console.log('Getting vendor products with filter:', filter); // Debug log

    let query = supabase
      .from('products')
      .select('*')
      .eq('business_code_if_vendor', filter.vendorBusinessCode);

    // If not viewing all, apply business code filter
    if (filter.businessCode && filter.businessCode !== 'all') {
      query = query.eq('business_code_of_owner', filter.businessCode);
      
      // Only apply branch filter when a specific business is selected
      if (filter.branchName && filter.branchName !== 'all') {
        query = query.eq('branch_name', filter.branchName);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching vendor products:', error);
      throw error;
    }

    console.log('Fetched vendor products:', data); // Debug log
    return data || [];
  } catch (error) {
    console.error('Error in getVendorProducts:', error);
    throw error;
  }
}

export async function createProduct(product: Omit<Product, 'product_id' | 'date_of_creation'>, defaultBranch?: string): Promise<Product | null> {
  // Get the business name based on whether it's a vendor or owner
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('business_name, role, "vendor_business _name"')
    .eq('business_code', product.business_code_if_vendor || product.business_code_of_owner)
    .eq('role', product.business_code_if_vendor ? 'vendor' : 'owner')
    .maybeSingle();

  if (profileError) {
    console.error('Error fetching business name:', profileError);
    throw profileError;
  }

  // Use vendor business name if it's a vendor, otherwise use owner's business name
  const businessName = product.business_code_if_vendor 
    ? profileData?.['vendor_business _name']
    : profileData?.business_name;
  const {
    product_name,
    type,
    current_page,
    expiry_date,
    quantity,
    price,
    barcode,
    image_url,
    description,
    trackable,
    business_code_of_owner,
    business_code_if_vendor,
    branch_name = defaultBranch || 'main', // Use provided branch or default to 'main'
    accepted
  } = product;

  const productData = {
    product_name,
    type,
    business_name_of_product: businessName || 'Unknown Business',
    current_page: current_page || 'upcoming_products',
    expiry_date,
    quantity: quantity || 0,
    price: price || 0,
    barcode,
    image_url,
    description,
    trackable: trackable || false,
    business_code_of_owner,
    business_code_if_vendor,
    branch_name,
    accepted: accepted || false,
    date_of_creation: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('products')
    .insert([productData])
    .select()
    .single();

  if (error) {
    console.error('Error creating product:', error);
    throw error;
  }

  return data;
}

export async function updateProduct(productId: number, updates: Partial<Product>): Promise<Product | null> {
  // Remove any fields that don't exist in the table schema
  const {
    product_name,
    type,
    production_date,
    current_page,
    expiry_date,
    quantity,
    price,
    barcode,
    image_url,
    description,
    trackable,
    business_code_of_owner,
    business_code_if_vendor,
    branch_name,
    accepted,
    rejection_reason
  } = updates;

  const updateData = {
    ...(product_name && { product_name }),
    ...(type && { type }),
    ...(production_date && { production_date }),
    ...(current_page && { current_page }),
    ...(expiry_date && { expiry_date }),
    ...(quantity !== undefined && { quantity }),
    ...(price !== undefined && { price }),
    ...(barcode && { barcode }),
    ...(image_url && { image_url }),
    ...(description && { description }),
    ...(trackable !== undefined && { trackable }),
    ...(business_code_of_owner && { business_code_of_owner }),
    ...(business_code_if_vendor && { business_code_if_vendor }),
    ...(branch_name && { branch_name }),
    ...(accepted !== undefined && { accepted }),
    ...(rejection_reason && { rejection_reason })
  };

  const { data, error } = await supabase
    .from('products')
    .update(updateData)
    .eq('product_id', productId)
    .select()
    .single();

  if (error) {
    console.error('Error updating product:', error);
    return null;
  }
  return data;
}

export async function approveProduct(productId: number, accepted: boolean, rejectionReason?: string): Promise<boolean> {
  const { error } = await supabase
    .from('products')
    .update({
      accepted,
      current_page: accepted ? 'products' : 'upcoming_products',
      date_of_acception_or_rejection: new Date().toISOString(),
      rejection_reason: rejectionReason || null
    })
    .eq('product_id', productId);

  if (error) {
    console.error('Error approving/rejecting product:', error);
    return false;
  }

  return true;
}

export async function deleteProduct(productId: number): Promise<boolean> {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('product_id', productId);

  if (error) {
    console.error('Error deleting product:', error);
    return false;
  }

  return true;
}