/*
  # Add foreign key relationship between products and profiles tables

  1. Changes
    - Add foreign key constraint from products.business_code_of_owner to profiles.business_code
    - Add index on profiles.business_code for better join performance

  2. Notes
    - This enables joining products with profiles to get business names
    - The business_code column in profiles is used as the reference
*/

-- Add index on business_code in profiles table
CREATE INDEX IF NOT EXISTS idx_profiles_business_code ON profiles(business_code);

-- Add foreign key constraint
ALTER TABLE products
ADD CONSTRAINT fk_products_profiles
FOREIGN KEY (business_code_of_owner) 
REFERENCES profiles(business_code);

-- Update RLS policy to allow joining with profiles
CREATE POLICY "Allow joining with profiles"
ON profiles
FOR SELECT
TO authenticated
USING (true);