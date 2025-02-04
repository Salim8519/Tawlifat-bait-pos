-- First, enable RLS on the profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "admin_full_access" ON profiles;
DROP POLICY IF EXISTS "manager_owner_read_access" ON profiles;
DROP POLICY IF EXISTS "manager_owner_insert_cashiers" ON profiles;
DROP POLICY IF EXISTS "manager_owner_update_cashiers" ON profiles;
DROP POLICY IF EXISTS "users_read_own_profile" ON profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON profiles;

-- Create a function to get user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role 
    FROM profiles 
    WHERE user_id = auth.uid() 
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get user's business_code
CREATE OR REPLACE FUNCTION get_user_business_code()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT business_code 
    FROM profiles 
    WHERE user_id = auth.uid() 
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Users can always read their own profile
CREATE POLICY "users_read_own_profile"
ON profiles
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
);

-- 2. Admin can do anything
CREATE POLICY "admin_full_access"
ON profiles
FOR ALL
TO authenticated
USING (
  get_user_role() = 'admin'
);

-- 3. Managers and Owners can read profiles
CREATE POLICY "manager_owner_read_access"
ON profiles
FOR SELECT
TO authenticated
USING (
  (get_user_role() IN ('manager', 'owner') AND (
    -- Can read same business_code profiles
    business_code = get_user_business_code()
    OR
    -- Can read any vendor profile
    is_vendor = true
  ))
);

-- 4. Managers and Owners can insert new profiles
CREATE POLICY "manager_owner_insert_profiles"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (
  get_user_role() IN ('manager', 'owner') AND
  (
    -- For cashiers, must match business_code
    (role = 'cashier' AND business_code = get_user_business_code())
    OR
    -- For vendors, allow any business_code
    (role = 'vendor' AND is_vendor = true)
  )
);

-- 5. Managers and Owners can update profiles
CREATE POLICY "manager_owner_update_profiles"
ON profiles
FOR UPDATE
TO authenticated
USING (
  get_user_role() IN ('manager', 'owner') AND
  (
    -- Can update cashiers from same business
    (role = 'cashier' AND business_code = get_user_business_code())
    OR
    -- Can update vendors
    is_vendor = true
  )
);

-- 6. Users can update their own non-sensitive fields
CREATE POLICY "users_update_own_profile"
ON profiles
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
)
WITH CHECK (
  -- Can't change sensitive fields
  user_id = auth.uid() AND
  role = (SELECT role FROM profiles WHERE user_id = auth.uid()) AND
  business_code = (SELECT business_code FROM profiles WHERE user_id = auth.uid())
);
