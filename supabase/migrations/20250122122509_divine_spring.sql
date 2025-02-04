-- Create business settings table
CREATE TABLE IF NOT EXISTS business_settings (
    setting_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_code_ TEXT NOT NULL,
    receipt_header TEXT,
    receipt_footer TEXT,
    url_logo_of_business TEXT,
    loyalty_system_enabled BOOLEAN DEFAULT FALSE,
    vendor_commission_enabled BOOLEAN DEFAULT FALSE,
    default_commission_rate NUMERIC DEFAULT 10,
    minimum_commission_amount NUMERIC DEFAULT 0,
    tax_enabled BOOLEAN DEFAULT FALSE,
    tax_rate NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for business code
CREATE INDEX IF NOT EXISTS idx_business_settings_business_code 
ON business_settings(business_code_);

-- Add foreign key constraint
ALTER TABLE business_settings
ADD CONSTRAINT fk_business_settings_profiles
FOREIGN KEY (business_code_)
REFERENCES profiles(business_code)
ON DELETE CASCADE
ON UPDATE CASCADE
DEFERRABLE INITIALLY DEFERRED;

-- Enable RLS
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Allow users to view their business settings"
ON business_settings
FOR SELECT
TO authenticated
USING (
  business_code_ IN (
    SELECT business_code 
    FROM profiles 
    WHERE auth.uid() = user_id
  )
);

CREATE POLICY "Allow users to update their business settings"
ON business_settings
FOR UPDATE
TO authenticated
USING (
  business_code_ IN (
    SELECT business_code 
    FROM profiles 
    WHERE auth.uid() = user_id
  )
)
WITH CHECK (
  business_code_ IN (
    SELECT business_code 
    FROM profiles 
    WHERE auth.uid() = user_id
  )
);

CREATE POLICY "Allow users to insert their business settings"
ON business_settings
FOR INSERT
TO authenticated
WITH CHECK (
  business_code_ IN (
    SELECT business_code 
    FROM profiles 
    WHERE auth.uid() = user_id
  )
);