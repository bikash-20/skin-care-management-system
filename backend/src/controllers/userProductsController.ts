import { Request, Response } from 'express';
import { z } from 'zod';
import { userProductsRepo } from '../repositories/userProductsRepo';
import { productsRepo } from '../repositories/productsRepo';
import { badRequest, notFound, ok, created, unauthorized } from '../utils/responses';
import { writeAudit } from '../utils/audit';

const STATUSES = ['CURRENT', 'FINISHED', 'PAUSED', 'DISCONTINUED'];

const createSchema = z.object({
    product_id: z.string().regex(/^\d+$/),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
    status: z.enum(STATUSES as [string, ...string[]]).optional(),
    frequency: z.string().max(100).nullable().optional(),
    personal_notes: z.string().max(2000).nullable().optional(),
    rating: z.number().int().min(1).max(5).nullable().optional(),
});

const updateSchema = createSchema.partial().extend({
    product_id: z.string().regex(/^\d+$/).optional(),
});

function parseId(raw: string): number | null {
    if (!/^\d+$/.test(raw)) return null;
    return Number(raw);
}

export const userProductsController = {
    async list(req: Request, res: Response): Promise<void> {
        if (!req.user) { unauthorized(res); return; }
        const items = await userProductsRepo.listByUser(req.user.id);
        ok(res, { items });
    },

    async create(req: Request, res: Response): Promise<void> {
        if (!req.user) { unauthorized(res); return; }
        const body = createSchema.parse(req.body);
        const product = await productsRepo.findById(body.product_id);
        if (!product) { badRequest(res, 'Product not found'); return; }
        const item = await userProductsRepo.create({
            user_id: req.user.id,
            product_id: body.product_id,
            start_date: body.start_date ?? null,
            end_date: body.end_date ?? null,
            status: body.status ?? 'CURRENT',
            frequency: body.frequency ?? null,
            personal_notes: body.personal_notes ?? null,
            rating: body.rating ?? null,
        });
        await writeAudit({ userId: req.user.id, action: 'USER_PRODUCT_ADDED', entityType: 'user_products', entityId: item.id });
        created(res, { item }, 'Product added to your cabinet');
    },

    async update(req: Request, res: Response): Promise<void> {
        if (!req.user) { unauthorized(res); return; }
        const id = parseId(req.params.id);
        if (id === null) { badRequest(res, 'Invalid id'); return; }
        const body = updateSchema.parse(req.body);
        const updated = await userProductsRepo.update(String(id), req.user.id, {
            product_id: body.product_id,
            start_date: body.start_date ?? undefined,
            end_date: body.end_date ?? undefined,
            status: body.status,
            frequency: body.frequency,
            personal_notes: body.personal_notes,
            rating: body.rating,
        });
        if (!updated) { notFound(res, 'User product not found'); return; }
        await writeAudit({ userId: req.user.id, action: 'USER_PRODUCT_UPDATED', entityType: 'user_products', entityId: updated.id });
        ok(res, { item: updated }, 'Updated');
    },

    async delete(req: Request, res: Response): Promise<void> {
        if (!req.user) { unauthorized(res); return; }
        const id = parseId(req.params.id);
        if (id === null) { badRequest(res, 'Invalid id'); return; }
        const ok2 = await userProductsRepo.delete(String(id), req.user.id);
        if (!ok2) { notFound(res, 'User product not found'); return; }
        await writeAudit({ userId: req.user.id, action: 'USER_PRODUCT_REMOVED', entityType: 'user_products', entityId: id });
        ok(res, null, 'Removed');
    },
};