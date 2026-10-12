import { query, withTransaction } from '../db/pool';

export interface SkinProfileRow {
    id: string;
    user_id: string;
    skin_type: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export const profileRepo = {
    async getByUserId(userId: string): Promise<SkinProfileRow | null> {
        const result = await query<SkinProfileRow>(
            `SELECT * FROM skin_profiles WHERE user_id = $1 LIMIT 1`,
            [userId]
        );
        return result.rowCount && result.rowCount > 0 ? result.rows[0] : null;
    },

    /**
     * Upsert skin profile for a user (one-to-one).
     */
    async upsert(userId: string, skinType: string | null, notes: string | null): Promise<SkinProfileRow> {
        return withTransaction(async (client) => {
            const result = await client.query<SkinProfileRow>(
                `INSERT INTO skin_profiles (user_id, skin_type, notes)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (user_id) DO UPDATE
                    SET skin_type = EXCLUDED.skin_type,
                        notes     = EXCLUDED.notes
                 RETURNING *`,
                [userId, skinType, notes]
            );
            return result.rows[0];
        });
    },

    async listConcerns(): Promise<{ id: string; name: string; description: string | null }[]> {
        const result = await query<{ id: string; name: string; description: string | null }>(
            `SELECT id, name, description FROM skin_concerns ORDER BY name ASC`
        );
        return result.rows;
    },

    async getUserConcerns(userId: string) {
        const result = await query(
            `SELECT usc.id, usc.user_id, usc.concern_id, usc.severity, usc.notes,
                    sc.name AS concern_name
             FROM user_skin_concerns usc
             JOIN skin_concerns sc ON sc.id = usc.concern_id
             WHERE usc.user_id = $1
             ORDER BY sc.name ASC`,
            [userId]
        );
        return result.rows;
    },

    /**
     * Replace a user's full list of concerns atomically.
     */
    async replaceUserConcerns(
        userId: string,
        concerns: Array<{ concern_id: string; severity: number | null; notes: string | null }>
    ): Promise<void> {
        await withTransaction(async (client) => {
            await client.query(`DELETE FROM user_skin_concerns WHERE user_id = $1`, [userId]);
            for (const c of concerns) {
                await client.query(
                    `INSERT INTO user_skin_concerns (user_id, concern_id, severity, notes)
                     VALUES ($1, $2, $3, $4)`,
                    [userId, c.concern_id, c.severity, c.notes]
                );
            }
        });
    },
};