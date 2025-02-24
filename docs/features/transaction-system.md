# Transaction System Documentation

## Overview
This document explains how the transaction system works across three main tables:
- Sold Products
- Vendor Transactions
- Overall Transactions

## Flow of a Sale
1. User creates a sale in POS
2. System processes through useTransaction hook
3. Records are created in all relevant tables
4. Tax and commission are calculated where applicable

## Sold Products Table
Records individual product sales with detailed information.

### What it Receives:
- receipt_id: Links to receipt
- product details (name, quantity, etc.)
- unit_price_original: Original product price
- unit_price_by_bussniess: Final selling price
- vendor_code_if_by_vendor: Vendor ID if applicable
- business_code: Owner's business code
- tax_on_product: Tax amount for this product

### Behavior:
- Tracks every individual product sold
- Calculates tax per product
- Records vendor commission if applicable
- Maintains original and business prices

### Example:
```typescript
{
  receipt_id: "rec_123",
  product_name: "Item A",
  quantity: 2,
  unit_price_original: 10.000,
  unit_price_by_bussniess: 11.000,
  total_price: 22.000,
  tax_on_product: 1.100,  // 5% tax
  comission_for_bussnies_from_vendor: 1.000,
  vendor_code_if_by_vendor: "vend_123"
}
```

## Vendor Transactions
Tracks transactions specific to vendor products.

### What it Receives:
- vendor_code: Vendor identifier
- transaction details
- amount: Total with tax
- owner_profit_from_this_transcation: Commission + Tax

### Behavior:
- Created only for vendor products
- Includes tax in total amount
- Calculates proportional discounts
- Records vendor commission

### Example:
```typescript
{
  vendor_code: "vend_123",
  transaction_type: "vendor_sale",
  amount: 23.100,  // 22.000 + 1.100 tax
  owner_profit_from_this_transcation: 2.100, // 1.000 commission + 1.100 tax
  details: {
    products: [...],
    commission: 1.000,
    subtotal: 22.000,
    tax: 1.100,
    total: 23.100
  }
}
```

## Overall Transactions
Records all transactions including both vendor and owner products.

### What it Receives:
- transaction_type: 'sale' or 'vendor_sale'
- amount: Total with tax
- owner_profit_from_this_transcation: Full amount for owner products, commission + tax for vendor products

### Behavior:
- Records all sales transactions
- Includes tax in total amount
- Different profit calculation based on product type:
  * Owner products: Full amount including tax
  * Vendor products: Commission + tax only

### Example (Owner Product):
```typescript
{
  transaction_type: "sale",
  amount: 105.000,  // 100.000 + 5.000 tax
  owner_profit_from_this_transcation: 105.000,  // Full amount
  details: {
    products: [...],
    subtotal: 100.000,
    tax: 5.000,
    total: 105.000
  }
}
```

### Example (Vendor Product):
```typescript
{
  transaction_type: "vendor_sale",
  amount: 105.000,  // 100.000 + 5.000 tax
  owner_profit_from_this_transcation: 15.000,  // 10.000 commission + 5.000 tax
  details: {
    products: [...],
    commission: 10.000,
    subtotal: 100.000,
    tax: 5.000,
    total: 105.000
  }
}
```

## Tax Handling
- Tax is calculated on the final selling price
- Tax rate is configured in business settings
- Tax is included in:
  * sold_products.tax_on_product
  * transactions.amount
  * transactions.owner_profit_from_this_transcation
  * transactions.details.tax

## Commission Handling
- Calculated on pre-tax amount
- Only applies to vendor products
- Minimum amount threshold from settings
- Rate configured in business settings
- Stored in:
  * sold_products.comission_for_bussnies_from_vendor
  * transactions.details.commission (vendor transactions)

## Important Notes
1. All monetary values use OMR currency
2. Tax is always calculated after commission
3. Owner keeps both commission and tax
4. Vendor price is always pre-tax
5. Discounts are applied proportionally
