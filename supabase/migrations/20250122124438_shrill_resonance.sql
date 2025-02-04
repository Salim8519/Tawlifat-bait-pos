-- Drop existing coupons table if it exists
DROP TABLE IF EXISTS coupons;

-- Recreate coupons table with proper ID generation
CREATE TABLE coupons (
    coupon_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_code TEXT NOT NULL REFERENCES profiles(business_code),
    coupon_code TEXT NOT NULL UNIQUE,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('fixed', 'percentage')),
    discount_value NUMERIC NOT NULL,
    number_of_uses INT DEFAULT 0,
    max_uses INT DEFAULT 0,
    expiry_date DATE,
    min_purchase_amount NUMERIC DEFAULT 0,
    max_purchase_amount NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_coupons_business_code ON coupons(business_code);
CREATE INDEX idx_coupons_coupon_code ON coupons(coupon_code);

-- Enable RLS
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own coupons"
ON coupons
FOR SELECT
TO authenticated
USING (
    business_code IN (
        SELECT business_code 
        FROM profiles 
        WHERE auth.uid() = user_id
    )
);

CREATE POLICY "Users can insert their own coupons"
ON coupons
FOR INSERT
TO authenticated
WITH CHECK (
    business_code IN (
        SELECT business_code 
        FROM profiles 
        WHERE auth.uid() = user_id
    )
);

CREATE POLICY "Users can update their own coupons"
ON coupons
FOR UPDATE
TO authenticated
USING (
    business_code IN (
        SELECT business_code 
        FROM profiles 
        WHERE auth.uid() = user_id
    )
)
WITH CHECK (
    business_code IN (
        SELECT business_code 
        FROM profiles 
        WHERE auth.uid() = user_id
    )
);

CREATE POLICY "Users can delete their own coupons"
ON coupons
FOR DELETE
TO authenticated
USING (
    business_code IN (
        SELECT business_code 
        FROM profiles 
        WHERE auth.uid() = user_id
    )
);

-- Create function to increment coupon usage
CREATE OR REPLACE FUNCTION increment_coupon_usage(coupon_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE coupons
    SET number_of_uses = number_of_uses + 1
    WHERE coupon_id = coupon_id_param;
END;
$$;