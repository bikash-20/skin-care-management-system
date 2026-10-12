import { Response } from 'express';

export interface ApiSuccess<T> {
    success: true;
    message?: string;
    data: T;
}

export interface ApiError {
    success: false;
    message: string;
    error?: string;
}

export function ok<T>(res: Response, data: T, message?: string): Response<ApiSuccess<T>> {
    return res.status(200).json({ success: true, message, data });
}

export function created<T>(res: Response, data: T, message = 'Created'): Response<ApiSuccess<T>> {
    return res.status(201).json({ success: true, message, data });
}

export function noContent(res: Response): Response {
    return res.status(204).send();
}

export function badRequest(res: Response, message: string, error?: string): Response<ApiError> {
    return res.status(400).json({ success: false, message, error });
}

export function unauthorized(res: Response, message = 'Unauthorized'): Response<ApiError> {
    return res.status(401).json({ success: false, message });
}

export function forbidden(res: Response, message = 'Forbidden'): Response<ApiError> {
    return res.status(403).json({ success: false, message });
}

export function notFound(res: Response, message = 'Not found'): Response<ApiError> {
    return res.status(404).json({ success: false, message });
}

export function conflict(res: Response, message: string): Response<ApiError> {
    return res.status(409).json({ success: false, message });
}

export function serverError(res: Response, message = 'Internal server error', error?: string): Response<ApiError> {
    return res.status(500).json({ success: false, message, error });
}