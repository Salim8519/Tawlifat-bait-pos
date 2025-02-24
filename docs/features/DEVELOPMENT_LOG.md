# Tawliat Bait POS Development Log

## Database Structure

### Core Tables
1. **Products Table**
   ```sql
   - product_id (integer, PK)
   - product_name (text)
   - barcode (text)
   - price (integer)
   - quantity (integer)
   - type (text)
   - trackable (boolean)
   - expiry_date (date)
   - business_code_of_owner (text)
   - business_code_if_vendor (text)
   - business_name_of_product (text)
   - branch_name (text)
   - current_page (text)
   - accepted (boolean)
   - image_url (text)
   - description (text)
   ```

### Key Relationships
- No foreign key constraints (text-based matching)
- Business relationships through business_code
- Branch relationships through branch_name
- Vendor relationships through business_code_if_vendor

## Business Logic

### Vendor System
1. **Vendor Types**
   - Regular Vendors (profiles.is_vendor = true)
   - Sub-vendors (managed through vendor_assignments)

2. **Commission Structure**
   - Configured in business_settings
   - vendor_commission_enabled (boolean)
   - default_commission_rate (numeric)
   - minimum_commission_amount (numeric)

3. **Vendor Product Flow**
   - Products linked via business_code_if_vendor
   - Approval workflow with accepted flag
   - Tracks creation and acceptance dates
   - Stores vendor business name

### Cart System
1. **Cart Item Structure**
   ```typescript
   interface CartItem {
     id: string
     barcode: string
     nameAr: string
     type: string
     price: number
     quantity: number
     category: string
     expiryDate?: Date
     maxQuantity?: number
     trackable: boolean
     vendorId: string
     vendorName: string
     vendorPrice: number
     business_code_if_vendor: string
     business_name_if_vendor: string
     imageUrl?: string
     description?: string
   }
   ```

2. **Cart Features**
   - Quantity tracking
   - Stock validation
   - Vendor metadata
   - Price calculations with commission
   - Image display
   - Expiry date tracking

### Product Management
1. **Product Loading**
   - Filters by current_page='products'
   - Checks accepted status
   - Validates quantity > 0
   - Handles vendor assignments

2. **Product Display**
   - Compact grid layout
   - Responsive columns (3-6 based on screen)
   - Image with fallback
   - Stock status
   - Vendor information
   - Type indicator (food/product)

3. **Search Features**
   - Case-insensitive product name search
   - Barcode search
   - Real-time filtering

## UI/UX Improvements

### Product Cards
1. **Layout**
   ```css
   - Grid: grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6
   - Gap: gap-2
   - Padding: p-2
   ```

2. **Image Handling**
   ```typescript
   - Aspect ratio square
   - Object-fit: cover
   - Error fallback
   - ShoppingCart icon placeholder
   ```

3. **Typography**
   ```css
   - Title: text-sm leading-tight line-clamp-2
   - Metadata: text-xs
   - Status: text-xs text-gray-500
   ```

### Cart Items
1. **Layout**
   ```css
   - Flex layout
   - Image size: w-16 h-16
   - Rounded corners
   - Shadow effects
   ```

2. **Features**
   - Quantity controls
   - Remove item
   - Price display
   - Vendor information
   - Stock validation

## Performance Optimizations

1. **Query Optimization**
   - Specific column selection
   - Efficient filtering
   - Reduced joins

2. **UI Performance**
   - Image lazy loading
   - Error boundaries
   - Efficient re-renders
   - Compact layouts

## Security Considerations

1. **Data Access**
   - Business code validation
   - Branch access control
   - Vendor permissions

2. **Transaction Safety**
   - Stock validation
   - Commission calculations
   - Payment processing

## Future Enhancements

1. **Vendor Features**
   - Enhanced commission tracking
   - Better vendor product management
   - Improved approval workflow

2. **UI Improvements**
   - More responsive layouts
   - Better image optimization
   - Enhanced search capabilities

3. **Business Logic**
   - Advanced commission rules
   - Better stock management
   - Enhanced reporting

## Critical Information for New Developers

### Project Architecture Overview
1. **Multi-tenant System**
   - Each business has its own code (business_code)
   - Businesses can have multiple branches
   - Vendors can be associated with multiple businesses
   - All relationships are text-based, not foreign key constrained

