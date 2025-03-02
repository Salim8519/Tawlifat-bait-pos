# Business and Vendor Code Retrieval Guide

This document explains how to retrieve and work with business codes and vendor information in the Tawliat Bait POS system.

## Business Code Retrieval

### 1. From Current User

```typescript
// Using the auth store hook
const { user } = useAuthStore();
const businessCode = user?.businessCode;

// Get business name from database (recommended)
const businessName = await getBusinessName(businessCode);
// OR from user profile (if available)
const businessNameFromProfile = user?.businessName;
```

### 2. From Profile

```typescript
// Get profile from user ID
const profile = await getProfile(userId);
const businessCode = profile?.business_code;
const businessName = profile?.business_name; // Get business name from profile
```

## Business Name Retrieval Best Practices

### 1. Using Business Service (Recommended)
```typescript
import { getBusinessName } from '../services/businessService';

// Gets business name from owner's profile in database
const businessName = await getBusinessName(businessCode);
```

This method is recommended because:
- Always gets the latest business name from the database
- Ensures you get the owner's business name
- Has proper error handling and fallback to 'Unknown Business'
- Used in vendor transactions and rental payments

Example usage in vendor transactions:
```typescript
// In a payment handling component
const handlePayment = async () => {
  const ownerBusinessName = await getBusinessName(businessCode);
  
  await transactionsOverallService.createVendorTransaction({
    business_code: businessCode,
    business_name: ownerBusinessName, // Always correct and up-to-date
    // ... other transaction details
  });
};
```

### Implementation Details

The `getBusinessName` function in `businessService.ts` is implemented as follows:

```typescript
export async function getBusinessName(businessCode: string): Promise<string> {
  const { data, error } = await supabase
    .from('profiles')
    .select('business_name')
    .eq('business_code', businessCode)
    .eq('role', 'owner')
    .single();

  if (error) {
    console.error('Error fetching business name:', error);
    return 'Unknown Business';
  }

  return data?.business_name || 'Unknown Business';
}
```

Key features:
- Filters by both business code and owner role
- Provides fallback value 'Unknown Business'
- Includes error logging
- Returns a Promise<string> for proper async handling

### 2. From User Profile (Not Recommended for Transactions)
```typescript
const { user } = useAuthStore();
const businessName = user?.businessName;
```

This method is not recommended for transactions because:
- May not be up-to-date with database
- Doesn't guarantee it's the owner's business name
- No fallback if value is missing

### 3. From Profile Query
```typescript
const { data: profile } = await supabase
  .from('profiles')
  .select('business_name')
  .eq('business_code', businessCode)
  .eq('role', 'owner')
  .single();

const businessName = profile?.business_name;
```

This method is not recommended because:
- Requires manual error handling
- No built-in fallback value
- Duplicates logic that's already in businessService

## Best Practices for Business Name Retrieval

### Using the Business Service

Always use the dedicated functions in the business service to retrieve business names:

```typescript
import { getBusinessName, ensureBusinessName } from '../services/businessService';

// Basic retrieval - returns the business name or 'Unknown Business'
const businessName = await getBusinessName(businessCode);

// Enhanced retrieval with fallback - ensures a valid business name is always returned
const safeName = await ensureBusinessName(businessCode, currentBusinessName);
```

### Business Name Lookup Process

The `getBusinessName` function follows a multi-step lookup process:

1. First tries to find the business name from an owner profile
2. If not found, looks for any user with the same business code
3. If still not found, checks the business_settings table
4. If all lookups fail, returns a default value

This approach ensures that the business name can be retrieved regardless of the current user's role (owner, manager, cashier, etc.).

### Benefits of Using ensureBusinessName

The `ensureBusinessName` function provides several advantages:

1. **Graceful Fallbacks**: If the business name can't be found in the database, it provides a fallback using the business code.
2. **Efficiency**: Uses an existing name if provided, avoiding unnecessary database queries.
3. **Error Handling**: Catches and logs errors without throwing exceptions that could interrupt the flow.
4. **Consistency**: Ensures a consistent approach to business name retrieval across the application.

### Implementation

```typescript
// Example usage in a service
import { ensureBusinessName } from '../services/businessService';

export async function processBusinessTransaction(businessCode: string, businessName?: string) {
  // Get a guaranteed valid business name
  const validBusinessName = await ensureBusinessName(businessCode, businessName);
  
  // Now use the valid business name for the transaction
  // ...
}
```

