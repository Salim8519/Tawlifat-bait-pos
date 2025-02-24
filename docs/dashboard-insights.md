# Dashboard Data & Profit Calculation

## Data Filtering
- Filters by `business_code` for business-specific data
- Optional `branch_name` filter for branch-specific insights
- Date range filters (today, this week, this month, last 3 months, custom)
- All queries respect multi-tenant architecture

## Profit Calculation
1. Business-Owned Products:
   - Full profit goes to business owner
   - Calculated as: selling_price - cost_price
   - Direct control over pricing and inventory

2. Vendor Products:
   - Business takes commission only
   - Tracked in `owner_profit_from_this_transcation`
   - Identified by non-null `vendor_name`
   - Commission rates set in business settings

## Transaction Types & Profit Sources
- Direct Sales: Full profit to business (100% margin)
- Vendor Sales: Commission-based profit (configured %)
- Monthly Tax: Fixed vendor contribution
- Rental Income: Space rental payments
- Vendor Deposits/Withdrawals: No profit impact

## Data Sources & Calculations
- `transactions_overall` table for all transactions
- Filters applied at query level for performance
- No database relationships (text-based matching)
- Real-time calculations for accurate insights
- Separate tracking of business vs vendor profits
- Commission calculations based on business settings
