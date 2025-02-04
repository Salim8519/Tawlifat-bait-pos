-- Create payment method enum type
CREATE TYPE payment_method AS ENUM ('cash', 'card', 'online');

-- Modify receipts table to use the enum
ALTER TABLE receipts 
ALTER COLUMN payment_method TYPE payment_method 
USING payment_method::payment_method;