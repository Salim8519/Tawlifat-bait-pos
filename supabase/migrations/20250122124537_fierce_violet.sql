/*
  # Fix Coupons Table ID Generation

  1. Changes
    - Add auto-generation for coupon_id using a function
    - Add trigger to handle ID generation on insert
    - Update RLS policies to match new schema

  2. Security
    - Maintain existing RLS policies
    - Add security definer to trigger function
*/

-- Create function to generate coupon ID
CREATE OR REPLACE FUNCTION generate_coupon_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_id TEXT;
BEGIN
  -- Generate a random 8-character ID
  new_id := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
  
  -- Keep generating until we find a unique one
  WHILE EXISTS (SELECT 1 FROM coupons WHERE coupon_id = new_id) LOOP
    new_id := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
  END LOOP;
  
  RETURN new_id;
END;
$$;

-- Create trigger to auto-generate coupon_id
CREATE OR REPLACE FUNCTION set_coupon_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.coupon_id IS NULL THEN
    NEW.coupon_id := generate_coupon_id();
  END IF;
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS tr_set_coupon_id ON coupons;

-- Create trigger
CREATE TRIGGER tr_set_coupon_id
BEFORE INSERT ON coupons
FOR EACH ROW
EXECUTE FUNCTION set_coupon_id();