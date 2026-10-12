-- 002_create_skin_profiles.sql (SQLite)

CREATE TABLE IF NOT EXISTS skin_profiles (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    skin_type       TEXT
                    CHECK (skin_type IS NULL OR skin_type IN
                      ('DRY','OILY','COMBINATION','NORMAL','SENSITIVE','UNKNOWN')),
    notes           TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_skin_profiles_user_id ON skin_profiles(user_id);