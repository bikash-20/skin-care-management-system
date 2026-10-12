import fs from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';
import { initDb, getDriver, query, execScript, closePool } from './pool';
import { config } from '../config';

/**
 * Seed script.
 *
 *  1. Apply the SQL seed file (reference data).
 *  2. Insert demo users with bcrypt-hashed passwords.
 *  3. Insert a sample skin profile, concerns, progress records, an
 *     appointment, and a routine for the first demo user so the
 *     dashboard isn't empty on first login.
 *
 * Idempotent — running it again is safe.
 */
async function run(): Promise<void> {
    await initDb();
    const driver = getDriver();

    const seedFile = path.resolve(__dirname, driver === 'pg'
        ? '../../../database/seed/seed.sql'
        : '../../seed-sqlite.sql');
    if (!fs.existsSync(seedFile)) {
        throw new Error(`Seed file not found: ${seedFile}`);
    }
    const sql = fs.readFileSync(seedFile, 'utf8');
    await execScript(sql);
    // eslint-disable-next-line no-console
    console.log('Reference data seeded.');

    const adminHash = await bcrypt.hash(config.seed.adminPassword, 10);
    const userHash = await bcrypt.hash(config.seed.userPassword, 10);

    const demoUsers = [
        { full_name: config.seed.adminName, email: config.seed.adminEmail, password_hash: adminHash, role: 'ADMIN', phone: '+1-555-0100', date_of_birth: '1985-01-15', gender: 'OTHER' },
        { full_name: 'Alex Carter', email: 'alex@example.com', password_hash: userHash, role: 'USER', phone: '+1-555-0101', date_of_birth: '1995-04-22', gender: 'FEMALE' },
        { full_name: 'Jordan Lee', email: 'jordan@example.com', password_hash: userHash, role: 'USER', phone: '+1-555-0102', date_of_birth: '1990-08-30', gender: 'MALE' },
        { full_name: 'Sam Rivera', email: 'sam@example.com', password_hash: userHash, role: 'USER', phone: '+1-555-0103', date_of_birth: '1998-11-12', gender: 'OTHER' },
    ];

    for (const u of demoUsers) {
        await insertUser(u);
    }
    // eslint-disable-next-line no-console
    console.log(`Seeded ${demoUsers.length} users.`);

    // Seed demo data for the first demo user
    const alexRow = await query<{ id: string | number }>(
        `SELECT id FROM users WHERE email = 'alex@example.com' LIMIT 1`
    );
    if (alexRow.rowCount && alexRow.rowCount > 0) {
        const alexId = String(alexRow.rows[0].id);

        await upsertSkinProfile(alexId, 'COMBINATION', 'Combination skin with mild dryness in winter.');

        const acneRow = await query<{ id: string | number }>(
            `SELECT id FROM skin_concerns WHERE name = 'Acne' LIMIT 1`
        );
        const drynessRow = await query<{ id: string | number }>(
            `SELECT id FROM skin_concerns WHERE name = 'Dryness' LIMIT 1`
        );
        if (acneRow.rowCount && drynessRow.rowCount) {
            await insertUserConcern(alexId, String(acneRow.rows[0].id), 3, 'Mostly on chin and jawline');
            await insertUserConcern(alexId, String(drynessRow.rows[0].id), 2, 'Mild dryness around the eyes');
        }

        // Two progress records: one 7 days ago, one today
        await insertProgress(alexId, dateOffset(-7), 4, 3, 3, 2, 3, 'Skin felt oily in T-zone.');
        await insertProgress(alexId, dateOffset(0), 2, 2, 2, 1, 4, 'Skin feels calmer after new routine.');

        // One appointment 7 days in the future
        await insertAppointment(alexId, dateOffset(7), '10:00', 'General skin review', 'First appointment', 'REQUESTED');

        // One morning routine with two steps
        const cleanserRow = await query<{ id: string | number }>(
            `SELECT id FROM products WHERE name = 'Gentle Foam Cleanser' LIMIT 1`
        );
        const sunscreenRow = await query<{ id: string | number }>(
            `SELECT id FROM products WHERE name = 'Invisible Shield SPF 50' LIMIT 1`
        );

        const routineId = await insertRoutine(alexId, 'Morning Routine', 'MORNING', 'Daily morning routine', 1);
        if (routineId && cleanserRow.rowCount) {
            await insertRoutineProduct(routineId, String(cleanserRow.rows[0].id), 1, 'Daily');
        }
        if (routineId && sunscreenRow.rowCount) {
            await insertRoutineProduct(routineId, String(sunscreenRow.rows[0].id), 2, 'Daily');
        }
    }

    // eslint-disable-next-line no-console
    console.log(`Admin login: ${config.seed.adminEmail} / ${config.seed.adminPassword}`);
    // eslint-disable-next-line no-console
    console.log(`Demo user login password: ${config.seed.userPassword}`);

    await closePool();
}

