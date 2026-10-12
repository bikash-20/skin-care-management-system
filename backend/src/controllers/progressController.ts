import { Request, Response } from 'express';
import { z } from 'zod';
import { progressRepo } from '../repositories/progressRepo';
import { badRequest, notFound, ok, created, unauthorized } from '../utils/responses';
import { writeAudit } from '../utils/audit';

const levelRange = z.number().int().min(1).max(5).nullable().optional();

const createSchema = z.object({
    recorded_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    acne_severity: levelRange,
    dryness_level: levelRange,
    oiliness_level: levelRange,
    redness_level: levelRange,
    overall_condition_score: levelRange,
    image_url: z.string().max(2000).nullable().optional(),
    notes: z.string().max(2000).nullable().optional(),
});

const updateSchema = createSchema.partial();

function parseId(raw: string): number | null {
    if (!/^\d+$/.test(raw)) return null;
    return Number(raw);
}

export const progressController = {
    async list(req: Request, res: Response): Promise<void> {
        if (!req.user) { unauthorized(res); return; }
        const records = await progressRepo.listByUser(req.user.id);
        ok(res, { records });
    },

    async get(req: Request, res: Response): Promise<void> {
        if (!req.user) { unauthorized(res); return; }
        const id = parseId(req.params.id);
        if (id === null) { badRequest(res, 'Invalid id'); return; }
        const record = await progressRepo.findById(String(id), req.user.id);
        if (!record) { notFound(res, 'Progress record not found'); return; }
        ok(res, { record });
    },

    async create(req: Request, res: Response): Promise<void> {
        if (!req.user) { unauthorized(res); return; }
        const body = createSchema.parse(req.body);
        const record = await progressRepo.create({
            user_id: req.user.id,
            recorded_date: body.recorded_date,
            acne_severity: body.acne_severity ?? null,
            dryness_level: body.dryness_level ?? null,
            oiliness_level: body.oiliness_level ?? null,
            redness_level: body.redness_level ?? null,
            overall_condition_score: body.overall_condition_score ?? null,
            image_url: body.image_url ?? null,
            notes: body.notes ?? null,
        });
        await writeAudit({ userId: req.user.id, action: 'PROGRESS_RECORDED', entityType: 'progress_records', entityId: record.id });
        created(res, { record }, 'Progress recorded');
    },

    async update(req: Request, res: Response): Promise<void> {
        if (!req.user) { unauthorized(res); return; }
        const id = parseId(req.params.id);
        if (id === null) { badRequest(res, 'Invalid id'); return; }
        const body = updateSchema.parse(req.body);
        const updated = await progressRepo.update(String(id), req.user.id, {
            recorded_date: body.recorded_date,
            acne_severity: body.acne_severity,
            dryness_level: body.dryness_level,
            oiliness_level: body.oiliness_level,
            redness_level: body.redness_level,
            overall_condition_score: body.overall_condition_score,
            image_url: body.image_url,
            notes: body.notes,
        });
        if (!updated) { notFound(res, 'Progress record not found'); return; }
        await writeAudit({ userId: req.user.id, action: 'PROGRESS_UPDATED', entityType: 'progress_records', entityId: updated.id });
        ok(res, { record: updated }, 'Progress updated');
    },

    async delete(req: Request, res: Response): Promise<void> {
        if (!req.user) { unauthorized(res); return; }
        const id = parseId(req.params.id);
        if (id === null) { badRequest(res, 'Invalid id'); return; }
        const ok2 = await progressRepo.delete(String(id), req.user.id);
        if (!ok2) { notFound(res, 'Progress record not found'); return; }
        await writeAudit({ userId: req.user.id, action: 'PROGRESS_DELETED', entityType: 'progress_records', entityId: id });
        ok(res, null, 'Progress deleted');
    },
};