# DBMS Concepts Demonstrated

This document explains the database design and the SQL concepts used in the Skin Care Management System.

## 1. Design goals

- **Relational** — every entity is a table; relationships use foreign keys.
- **Normalized** to roughly **3NF** — categories, concerns, and other reference data are stored in their own tables and referenced by ID; user-supplied data does not duplicate catalog fields.
- **Constraint-rich** — primary keys, foreign keys, `NOT NULL`, `UNIQUE`, and `CHECK` constraints are used throughout.
- **Index-backed** — every foreign key and frequently-searched column has a B-tree index.
- **Explicit SQL** — no ORM; the backend uses parameterized queries via `pg`.

## 2. Tables and constraints

| Table | Primary key | Foreign keys | Notable constraints |
|-------|-------------|--------------|---------------------|
| `users` | `id` | — | `UNIQUE(email)`, `CHECK(role IN ('USER','ADMIN'))` |
| `skin_profiles` | `id` | `user_id → users(id)` (UNIQUE) | `CHECK(skin_type IN (...))` |
| `skin_concerns` | `id` | — | `UNIQUE(name)` |
| `user_skin_concerns` | `id` | `user_id`, `concern_id` | `UNIQUE(user_id, concern_id)`, `CHECK(severity BETWEEN 1 AND 5)` |
| `product_categories` | `id` | — | `UNIQUE(name)` |
| `products` | `id` | `category_id` | `CHECK(price IS NULL OR price >= 0)` |
| `user_products` | `id` | `user_id`, `product_id` | `CHECK(status IN (...))`, `CHECK(rating BETWEEN 1 AND 5)` |
| `routines` | `id` | `user_id` | `CHECK(routine_type IN (...))` |
| `routine_products` | `id` | `routine_id`, `product_id` | `UNIQUE(routine_id, step_order)` (no duplicate step numbers) |
| `progress_records` | `id` | `user_id` | `CHECK(... BETWEEN 1 AND 5)` on every level column |
| `appointments` | `id` | `user_id` | `CHECK(status IN (...))` |
| `audit_logs` | `id` | `user_id` (nullable) | `details JSONB` |

## 3. Indexes

```sql
idx_users_email                    -- fast login lookups
idx_users_role
idx_users_is_active

idx_skin_profiles_user_id          -- 1:1 lookup

idx_user_skin_concerns_user_id
idx_user_skin_concerns_concern_id

idx_products_name                  -- text search
idx_products_category_id
idx_products_brand
idx_products_is_active

idx_user_products_user_id
idx_user_products_product_id
idx_user_products_status

idx_routines_user_id
idx_routines_is_active
idx_routine_products_routine_id
idx_routine_products_product_id

idx_progress_records_user_id
idx_progress_records_user_date     -- composite for "history since X"

idx_appointments_user_id
idx_appointments_date
idx_appointments_status
idx_appointments_user_date        -- composite

idx_audit_logs_user_id
idx_audit_logs_action
idx_audit_logs_entity
idx_audit_logs_created_at          -- desc for recent-first listing
```

## 4. Views

```sql
v_product_catalog        -- products joined with category name (used by catalog endpoints)
v_user_dashboard         -- per-user aggregate counts
v_admin_user_stats       -- GROUP BY aggregations for admin overview
```

Views are used by the API to keep complex JOINs and aggregations in the database layer.

## 5. Triggers

`set_updated_at()` is created in `011_create_triggers.sql` and attached to:
- `users`
- `skin_profiles`
- `products`
- `routines`
- `appointments`

Whenever a row is updated, the trigger writes `CURRENT_TIMESTAMP` to `updated_at`. This guarantees consistency without relying on application code.

## 6. Transactions

Multi-step writes that must be atomic use a transaction. Example — creating a routine with multiple steps:

