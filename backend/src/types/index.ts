export type Role = 'USER' | 'ADMIN';

export interface AuthUser {
    id: string;
    email: string;
    role: Role;
    full_name: string;
    is_active: boolean;
}

export interface AuthRequest extends Express.Request {
    user?: AuthUser;
}

declare global {
    namespace Express {
        interface Request {
            user?: AuthUser;
        }
    }
}

export {};