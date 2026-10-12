export type Role = 'USER' | 'ADMIN';

export interface User {
    id: string;
    email: string;
    role: Role;
    full_name: string;
    is_active: boolean;
    phone?: string | null;
    date_of_birth?: string | null;
    gender?: string | null;
}

export interface AuthResponse {
    token: string;
    user: User;
}

export interface SkinProfile {
    id?: string;
    user_id?: string;
    skin_type: 'DRY' | 'OILY' | 'COMBINATION' | 'NORMAL' | 'SENSITIVE' | 'UNKNOWN' | null;
    notes: string | null;
    created_at?: string;
    updated_at?: string;
}

export interface SkinConcern {
    id: string;
    name: string;
    description: string | null;
}

export interface UserSkinConcern {
    id: string;
    user_id: string;
    concern_id: string;
    severity: number | null;
    notes: string | null;
    concern_name: string;
}

export interface Category {
    id: string;
    name: string;
    description: string | null;
    is_active: boolean;
}

export interface Product {
    id: string;
    category_id: string;
    name: string;
    brand: string | null;
    description: string | null;
    key_ingredients: string | null;
    suitable_skin_types: string | null;
    usage_instructions: string | null;
    price: string | null;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
    category_name?: string;
}

export interface UserProduct {
    id: string;
    user_id: string;
    product_id: string;
    start_date: string | null;
    end_date: string | null;
    status: 'CURRENT' | 'FINISHED' | 'PAUSED' | 'DISCONTINUED';
    frequency: string | null;
    personal_notes: string | null;
    rating: number | null;
    created_at?: string;
    product_name?: string;
    product_brand?: string | null;
    category_name?: string;
}

export interface Routine {
    id: string;
    user_id: string;
    name: string;
    routine_type: 'MORNING' | 'NIGHT' | 'WEEKLY' | 'CUSTOM';
    description: string | null;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface RoutineProduct {
    id: string;
    routine_id: string;
    product_id: string;
    step_order: number;
    frequency: string | null;
    usage_instructions: string | null;
    notes: string | null;
    product_name?: string;
    product_brand?: string | null;
    category_name?: string;
}

export interface ProgressRecord {
    id: string;
    user_id: string;
    recorded_date: string;
    acne_severity: number | null;
    dryness_level: number | null;
    oiliness_level: number | null;
    redness_level: number | null;
    overall_condition_score: number | null;
    image_url: string | null;
    notes: string | null;
    created_at?: string;
}

export interface Appointment {
    id: string;
    user_id: string;
    appointment_date: string;
    appointment_time: string;
    reason: string;
    notes: string | null;
    status: 'REQUESTED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
    created_at?: string;
    updated_at?: string;
    user_full_name?: string;
    user_email?: string;
}

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

export type ApiResponse<T> = ApiSuccess<T> | ApiError;