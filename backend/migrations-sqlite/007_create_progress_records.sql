-- 007_create_progress_records.sql (SQLite)

CREATE TABLE IF NOT EXISTS progress_records (
    id                      INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id                 INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recorded_date           TEXT NOT NULL,
    acne_severity           INTEGER CHECK (acne_severity BETWEEN 1 AND 5),
    dryness_level           INTEGER CHECK (dryness_level BETWEEN 1 AND 5),
    oiliness_level          INTEGER CHECK (oiliness_level BETWEEN 1 AND 5),
    redness_level           INTEGER CHECK (redness_level BETWEEN 1 AND 5),
    overall_condition_score INTEGER CHECK (overall_condition_score BETWEEN 1 AND 5),
    image_url               TEXT,
    notes                   TEXT,
    created_at              TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_progress_records_user_id ON progress_records(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_records_user_date ON progress_records(user_id, recorded_date);