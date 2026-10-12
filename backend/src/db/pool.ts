/**
 * Database access layer.
 *
 * Supports two drivers:
 *   - PostgreSQL when DATABASE_URL starts with "postgres://" or "postgresql://"
 *   - SQLite (file-based) when DATABASE_URL starts with "sqlite:" or is empty
 *
 * Both drivers expose the same `query()` and `withTransaction()` API so
 * that the repositories can stay almost identical.
 */
import fs from 'fs';
import path from 'path';
import { config } from '../config';

export interface QueryResult<T> {
    rows: T[];
    rowCount: number;
    // Inserted row id (only set for INSERT on SQLite, undefined for pg)
    lastInsertRowid?: number | bigint;
}

export interface QueryClient {
    query<T = unknown>(text: string, params?: unknown[]): Promise<QueryResult<T>>;
}

/* ---------------- PostgreSQL ---------------- */

type PgModule = typeof import('pg');
let pgPool: import('pg').Pool | null = null;
let pgModule: PgModule | null = null;

async function pgQuery<T = unknown>(text: string, params: unknown[] = []): Promise<QueryResult<T>> {
    if (!pgPool || !pgModule) throw new Error('pg pool not initialized');
    const r = await pgPool.query(text, params as unknown[]);
    return { rows: r.rows as T[], rowCount: r.rowCount ?? 0 };
}

async function pgWithTransaction<T>(callback: (client: QueryClient) => Promise<T>): Promise<T> {
    if (!pgPool) throw new Error('pg pool not initialized');
    const client = await pgPool.connect();
    try {
        await client.query('BEGIN');
        const result = await callback({
            query: <R = unknown>(text: string, params?: unknown[]) =>
                pgClientQuery<R>(client, text, params ?? []),
        });
        await client.query('COMMIT');
        return result;
    } catch (err) {
        try { await client.query('ROLLBACK'); } catch { /* ignore */ }
        throw err;
    } finally {
        client.release();
    }
}

async function pgClientQuery<T = unknown>(client: import('pg').PoolClient, text: string, params: unknown[]): Promise<QueryResult<T>> {
    const r = await client.query(text, params as unknown[]);
    return { rows: r.rows as T[], rowCount: r.rowCount ?? 0 };
}

async function initPg(): Promise<void> {
    pgModule = await import('pg');
    pgPool = new pgModule.Pool({
        connectionString: config.databaseUrl,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
    });
    pgPool.on('error', (err) => {
        // eslint-disable-next-line no-console
        console.error('pg pool error:', err);
    });
}

async function closePg(): Promise<void> {
    if (pgPool) await pgPool.end();
}

/* ---------------- SQLite ---------------- */

type SqliteDb = import('better-sqlite3').Database;

let sqliteDb: SqliteDb | null = null;

function resolveSqlitePath(): string {
    let raw = config.databaseUrl;
    if (raw.startsWith('sqlite:')) raw = raw.slice('sqlite:'.length);
    if (raw === ':memory:' || raw === '') return ':memory:';
    return raw;
}

