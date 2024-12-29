export type UserRole = 'super_admin' | 'owner' | 'sub_vendor' | 'cashier';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  assignedBranches?: string[];
}

export interface Product {
  id: string;
  nameAr: string;
  price: number;
  quantity: number;
  category: string;
  imageUrl: string;
  vendorId: string;
  type: 'food' | 'non-food';
  expiryDate?: string;
  preparationDate?: string;
  description?: string;
  barcode?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  points?: number;
}

export interface CartItem extends Product {
  quantity: number;
}