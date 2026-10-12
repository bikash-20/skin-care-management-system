import fs from 'fs';
import path from 'path';
import { initDb, getDriver, execScript, closePool } from './pool';

/**
 * Apply every .sql file in the active migrations folder in lexicographic
 * order. Each file is executed as a single script.
 */
async function run(): Promise<void> {
    await initDb();
    const driver = getDriver();
    const folder = driver === 'pg' ? 'migrations-pg' : 'migrations-sqlite';

    const migrationsDir = path.resolve(__dirname, `../../${folder}`);
    if (!fs.existsSync(migrationsDir)) {
        throw new Error(`Migrations folder not found: ${migrationsDir}`);
    }
    const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
    if (files.length === 0) {
        // eslint-disable-next-line no-console
        console.log('No migrations found.');
        return;
    }

    // eslint-disable-next-line no-console
    console.log(`Driver: ${driver}`);

    for (const file of files) {
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        // eslint-disable-next-line no-console
        console.log(`Applying migration: ${file}`);
        try {
            await execScript(sql);
            // eslint-disable-next-line no-console
            console.log(`  ✓ ${file}`);
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error(`  ✗ ${file} failed:`, err);
            throw err;
        }
    }

    // eslint-disable-next-line no-console
    console.log('All migrations applied.');
    await closePool();
}

run().catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
});