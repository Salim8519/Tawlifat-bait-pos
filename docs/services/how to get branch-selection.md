# Branch Selection Logic

## Overview
The system automatically determines and selects the appropriate branch for users based on their role and assigned main branch.

## Technical Implementation

### 1. User Profile Loading
- During login, user profile is fetched from `profiles` table in Supabase
- Main branch is stored in `profiles.main_branch` field
- Profile data is loaded via `getProfile()` in `profileService.ts`

### 2. Auth Store Integration
```typescript
// User interface in useAuthStore
interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  businessCode: string;
  main_branch?: string;  // Optional main branch assignment
}
```

### 3. Branch Selection Flow
1. User logs in → Profile loaded with `main_branch`
2. `BranchPOSSelector` component checks:
   ```typescript
   if ((user?.role === 'cashier' || user?.role === 'manager') && user?.main_branch) {
     // Find and select assigned branch
   } else {
     // Default to first active branch
   }
   ```

### 4. Role-Specific Behavior
- **Cashiers**: Locked to their assigned branch
- **Managers**: Default to assigned branch but can switch
- **Other Roles**: Default to first active branch
