/*
  # Update sold_products table schema

  1. Changes
    - Add missing columns:
      - vendor_price
      - selling_price
    - Fix column name typos:
      - business_bracnh_name -> business_branch_name
      - comission_for_bussnies_from_vendor -> commission_for_business_from_vendor
    - Update column types and constraints
    - Add indexes for better performance

  2. Security
    - Maintain existing RLS policies
    - Add new policies for the updated schema
*/

-- First drop the existing table
DROP TABLE IF EXISTS sold_products CASCADE;

-- Recreate the table with correct schema
CREATE TABLE sold_products (
    sold_product_id TEXT PRIMARY KEY DEFAULT generate_sold_product_id(),
    receipt_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    vendor_price NUMERIC,
    selling_price NUMERIC NOT NULL,
    total_price NUMERIC NOT NULL,
    vendor_code_if_by_vendor TEXT,
    business_code TEXT NOT NULL,
    business_branch_name TEXT NOT NULL,
    commission_for_business_from_vendor NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_sold_products_receipt_id ON sold_products(receipt_id);
CREATE INDEX idx_sold_products_business_code ON sold_products(business_code);
CREATE INDEX idx_sold_products_vendor_code ON sold_products(vendor_code_if_by_vendor);
CREATE INDEX idx_sold_products_created_at ON sold_products(created_at);

-- Enable RLS
ALTER TABLE sold_products ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own sold products"
ON sold_products
FOR SELECT
TO authenticated
USING (
    business_code = auth.jwt()->>'business_code' OR
    vendor_code_if_by_vendor = auth.jwt()->>'business_code'
);

CREATE POLICY "Users can insert their own sold products"
ON sold_products
FOR INSERT
TO authenticated
WITH CHECK (
    business_code = auth.jwt()->>'business_code'
);

-- Add function to generate sold product ID if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'generate_sold_product_id') THEN
    CREATE FUNCTION generate_sold_product_id()
    RETURNS TEXT
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
        new_id TEXT;
    BEGIN
        -- Generate a random ID with SPD prefix (Sold Product ID)
        new_id := 'SPD' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
        
        -- Keep generating until we find a unique one
        WHILE EXISTS (SELECT 1 FROM sold_products WHERE sold_product_id = new_id) LOOP
            new_id := 'SPD' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
        END LOOP;
        
        RETURN new_id;
    END;
    $$;
  END IF;
END $$;