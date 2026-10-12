import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

function optional(name: string, fallback?: string): string | undefined {
    return process.env[name] ?? fallback;
}

function required(name: string, fallback?: string): string {
    const value = process.env[name] ?? fallback;
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

/**
 * Decide which driver to use based on DATABASE_URL.
 *  - Starts with "postgres://" or "postgresql://" -> PostgreSQL.
 *  - Starts with "sqlite:" or empty/missing     -> SQLite (MVP-friendly).
 *
 * For an MVP demo we default to a local SQLite file `./data/scms.sqlite`
 * so the project boots with zero external services.
 */
function detectDatabaseUrl(): string {
    const raw = optional('DATABASE_URL');
    if (raw && raw.length > 0) return raw;
    // Default: a local SQLite file in the backend/data folder.
    return `sqlite:${path.resolve(process.cwd(), 'data', 'scms.sqlite')}`;
}

export const config = {
    port: Number(process.env.PORT ?? 5000),
    nodeEnv: process.env.NODE_ENV ?? 'development',
    databaseUrl: detectDatabaseUrl(),
    jwtSecret: required('JWT_SECRET', 'dev-insecure-secret-change-me'),
    jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
    frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    seed: {
        adminEmail: process.env.SEED_ADMIN_EMAIL ?? 'admin@scms.local',
        adminPassword: process.env.SEED_ADMIN_PASSWORD ?? 'Admin@12345',
        adminName: process.env.SEED_ADMIN_NAME ?? 'System Admin',
        userPassword: process.env.SEED_USER_PASSWORD ?? 'User@12345',
    },
};

export const isProd = config.nodeEnv === 'production';