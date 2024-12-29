-- Insert store owners
INSERT INTO users (
    username,
    password_hash,
    full_name,
    email,
    phone,
    role,
    status,
    store_name,
    store_location,
    permissions
) VALUES 
-- Store Owner 1
(
    'owner1',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6c7Q1ZpwLe', -- Owner123!
    'أحمد محمد',
    'ahmed@store.com',
    '96812345678',
    'owner',
    'active',
    'سوبرماركت السعادة',
    'مسقط، عمان',
    '{"can_manage_all": true}'
),
-- Store Owner 2
(
    'owner2',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6c7Q1ZpwLe', -- Owner123!
    'فاطمة علي',
    'fatima@store.com',
    '96887654321',
    'owner',
    'active',
    'متجر البركة',
    'صلالة، عمان',
    '{"can_manage_all": true}'
);

-- Get the IDs of the store owners for reference
WITH owner_ids AS (
    SELECT id, store_name FROM users WHERE role = 'owner'
)
-- Insert sub-vendors
INSERT INTO users (
    username,
    password_hash,
    full_name,
    email,
    phone,
    role,
    status,
    parent_id,
    rental_space,
    rental_amount,
    rental_due_date,
    rental_status,
    permissions
)
SELECT
    'vendor' || row_number() OVER () AS username,
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6c7Q1ZpwLe', -- Vendor123!
    CASE row_number() OVER ()
        WHEN 1 THEN 'علي سالم'
        WHEN 2 THEN 'محمد خالد'
        WHEN 3 THEN 'سعيد عبدالله'
        WHEN 4 THEN 'خالد أحمد'
    END AS full_name,
    'vendor' || row_number() OVER () || '@example.com' AS email,
    '9689' || (row_number() OVER () + 1000000) AS phone,
    'sub_vendor' AS role,
    'active' AS status,
    id AS parent_id,
    CASE row_number() OVER ()
        WHEN 1 THEN 'رف A1'
        WHEN 2 THEN 'ركن B2'
        WHEN 3 THEN 'رف C3'
        WHEN 4 THEN 'مساحة D4'
    END AS rental_space,
    CASE row_number() OVER ()
        WHEN 1 THEN 100
        WHEN 2 THEN 150
        WHEN 3 THEN 200
        WHEN 4 THEN 250
    END AS rental_amount,
    CURRENT_DATE + interval '1 month' AS rental_due_date,
    'paid' AS rental_status,
    '{"can_manage_products": true}'::jsonb AS permissions
FROM owner_ids
WHERE store_name = 'سوبرماركت السعادة'
LIMIT 4;

-- Insert cashiers
WITH owner_ids AS (
    SELECT id, store_name FROM users WHERE role = 'owner'
)
INSERT INTO users (
    username,
    password_hash,
    full_name,
    email,
    phone,
    role,
    status,
    parent_id,
    permissions
)
SELECT
    'cashier' || row_number() OVER () AS username,
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6c7Q1ZpwLe', -- Cashier123!
    CASE row_number() OVER ()
        WHEN 1 THEN 'فاطمة أحمد'
        WHEN 2 THEN 'نورة سالم'
        WHEN 3 THEN 'عائشة محمد'
        WHEN 4 THEN 'مريم خالد'
    END AS full_name,
    'cashier' || row_number() OVER () || '@example.com' AS email,
    '9687' || (row_number() OVER () + 1000000) AS phone,
    'cashier' AS role,
    'active' AS status,
    id AS parent_id,
    '{"can_process_sales": true}'::jsonb AS permissions
FROM owner_ids
LIMIT 4;