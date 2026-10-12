import { query } from '../db/pool';

export interface ProgressRow {
    id: string;
    user_id: string;
    recorded_date: string;
    acne_severity: number | null;
    dryness_level: number | null;
    oiliness_level: number | null;
    redness_level: number | null;
    overall_condition_score: number | null;
    image_url: string | null;
    notes: string | null;
    created_at: string;
}

export const progressRepo = {
    async listByUser(userId: string): Promise<ProgressRow[]> {
        const result = await query<ProgressRow>(
            `SELECT * FROM progress_records WHERE user_id = $1 ORDER BY recorded_date ASC`,
            [userId]
        );
        return result.rows;
    },

    async findById(id: string, userId: string): Promise<ProgressRow | null> {
        const result = await query<ProgressRow>(
            `SELECT * FROM progress_records WHERE id = $1 AND user_id = $2 LIMIT 1`,
            [id, userId]
        );
        return result.rowCount && result.rowCount > 0 ? result.rows[0] : null;
    },

    async create(input: Omit<ProgressRow, 'id' | 'created_at'>): Promise<ProgressRow> {
        const result = await query<ProgressRow>(
            `INSERT INTO progress_records
                (user_id, recorded_date, acne_severity, dryness_level, oiliness_level, redness_level, overall_condition_score, image_url, notes)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
            [
                input.user_id,
                input.recorded_date,
                input.acne_severity,
                input.dryness_level,
                input.oiliness_level,
                input.redness_level,
                input.overall_condition_score,
                input.image_url,
                input.notes,
            ]
        );
        return result.rows[0];
    },

    async update(id: string, userId: string, input: Partial<ProgressRow>): Promise<ProgressRow | null> {
        const result = await query<ProgressRow>(
            `UPDATE progress_records SET
                recorded_date = COALESCE($3, recorded_date),
                acne_severity = COALESCE($4, acne_severity),
                dryness_level = COALESCE($5, dryness_level),
                oiliness_level = COALESCE($6, oiliness_level),
                redness_level = COALESCE($7, redness_level),
                overall_condition_score = COALESCE($8, overall_condition_score),
                image_url = COALESCE($9, image_url),
                notes = COALESCE($10, notes)
             WHERE id = $1 AND user_id = $2
             RETURNING *`,
            [
                id,
                userId,
                input.recorded_date ?? null,
                input.acne_severity ?? null,
                input.dryness_level ?? null,
                input.oiliness_level ?? null,
                input.redness_level ?? null,
                input.overall_condition_score ?? null,
                input.image_url ?? null,
                input.notes ?? null,
            ]
        );
        return result.rowCount && result.rowCount > 0 ? result.rows[0] : null;
    },

    async delete(id: string, userId: string): Promise<boolean> {
        const result = await query(
            `DELETE FROM progress_records WHERE id = $1 AND user_id = $2`,
            [id, userId]
        );
        return (result.rowCount ?? 0) > 0;
    },
};