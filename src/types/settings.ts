export interface BusinessSettings {
  setting_id: string;
  business_code_: string;
  receipt_header: string | null;
  receipt_footer: string | null;
  url_logo_of_business: string | null;
  loyalty_system_enabled: boolean;
  vendor_commission_enabled: boolean;
  default_commission_rate: number;
  minimum_commission_amount: number;
  tax_enabled: boolean;
  tax_rate: number;
  created_at: string;
  updated_at: string;
}
