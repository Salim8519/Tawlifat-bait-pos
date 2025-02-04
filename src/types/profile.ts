export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  business_name: string | null;
  created_at: string | null;
  business_code: string | null;
  main_branch: string | null;
  salary: number | null;
  role: 'owner' | 'vendor' | 'cashier' | 'admin' | null;
  is_vendor: boolean;
  vendor_business_name: string | null;
  working_status: string | null;
}