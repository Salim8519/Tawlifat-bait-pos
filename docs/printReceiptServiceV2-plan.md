# PrintReceiptServiceV2 Implementation Plan

## Overview
Create an enhanced receipt printing service that automatically adapts to any POS printer size without manual configuration. This service will replace the current implementation while maintaining backward compatibility.
old version: `printReceiptService.ts`
new version: `printReceiptServiceV2.ts`

## Goals
1. Automatic printer size detection and adaptation
2. Improved responsive layout for any width
3. Better error handling and logging
4. Modular design with separation of concerns
5. Maintain backward compatibility

## Implementation Steps

### 1. Create Core Service Structure
- Create `printReceiptServiceV2.ts` with the same function signature as v1
- Implement helper functions for business settings, formatting, etc.
- Maintain the same parameter structure for backward compatibility

```typescript
export async function printReceiptV2(
  receipt: Receipt,
  cartItems: CartItem[],
  printerWidth?: string // Optional - will be auto-detected if not provided
): Promise<boolean>
```

### 2. Implement Printer Size Detection
- Add function to detect printer capabilities using the `window.matchMedia` API
- Create a printer size detection mechanism that runs before generating HTML
- Define standard sizes (57mm, 80mm, 85mm) but allow for custom widths
- Store detected size in localStorage for future use

### 3. Create Responsive Layout System
- Implement CSS Grid/Flexbox-based layout that adapts to any width
- Use CSS variables for dynamic sizing based on detected printer width
- Create responsive font scaling based on container width
- Use relative units (%, rem) instead of fixed pixel values

### 4. Implement Content Prioritization
- Create a system that prioritizes content based on available space
- Define "must-show" vs "optional" content elements
- Implement collapsible sections for very narrow printers
- Create condensed view for items when space is limited

### 5. Optimize for Thermal Printers
- Improve CSS for better thermal printer compatibility
- Optimize image rendering for thermal printers
- Add print-specific CSS optimizations
- Test with various thermal printer models

### 6. Enhance Error Handling
- Implement robust error handling with detailed error messages
- Add fallback mechanisms for when auto-detection fails
- Create a debug mode for troubleshooting
- Add comprehensive logging

## Technical Specifications

### Input Parameters
The `printReceiptV2` function will accept the same parameters as v1:

1. **receipt: Receipt**
   - receipt_id: Unique identifier
   - business_code: Business identifier
   - branch_name: Branch name
   - cashier_name: Cashier's name
   - customer_name and customer_phone: Optional customer information
   - total_amount: Total amount
   - payment_method: 'cash', 'card', or 'online'
   - discount: Discount amount
   - coupon_code: Optional coupon code
   - receipt_note: Optional note
   - tax_amount: Tax amount
   - commission_amount_from_vendors: Commission amount
   - receipt_date: Date of receipt

2. **cartItems: CartItem[]**
   - nameAr: Arabic name of product
   - quantity: Quantity purchased
   - price: Unit price
   - notes: Optional item notes

3. **printerWidth: string (optional)**
   - If provided, will override auto-detection
   - Supports any CSS width value (mm, px, etc.)

### Key Functions to Implement

1. **detectPrinterSize()**
   - Auto-detects printer width using media queries
   - Returns optimal width value

2. **generateResponsiveHTML(receipt, cartItems, width)**
   - Creates HTML with responsive design
   - Uses CSS variables for dynamic sizing

3. **optimizeForThermalPrinter(html)**
   - Adds thermal printer optimizations
   - Handles special cases for thermal printing

4. **handlePrintingErrors(error)**
   - Provides detailed error information
   - Implements fallback mechanisms

## Testing Plan
1. Test with various printer widths (57mm, 80mm, 85mm, custom)
2. Test with different receipt content lengths
3. Test with/without optional content (logo, customer info, etc.)
4. Test error scenarios and recovery

## Migration Strategy
1. Implement V2 alongside V1
2. Add feature flag to switch between implementations
3. Gradually transition to V2 after testing
4. Eventually deprecate V1

## Timeline
- Initial implementation: 3 days
- Testing and refinement: 2 days
- Documentation: 1 day
- Total: 6 days
