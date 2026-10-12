import { Request, Response } from 'express';
import { z } from 'zod';
import { query } from '../db/pool';
import { usersRepo } from '../repositories/usersRepo';
import { ok, badRequest, notFound } from '../utils/responses';
import { writeAudit } from '../utils/audit';

const setActiveSchema = z.object({ is_active: z.boolean() });

function parseId(raw: string): number | null {
    if (!/^\d+$/.test(raw)) return null;
    return Number(raw);
}

export const adminController = {
    async stats(_req: Request, res: Response): Promise<void> {
        // Aggregate queries demonstrating GROUP BY, COUNT, COUNT(DISTINCT ...)
        const totalsResult = await query<{
            total_users: string; active_users: string;
            total_products: string; active_products: string;
            total_categories: string;
            total_appointments: string; pending_appointments: string;
            total_progress: string; total_routines: string; total_user_products: string;
        }>(
            `SELECT
                (SELECT COUNT(*) FROM users) AS total_users,
                (SELECT COUNT(*) FROM users WHERE is_active = TRUE) AS active_users,
                (SELECT COUNT(*) FROM products) AS total_products,
                (SELECT COUNT(*) FROM products WHERE is_active = TRUE) AS active_products,
                (SELECT COUNT(*) FROM product_categories WHERE is_active = TRUE) AS total_categories,
                (SELECT COUNT(*) FROM appointments) AS total_appointments,
                (SELECT COUNT(*) FROM appointments WHERE status = 'REQUESTED') AS pending_appointments,
                (SELECT COUNT(*) FROM progress_records) AS total_progress,
                (SELECT COUNT(*) FROM routines) AS total_routines,
                (SELECT COUNT(*) FROM user_products) AS total_user_products`
        );
        const totals = totalsResult.rows[0];

        // Products per category using LEFT JOIN + GROUP BY
        const productsPerCategory = await query<{ category_name: string; product_count: string }>(
            `SELECT c.name AS category_name, COUNT(p.id) AS product_count
             FROM product_categories c
             LEFT JOIN products p ON p.category_id = c.id
             GROUP BY c.id, c.name
             ORDER BY product_count DESC, c.name ASC`
        );

        // Recent registrations (last 5)
        const recent = await query<{ id: string; full_name: string; email: string; role: string; created_at: string }>(
            `SELECT id, full_name, email, role, created_at
             FROM users
             ORDER BY created_at DESC
             LIMIT 5`
        );

        ok(res, {
            totals,
            products_per_category: productsPerCategory.rows,
            recent_registrations: recent.rows,
        });
    },

    async listUsers(req: Request, res: Response): Promise<void> {
        const search = typeof req.query.search === 'string' ? req.query.search : undefined;
        const limit = req.query.limit ? Number(req.query.limit) : undefined;
        const offset = req.query.offset ? Number(req.query.offset) : undefined;
        const users = await usersRepo.list({ search, limit, offset });
        ok(res, { users });
    },

    async setUserActive(req: Request, res: Response): Promise<void> {
        const id = parseId(req.params.id);
        if (id === null) { badRequest(res, 'Invalid user id'); return; }
        const body = setActiveSchema.parse(req.body);
        const updated = await usersRepo.setActive(String(id), body.is_active);
        if (!updated) { notFound(res, 'User not found'); return; }
        await writeAudit({
            userId: req.user?.id,
            action: body.is_active ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
            entityType: 'users',
            entityId: updated.id,
        });
        ok(res, { user: { id: updated.id, is_active: updated.is_active, full_name: updated.full_name, email: updated.email } });
    },

    async listAuditLogs(req: Request, res: Response): Promise<void> {
        const limit = Math.min(Number(req.query.limit ?? 100), 200);
        const offset = Math.max(Number(req.query.offset ?? 0), 0);
        const result = await query(
            `SELECT id, user_id, action, entity_type, entity_id, details, created_at
             FROM audit_logs
             ORDER BY created_at DESC
             LIMIT $1 OFFSET $2`,
            [limit, offset]
        );
        ok(res, { logs: result.rows });
    },
};