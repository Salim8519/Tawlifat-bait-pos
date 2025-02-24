# Tawliat Bait POS System Overview

## Project Introduction
Tawliat Bait POS is a comprehensive point-of-sale and business management system designed for multi-branch businesses and vendor marketplaces. At its core, the system serves multiple user roles with distinct capabilities:

- **System Administrators** oversee the entire platform, managing all businesses, users, and system-wide configurations
- **Business Owners** run their operations by managing branches, appointing managers and cashiers, and establishing vendor partnerships
- **Business Managers** handle daily operations, manage cashiers, and oversee branch-specific activities, similar to owners but cannot add new managers
- **Cashiers** operate the POS system, handle transactions, manage the cash drawer, and serve customers at their assigned branches
- **Vendors** operate as independent businesses, supplying products to multiple businesses and branches while maintaining their own identity and tracking commissions

The system emphasizes security through role-based access control, data isolation between businesses, and seamless integration between vendors and businesses, all while maintaining efficient branch operations and inventory management.

## System Architecture

### Role Hierarchy
```
Admin
  └─ All System Access
     └─ Manage all businesses and users

Business Owner
  ├─ Business Management
  │  ├─ Add/Manage Managers
  │  ├─ Add/Manage Cashiers
  │  └─ Add/Manage Branches
  └─ Vendor Management
     ├─ Invite Vendors
     └─ Create Vendor Accounts

Business Manager
  ├─ Business Operations
  │  ├─ Manage Cashiers
  │  └─ Manage Branches
  └─ Limited Business Settings

Cashier
  └─ Branch Operations
     ├─ POS Operations
     ├─ Cash Management
     └─ Customer Service

Vendor
  └─ Multi-Business Supply
     ├─ Product Management
     ├─ Branch-specific Supply
     └─ Commission Tracking
```

## Business Structure

### Business Entities
1. **Regular Business**
   - Unique business_code
   - Business name
   - Multiple branches possible
   - Hierarchical user structure

2. **Vendor Business**
   - Separate business_code_if_vendor
   - Can supply multiple businesses
   - Branch-specific assignments
   - Independent operation model

### Branch Management
- Each business can have multiple branches
- Users can be assigned to specific branches
- Vendors can be assigned to multiple branches across businesses
- Branch-specific inventory and operations

## Role Capabilities

### Administrative Role
- System-wide access and management
- User management across all businesses
- Business creation and configuration
- System settings and monitoring

### Business Owner Role
- Full business management
- User management within business:
  - Add/manage managers
  - Add/manage cashiers
  - Branch assignments
- Vendor relationships:
  - Create vendor accounts
  - Invite existing vendors
  - Manage vendor assignments
- Complete business settings access

### Business Manager Role
Similar to owner except:
- Cannot add new managers
- Full operational control
- Branch management
- Cashier management
- Inventory control
- Reporting access

### Cashier Role
- Limited to assigned branch
- POS operations
- Cash drawer management
- Basic customer management
- Sales and returns processing
- Receipt management

### Vendor Role
- Multi-business capability
- Product management
- Branch-specific supply
- Commission tracking
- Sales monitoring
- Independent business operation

## Data Relationships

### Business Identification
1. **Regular Business**
   ```
   business_code: Primary identifier
   branch_name: Branch identifier
   ```

2. **Vendor Business**
   ```
   business_code_if_vendor: Vendor identifier
   business_code_of_owner: Product ownership
   ```

### User Assignment
```
profiles
├── user_id
├── role
├── business_code
├── is_vendor
└── main_branch
```

### Vendor Assignments
```
vendor_assignments
├── vendor_business_code
├── assigned_business_code
└── assigned_branches
```

## Key Features

### Multi-Branch Support
- Independent branch operations
- Branch-specific inventory
- Cross-branch reporting
- Branch-level user assignment

### Vendor Integration
- Multi-business supply capability
- Branch-specific product assignment
- Commission tracking
- Independent vendor operations

### Role-Based Access
- Hierarchical permissions
- Branch-level restrictions
- Feature-specific access
- Data visibility control

### Business Operations
- POS system
- Inventory management
- Cash tracking
- Customer management
- Reporting and analytics
- Vendor space management

## Security Model

### Access Control
- Role-based permissions
- Business code validation
- Branch-level restrictions
- Feature-specific gates

### Data Isolation
- Business-specific data separation
- Branch-level data control
- Vendor data independence
- Cross-business vendor integration

## System Integration

### Business Workflow
1. Admin creates business
2. Owner sets up business structure
3. Managers handle operations
4. Cashiers process transactions
5. Vendors supply products

### Vendor Workflow
1. Vendor account creation
2. Business assignment
3. Branch-specific supply
4. Product management
5. Commission tracking
