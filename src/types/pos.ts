export type ProductType = 'food' | 'non-food';

export interface Product {
  id: string;
  barcode: string;
  nameAr: string;
  type: ProductType;
  price: number;
  vendorPrice?: number;
  quantity: number;
  barcode?: string;
  vendorId: string;
  vendorName: string;
  category: string;
  imageUrl?: string;
  expiryDate?: string;
  preparationDate?: string;
  description?: string;
}

export interface CartItem extends Product {
  quantity: number;
  maxQuantity?: number; // Maximum quantity allowed (based on stock)
  trackable: boolean; // Whether the item is trackable
  notes?: string;

  // Hidden metadata for future reference
  _metadata?: {
    vendor: {
      code: string;
      name: string;
      business_code: string;
      business_name: string;
    };
    sale: {
      business_code: string;
      business_name: string;
      branch_name: string;
      sale_date: string;
    };
    product: {
      original_price: number;
      vendor_price: number;
      is_vendor_supplied: boolean;
    };
  };
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  points?: number;
}

export type DiscountType = 'fixed' | 'percentage';

export interface Discount {
  type: DiscountType;
  value: number;
}

export interface Coupon {
  code: string;
  type: DiscountType;
  value: number;
  expiryDate: string;
  isActive: boolean;
}