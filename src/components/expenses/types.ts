export type TransactionType = 'deposit' | 'withdraw';

export interface ExpenseFormData {
  transaction_type: TransactionType;
  amount: number;
  payment_method: string;
  transaction_reason: string;
  branch_name: string;
  details?: Record<string, any>;
}

export const PAYMENT_METHODS = [
  'cash',
  'card',
  'online'
] as const;

export type PaymentMethod = typeof PAYMENT_METHODS[number];