2. **Key Business Rules**
   - Products can be owned by business or supplied by vendors
   - Vendor products require approval workflow
   - Stock tracking can be enabled/disabled per product
   - Food products have expiry date tracking
   - Commission calculations vary by business settings

3. **Important State Management**
   - User context includes business code and branch
   - Settings are managed through useSettingsStore
   - Cart state is managed locally
   - Language switching (AR/EN) throughout app

### Critical Workflows

1. **Product Addition Flow**
   ```typescript
   // 1. Product Creation
   - Add basic product info
   - Set business_code_of_owner
   - Set branch_name
   - Set trackable flag

   // 2. If Vendor Product
   - Set business_code_if_vendor
   - Set business_name_of_product
   - Requires acceptance workflow
   ```

2. **Sales Process**
   ```typescript
   // 1. Cart Addition
   - Validate stock
   - Calculate commission
   - Add vendor metadata
   - Track quantities

   // 2. Payment Processing
   - Update stock
   - Process commissions
   - Generate receipt
   - Update cash tracking (if cash payment)
   ```

3. **Vendor Assignment**
   ```typescript
   // 1. Assignment Creation
   - Link vendor to business
   - Set commission rates
   - Configure branch access

   // 2. Product Approval
   - Review vendor products
   - Set acceptance status
   - Configure pricing
   ```

## Database Design Considerations

### Text-Based Relationships
```sql
-- Example: Finding vendor products
SELECT * FROM products 
WHERE business_code_if_vendor = 'VENDOR_CODE'
AND branch_name = 'BRANCH_NAME';

-- NOT using foreign keys:
-- DON'T do this:
FOREIGN KEY (business_code_if_vendor) REFERENCES businesses(business_code)
```

### Important Tables Relationships
1. **Products → Businesses**
   - business_code_of_owner → businesses.business_code
   - business_code_if_vendor → businesses.business_code

2. **Products → Branches**
   - branch_name → branches.branch_name
   - business_code_of_owner → branches.business_code

3. **Vendor Assignments**
   - owner_business_code → businesses.business_code
   - vendor_business_code → businesses.business_code
   - branch_name → branches.branch_name

## Critical Components

### 1. Transaction Processing
```typescript
interface TransactionMetadata {
  businessCode: string
  branchName: string
  vendorProducts: {
    vendorId: string
    commission: number
    products: string[]
  }[]
}
```

### 2. Commission Calculation
```typescript
function calculateCommission(price: number, settings: BusinessSettings): number {
  if (price < settings.minimum_commission_amount) {
    return 0;
  }
  return (price * settings.default_commission_rate) / 100;
}
```

### 3. Stock Management
```typescript
interface StockUpdate {
  productId: string
  quantity: number
  trackable: boolean
  currentStock: number
}
```

## Role System & Permissions

### Role Hierarchy
```
Admin
  └─ Owner
       └─ Manager
            └─ Cashier
Vendor (Parallel Role)
```

### Role Definitions & Permissions

1. **Admin Role**
   ```typescript
   interface AdminPermissions {
     role: 'admin'
     capabilities: {
       system_config: true      // Can configure system-wide settings
       business_management: true // Can manage all businesses
       user_management: true    // Can manage all users
       reporting: true          // Access to all reports
       audit_logs: true         // Can view all audit logs
     }
   }
   ```
   **Key Responsibilities:**
   - System-wide configuration
   - Business account management
   - User role management
   - Global reporting access
   - System maintenance
   - Security monitoring

2. **Owner Role**
   ```typescript
   interface OwnerPermissions {
     role: 'owner'
     business_code: string
     capabilities: {
       business_settings: true    // Can configure business settings
       branch_management: true    // Can manage branches
       vendor_management: true    // Can manage vendors
       staff_management: true     // Can manage staff
       financial_access: true     // Full financial access
       reporting: true           // Business-wide reporting
     }
   }
   ```
   **Key Responsibilities:**
   - Business configuration
   - Branch management
   - Staff management
   - Vendor relationships
   - Financial oversight
   - Business reporting

3. **Manager Role**
   ```typescript
   interface ManagerPermissions {
     role: 'manager'
     business_code: string
     branch_name: string
     capabilities: {
       inventory_management: true // Can manage inventory
       staff_scheduling: true    // Can schedule staff
       daily_operations: true    // Can manage daily operations
       basic_reporting: true     // Access to branch reports
       customer_service: true    // Can handle customer issues
     }
   }
   ```
   **Key Responsibilities:**
   - Branch operations
   - Inventory management
   - Staff scheduling
   - Customer service
   - Branch reporting
   - Daily cash management

