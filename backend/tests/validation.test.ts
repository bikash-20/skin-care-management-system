/**
 * Pure validation tests that don't require a database.
 * Validates the Zod schemas used by the auth controller.
 */
import { registerSchema, loginSchema } from '../src/controllers/authController';

describe('Auth schemas', () => {
    it('registerSchema accepts valid input', () => {
        const result = registerSchema.safeParse({
            full_name: 'Alice',
            email: 'alice@example.com',
            password: 'StrongP@ss123',
            phone: '+1-555-0100',
            date_of_birth: '1990-01-01',
        });
        expect(result.success).toBe(true);
    });

    it('registerSchema rejects invalid email', () => {
        const result = registerSchema.safeParse({
            full_name: 'Alice',
            email: 'not-an-email',
            password: 'StrongP@ss123',
        });
        expect(result.success).toBe(false);
    });

    it('registerSchema rejects short password', () => {
        const result = registerSchema.safeParse({
            full_name: 'Alice',
            email: 'alice@example.com',
            password: 'short',
        });
        expect(result.success).toBe(false);
    });

    it('loginSchema accepts valid input', () => {
        const result = loginSchema.safeParse({
            email: 'alice@example.com',
            password: 'whatever',
        });
        expect(result.success).toBe(true);
    });
});