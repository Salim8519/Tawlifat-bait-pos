/*
  # Create unified products table
  
  1. New Tables
    - `products` table with all product information including:
      - Basic product details (name, type, price, etc)
      - Inventory tracking
      - Approval workflow
      - Business and branch association
      
  2. Features
    - Supports both regular and upcoming products
    - Tracks product status and approval
    - Maintains business context
    - Enables product tracking
*/

-- Create product type enum
CREATE TYPE product_type AS ENUM ('food', 'non-food');
CREATE TYPE product_page AS ENUM ('upcoming_products', 'products');

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  product_id SERIAL PRIMARY KEY,
  product_name TEXT NOT NULL,
  type product_type NOT NULL,
  current_page product_page NOT NULL DEFAULT 'upcoming_products',
  expiry_date DATE,
  quantity INTEGER NOT NULL DEFAULT 0,
  price INTEGER NOT NULL,
  barcode TEXT UNIQUE,
  image_url TEXT,
  description TEXT,
  trackable BOOLEAN NOT NULL DEFAULT false,
  business_code_of_owner TEXT NOT NULL,
  business_code_if_vendor TEXT,
  branch_name TEXT,
  accepted BOOLEAN NOT NULL DEFAULT false,
  date_of_acception_or_rejection TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  date_of_creation TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for common queries
CREATE INDEX idx_products_business_code_of_owner ON products(business_code_of_owner);
CREATE INDEX idx_products_current_page ON products(current_page);
CREATE INDEX idx_products_accepted ON products(accepted);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view products for their business"
  ON products
  FOR SELECT
  USING (
    business_code_of_owner = auth.jwt()->>'business_code' OR
    business_code_if_vendor = auth.jwt()->>'business_code'
  );

CREATE POLICY "Owners can insert products"
  ON products
  FOR INSERT
  WITH CHECK (
    business_code_of_owner = auth.jwt()->>'business_code' OR
    business_code_if_vendor = auth.jwt()->>'business_code'
  );

CREATE POLICY "Users can update their own products"
  ON products
  FOR UPDATE
  USING (
    business_code_of_owner = auth.jwt()->>'business_code' OR
    business_code_if_vendor = auth.jwt()->>'business_code'
  );