4. **Cashier Role**
   ```typescript
   interface CashierPermissions {
     role: 'cashier'
     business_code: string
     branch_name: string
     capabilities: {
       process_sales: true      // Can process sales
       manage_cart: true        // Can manage shopping cart
       view_inventory: true     // Can view inventory
       basic_customer_service: true // Basic customer service
       handle_cash: true        // Can handle cash transactions
     }
   }
   ```
   **Key Responsibilities:**
   - Process sales
   - Handle payments
   - Basic inventory checks
   - Customer assistance
   - Cash handling
   - Receipt management

5. **Vendor Role**
   ```typescript
   interface VendorPermissions {
     role: 'vendor'
     business_code: string
     capabilities: {
       product_management: true  // Can manage own products
       view_sales: true         // Can view own product sales
       commission_tracking: true // Can track commissions
       inventory_updates: true   // Can update own inventory
     }
     restrictions: {
       branch_access: string[]   // Limited to assigned branches
       product_types: string[]   // Limited to approved categories
     }
   }
   ```
   **Key Responsibilities:**
   - Product management
   - Inventory updates
   - Sales tracking
   - Commission monitoring
   - Price management
   - Stock management

### Role-Based Access Control

1. **Access Validation**
   ```typescript
   // Role validation middleware
   const validateRoleAccess = (
     requiredRole: Role,
     requiredCapabilities: string[]
   ) => async (req: Request, res: Response, next: NextFunction) => {
     const userRole = req.user.role;
     const userCapabilities = getRoleCapabilities(userRole);
     
     if (!hasRequiredCapabilities(userCapabilities, requiredCapabilities)) {
       return res.status(403).json({ error: 'Insufficient permissions' });
     }
     next();
   };
   ```

2. **Business Context Validation**
   ```typescript
   // Business context middleware
   const validateBusinessContext = async (
     userBusinessCode: string,
     targetBusinessCode: string,
     userRole: Role
   ) => {
     // Admin can access any business
     if (userRole === 'admin') return true;
     
     // Others can only access their assigned business
     return userBusinessCode === targetBusinessCode;
   };
   ```

3. **Branch Access Control**
   ```typescript
   // Branch access middleware
   const validateBranchAccess = async (
     userRole: Role,
     userBranchName: string,
     targetBranchName: string
   ) => {
     // Owner can access all branches
     if (userRole === 'owner') return true;
     
     // Manager and Cashier limited to assigned branch
     if (['manager', 'cashier'].includes(userRole)) {
       return userBranchName === targetBranchName;
     }
     
     // Vendor needs specific branch assignment check
     if (userRole === 'vendor') {
       return await checkVendorBranchAssignment(
         userBranchName,
         targetBranchName
       );
     }
   };
   ```

### Common Role Operations

1. **Sales Processing**
   ```typescript
   // Different roles have different sales capabilities
   const processSale = async (
     user: User,
     sale: Sale
   ): Promise<SaleResult> => {
     switch (user.role) {
       case 'cashier':
         return processCashierSale(sale);
       case 'manager':
         return processManagerSale(sale);
       case 'owner':
         return processOwnerSale(sale);
       default:
         throw new Error('Unauthorized to process sales');
     }
   };
   ```

2. **Inventory Management**
   ```typescript
   // Role-specific inventory operations
   const updateInventory = async (
     user: User,
     update: InventoryUpdate
   ): Promise<void> => {
     if (!canManageInventory(user.role)) {
       throw new Error('Insufficient permissions');
     }
     
     if (user.role === 'vendor') {
       await updateVendorInventory(update);
     } else {
       await updateBusinessInventory(update);
     }
   };
   ```

3. **Report Access**
   ```typescript
   // Role-based report access
   const getReports = async (
     user: User,
     reportType: ReportType
   ): Promise<Report> => {
     const allowedReports = getRoleReports(user.role);
     if (!allowedReports.includes(reportType)) {
       throw new Error('Report access denied');
     }
     return generateReport(reportType, user);
   };
   ```

### Role-Specific UI Components

