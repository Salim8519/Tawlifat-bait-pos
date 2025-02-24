-- Create enum for payment status
CREATE TYPE tax_payment_status AS ENUM ('pending', 'paid', 'partially_paid', 'cancelled');

-- Create monthly tax history table
CREATE TABLE monthly_tax_history (
    id BIGSERIAL PRIMARY KEY,
    owner_business_code TEXT NOT NULL,
    vendor_business_code TEXT NOT NULL,
    branch_name TEXT NOT NULL,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    year INTEGER NOT NULL,
    tax_amount NUMERIC NOT NULL DEFAULT 0,
    payment_status tax_payment_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
   );

