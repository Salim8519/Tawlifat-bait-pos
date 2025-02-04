-- Add long_text_receipt column to receipts table
ALTER TABLE receipts
ADD COLUMN long_text_receipt TEXT;

-- Create index for better text search performance
CREATE INDEX idx_receipts_text ON receipts USING GIN (to_tsvector('english', COALESCE(long_text_receipt, '')));

-- Update RLS policies to include the new column
DROP POLICY IF EXISTS "Users can view their own receipts" ON receipts;
CREATE POLICY "Users can view their own receipts"
ON receipts
FOR SELECT
TO authenticated
USING (
    business_code IN (
        SELECT business_code 
        FROM profiles 
        WHERE auth.uid() = user_id
    )
);

-- Add function to search receipts by text
CREATE OR REPLACE FUNCTION search_receipts(
    search_text TEXT,
    business_code_param TEXT
) RETURNS SETOF receipts
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT *
    FROM receipts
    WHERE business_code = business_code_param
    AND to_tsvector('english', COALESCE(long_text_receipt, '')) @@ to_tsquery('english', search_text)
    ORDER BY receipt_date DESC;
$$;