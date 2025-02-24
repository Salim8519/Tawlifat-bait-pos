# Transaction and Cash Tracking Services

## Cash Tracking Service

The cash tracking service manages all cash-related operations across the system, tracking cash additions, removals, and maintaining running totals per business branch.

### Key Features

- Tracks cash flow per business and branch
- Maintains running cash totals
- Records all cash movements with reasons
- Generates unique tracking IDs
- Integrates with transaction service

### Main Functions

#### `createCashTracking(data: CreateCashTrackingData)`

Creates a new cash tracking record.

Parameters:
```typescript
{
  business_code: string;          // Business identifier
  business_branch_name: string;   // Branch name
  cashier_name?: string;         // Optional cashier name
  previous_total_cash: number;   // Previous cash total
  new_total_cash: number;       // New cash total after operation
  cash_additions?: number;      // Amount added (if any)
  cash_removals?: number;       // Amount removed (if any)
  cash_change_reason?: string;  // Reason for cash change
  total_returns?: number;       // Return amount (if any)
}
```

#### `getLatestCashTracking(businessCode: string, branchName: string)`

Retrieves the most recent cash tracking record for a branch.

#### `updateCashForSale(businessCode, branchName, cashierName, saleAmount)`

Updates cash tracking when a sale is made.

#### `updateCashForReturn(businessCode, branchName, cashierName, returnAmount)`

Updates cash tracking when a return is processed.

#### `updateCashManually(businessCode, branchName, cashierName, amount, reason)`

Handles manual cash adjustments (additions/removals).

#### `getCashTrackingStats(businessCode, branchName?, startDate?, endDate?)`

Retrieves cash statistics for a period:
- Total cash sales
- Total returns
- Total additions
- Total removals
- Net cash flow

## Transactions Overall Service

The transactions overall service manages all financial transactions across the system, providing a centralized record of all monetary operations.

### Key Features

- Records all financial transactions
- Supports multiple transaction types
- Maintains transaction history
- Handles vendor transactions
- Supports multiple payment methods

### Transaction Types

- Sales (`sale`)
- Returns (`return`)
- Cash additions (`cash_addition`)
- Cash removals (`cash_removal`)
- Tax payments (`tax`)
- Vendor payments (`vendor_payment`)
- Rent payments (`rent`)

### Transaction Structure

```typescript
{
  business_code: string;        // Business identifier
  business_name: string;        // Business name
  branch_name: string;         // Branch name
  transaction_type: string;    // Type of transaction
  transaction_reason: string;  // Reason/description
  amount: number;             // Transaction amount
  currency: string;           // Currency (default: 'OMR')
  payment_method: string;     // Payment method used
  vendor_code?: string;       // Vendor code (if applicable)
  vendor_name?: string;       // Vendor name (if applicable)
  details: {                  // Additional details
    [key: string]: any;      // Flexible structure for different transaction types
  }
}
```

### Important Notes

1. **Text-Based Relationships**
   - All relationships are managed through text matching
   - No foreign key constraints
   - Business code and branch name are primary identifiers

2. **Cash Flow Management**
   - Cash tracking automatically updates for cash transactions
   - Maintains accurate running totals
   - Records all cash movements with audit trail

3. **Data Integrity**
   - Each cash tracking record has a unique tracking ID
   - All transactions are timestamped
   - Complete audit trail maintained

4. **Error Handling**
   - Services include comprehensive error handling
   - Failed transactions are logged
   - Maintains data consistency

5. **Performance Considerations**
   - Optimized queries for cash tracking lookups
   - Efficient transaction recording
   - Minimal database operations

### Integration Points

- Sales System
- Return Processing
- Vendor Management
- Tax Payment System
- Rental Management
- Cash Register Operations

### Best Practices

1. **Cash Tracking**
   - Always verify previous totals
   - Include clear reasons for changes
   - Maintain audit trail
   - Regular reconciliation

2. **Transactions**
   - Use appropriate transaction types
   - Include detailed descriptions
   - Maintain consistent currency
   - Proper error handling
