import { Request, Response } from 'express';
import { z } from 'zod';
import { routinesRepo } from '../repositories/routinesRepo';
import { productsRepo } from '../repositories/productsRepo';
import { badRequest, notFound, ok, created, unauthorized } from '../utils/responses';
import { writeAudit } from '../utils/audit';

const ROUTINE_TYPES = ['MORNING', 'NIGHT', 'WEEKLY', 'CUSTOM'];

const createSchema = z.object({
    name: z.string().trim().min(1).max(150),
    routine_type: z.enum(ROUTINE_TYPES as [string, ...string[]]),
    description: z.string().max(2000).nullable().optional(),
    is_active: z.boolean().optional(),
    products: z
        .array(
            z.object({
                product_id: z.string().regex(/^\d+$/),
                step_order: z.number().int().min(1).max(99),
                frequency: z.string().max(100).nullable().optional(),
                usage_instructions: z.string().max(500).nullable().optional(),
                notes: z.string().max(500).nullable().optional(),
            })
        )
        .optional(),
});

const updateSchema = z.object({
    name: z.string().trim().min(1).max(150).optional(),
    routine_type: z.enum(ROUTINE_TYPES as [string, ...string[]]).optional(),
    description: z.string().max(2000).nullable().optional(),
    is_active: z.boolean().optional(),
    products: z
        .array(
            z.object({
                product_id: z.string().regex(/^\d+$/),
                step_order: z.number().int().min(1).max(99),
                frequency: z.string().max(100).nullable().optional(),
                usage_instructions: z.string().max(500).nullable().optional(),
                notes: z.string().max(500).nullable().optional(),
            })
        )
        .optional(),
});

const routineProductAddSchema = z.object({
    product_id: z.string().regex(/^\d+$/),
    step_order: z.number().int().min(1).max(99),
    frequency: z.string().max(100).nullable().optional(),
    usage_instructions: z.string().max(500).nullable().optional(),
    notes: z.string().max(500).nullable().optional(),
});

const routineProductUpdateSchema = z.object({
    step_order: z.number().int().min(1).max(99).optional(),
    frequency: z.string().max(100).nullable().optional(),
    usage_instructions: z.string().max(500).nullable().optional(),
    notes: z.string().max(500).nullable().optional(),
});

function parseId(raw: string): number | null {
    if (!/^\d+$/.test(raw)) return null;
    return Number(raw);
}

