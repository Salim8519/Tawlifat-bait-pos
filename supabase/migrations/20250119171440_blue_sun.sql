/*
  # Add vendor profile relationship

  1. Changes
    - Add foreign key relationship between vendor_assignments and profiles tables
    - Add index on vendor_business_code for better join performance
    - Update RLS policies to allow proper access

  2. Security
    - Maintain existing RLS policies
    - Add policy for profile access
*/

-- Add index for better join performance
CREATE INDEX IF NOT EXISTS idx_vendor_assignments_business_code 
ON vendor_assignments(vendor_business_code);

-- Add foreign key constraint
ALTER TABLE vendor_assignments
ADD CONSTRAINT fk_vendor_assignments_profiles
FOREIGN KEY (vendor_business_code)
REFERENCES profiles(business_code)
ON DELETE RESTRICT
ON UPDATE CASCADE
DEFERRABLE INITIALLY DEFERRED;

-- Update RLS policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow profiles access for authenticated users"
ON profiles
FOR SELECT
TO authenticated
USING (true);

-- Update vendor assignments RLS
DROP POLICY IF EXISTS "Allow vendor assignments access" ON vendor_assignments;

CREATE POLICY "Allow vendor assignments access"
ON vendor_assignments
FOR SELECT
TO authenticated
USING (
  owner_business_code = auth.jwt()->>'business_code' OR
  vendor_business_code IN (
    SELECT business_code 
    FROM profiles 
    WHERE auth.uid() = user_id
  )
);