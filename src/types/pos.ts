export type ProductType = 'food' | 'non-food';

export interface Product {
  id: string;
  barcode: string;
  nameAr: string;
  type: ProductType;
  price: number;
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
  notes?: string;
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