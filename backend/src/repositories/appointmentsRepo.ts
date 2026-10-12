import { query } from '../db/pool';

export interface AppointmentRow {
    id: string;
    user_id: string;
    appointment_date: string;
    appointment_time: string;
    reason: string;
    notes: string | null;
    status: string;
    created_at: string;
    updated_at: string;
    user_full_name?: string;
    user_email?: string;
}

export interface AppointmentListFilters {
    userId?: string;
    status?: string;
    fromDate?: string;
    toDate?: string;
    limit?: number;
    offset?: number;
}

export const appointmentsRepo = {
    async list(filters: AppointmentListFilters): Promise<AppointmentRow[]> {
        const limit = Math.max(1, Math.min(filters.limit ?? 50, 200));
        const offset = Math.max(0, filters.offset ?? 0);
        const result = await query<AppointmentRow>(
            `SELECT a.*, u.full_name AS user_full_name, u.email AS user_email
             FROM appointments a
             JOIN users u ON u.id = a.user_id
             WHERE ($1::bigint IS NULL OR a.user_id = $1)
               AND ($2::text IS NULL OR a.status = $2)
               AND ($3::date IS NULL OR a.appointment_date >= $3)
               AND ($4::date IS NULL OR a.appointment_date <= $4)
             ORDER BY a.appointment_date ASC, a.appointment_time ASC
             LIMIT $5 OFFSET $6`,
            [
                filters.userId ?? null,
                filters.status ?? null,
                filters.fromDate ?? null,
                filters.toDate ?? null,
                limit,
                offset,
            ]
        );
        return result.rows;
    },

    async findById(id: string): Promise<AppointmentRow | null> {
        const result = await query<AppointmentRow>(
            `SELECT a.*, u.full_name AS user_full_name, u.email AS user_email
             FROM appointments a
             JOIN users u ON u.id = a.user_id
             WHERE a.id = $1 LIMIT 1`,
            [id]
        );
        return result.rowCount && result.rowCount > 0 ? result.rows[0] : null;
    },

    async create(input: Omit<AppointmentRow, 'id' | 'created_at' | 'updated_at' | 'user_full_name' | 'user_email' | 'status'> & { status?: string }): Promise<AppointmentRow> {
        const result = await query<AppointmentRow>(
            `INSERT INTO appointments (user_id, appointment_date, appointment_time, reason, notes, status)
             VALUES ($1, $2, $3, $4, $5, COALESCE($6, 'REQUESTED'))
             RETURNING *`,
            [
                input.user_id,
                input.appointment_date,
                input.appointment_time,
                input.reason,
                input.notes,
                input.status ?? 'REQUESTED',
            ]
        );
        return result.rows[0];
    },

    async update(id: string, userId: string, input: Partial<AppointmentRow>): Promise<AppointmentRow | null> {
        const result = await query<AppointmentRow>(
            `UPDATE appointments SET
                appointment_date = COALESCE($3, appointment_date),
                appointment_time = COALESCE($4, appointment_time),
                reason = COALESCE($5, reason),
                notes = COALESCE($6, notes)
             WHERE id = $1 AND user_id = $2
             RETURNING *`,
            [
                id,
                userId,
                input.appointment_date ?? null,
                input.appointment_time ?? null,
                input.reason ?? null,
                input.notes ?? null,
            ]
        );
        return result.rowCount && result.rowCount > 0 ? result.rows[0] : null;
    },

    async setStatus(id: string, status: string): Promise<AppointmentRow | null> {
        const result = await query<AppointmentRow>(
            `UPDATE appointments SET status = $2 WHERE id = $1 RETURNING *`,
            [id, status]
        );
        return result.rowCount && result.rowCount > 0 ? result.rows[0] : null;
    },
};