import { query } from '../db/pool';

export interface ProductRow {
    id: string;
    category_id: string;
    name: string;
    brand: string | null;
    description: string | null;
    key_ingredients: string | null;
    suitable_skin_types: string | null;
    usage_instructions: string | null;
    price: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    category_name?: string;
}

export interface ProductListFilters {
    search?: string;
    categoryId?: string;
    skinType?: string;
    activeOnly?: boolean;
    limit?: number;
    offset?: number;
}

export const productsRepo = {
    async list(filters: ProductListFilters): Promise<ProductRow[]> {
        const search = filters.search ? `%${filters.search.toLowerCase()}%` : null;
        const limit = Math.max(1, Math.min(filters.limit ?? 50, 100));
        const offset = Math.max(0, filters.offset ?? 0);
        const result = await query<ProductRow>(
            `SELECT p.*, c.name AS category_name
             FROM products p
             JOIN product_categories c ON c.id = p.category_id
             WHERE ($1::text IS NULL OR LOWER(p.name) LIKE $1 OR LOWER(p.brand) LIKE $1)
               AND ($2::bigint IS NULL OR p.category_id = $2)
               AND ($3::text IS NULL OR p.suitable_skin_types LIKE $3)
               AND ($4::boolean OR p.is_active = TRUE)
             ORDER BY p.name ASC
             LIMIT $5 OFFSET $6`,
            [
                search,
                filters.categoryId ?? null,
                filters.skinType ? `%${filters.skinType}%` : null,
                !filters.activeOnly,
                limit,
                offset,
            ]
        );
        return result.rows;
    },

    async findById(id: string, includeInactive = false): Promise<ProductRow | null> {
        const result = await query<ProductRow>(
            `SELECT p.*, c.name AS category_name
             FROM products p
             JOIN product_categories c ON c.id = p.category_id
             WHERE p.id = $1 AND ($2::boolean OR p.is_active = TRUE)
             LIMIT 1`,
            [id, includeInactive]
        );
        return result.rowCount && result.rowCount > 0 ? result.rows[0] : null;
    },

    async create(input: Omit<ProductRow, 'id' | 'created_at' | 'updated_at' | 'category_name'>): Promise<ProductRow> {
        const result = await query<ProductRow>(
            `INSERT INTO products
                (category_id, name, brand, description, key_ingredients, suitable_skin_types, usage_instructions, price, is_active)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, COALESCE($10, TRUE))
             RETURNING *`,
            [
                input.category_id,
                input.name,
                input.brand,
                input.description,
                input.key_ingredients,
                input.suitable_skin_types,
                input.usage_instructions,
                input.price,
                input.is_active ?? true,
            ]
        );
        return result.rows[0];
    },

    async update(id: string, input: Partial<ProductRow>): Promise<ProductRow | null> {
        const result = await query<ProductRow>(
            `UPDATE products SET
                category_id = COALESCE($2, category_id),
                name = COALESCE($3, name),
                brand = COALESCE($4, brand),
                description = COALESCE($5, description),
                key_ingredients = COALESCE($6, key_ingredients),
                suitable_skin_types = COALESCE($7, suitable_skin_types),
                usage_instructions = COALESCE($8, usage_instructions),
                price = COALESCE($9, price)
             WHERE id = $1
             RETURNING *`,
            [
                id,
                input.category_id ?? null,
                input.name ?? null,
                input.brand ?? null,
                input.description ?? null,
                input.key_ingredients ?? null,
                input.suitable_skin_types ?? null,
                input.usage_instructions ?? null,
                input.price ?? null,
            ]
        );
        return result.rowCount && result.rowCount > 0 ? result.rows[0] : null;
    },

    async setActive(id: string, active: boolean): Promise<ProductRow | null> {
        const result = await query<ProductRow>(
            `UPDATE products SET is_active = $2 WHERE id = $1 RETURNING *`,
            [id, active]
        );
        return result.rowCount && result.rowCount > 0 ? result.rows[0] : null;
    },

    /**
     * Soft delete: prefer setting is_active = false to preserve history.
     * Hard delete only when there are no references.
     */
    async softDelete(id: string): Promise<boolean> {
        const result = await query(
            `UPDATE products SET is_active = FALSE WHERE id = $1 RETURNING id`,
            [id]
        );
        return (result.rowCount ?? 0) > 0;
    },
};