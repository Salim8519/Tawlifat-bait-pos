# Transaction Services Documentation

## Overview

This document outlines the key services responsible for managing transactions in the Tawliat Bait POS system, focusing on the three main transaction-related tables.

## Database Tables

### 1. transactions_overall

Central table for all financial transactions in the system.

### 2. vendor_transactions

Specialized table for tracking vendor-specific transactions.

### 3. cash_tracking

Manages cash register balances and cash-based operations.

## Service Responsibilities

### transactions_overall Table

| Service | Function | Responsibility |
|---------|----------|----------------|
| `transactionService.ts` | `createTransaction()` | Primary entry point for creating transaction records |
| `useTransaction.ts` (hook) | `processTransaction()` | Orchestrates transaction creation for sales |
| `cashTrackingService.ts` | Various functions | Creates transactions for cash additions/removals |

### vendor_transactions Table

| Service | Function | Responsibility |
|---------|----------|----------------|
| `vendorTransactionService.ts` | `createTransaction()` | Handles database insertion |
| `updateVendorTransactionsService.ts` | `updateVendorTransactionsFromSale()` | Processes vendor sales during checkout |
| `vendorTaxService.ts` | Various functions | Handles tax-related vendor transactions |
| `vendorSpacePaymentService.ts` | Various functions | Manages rental space payments |

### cash_tracking Table

| Service | Function | Responsibility |
|---------|----------|----------------|
| `cashTrackingService.ts` | `createCashTracking()` | Creates tracking records with transactions |
| `cashTrackingService.ts` | `updateCashForSale()` | Updates cash tracking for sales (no transaction) |

## Transaction Flow During Checkout

1. User initiates checkout in `POSPage.tsx`
2. `processReceipt()` in `useReceipt.ts` is called
3. `processTransaction()` in `useTransaction.ts` creates records in `transactions_overall`
4. `createReceipt()` creates a receipt record
5. `createSoldProducts()` records sold products
6. For vendor products, `updateVendorTransactionsFromSale()` updates `vendor_transactions`
7. For cash payments, `updateCashForSale()` updates `cash_tracking`

## Vendor Transaction Service

The vendor transaction service is responsible for updating the vendor_transactions table when vendor products are sold through the POS system.

### Key Functions

- `updateVendorTransactionsFromSale`: Updates vendor transactions for products sold through the POS
  - Groups items by vendor
  - Calculates accumulated profits
  - Creates transaction records for each vendor

### Business Name Handling

The service now uses the `ensureBusinessName` function from the business service to ensure a valid business name is always available:

```typescript
// In updateVendorTransactionsService.ts
import { ensureBusinessName } from './businessService';

// Inside the function
const finalBusinessName = await ensureBusinessName(businessCode, businessName);
```

This approach provides several benefits:
- Prevents 406 errors when fetching business names
- Provides graceful fallbacks when business names can't be retrieved
- Ensures consistent business name handling across the application
- Works for all user roles (owner, manager, cashier)

The business name retrieval process follows these steps:
1. Use the provided business name if available
2. If not available, try to get from an owner profile
3. If not found, try to get from any user with the same business code
4. If still not found, try to get from business_settings
5. If all lookups fail, use a fallback format with the business code

### Error Handling

The service includes robust error handling to prevent transaction failures:
- Logs detailed information about errors
- Provides fallback values when possible
- Continues processing other vendors if one fails

## Key Design Patterns

- **Single Responsibility**: Each service handles a specific aspect of transactions
- **Modular Architecture**: Services are decoupled and focused on specific tables
- **Transaction Tracking**: Comprehensive tracking of all financial operations
- **Vendor Management**: Specialized handling for vendor-related transactions
