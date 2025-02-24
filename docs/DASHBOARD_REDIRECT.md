# Dashboard Redirection Logic

## Purpose
All authenticated users are redirected to `/dashboard` to ensure role-appropriate access and immediate functionality. This serves as the application's command center, providing tailored experiences based on user roles.

## Implementation
- Administrative Users (admin & super_admin) → AdminOwnersPage (system-wide management)
- Vendor → SubVendorDashboardPage (product/sales tracking)
- Regular Users → DashboardPage (business metrics)

## Key Benefits
1. **Security**: Enforces authentication and role-based access
2. **UX**: Immediate access to relevant tools and data
3. **Architecture**: Consistent routing and data loading patterns
4. **Business Logic**: Automatic loading of critical business context

## Dashboard Redirection Forces

### Dashboard Components
Each role in the system has its own dedicated dashboard component, ensuring separation of concerns and role-specific functionality:

1. **Administrative Dashboard** (`AdminOwnersPage`)
   - Used by both admin and super_admin roles
   - Focused on system-wide management
   - Independent of other dashboards
   - Full access to administrative features

2. **Vendor Dashboard** (`SubVendorDashboardPage`)
   - Specific to vendor role
   - Product and sales management focused
   - Separate implementation from other dashboards
   - Vendor-specific features and metrics

3. **Standard Dashboard** (`DashboardPage`)
   - Used by regular roles (owner, cashier, etc.)
   - Business operations focused
   - Role-specific access restrictions
   - Business metrics and daily operations

These components are completely independent, meaning:
- Changes to one dashboard don't affect others
- Each has its own state management
- UI/UX tailored to role needs
- Separate routing and access control

### Technical Forces
1. **State Initialization**
   - Business settings must be loaded (useBusinessSettings hook)
   - User profile and permissions need initialization
   - Business code context must be established

2. **Security Requirements**
   - Authentication state verification
   - Business code validation
   - Role-based access control initialization
   - Settings validation before access

3. **Application Architecture**
   - Centralized state management through stores
   - Persistent auth state (zustand persist)
   - Role-based component rendering
   - Protected route wrapper enforcement

### Business Logic Forces
1. **User Context**
   - Role determines dashboard component
   - Business code sets data access scope
   - Branch assignments affect operations
   - Settings configure system behavior

2. **Data Flow**
   - Initial data loading requirements
   - Business settings dependencies
   - Role-specific data access patterns
   - Real-time monitoring initialization

### Role-Specific Forces

### Administrative Roles (admin & super_admin)
1. **Route Resolution Chain**
   ```
   / → /dashboard → AdminOwnersPage
   ```
   - Root path triggers initial redirect
   - Role check identifies administrative status
   - AdminOwnersPage loaded exclusively for admin users

2. **Validation Steps**
   - User authentication check
   - Role verification (admin/super_admin)
   - Business settings validation
   - Access permissions verification

3. **Component Loading**
   - DashboardLayout wrapper
   - AdminOwnersPage component
   - Required admin services
   - System-wide monitoring

4. **Access Control**
   - No business_code filtering
   - Full system access rights
   - Global data visibility
   - Complete management capabilities

The forced redirection to `/dashboard` ensures all these requirements are met before allowing user interaction with the system. The separation of dashboard components ensures that each role gets a tailored experience without affecting other roles' functionality.

The dashboard redirection and component separation are core to maintaining security while providing role-specific functionality and immediate access to business-critical information.
