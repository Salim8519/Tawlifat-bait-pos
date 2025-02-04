/*
  # Fix products-profiles relationship

  1. Changes
    - Drop existing foreign key if exists
    - Create new foreign key relationship between products and profiles
    - Update RLS policies to handle the relationship properly

  2. Security
    - Maintain existing RLS policies
    - Add proper constraints for data integrity
*/

-- First drop the existing foreign key if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_products_profiles' 
    AND table_name = 'products'
  ) THEN
    ALTER TABLE products DROP CONSTRAINT fk_products_profiles;
  END IF;
END $$;

-- Add foreign key constraints with proper references
ALTER TABLE products
ADD CONSTRAINT fk_products_owner_profile
FOREIGN KEY (business_code_of_owner) 
REFERENCES profiles(business_code)
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE products
ADD CONSTRAINT fk_products_vendor_profile
FOREIGN KEY (business_code_if_vendor) 
REFERENCES profiles(business_code)
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- Update RLS policies to handle the relationships
DROP POLICY IF EXISTS "Allow products-profiles join for authenticated users" ON products;

CREATE POLICY "Allow products-profiles join for authenticated users"
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