1. **Navigation Menu**
   ```typescript
   // Dynamic menu based on role
   const getNavigationMenu = (role: Role): MenuItem[] => {
     const baseMenu = [
       { path: '/dashboard', label: 'Dashboard' },
       { path: '/sales', label: 'Sales' }
     ];
     
     switch (role) {
       case 'admin':
         return [...baseMenu, ...getAdminMenu()];
       case 'owner':
         return [...baseMenu, ...getOwnerMenu()];
       // ... other roles
     }
   };
   ```

2. **Action Buttons**
   ```typescript
   // Role-specific actions
   const getActionButtons = (role: Role): ActionButton[] => {
     const buttons: ActionButton[] = [];
     
     if (canManageUsers(role)) {
       buttons.push({ type: 'user_management' });
     }
     
     if (canManageInventory(role)) {
       buttons.push({ type: 'inventory' });
     }
     
     return buttons;
   };
   ```

### Role Migration & Updates

1. **Role Upgrade Process**
   ```typescript
   // Process for upgrading user roles
   const upgradeUserRole = async (
     userId: string,
     newRole: Role,
     approver: User
   ): Promise<void> => {
     // Validate approver has permission
     if (!canUpgradeRole(approver.role)) {
       throw new Error('Unauthorized to upgrade roles');
     }
     
     // Log role change
     await logRoleChange(userId, newRole, approver.id);
     
     // Update user role
     await updateUserRole(userId, newRole);
   };
   ```

2. **Permission Updates**
   ```typescript
   // Update role permissions
   const updateRolePermissions = async (
     role: Role,
     newPermissions: Permission[]
   ): Promise<void> => {
     // Validate permission update
     validatePermissionUpdate(role, newPermissions);
     
     // Update permissions
     await updatePermissions(role, newPermissions);
     
     // Notify affected users
     await notifyPermissionChange(role);
   };
   ```

### Best Practices for Role Management

1. **Role Assignment**
   - Always validate role changes
   - Log role modifications
   - Maintain role hierarchy
   - Check business context
   - Verify branch assignments

2. **Permission Checks**
   - Use middleware for validation
   - Check at component level
   - Validate business context
   - Verify branch access
   - Track permission usage

3. **UI Considerations**
   - Hide unauthorized features
   - Show role-specific navigation
   - Display appropriate actions
   - Clear error messages
   - Role-based dashboards

## Role-Based UI Navigation & Access Control

### Navigation Routes by Role

1. **Admin Navigation**
   ```typescript
   const adminRoutes = [
     { path: '/admin/dashboard', label: 'Dashboard' },
     { path: '/admin/businesses', label: 'Businesses' },
     { path: '/admin/users', label: 'Users' },
     { path: '/admin/settings', label: 'System Settings' },
     { path: '/admin/logs', label: 'Audit Logs' },
     { path: '/admin/reports', label: 'Global Reports' }
   ];
   ```

2. **Owner Navigation**
   ```typescript
   const ownerRoutes = [
     { path: '/dashboard', label: 'Business Dashboard' },
     { path: '/branches', label: 'Branches' },
     { path: '/staff', label: 'Staff Management' },
     { path: '/vendors', label: 'Vendor Management' },
     { path: '/settings', label: 'Business Settings' },
     { path: '/reports', label: 'Business Reports' },
     { path: '/financial', label: 'Financial Overview' }
   ];
   ```

3. **Manager Navigation**
   ```typescript
   const managerRoutes = [
     { path: '/branch/dashboard', label: 'Branch Dashboard' },
     { path: '/inventory', label: 'Inventory' },
     { path: '/staff-schedule', label: 'Staff Schedule' },
     { path: '/sales', label: 'Sales Management' },
     { path: '/reports/branch', label: 'Branch Reports' },
     { path: '/customers', label: 'Customer Service' }
   ];
   ```

4. **Cashier Navigation**
   ```typescript
   const cashierRoutes = [
     { path: '/pos', label: 'Point of Sale' },
     { path: '/inventory/view', label: 'View Inventory' },
     { path: '/sales/history', label: 'Sales History' },
     { path: '/customers/basic', label: 'Customer Info' }
   ];
   ```

5. **Vendor Navigation**
   ```typescript
   const vendorRoutes = [
     { path: '/vendor/dashboard', label: 'Vendor Dashboard' },
     { path: '/vendor/products', label: 'My Products' },
     { path: '/vendor/sales', label: 'Sales Overview' },
     { path: '/vendor/commission', label: 'Commission Reports' },
     { path: '/vendor/inventory', label: 'Stock Management' }
   ];
   ```

