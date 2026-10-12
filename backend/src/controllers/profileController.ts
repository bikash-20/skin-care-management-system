import { Request, Response } from 'express';
import { z } from 'zod';
import { profileRepo } from '../repositories/profileRepo';
import { ok, unauthorized } from '../utils/responses';
import { writeAudit } from '../utils/audit';

const profileSchema = z.object({
    skin_type: z.enum(['DRY', 'OILY', 'COMBINATION', 'NORMAL', 'SENSITIVE', 'UNKNOWN']).nullable().optional(),
    notes: z.string().max(2000).nullable().optional(),
});

const concernsSchema = z.object({
    concerns: z
        .array(
            z.object({
                concern_id: z.string().regex(/^\d+$/),
                severity: z.number().int().min(1).max(5).nullable().optional(),
                notes: z.string().max(500).nullable().optional(),
            })
        )
        .max(50),
});

export const profileController = {
    async get(req: Request, res: Response): Promise<void> {
        if (!req.user) { unauthorized(res); return; }
        const profile = await profileRepo.getByUserId(req.user.id);
        ok(res, { profile });
    },

    async upsert(req: Request, res: Response): Promise<void> {
        if (!req.user) { unauthorized(res); return; }
        const body = profileSchema.parse(req.body);
        const profile = await profileRepo.upsert(
            req.user.id,
            body.skin_type ?? null,
            body.notes ?? null
        );
        await writeAudit({ userId: req.user.id, action: 'PROFILE_UPDATED', entityType: 'skin_profiles', entityId: profile.id });
        ok(res, { profile }, 'Profile saved');
    },

    async listConcerns(_req: Request, res: Response): Promise<void> {
        const concerns = await profileRepo.listConcerns();
        ok(res, { concerns });
    },

    async getConcerns(req: Request, res: Response): Promise<void> {
        if (!req.user) { unauthorized(res); return; }
        const concerns = await profileRepo.getUserConcerns(req.user.id);
        ok(res, { concerns });
    },

    async setConcerns(req: Request, res: Response): Promise<void> {
        if (!req.user) { unauthorized(res); return; }
        const body = concernsSchema.parse(req.body);
        await profileRepo.replaceUserConcerns(
            req.user.id,
            body.concerns.map((c) => ({
                concern_id: c.concern_id,
                severity: c.severity ?? null,
                notes: c.notes ?? null,
            }))
        );
        await writeAudit({ userId: req.user.id, action: 'PROFILE_CONCERNS_UPDATED', entityType: 'user_skin_concerns' });
        const updated = await profileRepo.getUserConcerns(req.user.id);
        ok(res, { concerns: updated }, 'Concerns updated');
    },
};