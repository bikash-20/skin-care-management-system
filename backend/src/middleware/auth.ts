import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { unauthorized, forbidden } from '../utils/responses';
import { AuthUser, Role } from '../types';

export interface JwtPayload {
    sub: string;
    email: string;
    role: Role;
    full_name: string;
    is_active: boolean;
}

export function signToken(user: AuthUser): string {
    const payload: JwtPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
        is_active: user.is_active,
    };
    return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn } as jwt.SignOptions);
}

export function verifyToken(token: string): JwtPayload {
    return jwt.verify(token, config.jwtSecret) as JwtPayload;
}

/**
 * Require a valid JWT. Populates req.user.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        unauthorized(res, 'Missing or invalid Authorization header');
        return;
    }
    const token = header.slice('Bearer '.length).trim();
    try {
        const payload = verifyToken(token);
        if (!payload.is_active) {
            unauthorized(res, 'Account is inactive');
            return;
        }
        req.user = {
            id: payload.sub,
            email: payload.email,
            role: payload.role,
            full_name: payload.full_name,
            is_active: payload.is_active,
        };
        next();
    } catch {
        unauthorized(res, 'Invalid or expired token');
    }
}

/**
 * Require one of the given roles. Must be used after requireAuth.
 */
export function requireRole(...roles: Role[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            unauthorized(res);
            return;
        }
        if (!roles.includes(req.user.role)) {
            forbidden(res, 'Insufficient permissions');
            return;
        }
        next();
    };
}