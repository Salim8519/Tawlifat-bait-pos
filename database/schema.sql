-- Drop existing types if they exist
DROP TYPE IF EXISTS user_role;
DROP TYPE IF EXISTS user_status;

-- Create enum types
CREATE TYPE user_role AS ENUM ('super_admin', 'owner', 'sub_vendor', 'cashier');
CREATE TYPE user_status AS ENUM ('active', 'inactive');

-- Drop existing table if it exists
DROP TABLE IF EXISTS users;

-- Create a simpler users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role user_role NOT NULL,
    status user_status DEFAULT 'active',
    parent_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert demo users
INSERT INTO users (username, password, role) VALUES
-- Super Admin
('admin', 'Admin123!', 'super_admin'),

-- Store Owner
('owner1', 'Owner123!', 'owner'),

-- Sub-vendor (linked to owner1)
('vendor1', 'Vendor123!', 'sub_vendor'),

-- Cashier (linked to owner1)
('cashier1', 'Cashier123!', 'cashier');

-- Link sub-vendor and cashier to owner1
DO $$ 
DECLARE
    owner_id UUID;
BEGIN
    SELECT id INTO owner_id FROM users WHERE username = 'owner1';
    
    UPDATE users 
    SET parent_id = owner_id 
    WHERE username IN ('vendor1', 'cashier1');
END $$;