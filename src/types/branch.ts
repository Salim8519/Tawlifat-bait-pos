export interface Branch {
  id: string;
  name: string;
  location: string;
  phone: string;
  isMain: boolean;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface BranchStats {
  totalSales: number;
  totalProducts: number;
  totalCustomers: number;
  dailyTransactions: number;
}