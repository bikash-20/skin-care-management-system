import { api } from './api';
import {
    Appointment, Category, Product, ProgressRecord, Routine, RoutineProduct,
    SkinConcern, SkinProfile, UserProduct, UserSkinConcern,
} from '../types';

export const profileService = {
    async get() { return api.get<{ profile: SkinProfile | null }>('/profile'); },
    async upsert(input: { skin_type: SkinProfile['skin_type']; notes: string | null }) {
        return api.post<{ profile: SkinProfile }>('/profile', input);
    },
    async listConcerns() { return api.get<{ concerns: SkinConcern[] }>('/skin-concerns'); },
    async getUserConcerns() { return api.get<{ concerns: UserSkinConcern[] }>('/profile/concerns'); },
    async setUserConcerns(concerns: Array<{ concern_id: string; severity: number | null; notes: string | null }>) {
        return api.put<{ concerns: UserSkinConcern[] }>('/profile/concerns', { concerns });
    },
};

export const productsService = {
    async list(filters: { search?: string; category_id?: string; skin_type?: string } = {}) {
        const q = new URLSearchParams();
        if (filters.search) q.set('search', filters.search);
        if (filters.category_id) q.set('category_id', filters.category_id);
        if (filters.skin_type) q.set('skin_type', filters.skin_type);
        return api.get<{ products: Product[] }>(`/products?${q.toString()}`);
    },
    async get(id: string) { return api.get<{ product: Product }>(`/products/${id}`); },
    async create(input: Partial<Product> & { category_id: string; name: string }) {
        return api.post<{ product: Product }>('/products', input);
    },
    async update(id: string, input: Partial<Product>) {
        return api.put<{ product: Product }>(`/products/${id}`, input);
    },
    async setActive(id: string, is_active: boolean) {
        return api.patch<{ product: Product }>(`/products/${id}/status`, { is_active });
    },
    async softDelete(id: string) { return api.del<null>(`/products/${id}`); },
};

export const categoriesService = {
    async list() { return api.get<{ categories: Category[] }>('/categories'); },
    async create(input: { name: string; description?: string }) {
        return api.post<{ category: Category }>('/categories', input);
    },
    async update(id: string, input: Partial<Category>) {
        return api.put<{ category: Category }>(`/categories/${id}`, input);
    },
    async setActive(id: string, is_active: boolean) {
        return api.patch<{ category: Category }>(`/categories/${id}/status`, { is_active });
    },
};

export const userProductsService = {
    async list() { return api.get<{ items: UserProduct[] }>('/my-products'); },
    async create(input: Partial<UserProduct> & { product_id: string }) {
        return api.post<{ item: UserProduct }>('/my-products', input);
    },
    async update(id: string, input: Partial<UserProduct>) {
        return api.put<{ item: UserProduct }>(`/my-products/${id}`, input);
    },
    async delete(id: string) { return api.del<null>(`/my-products/${id}`); },
};

export const routinesService = {
    async list() { return api.get<{ routines: Routine[] }>('/routines'); },
    async get(id: string) {
        return api.get<{ routine: Routine; products: RoutineProduct[] }>(`/routines/${id}`);
    },
    async create(input: Partial<Routine> & { name: string; routine_type: Routine['routine_type']; products?: Array<{ product_id: string; step_order: number }> }) {
        return api.post<{ routine: Routine; products: RoutineProduct[] }>('/routines', input);
    },
    async update(id: string, input: Partial<Routine> & { products?: Array<{ product_id: string; step_order: number }> }) {
        return api.put<{ routine: Routine; products: RoutineProduct[] }>(`/routines/${id}`, input);
    },
    async delete(id: string) { return api.del<null>(`/routines/${id}`); },
    async addProduct(routineId: string, input: { product_id: string; step_order: number; frequency?: string | null }) {
        return api.post<{ routine_product: RoutineProduct }>(`/routines/${routineId}/products`, input);
    },
    async updateProduct(routineId: string, rpId: string, input: Partial<RoutineProduct>) {
        return api.put<{ routine_product: RoutineProduct }>(`/routines/${routineId}/products/${rpId}`, input);
    },
    async deleteProduct(routineId: string, rpId: string) {
        return api.del<null>(`/routines/${routineId}/products/${rpId}`);
    },
};

export const progressService = {
    async list() { return api.get<{ records: ProgressRecord[] }>('/progress'); },
    async get(id: string) { return api.get<{ record: ProgressRecord }>(`/progress/${id}`); },
    async create(input: Partial<ProgressRecord> & { recorded_date: string }) {
        return api.post<{ record: ProgressRecord }>('/progress', input);
    },
    async update(id: string, input: Partial<ProgressRecord>) {
        return api.put<{ record: ProgressRecord }>(`/progress/${id}`, input);
    },
    async delete(id: string) { return api.del<null>(`/progress/${id}`); },
};

export const appointmentsService = {
    async list(filters: { status?: string } = {}) {
        const q = new URLSearchParams();
        if (filters.status) q.set('status', filters.status);
        return api.get<{ items: Appointment[] }>(`/appointments?${q.toString()}`);
    },
    async create(input: { appointment_date: string; appointment_time: string; reason: string; notes?: string }) {
        return api.post<{ appointment: Appointment }>('/appointments', input);
    },
    async update(id: string, input: Partial<Appointment>) {
        return api.put<{ appointment: Appointment }>(`/appointments/${id}`, input);
    },
    async setStatus(id: string, status: Appointment['status']) {
        return api.patch<{ appointment: Appointment }>(`/appointments/${id}/status`, { status });
    },
};

export const dashboardService = {
    async get() { return api.get<Record<string, unknown>>('/dashboard'); },
};

export interface AdminStats {
    totals: Record<string, string>;
    products_per_category: Array<{ category_name: string; product_count: string }>;
    recent_registrations: Array<{ id: string; full_name: string; email: string; role: string; created_at: string }>;
}

export interface AdminUser {
    id: string;
    full_name: string;
    email: string;
    role: string;
    is_active: boolean;
    created_at: string;
}

export interface AuditLog {
    id: string;
    user_id: string | null;
    action: string;
    entity_type: string | null;
    entity_id: string | null;
    details: Record<string, unknown> | null;
    created_at: string;
}

export const adminService = {
    async stats() { return api.get<AdminStats>('/admin/stats'); },
    async listUsers(search?: string) {
        const q = search ? `?search=${encodeURIComponent(search)}` : '';
        return api.get<{ users: AdminUser[] }>(`/admin/users${q}`);
    },
    async setUserActive(id: string, is_active: boolean) {
        return api.patch<{ user: AdminUser }>(`/admin/users/${id}/status`, { is_active });
    },
    async listAuditLogs() { return api.get<{ logs: AuditLog[] }>('/admin/audit-logs'); },
};