function initSqliteSync(): void {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const BetterSqlite3 = require('better-sqlite3');
    const dbPath = resolveSqlitePath();
    if (dbPath !== ':memory:') {
        const dir = path.dirname(dbPath);
        if (dir && !fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    }
    const db: SqliteDb = new BetterSqlite3(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    // Register helper functions used by triggers.
    db.function('js_set_updated_at', { deterministic: false, varargs: false }, () => {
        return new Date().toISOString();
    });
    sqliteDb = db;
}

/**
 * Translate PostgreSQL `$N` placeholders to SQLite `?` placeholders.
 *
 * - PostgreSQL allows the same `$N` to appear multiple times; SQLite's `?` is
 *   strictly positional. We rewrite each occurrence of `$N` into its own `?`
 *   and emit the bound value once per occurrence.
 * - If the input SQL already uses `?` (the SQLite-native form used by some
 *   seed scripts), we pass it through unchanged.
 * - PostgreSQL-style `expr::TYPE` casts are stripped since SQLite doesn't
 *   understand them (e.g. `$1::text`, `created_at::date`).
 */
function sqliteTranslate(text: string, params: unknown[]): { sql: string; params: unknown[] } {
    const hasPgPlaceholders = /\$\d+/.test(text);
    if (!hasPgPlaceholders) {
        // Already SQLite-native `?` form. Strip any `::TYPE` casts and
        // pass params through unchanged.
        const sql = text.replace(/::[A-Za-z_][A-Za-z0-9_]*/g, '');
        return { sql, params };
    }
    const expanded: unknown[] = [];
    const out = text.replace(/\$(\d+)|::([A-Za-z_][A-Za-z0-9_]*)/g, (_match, idx, _cast) => {
        if (idx) {
            const n = parseInt(idx, 10);
            const value = params[n - 1];
            expanded.push(value);
            return '?';
        }
        // Strip `::TYPE` cast entirely (empty replacement).
        return '';
    });
    return { sql: out, params: expanded };
}

function sqliteExec<T>(text: string, params: unknown[] = []): QueryResult<T> {
    if (!sqliteDb) throw new Error('sqlite db not initialized');
    const { sql, params: expanded } = sqliteTranslate(text, params);
    const stmt = sqliteDb.prepare(sql);
    const trimmed = sql.trimStart().toUpperCase();
    const bind = coerceParams(expanded);
    try {
        if (trimmed.startsWith('SELECT') || trimmed.startsWith('PRAGMA') || trimmed.startsWith('WITH')) {
            let rows = stmt.all(...bind);
            rows = normalizeIds(rows);
            rows = normalizeBooleans(rows);
            return { rows: rows as T[], rowCount: rows.length };
        }
        const info = stmt.run(...bind);
        const rows: T[] = [];
        return {
            rows,
            rowCount: info.changes,
            lastInsertRowid: info.lastInsertRowid,
        };
    } catch (err) {
        throw err;
    }
}

function sqliteExecWithReturning<T>(text: string, params: unknown[] = []): QueryResult<T> {
    if (!sqliteDb) throw new Error('sqlite db not initialized');
    const { sql, params: expanded } = sqliteTranslate(text, params);
    const stmt = sqliteDb.prepare(sql);
    const bind = coerceParams(expanded);
    let rows = stmt.all(...bind);
    rows = normalizeIds(rows);
    rows = normalizeBooleans(rows);
    return { rows: rows as T[], rowCount: rows.length };
}

/**
 * Coerce JS values into types that better-sqlite3 can bind.
 * - undefined  -> null
 * - boolean    -> 0 | 1
 * - Date       -> ISO string
 * Everything else is passed through.
 */
function coerceParams(params: unknown[]): unknown[] {
    return params.map((v) => {
        if (v === undefined) return null;
        if (typeof v === 'boolean') return v ? 1 : 0;
        if (v instanceof Date) return v.toISOString();
        return v;
    });
}

/**
 * Convert SQLite integer booleans (0/1) to real booleans.
 * Only converts integer-valued cells. Skips strings and bigints.
 */
function normalizeBooleans(rows: unknown[]): unknown[] {
    return rows.map((row) => {
        if (!row || typeof row !== 'object') return row;
        const result: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(row as Record<string, unknown>)) {
            if (typeof v === 'number' && (v === 0 || v === 1) && looksLikeBoolean(k)) {
                result[k] = v === 1;
            } else {
                result[k] = v;
            }
        }
        return result;
    });
}

const BOOLEAN_FIELDS = new Set(['is_active', 'has_skin_type', 'has_notes']);
function looksLikeBoolean(key: string): boolean {
    return BOOLEAN_FIELDS.has(key);
}

/**
 * Convert numeric primary keys from SQLite to strings so they match the
 * shape of PostgreSQL BIGSERIAL values (which pg returns as strings).
 * Only applied when running on SQLite.
 */
const ID_FIELDS = new Set([
    'id', 'user_id', 'concern_id', 'category_id', 'product_id',
    'routine_id', 'recorded_by', 'entity_id', 'last_insert_rowid',
]);
function looksLikeId(key: string): boolean {
    if (ID_FIELDS.has(key)) return true;
    if (key.endsWith('_id') && key !== 'image_url' && key !== 'video_url') return true;
    return false;
}
function normalizeIds(rows: unknown[]): unknown[] {
    return rows.map((row) => {
        if (!row || typeof row !== 'object') return row;
        const result: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(row as Record<string, unknown>)) {
            if (typeof v === 'number' && Number.isInteger(v) && looksLikeId(k)) {
                result[k] = String(v);
            } else if (typeof v === 'bigint' && looksLikeId(k)) {
                result[k] = String(v);
            } else {
                result[k] = v;
            }
        }
        return result;
    });
}

async function sqliteQuery<T>(text: string, params: unknown[] = []): Promise<QueryResult<T>> {
    const { sql } = sqliteTranslate(text, params);
    if (sql.trimStart().toUpperCase().includes('RETURNING')) {
        return sqliteExecWithReturning<T>(text, params);
    }
    return sqliteExec<T>(text, params);
}

async function sqliteWithTransaction<T>(callback: (client: QueryClient) => Promise<T>): Promise<T> {
    if (!sqliteDb) throw new Error('sqlite db not initialized');
    const wrapper: QueryClient = {
        query: async <R = unknown>(text: string, params?: unknown[]) =>
            sqliteExec<R>(text, params ?? []),
    };
    let result!: T;
    sqliteDb.exec('BEGIN');
    try {
        result = await callback(wrapper);
        sqliteDb.exec('COMMIT');
        return result;
    } catch (err) {
        try { sqliteDb.exec('ROLLBACK'); } catch { /* ignore */ }
        throw err;
    }
}

async function closeSqlite(): Promise<void> {
    if (sqliteDb) sqliteDb.close();
}

/* ---------------- Public API ---------------- */

let driver: 'pg' | 'sqlite' = 'sqlite';

export async function initDb(): Promise<void> {
    const url = config.databaseUrl;
    if (url.startsWith('postgres://') || url.startsWith('postgresql://')) {
        driver = 'pg';
        await initPg();
    } else {
        driver = 'sqlite';
        initSqliteSync();
    }
}

export function getDriver(): 'pg' | 'sqlite' {
    return driver;
}

export async function query<T = unknown>(text: string, params: unknown[] = []): Promise<QueryResult<T>> {
    if (driver === 'pg') return pgQuery<T>(text, params);
    return sqliteQuery<T>(text, params);
}

export async function withTransaction<T>(callback: (client: QueryClient) => Promise<T>): Promise<T> {
    if (driver === 'pg') return pgWithTransaction(callback);
    return sqliteWithTransaction(callback);
}

export async function closePool(): Promise<void> {
    if (driver === 'pg') await closePg();
    else await closeSqlite();
}

/**
 * Apply each statement (separated by ";") in the given SQL text.
 * Used by the migration runner and seed scripts.
 */
export async function execScript(script: string): Promise<void> {
    if (driver === 'pg') {
        await query(script);
        return;
    }
    if (!sqliteDb) throw new Error('sqlite db not initialized');
    sqliteDb.exec(script);
}