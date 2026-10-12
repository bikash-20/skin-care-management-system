-- 005_create_user_products.sql (SQLite)

CREATE TABLE IF NOT EXISTS user_products (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id      INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    start_date      TEXT,
    end_date        TEXT,
    status          TEXT NOT NULL DEFAULT 'CURRENT'
                    CHECK (status IN ('CURRENT','FINISHED','PAUSED','DISCONTINUED')),
    frequency       TEXT,
    personal_notes  TEXT,
    rating          INTEGER CHECK (rating BETWEEN 1 AND 5),
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_user_products_user_id ON user_products(user_id);
CREATE INDEX IF NOT EXISTS idx_user_products_product_id ON user_products(product_id);
CREATE INDEX IF NOT EXISTS idx_user_products_status ON user_products(status);