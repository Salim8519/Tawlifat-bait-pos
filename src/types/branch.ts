export interface Branch {
  branch_id: string;
  business_code: string; 
  branch_name: string; 
  is_active: boolean;
}

export interface BranchStats {
  totalSales: number;
  totalProducts: number;
  totalCustomers: number;
  dailyTransactions: number;
}