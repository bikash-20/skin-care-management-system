-- 011_create_triggers.sql (SQLite)
-- SQLite triggers can call a custom function. better-sqlite3 lets us
-- register JS functions so we can keep the same trigger body semantics.

-- The driver registers the js_set_updated_at() function before applying this file.
-- It is automatically defined by the pool when running migrations against SQLite.

DROP TRIGGER IF EXISTS trg_users_updated_at;
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
BEGIN
    UPDATE users SET updated_at = js_set_updated_at() WHERE id = OLD.id;
END;

DROP TRIGGER IF EXISTS trg_skin_profiles_updated_at;
CREATE TRIGGER trg_skin_profiles_updated_at
BEFORE UPDATE ON skin_profiles
FOR EACH ROW
BEGIN
    UPDATE skin_profiles SET updated_at = js_set_updated_at() WHERE id = OLD.id;
END;

DROP TRIGGER IF EXISTS trg_products_updated_at;
CREATE TRIGGER trg_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW
BEGIN
    UPDATE products SET updated_at = js_set_updated_at() WHERE id = OLD.id;
END;

DROP TRIGGER IF EXISTS trg_routines_updated_at;
CREATE TRIGGER trg_routines_updated_at
BEFORE UPDATE ON routines
FOR EACH ROW
BEGIN
    UPDATE routines SET updated_at = js_set_updated_at() WHERE id = OLD.id;
END;

DROP TRIGGER IF EXISTS trg_appointments_updated_at;
CREATE TRIGGER trg_appointments_updated_at
BEFORE UPDATE ON appointments
FOR EACH ROW
BEGIN
    UPDATE appointments SET updated_at = js_set_updated_at() WHERE id = OLD.id;
END;