import { query, withTransaction } from '../db/pool';
import { Role } from '../types';

export interface UserRow {
    id: string;
    full_name: string;
    email: string;
    password_hash: string;
    role: Role;
    phone: string | null;
    date_of_birth: string | null;
    gender: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface CreateUserInput {
    full_name: string;
    email: string;
    password_hash: string;
    role?: Role;
    phone?: string | null;
    date_of_birth?: string | null;
    gender?: string | null;
}

export const usersRepo = {
    async findByEmail(email: string): Promise<UserRow | null> {
        const result = await query<UserRow>(
            `SELECT * FROM users WHERE email = $1 LIMIT 1`,
            [email]
        );
        return result.rowCount && result.rowCount > 0 ? result.rows[0] : null;
    },

    async findById(id: string): Promise<UserRow | null> {
        const result = await query<UserRow>(`SELECT * FROM users WHERE id = $1 LIMIT 1`, [id]);
        return result.rowCount && result.rowCount > 0 ? result.rows[0] : null;
    },

    async create(input: CreateUserInput): Promise<UserRow> {
        return withTransaction(async (client) => {
            const result = await client.query<UserRow>(
                `INSERT INTO users (full_name, email, password_hash, role, phone, date_of_birth, gender)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 RETURNING *`,
                [
                    input.full_name,
                    input.email,
                    input.password_hash,
                    input.role ?? 'USER',
                    input.phone ?? null,
                    input.date_of_birth ?? null,
                    input.gender ?? null,
                ]
            );
            return result.rows[0];
        });
    },

    async setActive(id: string, isActive: boolean): Promise<UserRow | null> {
        const result = await query<UserRow>(
            `UPDATE users SET is_active = $2 WHERE id = $1 RETURNING *`,
            [id, isActive]
        );
        return result.rowCount && result.rowCount > 0 ? result.rows[0] : null;
    },

    async list(opts: { search?: string; limit?: number; offset?: number }) {
        const search = opts.search ? `%${opts.search.toLowerCase()}%` : null;
        const limit = Math.max(1, Math.min(opts.limit ?? 20, 100));
        const offset = Math.max(0, opts.offset ?? 0);
        const result = await query<{
            id: string;
            full_name: string;
            email: string;
            role: Role;
            is_active: boolean;
            created_at: string;
        }>(
            `SELECT id, full_name, email, role, is_active, created_at
             FROM users
             WHERE ($1::text IS NULL OR LOWER(full_name) LIKE $1 OR LOWER(email) LIKE $1)
             ORDER BY created_at DESC
             LIMIT $2 OFFSET $3`,
            [search, limit, offset]
        );
        return result.rows;
    },
};