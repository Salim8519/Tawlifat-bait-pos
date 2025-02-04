/*
  # Add relationship between products and profiles tables

  1. Changes
    - Add foreign key constraint from products to profiles
    - Add index on business_code in profiles
    - Add RLS policy for profiles access
    - Add RLS policy for products-profiles join

  2. Security
    - Enable RLS on profiles table
    - Add policy for authenticated users to read profiles
*/

-- Enable RLS on profiles if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Add index on business_code in profiles table if not exists
CREATE INDEX IF NOT EXISTS idx_profiles_business_code ON profiles(business_code);

-- Add foreign key constraint if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_products_profiles'
  ) THEN
    ALTER TABLE products
    ADD CONSTRAINT fk_products_profiles
    FOREIGN KEY (business_code_of_owner) 
    REFERENCES profiles(business_code);
  END IF;
END $$;

-- Add RLS policy for profiles access
CREATE POLICY "Allow profiles access for authenticated users"
ON profiles
FOR SELECT
TO authenticated
USING (true);

-- Update products RLS policy to allow joining with profiles
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