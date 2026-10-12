/**
 * Auth tests using a mock repository, no real database required.
 * Demonstrates the auth middleware + role enforcement behavior.
 */
import { Request, Response, NextFunction } from 'express';
import { signToken, requireAuth, requireRole } from '../src/middleware/auth';
import { unauthorized, forbidden } from '../src/utils/responses';
import jwt from 'jsonwebtoken';

describe('Auth middleware', () => {
    const makeReq = (headers: Record<string, string> = {}): Request =>
        ({ headers } as unknown as Request);
    const makeRes = (): Response => {
        const res: Partial<Response> = {};
        res.status = jest.fn().mockReturnValue(res);
        res.json = jest.fn().mockReturnValue(res);
        return res as Response;
    };
    const next: NextFunction = jest.fn();

    beforeEach(() => {
        (next as jest.Mock).mockReset();
    });

    it('rejects requests without Authorization header', () => {
        const req = makeReq();
        const res = makeRes();
        requireAuth(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('rejects invalid tokens', () => {
        const req = makeReq({ authorization: 'Bearer not-a-jwt' });
        const res = makeRes();
        requireAuth(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('accepts a valid token and populates req.user', () => {
        const token = signToken({
            id: '1', email: 'a@b.c', role: 'USER', full_name: 'A', is_active: true,
        });
        const req = makeReq({ authorization: `Bearer ${token}` });
        const res = makeRes();
        requireAuth(req, res, next);
        expect(next).toHaveBeenCalled();
        expect(req.user?.email).toBe('a@b.c');
    });

    it('requireRole blocks users without the required role', () => {
        const middleware = requireRole('ADMIN');
        const req = { user: { id: '1', email: 'a@b.c', role: 'USER', full_name: 'A', is_active: true } } as unknown as Request;
        const res = makeRes();
        middleware(req, res, next);
        expect(forbidden).toBeDefined();
        // it should not call next
        expect(next).not.toHaveBeenCalled();
    });

    it('requireRole allows matching roles', () => {
        const middleware = requireRole('ADMIN');
        const req = { user: { id: '1', email: 'a@b.c', role: 'ADMIN', full_name: 'A', is_active: true } } as unknown as Request;
        const res = makeRes();
        middleware(req, res, next);
        expect(next).toHaveBeenCalled();
    });

    it('expired tokens are rejected', () => {
        const token = jwt.sign(
            { sub: '1', email: 'a@b.c', role: 'USER', full_name: 'A', is_active: true },
            'dev-insecure-secret-change-me',
            { expiresIn: '-1s' }
        );
        const req = makeReq({ authorization: `Bearer ${token}` });
        const res = makeRes();
        requireAuth(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
    });

    it('responses helpers exist', () => {
        expect(typeof unauthorized).toBe('function');
        expect(typeof forbidden).toBe('function');
    });
});