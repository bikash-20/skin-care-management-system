import { Request, Response } from 'express';
import { z } from 'zod';
import { appointmentsRepo } from '../repositories/appointmentsRepo';
import { badRequest, notFound, ok, created, unauthorized } from '../utils/responses';
import { writeAudit } from '../utils/audit';

const STATUSES = ['REQUESTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];

const createSchema = z.object({
    appointment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    appointment_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
    reason: z.string().trim().min(1).max(500),
    notes: z.string().max(2000).nullable().optional(),
});

const updateSchema = z.object({
    appointment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    appointment_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional(),
    reason: z.string().trim().min(1).max(500).optional(),
    notes: z.string().max(2000).nullable().optional(),
});

const statusSchema = z.object({
    status: z.enum(STATUSES as [string, ...string[]]),
});

function parseId(raw: string): number | null {
    if (!/^\d+$/.test(raw)) return null;
    return Number(raw);
}

export const appointmentsController = {
    async list(req: Request, res: Response): Promise<void> {
        if (!req.user) { unauthorized(res); return; }
        // Admins can filter by status/date; users can only see their own.
        const filters = {
            userId: req.user.role === 'ADMIN' ? (typeof req.query.user_id === 'string' ? req.query.user_id : undefined) : req.user.id,
            status: typeof req.query.status === 'string' ? req.query.status : undefined,
            fromDate: typeof req.query.from === 'string' ? req.query.from : undefined,
            toDate: typeof req.query.to === 'string' ? req.query.to : undefined,
            limit: req.query.limit ? Number(req.query.limit) : undefined,
            offset: req.query.offset ? Number(req.query.offset) : undefined,
        };
        const items = await appointmentsRepo.list(filters);
        ok(res, { items });
    },

    async create(req: Request, res: Response): Promise<void> {
        if (!req.user) { unauthorized(res); return; }
        const body = createSchema.parse(req.body);
        const appt = await appointmentsRepo.create({
            user_id: req.user.id,
            appointment_date: body.appointment_date,
            appointment_time: body.appointment_time.length === 5 ? `${body.appointment_time}:00` : body.appointment_time,
            reason: body.reason,
            notes: body.notes ?? null,
        });
        await writeAudit({ userId: req.user.id, action: 'APPOINTMENT_CREATED', entityType: 'appointments', entityId: appt.id });
        created(res, { appointment: appt }, 'Appointment requested');
    },

    async update(req: Request, res: Response): Promise<void> {
        if (!req.user) { unauthorized(res); return; }
        const id = parseId(req.params.id);
        if (id === null) { badRequest(res, 'Invalid id'); return; }
        const body = updateSchema.parse(req.body);
        const updated = await appointmentsRepo.update(String(id), req.user.id, {
            appointment_date: body.appointment_date,
            appointment_time: body.appointment_time
                ? (body.appointment_time.length === 5 ? `${body.appointment_time}:00` : body.appointment_time)
                : undefined,
            reason: body.reason,
            notes: body.notes,
        });
        if (!updated) { notFound(res, 'Appointment not found'); return; }
        await writeAudit({ userId: req.user.id, action: 'APPOINTMENT_UPDATED', entityType: 'appointments', entityId: updated.id });
        ok(res, { appointment: updated }, 'Appointment updated');
    },

    async setStatus(req: Request, res: Response): Promise<void> {
        // Only admins can change appointment status.
        const id = parseId(req.params.id);
        if (id === null) { badRequest(res, 'Invalid id'); return; }
        const body = statusSchema.parse(req.body);
        const updated = await appointmentsRepo.setStatus(String(id), body.status);
        if (!updated) { notFound(res, 'Appointment not found'); return; }
        await writeAudit({ userId: req.user?.id, action: 'APPOINTMENT_STATUS_CHANGED', entityType: 'appointments', entityId: updated.id, details: { status: body.status } });
        ok(res, { appointment: updated }, 'Status updated');
    },
};