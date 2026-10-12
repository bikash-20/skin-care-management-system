-- 002_create_skin_profiles.sql
-- One-to-one relationship between users and skin_profiles.

CREATE TABLE IF NOT EXISTS skin_profiles (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skin_type       VARCHAR(30)
                    CHECK (skin_type IS NULL OR skin_type IN
                      ('DRY','OILY','COMBINATION','NORMAL','SENSITIVE','UNKNOWN')),
    notes           TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_skin_profiles_user_id ON skin_profiles(user_id);