### Role-Based Component Access

1. **Protected Route Component**
   ```typescript
   interface ProtectedRouteProps {
     requiredRole: Role | Role[];
     requiredCapabilities?: string[];
     businessCodeMatch?: boolean;
     branchNameMatch?: boolean;
   }

   const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
     requiredRole,
     requiredCapabilities = [],
     businessCodeMatch = false,
     branchNameMatch = false,
     children
   }) => {
     const user = useUser();
     const location = useLocation();
     
     // Role validation
     if (!hasRequiredRole(user.role, requiredRole)) {
       return <Navigate to="/unauthorized" state={{ from: location }} />;
     }
     
     // Capability validation
     if (!hasRequiredCapabilities(user.capabilities, requiredCapabilities)) {
       return <Navigate to="/unauthorized" state={{ from: location }} />;
     }
     
     // Business context validation
     if (businessCodeMatch && !validateBusinessContext(user, location)) {
       return <Navigate to="/unauthorized" state={{ from: location }} />;
     }
     
     // Branch context validation
     if (branchNameMatch && !validateBranchContext(user, location)) {
       return <Navigate to="/unauthorized" state={{ from: location }} />;
     }
     
     return <>{children}</>;
   };
   ```

2. **Conditional Rendering**
   ```typescript
   interface RoleGuardProps {
     allowedRoles: Role[];
     children: React.ReactNode;
   }

   const RoleGuard: React.FC<RoleGuardProps> = ({ 
     allowedRoles, 
     children 
   }) => {
     const user = useUser();
     
     if (!allowedRoles.includes(user.role)) {
       return null;
     }
     
     return <>{children}</>;
   };
   ```

### Role-Based Features

1. **Admin Features**
   ```typescript
   const AdminPanel = () => {
     return (
       <RoleGuard allowedRoles={['admin']}>
         <div>
           <BusinessManagement />
           <UserManagement />
           <SystemSettings />
           <AuditLogs />
         </div>
       </RoleGuard>
     );
   };
   ```

2. **Owner Features**
   ```typescript
   const OwnerDashboard = () => {
     return (
       <RoleGuard allowedRoles={['owner']}>
         <div>
           <BusinessOverview />
           <BranchManagement />
           <VendorManagement />
           <FinancialReports />
         </div>
       </RoleGuard>
     );
   };
   ```

3. **Manager Features**
   ```typescript
   const BranchManagement = () => {
     return (
       <RoleGuard allowedRoles={['manager']}>
         <div>
           <InventoryControl />
           <StaffScheduling />
           <DailySales />
           <CustomerService />
         </div>
       </RoleGuard>
     );
   };
   ```

4. **Cashier Features**
   ```typescript
   const POSSystem = () => {
     return (
       <RoleGuard allowedRoles={['cashier', 'manager']}>
         <div>
           <SalesInterface />
           <ProductScanner />
           <PaymentProcessor />
           <ReceiptPrinter />
         </div>
       </RoleGuard>
     );
   };
   ```

5. **Vendor Features**
   ```typescript
   const VendorPortal = () => {
     return (
       <RoleGuard allowedRoles={['vendor']}>
         <div>
           <ProductManagement />
           <SalesTracking />
           <CommissionReports />
           <InventoryUpdates />
         </div>
       </RoleGuard>
     );
   };
   ```

### Role-Based Actions

1. **Action Permission Matrix**
   ```typescript
   const actionPermissions = {
     'create_product': ['admin', 'owner', 'manager'],
     'delete_product': ['admin', 'owner'],
     'update_price': ['admin', 'owner', 'manager'],
     'view_reports': ['admin', 'owner', 'manager'],
     'process_refund': ['admin', 'owner', 'manager'],
     'void_transaction': ['admin', 'owner'],
     'manage_users': ['admin', 'owner'],
     'update_inventory': ['admin', 'owner', 'manager', 'vendor']
   } as const;
   ```

2. **Action Button Component**
   ```typescript
   interface ActionButtonProps {
     action: keyof typeof actionPermissions;
     onAction: () => void;
   }

   const ActionButton: React.FC<ActionButtonProps> = ({
     action,
     onAction
   }) => {
     const user = useUser();
     const allowed = actionPermissions[action].includes(user.role);
     
     if (!allowed) return null;
     
     return (
       <button 
         onClick={onAction}
         className="action-button"
       >
         {action}
       </button>
     );
   };
   ```

