export type ProductType = 'food' | 'non-food';
export type ProductPage = 'upcoming_products' | 'products';

export interface Product {
  product_id: number;
  product_name: string;
  type: ProductType;
  current_page: ProductPage;
  expiry_date: string | null;
  production_date: string | null;
  quantity: number;
  price: number;
  barcode?: string;
  image_url?: string;
  description?: string;
  trackable: boolean;
  business_code_of_owner: string;
  business_code_if_vendor?: string;
  branch_name?: string;
  accepted: boolean;
  date_of_acception_or_rejection?: string;
  rejection_reason?: string;
  date_of_creation: string;
  owner_profile?: {
    business_name: string;
  };
}

export interface ProductFilter {
  page?: ProductPage;
  type?: ProductType;
  accepted?: boolean;
  searchQuery?: string;
  branch_name?: string;
  business_code?: string;
}