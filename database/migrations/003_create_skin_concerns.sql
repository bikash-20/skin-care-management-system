-- 003_create_skin_concerns.sql
-- Master list of skin concerns and the user-concern junction table.

CREATE TABLE IF NOT EXISTS skin_concerns (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(100) UNIQUE NOT NULL,
    description     TEXT
);

CREATE TABLE IF NOT EXISTS user_skin_concerns (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    concern_id      BIGINT NOT NULL REFERENCES skin_concerns(id) ON DELETE CASCADE,
    severity        INTEGER CHECK (severity BETWEEN 1 AND 5),
    notes           TEXT,
    UNIQUE(user_id, concern_id)
);

CREATE INDEX IF NOT EXISTS idx_user_skin_concerns_user_id ON user_skin_concerns(user_id);
CREATE INDEX IF NOT EXISTS idx_user_skin_concerns_concern_id ON user_skin_concerns(concern_id);