/* ---------------- driver-aware helpers ---------------- */

function dateOffset(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
}

async function insertUser(u: {
    full_name: string; email: string; password_hash: string; role: string;
    phone: string; date_of_birth: string; gender: string;
}): Promise<void> {
    if (getDriver() === 'pg') {
        await query(
            `INSERT INTO users (full_name, email, password_hash, role, phone, date_of_birth, gender)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (email) DO NOTHING`,
            [u.full_name, u.email, u.password_hash, u.role, u.phone, u.date_of_birth, u.gender]
        );
    } else {
        await query(
            `INSERT OR IGNORE INTO users (full_name, email, password_hash, role, phone, date_of_birth, gender)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [u.full_name, u.email, u.password_hash, u.role, u.phone, u.date_of_birth, u.gender]
        );
    }
}

async function upsertSkinProfile(userId: string, skinType: string, notes: string): Promise<void> {
    if (getDriver() === 'pg') {
        await query(
            `INSERT INTO skin_profiles (user_id, skin_type, notes)
             VALUES ($1, $2, $3)
             ON CONFLICT (user_id) DO NOTHING`,
            [userId, skinType, notes]
        );
    } else {
        await query(
            `INSERT OR IGNORE INTO skin_profiles (user_id, skin_type, notes)
             VALUES (?, ?, ?)`,
            [userId, skinType, notes]
        );
    }
}

async function insertUserConcern(userId: string, concernId: string, severity: number, notes: string): Promise<void> {
    if (getDriver() === 'pg') {
        await query(
            `INSERT INTO user_skin_concerns (user_id, concern_id, severity, notes)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (user_id, concern_id) DO NOTHING`,
            [userId, concernId, severity, notes]
        );
    } else {
        await query(
            `INSERT OR IGNORE INTO user_skin_concerns (user_id, concern_id, severity, notes)
             VALUES (?, ?, ?, ?)`,
            [userId, concernId, severity, notes]
        );
    }
}

async function insertProgress(
    userId: string, recordedDate: string,
    acne: number, dryness: number, oiliness: number, redness: number, overall: number, notes: string
): Promise<void> {
    await query(
        `INSERT INTO progress_records
            (user_id, recorded_date, acne_severity, dryness_level, oiliness_level, redness_level, overall_condition_score, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, recordedDate, acne, dryness, oiliness, redness, overall, notes]
    );
}

async function insertAppointment(
    userId: string, date: string, time: string, reason: string, notes: string, status: string
): Promise<void> {
    await query(
        `INSERT INTO appointments (user_id, appointment_date, appointment_time, reason, notes, status)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, date, time, reason, notes, status]
    );
}

async function insertRoutine(
    userId: string, name: string, type: string, description: string, isActive: number
): Promise<string | null> {
    const r = await query<{ id: string | number }>(
        `INSERT INTO routines (user_id, name, routine_type, description, is_active)
         VALUES (?, ?, ?, ?, ?)
         RETURNING id`,
        [userId, name, type, description, isActive]
    );
    if (r.rowCount && r.rowCount > 0) return String(r.rows[0].id);
    return null;
}

async function insertRoutineProduct(routineId: string, productId: string, stepOrder: number, frequency: string): Promise<void> {
    if (getDriver() === 'pg') {
        await query(
            `INSERT INTO routine_products (routine_id, product_id, step_order, frequency)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (routine_id, step_order) DO NOTHING`,
            [routineId, productId, stepOrder, frequency]
        );
    } else {
        await query(
            `INSERT OR IGNORE INTO routine_products (routine_id, product_id, step_order, frequency)
             VALUES (?, ?, ?, ?)`,
            [routineId, productId, stepOrder, frequency]
        );
    }
}

run().catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
});