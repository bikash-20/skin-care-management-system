import { query } from '../db/pool';

export interface CategoryRow {
    id: string;
    name: string;
    description: string | null;
    is_active: boolean;
}

export const categoriesRepo = {
    async list(includeInactive = false): Promise<CategoryRow[]> {
        const result = await query<CategoryRow>(
            `SELECT id, name, description, is_active
             FROM product_categories
             WHERE ($1::boolean OR is_active = TRUE)
             ORDER BY name ASC`,
            [includeInactive]
        );
        return result.rows;
    },

    async findById(id: string): Promise<CategoryRow | null> {
        const result = await query<CategoryRow>(
            `SELECT id, name, description, is_active FROM product_categories WHERE id = $1 LIMIT 1`,
            [id]
        );
        return result.rowCount && result.rowCount > 0 ? result.rows[0] : null;
    },

    async create(input: { name: string; description?: string | null }): Promise<CategoryRow> {
        const result = await query<CategoryRow>(
            `INSERT INTO product_categories (name, description) VALUES ($1, $2) RETURNING *`,
            [input.name, input.description ?? null]
        );
        return result.rows[0];
    },

    async update(id: string, input: { name?: string; description?: string | null }): Promise<CategoryRow | null> {
        const result = await query<CategoryRow>(
            `UPDATE product_categories
             SET name = COALESCE($2, name),
                 description = COALESCE($3, description)
             WHERE id = $1
             RETURNING *`,
            [id, input.name ?? null, input.description ?? null]
        );
        return result.rowCount && result.rowCount > 0 ? result.rows[0] : null;
    },

    async setActive(id: string, active: boolean): Promise<CategoryRow | null> {
        const result = await query<CategoryRow>(
            `UPDATE product_categories SET is_active = $2 WHERE id = $1 RETURNING *`,
            [id, active]
        );
        return result.rowCount && result.rowCount > 0 ? result.rows[0] : null;
    },
};