# POS System Learnings

## Product Quantity Management

### Quantity Validation Rules
1. **Owner Products**
   - Non-trackable products: Quantity is validated against available stock
   - Trackable products: No quantity validation (e.g., services, custom orders)

2. **Vendor Products**
   - All vendor products require quantity validation regardless of trackable status
   - Cannot add more than available stock
   - Products are disabled in UI when:
     * Current cart quantity equals available stock
     * Available stock is 0 or less

### Implementation Details
1. **Product Display**
   ```typescript
   const isDisabled = (!product.trackable || product.business_code_if_vendor) && (
     currentQuantity >= product.quantity || 
     product.quantity <= 0
   );
   ```
   - Products are grayed out when disabled
   - Shows "Out" label for out-of-stock items

2. **Cart Management**
   - Validation happens at three levels:
     1. Visual (UI disabled state)
     2. Click handler (pre-add validation)
     3. Cart management (final validation)
   - MaxQuantity is set for:
     * All vendor products
     * Non-trackable owner products

### Business Logic
1. **Owner Products**
   - Trackable: No quantity limits (e.g., services)
   - Non-trackable: Limited by available stock

2. **Vendor Products**
   - Always quantity-limited regardless of trackable status
   - Ensures vendor stock accuracy
   - Prevents overselling vendor products

### Important Notes
1. **Stock Updates**
   - Stock is updated after successful sale
   - Only non-trackable products have quantities decreased
   - Vendor product quantities are always updated

2. **UI/UX Considerations**
   - Clear visual feedback for out-of-stock items
   - Error messages when attempting to exceed stock
   - Real-time cart quantity validation

### Inventory Management Rules
1. **Product Quantity Updates**:
   - Non-trackable products (trackable = false): Update quantity after sale
   - Vendor products (business_code_if_vendor exists): ALWAYS update quantity after sale
   - Regular trackable products (trackable = true): Do NOT update quantity

2. **Validation Order**:
   - First check if product is vendor product
   - Then check trackable flag for non-vendor products
   - Update quantities for both vendor and non-trackable products

3. **Quantity Tracking**:
   - Vendor products must always track quantity regardless of trackable flag
   - Regular products follow trackable flag rules
   - Both types validate against available stock before sale

4. **Implementation Details**:
   - Filter condition: `!product.trackable || product.business_code_if_vendor`
   - Always include business_code_if_vendor in product queries
   - Log both trackable status and vendor status for debugging

### Profile and Business Name Retrieval
- The `profiles` table uses `business_code` (not `business_code_`) for business identification
- When querying business names:
  - Always filter by `role = 'owner'` to get the correct business name
  - Business names should be retrieved from owner profiles only
  - Include error handling for cases where business name is not found
  - Log successful retrievals for debugging purposes
- This is important for:
  - Vendor transactions
  - Business settings
  - Any feature requiring business name validation

### Database Column Naming Conventions
1. **Business Settings Table**:
   - Column is named `business_code_` (with underscore)
   - NOT `business_code` (without underscore)
   - Always use `.eq('business_code_', value)` in queries
   - This differs from other tables that use `business_code`

2. **Column Name Consistency**:
   - Most tables use `business_code`
   - Only `business_settings` uses `business_code_`
   - Double-check column names when queries return 400 errors
   - Use table schema to verify correct column names

### Database Operations
1. **Supabase Limitations**:
   - Cannot use `supabase.raw()` for SQL operations
   - For increment operations: first fetch current value, then update with new value
   - Always handle both fetch and update errors separately

### Database Queries
- Get business name from owner's profile in one line:
```typescript
const { data } = await supabase.from('profiles').select('business_name').eq('business_code', businessCode).eq('role', 'owner').single();
```
This efficiently fetches the business name by filtering for the owner role and using single() to get one result.

### Vendor Transaction and Commission Handling
1. **Price Management**:
   - Original prices (without commission) should be used in vendor transactions
   - Get original price from products table, not from cart items
   - Cart items contain prices with commission already added

2. **Commission Calculation**:
   - Calculate commission as difference between selling price and original price
   - `itemCommission = itemSellingTotal - itemOriginalTotal`
   - Store commission in the `profit` field of vendor transactions

