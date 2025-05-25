# Return Products System Documentation

## Overview

The Return Products system in Tawliat Bait POS allows businesses to process product returns from customers, manage refunds, and maintain accurate inventory and financial records. This document provides a comprehensive explanation of how the return system works, including the database structure, service interactions, and user interface flow.

## Database Structure

The return system interacts with several key tables in the database:

### 1. `receipts` Table

This table stores both original sales receipts and return receipts:

- **Primary Key**: `receipt_id` (text)
- **Return-specific Fields**:
  - `is_return` (boolean): Flags the receipt as a return
  - `return_reason` (text): Stores the reason for the return
  - `total_amount` (numeric): For returns, this is stored as a negative value
  - `receipt_note` (text): Contains details about the original receipt
  - `transaction_id` (text): Links to the transactions_overall table

### 2. `sold_products` Table

This table stores both original sold products and returned products:

- **Primary Key**: `sold_product_id` (text)
- **Foreign Key**: `receipt_id` (text) - Links to receipts table
- **Return-specific Fields**:
  - `quantity` (integer): For returns, this is stored as a negative value
  - `total_price` (numeric): For returns, this is stored as a negative value

### 3. `returned_products` Table

This auxiliary table tracks return-specific information:

- **Fields**:
  - `return_receipt_id` (text): Links to the return receipt
  - `original_receipt_id` (text): Links to the original sale receipt
  - `sold_product_id` (text): Links to the original sold product
  - `quantity` (integer): The quantity being returned
  - `unit_price` (numeric): The unit price of the returned product
  - `business_code` (text): The business code
  - `branch_name` (text): The branch name

### 4. `transactions_overall` Table

This table records all financial transactions, including returns:

- **Primary Key**: `transaction_id` (uuid)
- **Return-specific Fields**:
  - `transaction_type` (text): Set to 'return' or 'cash_return' for returns
  - `amount` (numeric): For returns, this is stored as a negative value
  - `transaction_reason` (text): Contains the return reason
  - `details` (jsonb): Contains additional details about the return

### 5. `cash_tracking` Table

This table tracks cash drawer movements, including returns:

- **Fields**:
  - `previous_total_cash` (numeric): Cash amount before the return
  - `new_total_cash` (numeric): Cash amount after the return
  - `cash_removals` (numeric): Amount removed for the return
  - `total_returns` (numeric): Total return amount
  - `cash_change_reason` (text): Set to 'return' for returns

## Table Relationships

The system uses text-based relationships rather than foreign key constraints:

1. **Original Receipt to Return Receipt**:
   - Return receipts have IDs prefixed with `RET-` followed by the original receipt ID
   - Example: Original `RCPT-123` → Return `RET-RCPT-123`

2. **Original Products to Returned Products**:
   - Return products have IDs prefixed with `RET-` followed by the original product ID and timestamp
   - Example: Original `PROD-456` → Return `RET-PROD-456-1621234567890`

3. **Return Receipt to Transaction**:
   - Return receipts have a `transaction_id` that links to `transactions_overall.transaction_id`
   - Transaction IDs for returns are prefixed with `TR-` followed by a timestamp

## Service Architecture

The return system is implemented through several interconnected services:

### 1. `returnProductsService.ts`

This service handles the core return functionality:

```typescript
// Key functions
async searchReceipt(receiptId, businessCode, branchName)
async processReturn(originalReceipt, selectedProducts, returnInfo)
```

- **searchReceipt**: Fetches the original receipt and its products, checking for any previously returned items
- **processReturn**: Creates the return receipt and return product records

### 2. `cashTrackingService.ts`

This service manages the cash drawer implications of returns:

```typescript
// Key function for returns
async updateCashForReturn(businessCode, branchName, cashierName, returnAmount)
```

- Retrieves the latest cash tracking record
- Calculates the new cash total after the return
- Creates a new cash tracking record with the updated totals
- Calls the transaction service to record the financial transaction

### 3. `transactionService.ts`

This service records all financial transactions, including returns:

```typescript
// Key function
async createTransaction(transaction)
```

- Creates a record in the `transactions_overall` table
- For returns, sets `transaction_type` to 'return' or 'cash_return'
- Records negative amounts for returns
- Stores detailed information about the return in the `details` field

## User Flow

The return process follows these steps from the user's perspective:

### 1. Receipt Search

- User selects a branch
- User enters the receipt number to search
- System fetches the original receipt and its products
- System checks for any previously returned items from this receipt

### 2. Product Selection

- User views the list of products from the original receipt
- Products that have already been returned are marked and disabled
- User selects the products to be returned

### 3. Return Information

- User enters or confirms customer information
- User provides a reason for the return
- User selects the payment method for the refund

### 4. Return Processing

- System creates a return receipt with negative amounts
- System creates return product records with negative quantities
- If the payment method is cash, system updates the cash tracking
- System records the financial transaction in the transactions_overall table

