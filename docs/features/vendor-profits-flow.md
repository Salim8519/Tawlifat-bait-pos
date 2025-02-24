# Vendor Profits Data Flow

## Overview
This document explains how data flows through the Vendor Profits page, from user login to transaction recording.

## Data Flow Steps

### 1. User Authentication & Business Context
- User logs in and `useAuthStore` provides:
  - `user.businessCode` (owner's business code)
  - `user.role` (must be 'owner')
  - `user.mainBranch` (default branch)

### 2. Vendor Data Loading
```typescript
// 1. Get vendor assignments
const assignments = await getVendorAssignments(businessCode);
// Returns: vendor_business_code, branch_name, assignment_date

// 2. For each assignment, get vendor profile
const vendorProfile = assignments.profile; // From profiles table
// Contains: vendor_business_name, is_vendor, etc.

// 3. Get profits for each vendor
const profits = await getVendorProfits(
  businessCode,
  vendorCode,
  branchName,
  month,
  year
);
// Returns: vendorProfit, ownerProfit
```

### 3. Recording Transactions
When making vendor payments:

#### Vendor Transactions Table
```typescript
{
  transaction_id: string,      // Generated unique ID
  business_code: string,       // Owner's business code
  business_name: string,       // Owner's business name
  vendor_code: string,         // Vendor's business code
  vendor_name: string,         // Vendor's business name
  branch_name: string,         // Branch name
  transaction_type: 'expense', // Fixed type for both deposit/withdrawal
  amount: number,              // Positive for deposit, negative for withdrawal
  profit: number,              // Same as amount
  transaction_date: Date,
  status: 'completed'
}
```

#### Transactions Overall Table
```typescript
{
  business_code: string,       // Owner's business code
  business_name: string,       // Owner's business name
  branch_name: string,         // Branch name
  transaction_type: string,    // 'vendor_deposit' or 'vendor_withdrawal'
  amount: number,              // Negative for deposit, positive for withdrawal
  owner_profit: number,        // Same as amount
  vendor_code: string,         // Vendor's business code
  vendor_name: string,         // Vendor's business name
  payment_method: 'cash',
  currency: 'OMR',
  transaction_date: Date
}
```

## Important Notes
1. All relationships are text-based (no foreign keys)
2. Business names are fetched from profiles table
3. Amounts are in OMR with 3 decimal places
4. Transaction signs are opposite in overall vs vendor tables
5. Both tables must be updated for each transaction
