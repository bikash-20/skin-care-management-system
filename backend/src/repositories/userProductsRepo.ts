import { query } from '../db/pool';

export interface UserProductRow {
    id: string;
    user_id: string;
    product_id: string;
    start_date: string | null;
    end_date: string | null;
    status: string;
    frequency: string | null;
    personal_notes: string | null;
    rating: number | null;
    created_at: string;
    product_name?: string;
    product_brand?: string | null;
    category_name?: string;
}

export const userProductsRepo = {
    async listByUser(userId: string): Promise<UserProductRow[]> {
        const result = await query<UserProductRow>(
            `SELECT up.*, p.name AS product_name, p.brand AS product_brand, c.name AS category_name
             FROM user_products up
             JOIN products p ON p.id = up.product_id
             JOIN product_categories c ON c.id = p.category_id
             WHERE up.user_id = $1
             ORDER BY up.created_at DESC`,
            [userId]
        );
        return result.rows;
    },

    async findById(id: string, userId: string): Promise<UserProductRow | null> {
        const result = await query<UserProductRow>(
            `SELECT up.*, p.name AS product_name, p.brand AS product_brand, c.name AS category_name
             FROM user_products up
             JOIN products p ON p.id = up.product_id
             JOIN product_categories c ON c.id = p.category_id
             WHERE up.id = $1 AND up.user_id = $2
             LIMIT 1`,
            [id, userId]
        );
        return result.rowCount && result.rowCount > 0 ? result.rows[0] : null;
    },

    async create(input: Omit<UserProductRow, 'id' | 'created_at' | 'product_name' | 'product_brand' | 'category_name'>): Promise<UserProductRow> {
        const result = await query<UserProductRow>(
            `INSERT INTO user_products
                (user_id, product_id, start_date, end_date, status, frequency, personal_notes, rating)
             VALUES ($1, $2, $3, $4, COALESCE($5, 'CURRENT'), $6, $7, $8)
             RETURNING *`,
            [
                input.user_id,
                input.product_id,
                input.start_date ?? null,
                input.end_date ?? null,
                input.status ?? 'CURRENT',
                input.frequency ?? null,
                input.personal_notes ?? null,
                input.rating ?? null,
            ]
        );
        return result.rows[0];
    },

    async update(id: string, userId: string, input: Partial<UserProductRow>): Promise<UserProductRow | null> {
        const result = await query<UserProductRow>(
            `UPDATE user_products SET
                start_date = COALESCE($3, start_date),
                end_date = COALESCE($4, end_date),
                status = COALESCE($5, status),
                frequency = COALESCE($6, frequency),
                personal_notes = COALESCE($7, personal_notes),
                rating = COALESCE($8, rating)
             WHERE id = $1 AND user_id = $2
             RETURNING *`,
            [
                id,
                userId,
                input.start_date ?? null,
                input.end_date ?? null,
                input.status ?? null,
                input.frequency ?? null,
                input.personal_notes ?? null,
                input.rating ?? null,
            ]
        );
        return result.rowCount && result.rowCount > 0 ? result.rows[0] : null;
    },

    async delete(id: string, userId: string): Promise<boolean> {
        const result = await query(
            `DELETE FROM user_products WHERE id = $1 AND user_id = $2`,
            [id, userId]
        );
        return (result.rowCount ?? 0) > 0;
    },
};