## Implementation Details

### Return Receipt Creation

```typescript
// Create return receipt
const { data: returnReceipt } = await supabase
  .from('receipts')
  .insert([{
    receipt_id: `RET-${receipt.receipt_id}`,
    transaction_id: `TR-${Date.now()}`,
    business_code: receipt.business_code,
    branch_name: receipt.branch_name,
    cashier_name: userProfile?.full_name || 'Unknown',
    customer_name: customerName || receipt.customer_name,
    customer_phone: customerPhone || receipt.customer_phone,
    total_amount: -totalReturnAmount, // Negative amount for returns
    payment_method: paymentMethod,
    is_return: true,
    return_reason: returnReason,
    receipt_note: receiptNote,
    receipt_date: now,
    created_at: now,
    // Copy relevant fields from original receipt
    vendor_commission_enabled: receipt.vendor_commission_enabled,
    tax_amount: 0,
    discount: 0,
    commission_amount_from_vendors: 0,
    long_text_receipt: `Return Receipt\n\nOriginal Receipt: ${receipt.receipt_id}\n...`
  }])
```

### Return Product Creation

```typescript
// Create return product entries
await supabase
  .from('sold_products')
  .insert(
    selectedProducts.map(productId => {
      const product = soldProducts.find(p => p.sold_product_id === productId);
      return {
        sold_product_id: `RET-${productId}-${Date.now()}`,
        receipt_id: returnReceipt.receipt_id,
        product_name: product.product_name,
        unit_price_original: product.unit_price_original,
        unit_price_by_bussniess: product.unit_price_by_bussniess,
        quantity: -product.quantity, // Negative quantity for returns
        business_code: receipt.business_code,
        business_bracnh_name: receipt.branch_name,
        total_price: -(product.quantity * product.unit_price_original),
        vendor_code_if_by_vendor: product.vendor_code_if_by_vendor,
        comission_for_bussnies_from_vendor: product.comission_for_bussnies_from_vendor,
        created_at: now
      };
    })
  )
```

### Cash Tracking Update

```typescript
// Update cash tracking for returns
await updateCashForReturn(
  businessCode,
  branchName,
  cashierName,
  returnAmount
)

// In updateCashForReturn function
const previousTotal = latestTracking?.new_total_cash || 0;
const newTotal = previousTotal - returnAmount;

return createCashTracking({
  business_code: businessCode,
  business_branch_name: branchName,
  cashier_name: cashierName,
  previous_total_cash: previousTotal,
  new_total_cash: newTotal,
  cash_removals: returnAmount,
  total_returns: returnAmount,
  cash_change_reason: 'return'
});
```

### Transaction Creation

```typescript
// Create transaction record for returns
await createTransaction({
  business_code: businessCode,
  business_name: await getBusinessName(businessCode),
  branch_name: branchName,
  transaction_type: 'cash_return',
  amount: -returnAmount, // Negative amount
  payment_method: 'cash',
  transaction_reason: 'Product Return',
  owner_profit_from_this_transcation: -returnAmount,
  details: {
    previous_total_cash: previousTotal,
    new_total_cash: newTotal,
    cashier_name: cashierName,
    tracking_id: tracking_id
  }
});
```

## Localization

The return system supports both English and Arabic languages through the `returnProductsTranslations` object:

```typescript
export const returnProductsTranslations = {
  returnProducts: {
    en: 'Return Products',
    ar: 'إرجاع المنتجات'
  },
  // Other translations...
}
```

The translations are applied in the UI using a custom hook that selects the appropriate language based on the user's preference.

## Security and Access Control

The return system enforces security through:

1. **Business Code Filtering**: All queries filter by the user's business code
2. **Branch-specific Access**: Users can only process returns for their assigned branches
3. **Role-based Access**: Only authorized users (typically cashiers and managers) can process returns
4. **Data Validation**: The system validates receipt numbers, product selections, and return reasons

## Reporting and Analytics

Return data is included in various reports:

1. **Sales Reports**: Returns are shown as negative transactions
2. **Cash Flow Reports**: Returns are tracked as cash removals
3. **Product Reports**: Returned quantities affect product performance metrics
4. **Transaction Reports**: Returns are categorized as a specific transaction type

## Best Practices

When working with the return system:

1. Always verify the original receipt exists before processing a return
2. Check for previously returned items to prevent duplicate returns
3. Provide clear return reasons for auditing purposes
4. Ensure the cash drawer has sufficient funds when processing cash returns
5. Use the proper transaction types to maintain accurate financial records

## Technical Considerations

1. **Negative Values**: The system uses negative values for returned quantities and amounts
2. **ID Prefixing**: Return-related IDs use prefixes to distinguish them from original records
3. **Text-based Relationships**: The system uses text matching rather than foreign key constraints
4. **Transaction Tracking**: All returns generate corresponding financial transaction records
5. **Cash Flow Management**: Cash returns update the cash tracking system
