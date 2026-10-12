-- 008_create_appointments.sql
-- User appointments with admin-managed status.

CREATE TABLE IF NOT EXISTS appointments (
    id                BIGSERIAL PRIMARY KEY,
    user_id           BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    appointment_date  DATE NOT NULL,
    appointment_time  TIME NOT NULL,
    reason            TEXT NOT NULL,
    notes             TEXT,
    status            VARCHAR(30) NOT NULL DEFAULT 'REQUESTED'
                      CHECK (status IN ('REQUESTED','CONFIRMED','COMPLETED','CANCELLED')),
    created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_user_date ON appointments(user_id, appointment_date);