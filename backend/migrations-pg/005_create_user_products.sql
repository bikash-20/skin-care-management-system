-- 005_create_user_products.sql
-- Personal product cabinet: tracks products a user owns/uses.

CREATE TABLE IF NOT EXISTS user_products (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id      BIGINT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    start_date      DATE,
    end_date        DATE,
    status          VARCHAR(30) NOT NULL DEFAULT 'CURRENT'
                    CHECK (status IN ('CURRENT','FINISHED','PAUSED','DISCONTINUED')),
    frequency       VARCHAR(100),
    personal_notes  TEXT,
    rating          INTEGER CHECK (rating BETWEEN 1 AND 5),
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_products_user_id ON user_products(user_id);
CREATE INDEX IF NOT EXISTS idx_user_products_product_id ON user_products(product_id);
CREATE INDEX IF NOT EXISTS idx_user_products_status ON user_products(status);