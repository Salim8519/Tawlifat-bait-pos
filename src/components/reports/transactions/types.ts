export interface Transaction {
  id: string;
  business_code: string;
  branch_name: string;
  transaction_date: string;
  amount: number;
  payment_method: string;
  owner_profit_from_this_transcation: number;
  vendor_code?: string;
  vendor_name?: string;
  customer_name?: string;
  customer_phone?: string;
  transaction_type: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface TransactionStats {
  count: number;
  amount: number;
  profit: number;
}

export interface TransactionSummary {
  totalTransactions: number;
  totalAmount: number;
  totalProfit: number;
  ownerTransactions: TransactionStats;
  vendorTransactions: TransactionStats;
  byPaymentMethod: Record<string, TransactionStats>;
  byTransactionType: Record<string, TransactionStats>;
  byStatus: Record<string, TransactionStats>;
  byBranch: Record<string, TransactionStats>;
  byVendor: Record<string, TransactionStats>;
  recentTransactions: Transaction[];
}

export interface TransactionFilters {
  paymentMethod?: string;
  transactionType?: string;
  status?: string;
  vendorCode?: string;
  minAmount?: number;
  maxAmount?: number;
  searchTerm?: string;
  sortBy?: 'date' | 'amount' | 'profit';
  sortOrder?: 'asc' | 'desc';
}
