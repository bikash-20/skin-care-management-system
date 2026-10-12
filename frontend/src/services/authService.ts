import { api } from './api';
import { AuthResponse, User } from '../types';

export const authService = {
    async register(input: { full_name: string; email: string; password: string; phone?: string; date_of_birth?: string; gender?: string; }) {
        return api.post<AuthResponse>('/auth/register', input);
    },
    async login(input: { email: string; password: string }) {
        return api.post<AuthResponse>('/auth/login', input);
    },
    async me() {
        return api.get<{ user: User }>('/auth/me');
    },
    async logout() {
        return api.post<null>('/auth/logout');
    },
};