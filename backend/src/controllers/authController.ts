import bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import { z } from 'zod';
import { usersRepo } from '../repositories/usersRepo';
import { badRequest, conflict, created, ok, unauthorized } from '../utils/responses';
import { signToken } from '../middleware/auth';
import { writeAudit } from '../utils/audit';

const registerSchema = z.object({
    full_name: z.string().trim().min(1).max(100),
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(8).max(100),
    phone: z.string().trim().min(3).max(30).optional().nullable(),
    date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
    gender: z.string().trim().max(20).optional().nullable(),
});

const loginSchema = z.object({
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(1),
});

function publicUser(u: { id: string; email: string; role: 'USER' | 'ADMIN'; full_name: string; is_active: boolean; phone: string | null; date_of_birth: string | null; gender: string | null }) {
    return {
        id: u.id,
        email: u.email,
        role: u.role,
        full_name: u.full_name,
        is_active: u.is_active,
        phone: u.phone,
        date_of_birth: u.date_of_birth,
        gender: u.gender,
    };
}

export const authController = {
    async register(req: Request, res: Response): Promise<void> {
        const body = registerSchema.parse(req.body);

        const existing = await usersRepo.findByEmail(body.email);
        if (existing) {
            conflict(res, 'An account with that email already exists');
            return;
        }

        const password_hash = await bcrypt.hash(body.password, 10);
        const user = await usersRepo.create({
            full_name: body.full_name,
            email: body.email,
            password_hash,
            phone: body.phone ?? null,
            date_of_birth: body.date_of_birth ?? null,
            gender: body.gender ?? null,
        });

        await writeAudit({ userId: user.id, action: 'USER_REGISTERED', entityType: 'users', entityId: user.id });

        const token = signToken({
            id: user.id,
            email: user.email,
            role: user.role,
            full_name: user.full_name,
            is_active: user.is_active,
        });

        created(res, { token, user: publicUser(user) }, 'Registration successful');
    },

    async login(req: Request, res: Response): Promise<void> {
        const body = loginSchema.parse(req.body);
        const user = await usersRepo.findByEmail(body.email);
        if (!user || !user.is_active) {
            unauthorized(res, 'Invalid email or password');
            return;
        }
        const okPassword = await bcrypt.compare(body.password, user.password_hash);
        if (!okPassword) {
            unauthorized(res, 'Invalid email or password');
            return;
        }
        await writeAudit({ userId: user.id, action: 'USER_LOGIN', entityType: 'users', entityId: user.id });
        const token = signToken({
            id: user.id,
            email: user.email,
            role: user.role,
            full_name: user.full_name,
            is_active: user.is_active,
        });
        ok(res, { token, user: publicUser(user) }, 'Login successful');
    },

    async me(req: Request, res: Response): Promise<void> {
        if (!req.user) {
            unauthorized(res);
            return;
        }
        const user = await usersRepo.findById(req.user.id);
        if (!user) {
            unauthorized(res, 'Account not found');
            return;
        }
        ok(res, { user: publicUser(user) });
    },

    async logout(_req: Request, res: Response): Promise<void> {
        // JWTs are stateless. Client should drop the token.
        ok(res, null, 'Logged out');
    },
};

// Helper used in routes that need password validation feedback without a full Zod parse
export function validateRegisterBody(input: unknown): string | null {
    const result = registerSchema.safeParse(input);
    if (result.success) return null;
    return result.error.errors.map((e) => e.message).join('; ');
}

// (Re-export so other modules can use the schemas if needed.)
export { registerSchema, loginSchema };
export function badRegister(res: Response, msg: string): Response {
    return badRequest(res, msg);
}