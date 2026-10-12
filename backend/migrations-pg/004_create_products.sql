-- 004_create_products.sql
-- Product catalog tables.

CREATE TABLE IF NOT EXISTS product_categories (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(100) UNIQUE NOT NULL,
    description     TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS products (
    id                  BIGSERIAL PRIMARY KEY,
    category_id         BIGINT NOT NULL REFERENCES product_categories(id) ON DELETE RESTRICT,
    name                VARCHAR(150) NOT NULL,
    brand               VARCHAR(100),
    description         TEXT,
    key_ingredients     TEXT,
    suitable_skin_types TEXT,
    usage_instructions  TEXT,
    price               NUMERIC(10,2) CHECK (price IS NULL OR price >= 0),
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);