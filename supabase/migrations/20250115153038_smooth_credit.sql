/*
  # Fix products and profiles relationship

  1. Changes
    - Drop existing foreign key constraints if they exist
    - Add proper indexes for business codes
    - Add new foreign key constraints with proper ON DELETE/UPDATE behavior
    - Update RLS policies to handle relationships correctly

  2. Security
    - Maintain RLS policies for proper access control
    - Ensure data integrity with proper constraints
*/

-- First drop any existing foreign key constraints
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name IN ('fk_products_profiles', 'fk_products_owner_profile', 'fk_products_vendor_profile')
    AND table_name = 'products'
  ) THEN
    ALTER TABLE products 
    DROP CONSTRAINT IF EXISTS fk_products_profiles,
    DROP CONSTRAINT IF EXISTS fk_products_owner_profile,
    DROP CONSTRAINT IF EXISTS fk_products_vendor_profile;
  END IF;
END $$;

-- Add proper indexes for business codes if they don't exist
CREATE INDEX IF NOT EXISTS idx_products_owner_business_code 
ON products(business_code_of_owner);

CREATE INDEX IF NOT EXISTS idx_products_vendor_business_code 
ON products(business_code_if_vendor);

CREATE INDEX IF NOT EXISTS idx_profiles_business_code 
ON profiles(business_code);

-- Add new foreign key constraints with proper behavior
ALTER TABLE products
ADD CONSTRAINT fk_products_owner_profile
FOREIGN KEY (business_code_of_owner) 
REFERENCES profiles(business_code)
ON DELETE RESTRICT
ON UPDATE CASCADE
DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE products
ADD CONSTRAINT fk_products_vendor_profile
FOREIGN KEY (business_code_if_vendor) 
REFERENCES profiles(business_code)
ON DELETE RESTRICT
ON UPDATE CASCADE
DEFERRABLE INITIALLY DEFERRED;

-- Update RLS policies
DROP POLICY IF EXISTS "Allow products-profiles join for authenticated users" ON products;

CREATE POLICY "Allow products access for authenticated users"
ON products
FOR SELECT
TO authenticated
USING (
  business_code_of_owner IN (
    SELECT business_code 
    FROM profiles 
    WHERE auth.uid() = user_id
  ) OR
  business_code_if_vendor IN (
    SELECT business_code 
    FROM profiles 
    WHERE auth.uid() = user_id
  )
);