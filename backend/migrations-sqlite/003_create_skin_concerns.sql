-- 003_create_skin_concerns.sql (SQLite)

CREATE TABLE IF NOT EXISTS skin_concerns (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT NOT NULL UNIQUE,
    description     TEXT
);

CREATE TABLE IF NOT EXISTS user_skin_concerns (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    concern_id      INTEGER NOT NULL REFERENCES skin_concerns(id) ON DELETE CASCADE,
    severity        INTEGER CHECK (severity BETWEEN 1 AND 5),
    notes           TEXT,
    UNIQUE(user_id, concern_id)
);

CREATE INDEX IF NOT EXISTS idx_user_skin_concerns_user_id ON user_skin_concerns(user_id);
CREATE INDEX IF NOT EXISTS idx_user_skin_concerns_concern_id ON user_skin_concerns(concern_id);