export type TransactionType = 'sale' | 'return' | 'refund' | 'cash_addition' | 'cash_removal' | 'cash_return' | 'deposit' | 'withdraw';
export type PaymentMethod = 'cash' | 'card' | 'online';

export interface TransactionDetails {
  products?: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  customer?: {
    id?: string;
    name?: string;
    phone?: string;
  };
  notes?: string;
  [key: string]: any;
}

export interface CashTransactionDetails extends TransactionDetails {
  previous_total_cash: number;
  new_total_cash: number;
  cashier_name?: string;
  tracking_id: string;
}

export interface Transaction {
  transaction_id?: string;
  business_code: string;
  business_name: string;
  vendor_name?: string;
  vendor_code?: string;
  branch_name: string;
  payment_method: PaymentMethod;
  transaction_type: TransactionType;
  transaction_reason: string;
  amount: number;
  owner_profit_from_this_transcation: number;
  currency: string;
  transaction_date: string;
  details: TransactionDetails | CashTransactionDetails;
}

export interface TransactionFilter {
  businessCode?: string;
  vendorCode?: string;
  branchName?: string;
  transactionType?: TransactionType;
  paymentMethod?: PaymentMethod;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
}