### Role-Based Settings

1. **Settings Access**
   ```typescript
   const settingsAccess = {
     system: ['admin'],
     business: ['admin', 'owner'],
     branch: ['admin', 'owner', 'manager'],
     pos: ['admin', 'owner', 'manager', 'cashier'],
     vendor: ['admin', 'owner', 'vendor']
   } as const;
   ```

2. **Settings Component**
   ```typescript
   interface SettingsSectionProps {
     section: keyof typeof settingsAccess;
   }

   const SettingsSection: React.FC<SettingsSectionProps> = ({
     section
   }) => {
     const user = useUser();
     const allowed = settingsAccess[section].includes(user.role);
     
     if (!allowed) return null;
     
     return (
       <div className="settings-section">
         {/* Section specific settings */}
       </div>
     );
   };
   ```

## Common Pitfalls & Solutions

1. **Vendor Product Management**
   - Issue: Missing vendor names
   - Solution: Use business_name_of_product from products table

2. **Image Display**
   - Issue: Missing images
   - Solution: Added fallback icon and error handling

3. **Product Search**
   - Issue: Case sensitivity
   - Solution: Implemented case-insensitive search

## Best Practices

1. **Code Organization**
   - Separate business logic
   - Type safety
   - Clear interfaces
   - Proper error handling

2. **UI Design**
   - Consistent spacing
   - Responsive layouts
   - Error states
   - Loading states

3. **Data Management**
   - Proper validation
   - Safe updates
   - Efficient queries
   - Clear relationships

## Future Development Areas

### 1. Enhanced Vendor Features
- Vendor-specific discounts
- Advanced commission rules
- Vendor performance analytics
- Automated settlements

### 2. Stock Management
- Real-time stock alerts
- Automated reordering
- Stock transfer between branches
- Batch stock updates

### 3. Reporting
- Vendor performance reports
- Commission summaries
- Stock movement analysis
- Sales trends by vendor

### 4. UI/UX Improvements
- Bulk product operations
- Advanced search filters
- Custom product views
- Quick action shortcuts

## Maintenance Tasks

### 1. Regular Checks
- Verify commission calculations
- Validate stock accuracy
- Check vendor assignments
- Monitor transaction logs

### 2. Data Cleanup
- Archive old transactions
- Clean up rejected products
- Update vendor assignments
- Verify business relationships

### 3. Performance Monitoring
- Query performance
- Stock update speed
- Commission calculation time
- UI responsiveness

## Documentation Standards

### 1. Code Comments
```typescript
/**
 * Process vendor product transaction
 * @param {string} vendorId - Vendor's business code
 * @param {Product[]} products - List of products in transaction
 * @param {BusinessSettings} settings - Current business settings
 * @returns {TransactionResult} Processed transaction with commissions
 */
```

### 2. Type Definitions
```typescript
// Always define clear interfaces
interface VendorProduct extends Product {
  vendorId: string;
  commission: number;
  approvalStatus: 'pending' | 'approved' | 'rejected';
}
```

### 3. Error Messages
```typescript
// Use descriptive error messages
throw new Error(`Invalid vendor assignment: ${vendorId} for business: ${businessCode}`);
```

## Testing Guidelines

### 1. Commission Tests
```typescript
describe('Commission Calculation', () => {
  test('applies minimum commission amount', () => {
    // Test commission threshold
  });
  test('handles vendor commission settings', () => {
    // Test vendor-specific rules
  });
});
```

### 2. Stock Updates
```typescript
describe('Stock Management', () => {
  test('prevents negative stock', () => {
    // Test stock validation
  });
  test('handles concurrent updates', () => {
    // Test race conditions
  });
});
```

### 3. Vendor Operations
```typescript
describe('Vendor Product Management', () => {
  test('requires approval for new products', () => {
    // Test approval workflow
  });
  test('validates vendor assignments', () => {
    // Test business relationships
  });
});
```

## Common Issues & Solutions

1. **Vendor Product Display**
   - Issue: Missing vendor names
   - Solution: Use business_name_of_product from products table

2. **Image Display**
   - Issue: Missing images
   - Solution: Added fallback icon and error handling

3. **Product Search**
   - Issue: Case sensitivity
   - Solution: Implemented case-insensitive search

## Performance Considerations

### 1. Query Optimization
```typescript
// Good: Specific column selection
.select(`
  product_id,
  product_name,
  price,
  quantity
