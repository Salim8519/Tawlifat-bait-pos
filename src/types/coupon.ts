export interface Coupon {
  coupon_id: string;
  business_code: string;
  coupon_code: string;
  discount_type: 'fixed' | 'percentage';
  discount_value: number;
  number_of_uses: number;
  max_uses: number | null;
  expiry_date: string | null;
  min_purchase_amount: number;
  max_purchase_amount: number;
  is_active: boolean;
  created_at: string;
}

export interface CreateCouponData {
  business_code: string;
  coupon_code: string;
  discount_type: 'fixed' | 'percentage';
  discount_value: number;
  max_uses?: number | null;
  expiry_date?: string | null;
  min_purchase_amount?: number;
  max_purchase_amount?: number;
  is_active?: boolean;
}