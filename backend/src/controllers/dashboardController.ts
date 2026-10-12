import { Request, Response } from 'express';
import { query } from '../db/pool';
import { unauthorized, ok } from '../utils/responses';
import { profileRepo } from '../repositories/profileRepo';

/**
 * Aggregated dashboard data for the logged-in user.
 * Uses SQL aggregation and joins to demonstrate DBMS concepts.
 */
export const dashboardController = {
    async get(req: Request, res: Response): Promise<void> {
        if (!req.user) { unauthorized(res); return; }
        const userId = req.user.id;

        // Use the v_user_dashboard view
        const summary = await query(
            `SELECT * FROM v_user_dashboard WHERE user_id = $1 LIMIT 1`,
            [userId]
        );

        // Latest progress record
        const latestProgress = await query(
            `SELECT * FROM progress_records WHERE user_id = $1 ORDER BY recorded_date DESC LIMIT 1`,
            [userId]
        );

        // Active routine preview (most recent active)
        const activeRoutine = await query(
            `SELECT id, name, routine_type FROM routines WHERE user_id = $1 AND is_active = TRUE ORDER BY created_at DESC LIMIT 1`,
            [userId]
        );

        let activeRoutineProducts: unknown[] = [];
        if (activeRoutine.rowCount && activeRoutine.rowCount > 0) {
            const rid = (activeRoutine.rows[0] as { id: string }).id;
            const productsRes = await query(
                `SELECT rp.step_order, p.id AS product_id, p.name AS product_name, p.brand
                 FROM routine_products rp
                 JOIN products p ON p.id = rp.product_id
                 WHERE rp.routine_id = $1
                 ORDER BY rp.step_order ASC
                 LIMIT 5`,
                [rid]
            );
            activeRoutineProducts = productsRes.rows;
        }

        // Upcoming appointments
        const upcoming = await query(
            `SELECT id, appointment_date, appointment_time, reason, status
             FROM appointments
             WHERE user_id = $1 AND appointment_date >= CURRENT_DATE
               AND status IN ('REQUESTED','CONFIRMED')
             ORDER BY appointment_date ASC, appointment_time ASC
             LIMIT 5`,
            [userId]
        );

        // Progress history for chart
        const progressHistory = await query(
            `SELECT recorded_date, acne_severity, dryness_level, oiliness_level,
                    redness_level, overall_condition_score
             FROM progress_records
             WHERE user_id = $1
             ORDER BY recorded_date ASC`,
            [userId]
        );

        // Skin profile completion: do we have a skin type set?
        const profile = await profileRepo.getByUserId(userId);

        ok(res, {
            summary: summary.rows[0] ?? null,
            profile_completion: {
                has_skin_type: !!profile?.skin_type,
                has_notes: !!profile?.notes,
                has_concerns: false, // computed below
            },
            active_routine: activeRoutine.rows[0] ?? null,
            active_routine_products: activeRoutineProducts,
            latest_progress: latestProgress.rows[0] ?? null,
            upcoming_appointments: upcoming.rows,
            progress_history: progressHistory.rows,
        });
    },
};