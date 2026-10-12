import { query, withTransaction } from '../db/pool';

export interface RoutineRow {
    id: string;
    user_id: string;
    name: string;
    routine_type: string;
    description: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface RoutineProductRow {
    id: string;
    routine_id: string;
    product_id: string;
    step_order: number;
    frequency: string | null;
    usage_instructions: string | null;
    notes: string | null;
    product_name?: string;
    product_brand?: string | null;
    category_name?: string;
}

export const routinesRepo = {
    async listByUser(userId: string): Promise<RoutineRow[]> {
        const result = await query<RoutineRow>(
            `SELECT * FROM routines WHERE user_id = $1 ORDER BY created_at DESC`,
            [userId]
        );
        return result.rows;
    },

    async findById(id: string, userId: string): Promise<RoutineRow | null> {
        const result = await query<RoutineRow>(
            `SELECT * FROM routines WHERE id = $1 AND user_id = $2 LIMIT 1`,
            [id, userId]
        );
        return result.rowCount && result.rowCount > 0 ? result.rows[0] : null;
    },

    async listProducts(routineId: string): Promise<RoutineProductRow[]> {
        const result = await query<RoutineProductRow>(
            `SELECT rp.*, p.name AS product_name, p.brand AS product_brand, c.name AS category_name
             FROM routine_products rp
             JOIN products p ON p.id = rp.product_id
             JOIN product_categories c ON c.id = p.category_id
             WHERE rp.routine_id = $1
             ORDER BY rp.step_order ASC`,
            [routineId]
        );
        return result.rows;
    },

    async create(input: Omit<RoutineRow, 'id' | 'created_at' | 'updated_at'>): Promise<RoutineRow> {
        const result = await query<RoutineRow>(
            `INSERT INTO routines (user_id, name, routine_type, description, is_active)
             VALUES ($1, $2, $3, $4, COALESCE($5, TRUE))
             RETURNING *`,
            [
                input.user_id,
                input.name,
                input.routine_type,
                input.description ?? null,
                input.is_active ?? true,
            ]
        );
        return result.rows[0];
    },

    async update(id: string, userId: string, input: Partial<RoutineRow>): Promise<RoutineRow | null> {
        const result = await query<RoutineRow>(
            `UPDATE routines SET
                name = COALESCE($3, name),
                routine_type = COALESCE($4, routine_type),
                description = COALESCE($5, description),
                is_active = COALESCE($6, is_active)
             WHERE id = $1 AND user_id = $2
             RETURNING *`,
            [
                id,
                userId,
                input.name ?? null,
                input.routine_type ?? null,
                input.description ?? null,
                input.is_active ?? null,
            ]
        );
        return result.rowCount && result.rowCount > 0 ? result.rows[0] : null;
    },

    async delete(id: string, userId: string): Promise<boolean> {
        const result = await query(
            `DELETE FROM routines WHERE id = $1 AND user_id = $2`,
            [id, userId]
        );
        return (result.rowCount ?? 0) > 0;
    },

    /**
     * Replace the routine products atomically (transaction).
     * Either all steps are saved, or none are.
     */
    async replaceProducts(
        routineId: string,
        items: Array<{ product_id: string; step_order: number; frequency?: string | null; usage_instructions?: string | null; notes?: string | null }>
    ): Promise<void> {
        await withTransaction(async (client) => {
            await client.query(`DELETE FROM routine_products WHERE routine_id = $1`, [routineId]);
            for (const item of items) {
                await client.query(
                    `INSERT INTO routine_products (routine_id, product_id, step_order, frequency, usage_instructions, notes)
                     VALUES ($1, $2, $3, $4, $5, $6)`,
                    [
                        routineId,
                        item.product_id,
                        item.step_order,
                        item.frequency ?? null,
                        item.usage_instructions ?? null,
                        item.notes ?? null,
                    ]
                );
            }
        });
    },

    async addProduct(routineId: string, item: {
        product_id: string; step_order: number; frequency?: string | null; usage_instructions?: string | null; notes?: string | null;
    }): Promise<RoutineProductRow> {
        const result = await query<RoutineProductRow>(
            `INSERT INTO routine_products (routine_id, product_id, step_order, frequency, usage_instructions, notes)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [routineId, item.product_id, item.step_order, item.frequency ?? null, item.usage_instructions ?? null, item.notes ?? null]
        );
        return result.rows[0];
    },

    async updateProduct(routineProductId: string, routineId: string, item: Partial<RoutineProductRow>): Promise<RoutineProductRow | null> {
        const result = await query<RoutineProductRow>(
            `UPDATE routine_products SET
                step_order = COALESCE($3, step_order),
                frequency = COALESCE($4, frequency),
                usage_instructions = COALESCE($5, usage_instructions),
                notes = COALESCE($6, notes)
             WHERE id = $1 AND routine_id = $2
             RETURNING *`,
            [
                routineProductId,
                routineId,
                item.step_order ?? null,
                item.frequency ?? null,
                item.usage_instructions ?? null,
                item.notes ?? null,
            ]
        );
        return result.rowCount && result.rowCount > 0 ? result.rows[0] : null;
    },

    async deleteProduct(routineProductId: string, routineId: string): Promise<boolean> {
        const result = await query(
            `DELETE FROM routine_products WHERE id = $1 AND routine_id = $2`,
            [routineProductId, routineId]
        );
        return (result.rowCount ?? 0) > 0;
    },
};