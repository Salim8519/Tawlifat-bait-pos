# Expenses Management System

## Overview
The Expenses Management System allows businesses to track deposits and withdrawals across their branches. It supports multiple payment methods and maintains accurate cash tracking for cash-based transactions.

## Key Components

### Branch Selection
- Uses `ExpenseBranchSelector` component
- Shows only active branches
- Cashiers see their assigned branch only
- Managers/Owners can select from all active branches
- No "all branches" option - transactions must be branch-specific

### Transaction Services

#### 1. Transaction Service (`transactionService.ts`)
- Handles the main transaction record in `transactions_overall` table
- Records:
  - Business and branch information
  - Transaction type (deposit/withdraw)
  - Payment method (cash/card/online)
  - Amount (positive for deposits, negative for withdrawals)
  - Owner profit tracking
  - Transaction reason and details

#### 2. Cash Tracking Service (`cashTrackingService.ts`)
- Automatically triggered for cash transactions
- Maintains running cash balance per branch
- Tracks:
  - Previous and new cash totals
  - Cash additions and removals
  - Cashier responsible for the transaction
  - Unique tracking IDs for audit trails
  - Transaction dates and reasons

## Data Flow

1. User Input:
   ```
   - Select branch (if not cashier)
   - Choose transaction type (deposit/withdraw)
   - Enter amount
   - Select payment method
   - Provide reason/notes
   ```

2. Transaction Processing:
   ```
   - Create main transaction record
   - If cash payment:
     - Update cash tracking
     - Maintain cash balance
   - Show success/error feedback
   ```

## Role-Based Access

- **Cashiers**:
  - Fixed to their assigned branch
  - Can process transactions
  - See their name in cash tracking

- **Managers/Owners**:
  - Can select any active branch
  - Full access to all transaction types
  - Can view all transactions

## Integration Points

1. **Business Service**:
   - Provides business name from owner's profile
   - Ensures correct business attribution

2. **Branch Management**:
   - Filters active branches
   - Maintains branch-specific tracking

3. **User Authentication**:
   - Role-based access control
   - Branch assignment validation

## Error Handling

- Validates all required fields
- Ensures positive amounts
- Handles failed transactions
- Provides user feedback via toast notifications
- Maintains data integrity across tables

## Future Considerations

1. **Reporting**:
   - Transaction summaries
   - Cash flow analysis
   - Branch comparisons

2. **Enhancements**:
   - Bulk transactions
   - Scheduled transactions
   - Advanced filtering
   - Export capabilities