### When to Use Which Function

- Use `getBusinessName` when you need the exact business name and can handle the 'Unknown Business' case.
- Use `ensureBusinessName` when you need a guaranteed valid string for a business name in operations like:
  - Creating transaction records
  - Generating receipts
  - Updating vendor transactions
  - Any operation where a missing business name would cause an error

## Vendor Information

### 1. Vendor Types
- **Regular Vendors**: Users with `profiles.is_vendor = true`
- **Sub-vendors**: Managed through `vendor_assignments` table

### 2. Vendor Assignment Data
```typescript
interface VendorAssignment {
  owner_business_code: string;    // Business that owns the vendor relationship
  vendor_business_code: string;   // Vendor's business code
  vendor_email_identifier: string;// Vendor's email
  branch_name: string;           // Branch where vendor operates
}
```

### 3. Getting Vendor Details

#### From Business Code
```typescript
// Get vendor profile using business code
const { data: vendorProfile } = await supabase
  .from('profiles')
  .select('*')
  .eq('business_code', vendorBusinessCode)
  .eq('is_vendor', true)
  .single();
```

#### From Email
```typescript
// Get vendor profile using email
const { data: vendorProfile } = await supabase
  .from('profiles')
  .select('*')
  .eq('email', vendorEmail)
  .eq('is_vendor', true)
  .single();
```

### 4. Vendor Assignments

#### Get All Vendors for a Business
```typescript
// Get all vendor assignments for a business
const { data: vendorAssignments } = await supabase
  .from('vendor_assignments')
  .select('*')
  .eq('owner_business_code', businessCode);
```

#### Get All Businesses a Vendor Works For
```typescript
// Get all businesses a vendor is assigned to
const { data: vendorAssignments } = await supabase
  .from('vendor_assignments')
  .select('*')
  .eq('vendor_business_code', vendorBusinessCode);
```

## Important Notes

1. **No Foreign Keys**: The system uses text-based matching for relationships instead of foreign key constraints.

2. **Data Validation**: Always validate business codes and vendor relationships at the application level:
   ```typescript
   // Example validation
   if (!profile.role || !profile.business_code) {
     throw new Error('Invalid profile: missing role or business code');
   }
   ```

3. **Business Access Rules**:
   - Admins have access to all businesses
   - Vendors must have `is_vendor` flag set to true
   - All users must have a valid business code

4. **Common Queries**:

   ```typescript
   // Get vendor's business name
   const getVendorBusinessName = async (vendorBusinessCode: string) => {
     const { data } = await supabase
       .from('profiles')
       .select('business_name')
       .eq('business_code', vendorBusinessCode)
       .eq('role', 'vendor')
       .single();
     return data?.business_name;
   };

   // Get vendor's full profile
   const getVendorProfile = async (vendorBusinessCode: string) => {
     const { data } = await supabase
       .from('profiles')
       .select('*')
       .eq('business_code', vendorBusinessCode)
       .eq('role', 'vendor')
       .single();
     return data;
   };
   ```

## Best Practices

1. **Always Use Auth Store**: For current user's business code, always use the auth store instead of making database queries.

2. **Cache Vendor Data**: Consider caching frequently accessed vendor information to reduce database queries.

3. **Validate Access**: Always validate business access before performing operations:
   ```typescript
   const validateBusinessAccess = async (profile: Profile): Promise<boolean> => {
     if (!profile.role || !profile.business_code) return false;
     if (profile.role === 'vendor' && !profile.is_vendor) return false;
     if (profile.role === 'admin') return true;
     return true;
   };
   ```

4. **Handle Missing Data**: Always handle cases where business codes or vendor information might be missing:
   ```typescript
   if (!businessCode) {
     throw new Error('Business code is required');
   }
   ```

## Common Issues and Solutions

1. **Missing Vendor Profile**:
   - Check if user has `is_vendor` flag set to true
   - Verify vendor assignment exists in `vendor_assignments` table
   - Ensure business code exists in profile

2. **Invalid Business Access**:
   - Verify user role permissions
   - Check business code validity
   - Validate vendor assignments if applicable

3. **Data Inconsistency**:
   - Always query using both business code and role
   - Validate data at application level
   - Use transactions for critical operations