```ts
await withTransaction(async (client) => {
    await client.query(`DELETE FROM routine_products WHERE routine_id = $1`, [routineId]);
    for (const item of items) {
        await client.query(
            `INSERT INTO routine_products (routine_id, product_id, step_order, frequency, usage_instructions, notes)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [...]
        );
    }
});
```

If any insert fails, the whole change is rolled back. The user never sees a partial routine.

The migration and seed scripts each run in their own transaction per file, so a failed migration never leaves the schema half-applied.

## 7. Example queries used by the API

### Active products with their category name
```sql
SELECT p.id, p.name, p.brand, c.name AS category_name, p.price, p.is_active
FROM products p
JOIN product_categories c ON c.id = p.category_id
WHERE p.is_active = TRUE
ORDER BY p.name ASC;
```

### Products per category (LEFT JOIN + GROUP BY)
```sql
SELECT c.name AS category_name, COUNT(p.id) AS product_count
FROM product_categories c
LEFT JOIN products p ON p.category_id = c.id
GROUP BY c.id, c.name
ORDER BY product_count DESC, c.name ASC;
```

### Upcoming appointments
```sql
SELECT a.id, a.appointment_date, a.appointment_time, a.reason, a.status, u.full_name
FROM appointments a
JOIN users u ON u.id = a.user_id
WHERE a.appointment_date >= CURRENT_DATE
  AND a.status IN ('REQUESTED','CONFIRMED')
ORDER BY a.appointment_date ASC, a.appointment_time ASC;
```

### User progress history
```sql
SELECT recorded_date, acne_severity, dryness_level, oiliness_level,
       redness_level, overall_condition_score
FROM progress_records
WHERE user_id = $1
ORDER BY recorded_date ASC;
```

### Admin dashboard stats (multiple aggregates in one round-trip)
```sql
SELECT
    (SELECT COUNT(*) FROM users) AS total_users,
    (SELECT COUNT(*) FROM users WHERE is_active = TRUE) AS active_users,
    (SELECT COUNT(*) FROM products WHERE is_active = TRUE) AS active_products,
    (SELECT COUNT(*) FROM appointments) AS total_appointments,
    (SELECT COUNT(*) FROM appointments WHERE status = 'REQUESTED') AS pending_appointments,
    ...;
```

## 8. SQL features actually used

- `CREATE TABLE`, `ALTER TABLE` (via migrations)
- `BIGSERIAL` identity columns
- `PRIMARY KEY`, `FOREIGN KEY ... REFERENCES ... ON DELETE ...`
- `UNIQUE`, `CHECK`, `NOT NULL`
- `CREATE INDEX`
- `CREATE OR REPLACE VIEW`
- `CREATE OR REPLACE FUNCTION`, `CREATE TRIGGER`
- `BEGIN`, `COMMIT`, `ROLLBACK`
- `INSERT ... ON CONFLICT DO NOTHING / DO UPDATE` (upsert, idempotent seeding)
- `JOIN` (INNER), `LEFT JOIN`
- `GROUP BY ... HAVING ...`
- Aggregate functions: `COUNT`, `COUNT(DISTINCT ...)`, `SUM`, `AVG`
- `ORDER BY`, `LIMIT`, `OFFSET` for pagination
- Parameterized placeholders (`$1`, `$2`, …) — never string concatenation.

## 9. Why we avoided an ORM

The PRD requires that the project "expose actual SQL clearly because this is a DBMS-focused academic project". Using `pg` directly:
- Makes every query visible in the codebase.
- Lets us show JOIN, GROUP BY, and aggregate queries to reviewers.
- Avoids hiding the foreign-key semantics behind an abstraction.

## 10. Migration discipline

Numbered migrations (`001_*.sql` … `011_*.sql`) are run in lexicographic order by `npm run migrate`. The seed script is idempotent — re-running it does not duplicate data.

## 11. Future DBMS work (not in v1)

- A `routine_logs` table to track daily routine adherence.
- A `notifications` table for in-app messages.
- `pg_trgm`-based full-text search on products.
- A stored procedure that returns a user's routine usage streak.
