import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { badRequest, serverError } from '../utils/responses';
import { isProd } from '../config';

export class HttpError extends Error {
    status: number;
    constructor(status: number, message: string) {
        super(message);
        this.status = status;
    }
}

// 404 handler
export function notFoundHandler(_req: Request, res: Response): void {
    res.status(404).json({ success: false, message: 'Route not found' });
}

// Centralized error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
    if (err instanceof ZodError) {
        const message = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
        badRequest(res, 'Validation failed', message);
        return;
    }
    if (err instanceof HttpError) {
        res.status(err.status).json({ success: false, message: err.message });
        return;
    }
    // Postgres unique violation
    if (typeof err === 'object' && err && (err as { code?: string }).code === '23505') {
        badRequest(res, 'Duplicate value violates a unique constraint');
        return;
    }
    if (typeof err === 'object' && err && (err as { code?: string }).code === '23503') {
        badRequest(res, 'Referenced record does not exist');
        return;
    }
    if (typeof err === 'object' && err && (err as { code?: string }).code === '23514') {
        badRequest(res, 'A value violates a check constraint');
        return;
    }
    // eslint-disable-next-line no-console
    console.error('Unhandled error:', err);
    serverError(res, 'Internal server error', isProd ? undefined : (err as Error)?.message);
}