export interface BusinessSettings {
  setting_id: string;
  business_code_: string;
  receipt_header?: string;
  receipt_footer?: string;
  url_logo_of_business?: string;
  loyalty_system_enabled?: boolean;
  vendor_commission_enabled?: boolean;
  default_commission_rate?: number;
  minimum_commission_amount?: number;
  tax_enabled?: boolean;
  tax_rate?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ReceiptItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  discount?: number;
}

export interface ReceiptData {
  items: ReceiptItem[];
  subtotal: number;
  tax?: number;
  discount?: number;
  total: number;
  customerName?: string;
  customerPhone?: string;
  cashierName: string;
  paymentMethod: string;
  orderNumber: string;
  couponCode?: string;
  couponDiscount?: number;
  businessCode: string;
  branchName: string;
  date: Date;
}
