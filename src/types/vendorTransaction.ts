export type TransactionType = 'product_sale' | 'rental' | 'tax';

export interface VendorTransaction {
  transaction_id: string;
  transaction_type: TransactionType;
  transaction_date: string;
  created_at?: string;

  // Business/Branch/Vendor Info
  business_code: string;
  business_name: string;
  branch_name: string;
  vendor_code: string;
  vendor_name: string;

  // Financial Info
  amount: number;
  profit: number;
  accumulated_profit: number;

  // Status
  status?: string;
  notes?: string;

  // Product Sale Fields
  product_name?: string;
  product_quantity?: number;
  unit_price?: number;
  total_price?: number;

  // Rental Fields
  rental_period?: string;
  rental_start_date?: string;
  rental_end_date?: string;

  // Tax Fields
  tax_period?: string;
  tax_description?: string;
}

export type CreateVendorTransactionInput = Omit<VendorTransaction, 'transaction_id' | 'created_at' | 'accumulated_profit'> & {
  accumulated_profit?: number;
};

// Example usage for each transaction type:
/*
// Product Sale
const productSale: CreateVendorTransactionInput = {
  transaction_type: 'product_sale',
  business_code: 'BUS123',
  business_name: 'My Business',
  branch_name: 'Main Branch',
  vendor_code: 'V001',
  vendor_name: 'Vendor A',
  amount: 100,
  profit: 20,
  product_name: 'Product X',
  product_quantity: 2,
  unit_price: 50,
  transaction_date: '2025-02-09'
};

// Rental
const rental: CreateVendorTransactionInput = {
  transaction_type: 'rental',
  business_code: 'BUS123',
  business_name: 'My Business',
  branch_name: 'Main Branch',
  vendor_code: 'V001',
  vendor_name: 'Vendor A',
  amount: 500,
  profit: 500,
  rental_start_date: '2025-02-01',
  rental_end_date: '2025-02-28',
  rental_period: '1 month',
  transaction_date: '2025-02-09'
};

// Tax
const tax: CreateVendorTransactionInput = {
  transaction_type: 'tax',
  business_code: 'BUS123',
  business_name: 'My Business',
  branch_name: 'Main Branch',
  vendor_code: 'V001',
  vendor_name: 'Vendor A',
  amount: 1000,
  profit: 0,
  tax_period: '2025-02',
  tax_description: 'Monthly vendor tax',
  transaction_date: '2025-02-09'
};
*/