`)

// Bad: Select all columns
.select('*')
```

### 2. Batch Operations
```typescript
// Good: Batch stock updates
const updates = products.map(p => ({
  product_id: p.id,
  quantity_change: -p.quantity
}));
await supabase.rpc('batch_update_quantities', { updates });

// Bad: Individual updates
for (const product of products) {
  await updateQuantity(product);
}
```

### 3. Client-Side Caching
```typescript
// Good: Cache vendor data
const vendorCache = new Map<string, VendorData>();
const getVendorData = async (vendorId: string) => {
  if (vendorCache.has(vendorId)) {
    return vendorCache.get(vendorId);
  }
  // ... fetch and cache
};
```

## Security Best Practices

### 1. Business Code Validation
```typescript
// Always validate business context
const validateBusinessAccess = (userBusinessCode: string, targetBusinessCode: string) => {
  if (userBusinessCode !== targetBusinessCode) {
    throw new Error('Unauthorized business access');
  }
};
```

### 2. Branch Access
```typescript
// Check branch access before operations
const validateBranchAccess = async (
  businessCode: string,
  branchName: string
) => {
  const { data } = await supabase
    .from('branch_access')
    .select('access_level')
    .match({ business_code: businessCode, branch_name: branchName })
    .single();
  return data?.access_level || 'none';
};
```

### 3. Vendor Permissions
```typescript
// Validate vendor operations
const validateVendorOperation = (
  operation: 'read' | 'write',
  vendorId: string,
  businessCode: string
) => {
  // Check vendor assignment and permissions
};
```

## Future Development Areas

### 1. Enhanced Vendor Features
- Vendor-specific discounts
- Advanced commission rules
- Vendor performance analytics
- Automated settlements

### 2. Stock Management
- Real-time stock alerts
- Automated reordering
- Stock transfer between branches
- Batch stock updates

### 3. Reporting
- Vendor performance reports
- Commission summaries
- Stock movement analysis
- Sales trends by vendor

### 4. UI/UX Improvements
- Bulk product operations
- Advanced search filters
- Custom product views
- Quick action shortcuts

## Maintenance Tasks

### 1. Regular Checks
- Verify commission calculations
- Validate stock accuracy
- Check vendor assignments
- Monitor transaction logs

### 2. Data Cleanup
- Archive old transactions
- Clean up rejected products
- Update vendor assignments
- Verify business relationships

### 3. Performance Monitoring
- Query performance
- Stock update speed
- Commission calculation time
- UI responsiveness

## Documentation Standards

### 1. Code Comments
```typescript
/**
 * Process vendor product transaction
 * @param {string} vendorId - Vendor's business code
 * @param {Product[]} products - List of products in transaction
 * @param {BusinessSettings} settings - Current business settings
 * @returns {TransactionResult} Processed transaction with commissions
 */
```

### 2. Type Definitions
```typescript
// Always define clear interfaces
interface VendorProduct extends Product {
  vendorId: string;
  commission: number;
  approvalStatus: 'pending' | 'approved' | 'rejected';
}
```

### 3. Error Messages
```typescript
// Use descriptive error messages
throw new Error(`Invalid vendor assignment: ${vendorId} for business: ${businessCode}`);
```

## Testing Guidelines

### 1. Commission Tests
```typescript
describe('Commission Calculation', () => {
  test('applies minimum commission amount', () => {
    // Test commission threshold
  });
  test('handles vendor commission settings', () => {
    // Test vendor-specific rules
  });
});
```

### 2. Stock Updates
```typescript
describe('Stock Management', () => {
  test('prevents negative stock', () => {
    // Test stock validation
  });
  test('handles concurrent updates', () => {
    // Test race conditions
  });
});
```

### 3. Vendor Operations
```typescript
describe('Vendor Product Management', () => {
  test('requires approval for new products', () => {
    // Test approval workflow
  });
  test('validates vendor assignments', () => {
    // Test business relationships
  });
});
```

## Common Issues & Solutions

1. **Vendor Product Display**
   - Issue: Missing vendor names
   - Solution: Use business_name_of_product from products table

2. **Image Display**
   - Issue: Missing images
   - Solution: Added fallback icon and error handling

3. **Product Search**
   - Issue: Case sensitivity
   - Solution: Implemented case-insensitive search

## Performance Considerations

