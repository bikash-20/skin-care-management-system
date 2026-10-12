-- 006_create_routines.sql (SQLite)

CREATE TABLE IF NOT EXISTS routines (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    routine_type    TEXT NOT NULL
                    CHECK (routine_type IN ('MORNING','NIGHT','WEEKLY','CUSTOM')),
    description     TEXT,
    is_active       INTEGER NOT NULL DEFAULT 1,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS routine_products (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    routine_id          INTEGER NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
    product_id          INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    step_order          INTEGER NOT NULL CHECK (step_order > 0),
    frequency           TEXT,
    usage_instructions  TEXT,
    notes               TEXT,
    UNIQUE(routine_id, step_order)
);

CREATE INDEX IF NOT EXISTS idx_routines_user_id ON routines(user_id);
CREATE INDEX IF NOT EXISTS idx_routines_is_active ON routines(is_active);
CREATE INDEX IF NOT EXISTS idx_routine_products_routine_id ON routine_products(routine_id);
CREATE INDEX IF NOT EXISTS idx_routine_products_product_id ON routine_products(product_id);