export const routinesController = {
    async list(req: Request, res: Response): Promise<void> {
        if (!req.user) { unauthorized(res); return; }
        const routines = await routinesRepo.listByUser(req.user.id);
        ok(res, { routines });
    },

    async get(req: Request, res: Response): Promise<void> {
        if (!req.user) { unauthorized(res); return; }
        const id = parseId(req.params.id);
        if (id === null) { badRequest(res, 'Invalid routine id'); return; }
        const routine = await routinesRepo.findById(String(id), req.user.id);
        if (!routine) { notFound(res, 'Routine not found'); return; }
        const products = await routinesRepo.listProducts(String(id));
        ok(res, { routine, products });
    },

    async create(req: Request, res: Response): Promise<void> {
        if (!req.user) { unauthorized(res); return; }
        const body = createSchema.parse(req.body);
        // Validate product ids exist
        if (body.products && body.products.length > 0) {
            for (const item of body.products) {
                const p = await productsRepo.findById(item.product_id, true);
                if (!p) { badRequest(res, `Product ${item.product_id} not found`); return; }
            }
        }

        // Create routine, then atomically add products (transaction inside repo).
        const routine = await routinesRepo.create({
            user_id: req.user.id,
            name: body.name,
            routine_type: body.routine_type,
            description: body.description ?? null,
            is_active: body.is_active ?? true,
        });
        if (body.products && body.products.length > 0) {
            await routinesRepo.replaceProducts(
                routine.id,
                body.products.map((p) => ({
                    product_id: p.product_id,
                    step_order: p.step_order,
                    frequency: p.frequency ?? null,
                    usage_instructions: p.usage_instructions ?? null,
                    notes: p.notes ?? null,
                }))
            );
        }
        await writeAudit({ userId: req.user.id, action: 'ROUTINE_CREATED', entityType: 'routines', entityId: routine.id });
        const products = await routinesRepo.listProducts(routine.id);
        created(res, { routine, products }, 'Routine created');
    },

    async update(req: Request, res: Response): Promise<void> {
        if (!req.user) { unauthorized(res); return; }
        const id = parseId(req.params.id);
        if (id === null) { badRequest(res, 'Invalid routine id'); return; }
        const body = updateSchema.parse(req.body);
        const routine = await routinesRepo.update(String(id), req.user.id, {
            name: body.name,
            routine_type: body.routine_type,
            description: body.description,
            is_active: body.is_active,
        });
        if (!routine) { notFound(res, 'Routine not found'); return; }
        if (body.products) {
            for (const item of body.products) {
                const p = await productsRepo.findById(item.product_id, true);
                if (!p) { badRequest(res, `Product ${item.product_id} not found`); return; }
            }
            await routinesRepo.replaceProducts(
                String(id),
                body.products.map((p) => ({
                    product_id: p.product_id,
                    step_order: p.step_order,
                    frequency: p.frequency ?? null,
                    usage_instructions: p.usage_instructions ?? null,
                    notes: p.notes ?? null,
                }))
            );
        }
        await writeAudit({ userId: req.user.id, action: 'ROUTINE_UPDATED', entityType: 'routines', entityId: routine.id });
        const products = await routinesRepo.listProducts(String(id));
        ok(res, { routine, products }, 'Routine updated');
    },

    async delete(req: Request, res: Response): Promise<void> {
        if (!req.user) { unauthorized(res); return; }
        const id = parseId(req.params.id);
        if (id === null) { badRequest(res, 'Invalid routine id'); return; }
        const ok2 = await routinesRepo.delete(String(id), req.user.id);
        if (!ok2) { notFound(res, 'Routine not found'); return; }
        await writeAudit({ userId: req.user.id, action: 'ROUTINE_DELETED', entityType: 'routines', entityId: id });
        ok(res, null, 'Routine deleted');
    },

    async addProduct(req: Request, res: Response): Promise<void> {
        if (!req.user) { unauthorized(res); return; }
        const id = parseId(req.params.id);
        if (id === null) { badRequest(res, 'Invalid routine id'); return; }
        const routine = await routinesRepo.findById(String(id), req.user.id);
        if (!routine) { notFound(res, 'Routine not found'); return; }
        const body = routineProductAddSchema.parse(req.body);
        const product = await productsRepo.findById(body.product_id, true);
        if (!product) { badRequest(res, 'Product not found'); return; }
        const rp = await routinesRepo.addProduct(String(id), body);
        await writeAudit({ userId: req.user.id, action: 'ROUTINE_PRODUCT_ADDED', entityType: 'routine_products', entityId: rp.id });
        created(res, { routine_product: rp }, 'Product added to routine');
    },

    async updateProduct(req: Request, res: Response): Promise<void> {
        if (!req.user) { unauthorized(res); return; }
        const id = parseId(req.params.id);
        const rpId = parseId(req.params.routineProductId);
        if (id === null || rpId === null) { badRequest(res, 'Invalid id'); return; }
        const routine = await routinesRepo.findById(String(id), req.user.id);
        if (!routine) { notFound(res, 'Routine not found'); return; }
        const body = routineProductUpdateSchema.parse(req.body);
        const updated = await routinesRepo.updateProduct(String(rpId), String(id), body);
        if (!updated) { notFound(res, 'Routine product not found'); return; }
        await writeAudit({ userId: req.user.id, action: 'ROUTINE_PRODUCT_UPDATED', entityType: 'routine_products', entityId: rpId });
        ok(res, { routine_product: updated }, 'Updated');
    },

    async deleteProduct(req: Request, res: Response): Promise<void> {
        if (!req.user) { unauthorized(res); return; }
        const id = parseId(req.params.id);
        const rpId = parseId(req.params.routineProductId);
        if (id === null || rpId === null) { badRequest(res, 'Invalid id'); return; }
        const routine = await routinesRepo.findById(String(id), req.user.id);
        if (!routine) { notFound(res, 'Routine not found'); return; }
        const ok2 = await routinesRepo.deleteProduct(String(rpId), String(id));
        if (!ok2) { notFound(res, 'Routine product not found'); return; }
        await writeAudit({ userId: req.user.id, action: 'ROUTINE_PRODUCT_REMOVED', entityType: 'routine_products', entityId: rpId });
        ok(res, null, 'Removed');
    },
};