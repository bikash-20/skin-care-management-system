-- 010_create_views.sql
-- Useful SQL views for reporting.

-- View 1: Product catalog with category name
CREATE OR REPLACE VIEW v_product_catalog AS
SELECT
    p.id,
    p.name,
    p.brand,
    p.description,
    p.key_ingredients,
    p.suitable_skin_types,
    p.usage_instructions,
    p.price,
    p.is_active,
    p.created_at,
    p.updated_at,
    c.id AS category_id,
    c.name AS category_name
FROM products p
JOIN product_categories c ON p.category_id = c.id;

-- View 2: User dashboard summary
CREATE OR REPLACE VIEW v_user_dashboard AS
SELECT
    u.id AS user_id,
    u.full_name,
    u.email,
    u.is_active,
    u.created_at,
    sp.skin_type,
    (SELECT COUNT(*) FROM routines r WHERE r.user_id = u.id AND r.is_active = TRUE)
        AS active_routines_count,
    (SELECT COUNT(*) FROM user_products up WHERE up.user_id = u.id AND up.status = 'CURRENT')
        AS active_products_count,
    (SELECT COUNT(*) FROM appointments a
        WHERE a.user_id = u.id
        AND a.appointment_date >= CURRENT_DATE
        AND a.status IN ('REQUESTED','CONFIRMED'))
        AS upcoming_appointments_count,
    (SELECT COUNT(*) FROM progress_records p WHERE p.user_id = u.id)
        AS progress_records_count
FROM users u
LEFT JOIN skin_profiles sp ON sp.user_id = u.id;

-- View 3: Admin stats aggregated per user
CREATE OR REPLACE VIEW v_admin_user_stats AS
SELECT
    u.id AS user_id,
    u.full_name,
    u.email,
    u.role,
    u.is_active,
    u.created_at,
    COUNT(DISTINCT r.id) AS total_routines,
    COUNT(DISTINCT up.id) AS total_user_products,
    COUNT(DISTINCT pr.id) AS total_progress_records,
    COUNT(DISTINCT a.id) AS total_appointments
FROM users u
LEFT JOIN routines r ON r.user_id = u.id
LEFT JOIN user_products up ON up.user_id = u.id
LEFT JOIN progress_records pr ON pr.user_id = u.id
LEFT JOIN appointments a ON a.user_id = u.id
GROUP BY u.id, u.full_name, u.email, u.role, u.is_active, u.created_at;