3. **Transaction Type Validation**:
   - Vendor transactions use specific transaction types:
     * 'product_sale' (not 'sale')
     * 'rental'
     * 'tax'
   - Each type has its own required fields and validation rules

4. **Data Flow**:
   - Products Table → Original Price
   - Cart Items → Price with Commission
   - Vendor Transactions → Original Price Only
   - Commission tracked separately in profit field

### Vendor Profit Service
- When calculating vendor profits, use `vendor_business_code` from vendor assignments to match transactions, as this is the unique identifier used in the vendor_transactions table for vendor identification

### Vendor Transaction Profit Handling
1. **Profit Fields**:
   - `profit`: Total amount of current transaction (original prices × quantities)
   - `accumulated_profit`: Running total of all transaction profits
   - Commission calculations are kept separate from vendor-visible profits

2. **Accumulated Profit Calculation**:
   - Get last transaction's accumulated_profit for vendor
   - Add current transaction profit to previous accumulated_profit
   - Store new total as accumulated_profit
   - Formula: `newAccumulatedProfit = previousAccumulatedProfit + currentProfit`

3. **Price and Profit Visibility**:
   - Vendors see only original prices
   - Commission calculations visible only to business owner
   - All vendor-facing amounts use pre-commission prices
   - Commission tracking handled separately in business records

4. **Transaction Amount Fields**:
   - `amount`: Total transaction amount using original prices
   - `total_price`: Same as amount for consistency
   - `unit_price`: Original price per unit (for single-item transactions)

### Commission Calculation Rules
1. **Sold Products Commission**:
   - Commission is only applied if: product is from vendor AND commission is enabled AND price >= minimum commission amount
   - Original price is stored in `unit_price_original`, final price with commission in `unit_price_by_business`
   - Commission amount is the difference between business price and original price

2. **Owner Profit Calculation**:
   - For vendor products: profit = (selling price - vendor's original price) × quantity
   - For non-vendor products: profit = total amount (entire sale is profit)
   - Stored in `owner_profit_from_this_transcation` in transactions_overall table

## Monthly Tax Implementation Learnings

- When syncing data between tables (e.g., vendor tax status), always filter by specific time periods (month/year) to ensure consistent state across different views
- When using Supabase, verify table/column names in migrations before implementing features - schema mismatches can cause runtime errors that TypeScript won't catch

## Tax Payment and Transaction Recording
1. **Transaction IDs**:
   - `vendor_transactions`: Expects text-based IDs
   - `transactions_overall`: Uses UUID format
   - Solution: Use text ID for vendor_transactions and let transactions_overall auto-generate UUID
   - Store vendor_transaction_id in details JSON for reference

2. **Business Name Handling**:
   - Owner's business name should come from `vendor_assignments.owner_business_name`
   - NOT from:
     * `business_settings` (contains settings only)
     * `profiles` (may be outdated)
   - Query using combination of:
     * owner_business_code
     * vendor_business_code
     * branch_name
   - Always fallback to business_code if name not found

3. **Tax Transaction Structure**:
   - Amount is negative in vendor_transactions (shows as deduction)
   - Amount is positive in transactions_overall (shows as income)
   - Include tax_period in YYYY-MM format
   - Add descriptive notes and tax_description
   - Store all metadata in details JSON field

4. **Error Prevention**:
   - Use vendorTransactionService for proper validation
   - Let database handle UUID generation
   - Keep transaction IDs unique with timestamps
   - Validate all required fields before insert
   - Handle column name differences (e.g., business_code_)


## Debugging Tips
1. **Console Logging**
   - Product details logging includes:
     * Vendor status
     * Trackable status
     * Current stock
     * Cart quantities
   - Validation state logging shows:
     * Why items are disabled
     * Current vs maximum quantities
     * Validation pass/fail reasons

2. **Common Issues**
   - Check product.trackable status
   - Verify business_code_if_vendor for vendor products
   - Ensure maxQuantity is properly set
   - Monitor cart state updates

## Future Improvements
1. **Consider Adding**
   - Low stock warnings
   - Stock reservation system
   - Bulk quantity validation
   - Stock synchronization for vendor products

2. **Potential Optimizations**
   - Cache cart quantities
   - Batch stock updates
   - Precompute disabled states
