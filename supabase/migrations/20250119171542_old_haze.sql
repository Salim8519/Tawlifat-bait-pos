/*
  # Fix vendor profile relationship

  1. Changes
    - Drop existing foreign key if exists
    - Create proper foreign key relationship between vendor_assignments and profiles
    - Add indexes for performance
    - Update RLS policies

  2. Security
    - Maintain existing RLS policies
    - Add policy for profile access
*/

-- Drop existing foreign key if it exists
ALTER TABLE vendor_assignments 
DROP CONSTRAINT IF EXISTS fk_vendor_assignments_profiles;

-- Add indexes for better join performance
CREATE INDEX IF NOT EXISTS idx_vendor_assignments_vendor_email 
ON vendor_assignments(vendor_email_identifier);

CREATE INDEX IF NOT EXISTS idx_profiles_email 
ON profiles(his_email);

-- Add foreign key constraint using email as the join key
ALTER TABLE vendor_assignments
ADD CONSTRAINT fk_vendor_assignments_profiles
FOREIGN KEY (vendor_email_identifier)
REFERENCES profiles(his_email)
ON DELETE RESTRICT
ON UPDATE CASCADE
DEFERRABLE INITIALLY DEFERRED;

-- Update RLS policies
DROP POLICY IF EXISTS "Allow vendor assignments access" ON vendor_assignments;

CREATE POLICY "Allow vendor assignments access"
ON vendor_assignments
FOR SELECT
TO authenticated
USING (
  owner_business_code = auth.jwt()->>'business_code' OR
  vendor_email_identifier IN (
    SELECT his_email 
    FROM profiles 
    WHERE auth.uid() = user_id
  )
);