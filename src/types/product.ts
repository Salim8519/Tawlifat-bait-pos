export type ProductType = 'food' | 'non-food';
export type ProductPage = 'upcoming_products' | 'products';

export interface Product {
  product_id: string;
  product_name: string;
  barcode?: string;
  type: ProductType;
  price: number;
  quantity: number;
  trackable: boolean;
  expiry_date?: string;
  
  // Vendor information
  vendorId?: string;
  vendorName?: string;
  vendorPrice?: number;
  business_code_if_vendor?: string;
  business_name_if_vendor?: string;
  
  // Business information
  business_code_of_owner: string;
  branch_name?: string;
  
  // Additional fields
  accepted?: boolean;
  date_of_acception_or_rejection?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProductFilter {
  page?: ProductPage;
  type?: ProductType;
  accepted?: boolean;
  searchQuery?: string;
  branch_name?: string;
  business_code?: string;
}