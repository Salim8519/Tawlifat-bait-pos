# Admin Owners Page Documentation

## Overview
The Admin Owners Page manages and displays business owners and vendors in the system. It provides filtering, searching, and viewing capabilities for user profiles.

## Data Flow

1. **Data Fetching**
   - Uses `useProfiles` hook to fetch profiles from Supabase
   - Handles loading and error states automatically
   - Fetches all profile data in a single query

2. **State Management**
   - `searchQuery`: Text-based search input
   - `roleFilter`: Selected role filter
   - `vendorFilter`: Vendor/Non-vendor filter
   - `showAddModal`: Controls add owner modal visibility

3. **Filtering Logic**
   ```typescript
   profiles → searchFilter → roleFilter → vendorFilter → display
   ```
   - Search filter checks:
     * Full name
     * Email
     * Business name
   - Role filter matches exact role
   - Vendor filter checks `is_vendor` status

4. **Business Name Display**
   - For vendors: Shows `vendor_business _name`
   - For regular users: Shows `business_name`
   - Falls back to "No business name" if empty

5. **User Interface Components**
   - Search bar with real-time filtering
   - Role dropdown (dynamically populated)
   - Vendor type dropdown (fixed options)
   - Data table with sortable columns
   - Add owner button with modal

## Component Hierarchy
```
AdminOwnersPage
├── SearchBar
├── FilterDropdown (Role)
├── FilterDropdown (Vendor Type)
└── DataTable
    └── TableRows
```

## Performance Considerations
- Uses `useMemo` for:
  * Filtered profiles list
  * Unique roles list
- Prevents unnecessary re-renders
- Efficient filtering without multiple passes

## Security
- Requires admin authentication
- Data fetched through secure Supabase client
- Role-based access control
- Protected routes

## Error Handling
- Loading state with spinner
- Error state with message
- Fallback values for missing data
- Graceful handling of null values

## Future Improvements
1. Add pagination for large datasets
2. Implement sorting by columns
3. Add bulk actions
4. Export data functionality
5. Advanced filtering options