### 1. Query Optimization
```typescript
// Good: Specific column selection
.select(`
  product_id,
  product_name,
  price,
  quantity
`)

// Bad: Select all columns
.select('*')
```

### 2. Batch Operations
```typescript
// Good: Batch stock updates
const updates = products.map(p => ({
  product_id: p.id,
  quantity_change: -p.quantity
}));
await supabase.rpc('batch_update_quantities', { updates });

// Bad: Individual updates
for (const product of products) {
  await updateQuantity(product);
}
```

### 3. Client-Side Caching
```typescript
// Good: Cache vendor data
const vendorCache = new Map<string, VendorData>();
const getVendorData = async (vendorId: string) => {
  if (vendorCache.has(vendorId)) {
    return vendorCache.get(vendorId);
  }
  // ... fetch and cache
};
```

## Security Best Practices

### 1. Business Code Validation
```typescript
// Always validate business context
const validateBusinessAccess = (userBusinessCode: string, targetBusinessCode: string) => {
  if (userBusinessCode !== targetBusinessCode) {
    throw new Error('Unauthorized business access');
  }
};
```

### 2. Branch Access
```typescript
// Check branch access before operations
const validateBranchAccess = async (
  businessCode: string,
  branchName: string
) => {
  const { data } = await supabase
    .from('branch_access')
    .select('access_level')
    .match({ business_code: businessCode, branch_name: branchName })
    .single();
  return data?.access_level || 'none';
};
```

### 3. Vendor Permissions
```typescript
// Validate vendor operations
const validateVendorOperation = (
  operation: 'read' | 'write',
  vendorId: string,
  businessCode: string
) => {
  // Check vendor assignment and permissions
};
```

## Future Development Areas

### 1. Enhanced Vendor Features
- Vendor-specific discounts
- Advanced commission rules
- Vendor performance analytics
- Automated settlements

### 2. Stock Management
- Real-time stock alerts
- Automated reordering
- Stock transfer between branches
- Batch stock updates

### 3. Reporting
- Vendor performance reports
- Commission summaries
- Stock movement analysis
- Sales trends by vendor

### 4. UI/UX Improvements
- Bulk product operations
- Advanced search filters
- Custom product views
- Quick action shortcuts

## Maintenance Tasks

### 1. Regular Checks
- Verify commission calculations
- Validate stock accuracy
- Check vendor assignments
- Monitor transaction logs

### 2. Data Cleanup
- Archive old transactions
- Clean up rejected products
- Update vendor assignments
- Verify business relationships

### 3. Performance Monitoring
- Query performance
- Stock update speed
- Commission calculation time
- UI responsiveness

## Documentation Standards

### 1. Code Comments
```typescript
/**
 * Process vendor product transaction
 * @param {string} vendorId - Vendor's business code
 * @param {Product[]} products - List of products in transaction
 * @param {BusinessSettings} settings - Current business settings
 * @returns {TransactionResult} Processed transaction with commissions
 */
```

### 2. Type Definitions
```typescript
// Always define clear interfaces
interface VendorProduct extends Product {
  vendorId: string;
  commission: number;
  approvalStatus: 'pending' | 'approved' | 'rejected';
}
```

### 3. Error Messages
```typescript
// Use descriptive error messages
throw new Error(`Invalid vendor assignment: ${vendorId} for business: ${businessCode}`);
```

## Testing Guidelines

### 1. Commission Tests
```typescript
describe('Commission Calculation', () => {
  test('applies minimum commission amount', () => {
    // Test commission threshold
  });
  test('handles vendor commission settings', () => {
    // Test vendor-specific rules
  });
});
```

### 2. Stock Updates
```typescript
describe('Stock Management', () => {
  test('prevents negative stock', () => {
    // Test stock validation
  });
  test('handles concurrent updates', () => {
    // Test race conditions
  });
});
```

### 3. Vendor Operations
```typescript
describe('Vendor Product Management', () => {
  test('requires approval for new products', () => {
    // Test approval workflow
  });
  test('validates vendor assignments', () => {
    // Test business relationships
  });
});
```

## Common Issues & Solutions

1. **Vendor Product Display**
   - Issue: Missing vendor names
   - Solution: Use business_name_of_product from products table

2. **Image Display**
   - Issue: Missing images
   - Solution: Added fallback icon and error handling

3. **Product Search**
   - Issue: Case sensitivity
   - Solution: Implemented case-insensitive search

```
