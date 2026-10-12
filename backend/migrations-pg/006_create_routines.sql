-- 006_create_routines.sql
-- Routines and the routine_products junction table.

CREATE TABLE IF NOT EXISTS routines (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            VARCHAR(150) NOT NULL,
    routine_type    VARCHAR(30) NOT NULL
                    CHECK (routine_type IN ('MORNING','NIGHT','WEEKLY','CUSTOM')),
    description     TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS routine_products (
    id                  BIGSERIAL PRIMARY KEY,
    routine_id          BIGINT NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
    product_id          BIGINT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    step_order          INTEGER NOT NULL CHECK (step_order > 0),
    frequency           VARCHAR(100),
    usage_instructions  TEXT,
    notes               TEXT,
    UNIQUE(routine_id, step_order)
);

CREATE INDEX IF NOT EXISTS idx_routines_user_id ON routines(user_id);
CREATE INDEX IF NOT EXISTS idx_routines_is_active ON routines(is_active);
CREATE INDEX IF NOT EXISTS idx_routine_products_routine_id ON routine_products(routine_id);
CREATE INDEX IF NOT EXISTS idx_routine_products_product_id ON routine_products(product_id);