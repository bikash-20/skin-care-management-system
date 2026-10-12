import { Request, Response } from 'express';
import { z } from 'zod';
import { productsRepo } from '../repositories/productsRepo';
import { categoriesRepo } from '../repositories/categoriesRepo';
import { badRequest, notFound, ok, created } from '../utils/responses';
import { writeAudit } from '../utils/audit';

const productCreateSchema = z.object({
    category_id: z.string().regex(/^\d+$/),
    name: z.string().trim().min(1).max(150),
    brand: z.string().trim().max(100).nullable().optional(),
    description: z.string().max(2000).nullable().optional(),
    key_ingredients: z.string().max(1000).nullable().optional(),
    suitable_skin_types: z.string().max(200).nullable().optional(),
    usage_instructions: z.string().max(1000).nullable().optional(),
    price: z.number().min(0).nullable().optional(),
});

const productUpdateSchema = productCreateSchema.partial();

const categoryCreateSchema = z.object({
    name: z.string().trim().min(1).max(100),
    description: z.string().max(500).nullable().optional(),
});

const categoryUpdateSchema = z.object({
    name: z.string().trim().min(1).max(100).optional(),
    description: z.string().max(500).nullable().optional(),
});

function parseId(raw: string): number | null {
    if (!/^\d+$/.test(raw)) return null;
    return Number(raw);
}

export const productsController = {
    async list(req: Request, res: Response): Promise<void> {
        const products = await productsRepo.list({
            search: typeof req.query.search === 'string' ? req.query.search : undefined,
            categoryId: typeof req.query.category_id === 'string' ? req.query.category_id : undefined,
            skinType: typeof req.query.skin_type === 'string' ? req.query.skin_type : undefined,
            activeOnly: req.user?.role !== 'ADMIN',
            limit: req.query.limit ? Number(req.query.limit) : undefined,
            offset: req.query.offset ? Number(req.query.offset) : undefined,
        });
        ok(res, { products });
    },

    async getOne(req: Request, res: Response): Promise<void> {
        const id = parseId(req.params.id);
        if (id === null) { badRequest(res, 'Invalid product id'); return; }
        const includeInactive = req.user?.role === 'ADMIN';
        const product = await productsRepo.findById(String(id), includeInactive);
        if (!product) { notFound(res, 'Product not found'); return; }
        ok(res, { product });
    },

    async create(req: Request, res: Response): Promise<void> {
        const body = productCreateSchema.parse(req.body);
        const category = await categoriesRepo.findById(body.category_id);
        if (!category || !category.is_active) { badRequest(res, 'Category does not exist or is inactive'); return; }
        const product = await productsRepo.create({
            category_id: body.category_id,
            name: body.name,
            brand: body.brand ?? null,
            description: body.description ?? null,
            key_ingredients: body.key_ingredients ?? null,
            suitable_skin_types: body.suitable_skin_types ?? null,
            usage_instructions: body.usage_instructions ?? null,
            price: body.price != null ? String(body.price) : null,
            is_active: true,
        });
        await writeAudit({ userId: req.user?.id, action: 'PRODUCT_CREATED', entityType: 'products', entityId: product.id });
        created(res, { product }, 'Product created');
    },

    async update(req: Request, res: Response): Promise<void> {
        const id = parseId(req.params.id);
        if (id === null) { badRequest(res, 'Invalid product id'); return; }
        const body = productUpdateSchema.parse(req.body);
        const updated = await productsRepo.update(String(id), {
            category_id: body.category_id,
            name: body.name,
            brand: body.brand,
            description: body.description,
            key_ingredients: body.key_ingredients,
            suitable_skin_types: body.suitable_skin_types,
            usage_instructions: body.usage_instructions,
            price: body.price != null ? String(body.price) : undefined,
        });
        if (!updated) { notFound(res, 'Product not found'); return; }
        await writeAudit({ userId: req.user?.id, action: 'PRODUCT_UPDATED', entityType: 'products', entityId: updated.id });
        ok(res, { product: updated }, 'Product updated');
    },

    async setActive(req: Request, res: Response): Promise<void> {
        const id = parseId(req.params.id);
        if (id === null) { badRequest(res, 'Invalid product id'); return; }
        const { is_active } = z.object({ is_active: z.boolean() }).parse(req.body);
        const updated = await productsRepo.setActive(String(id), is_active);
        if (!updated) { notFound(res, 'Product not found'); return; }
        await writeAudit({
            userId: req.user?.id,
            action: is_active ? 'PRODUCT_ACTIVATED' : 'PRODUCT_DEACTIVATED',
            entityType: 'products',
            entityId: updated.id,
        });
        ok(res, { product: updated }, `Product ${is_active ? 'activated' : 'deactivated'}`);
    },

    async softDelete(req: Request, res: Response): Promise<void> {
        const id = parseId(req.params.id);
        if (id === null) { badRequest(res, 'Invalid product id'); return; }
        const ok2 = await productsRepo.softDelete(String(id));
        if (!ok2) { notFound(res, 'Product not found'); return; }
        await writeAudit({ userId: req.user?.id, action: 'PRODUCT_DEACTIVATED', entityType: 'products', entityId: id });
        ok(res, null, 'Product deactivated');
    },

    // Categories
    async listCategories(_req: Request, res: Response): Promise<void> {
        const includeInactive = _req.user?.role === 'ADMIN';
        const categories = await categoriesRepo.list(includeInactive);
        ok(res, { categories });
    },

    async createCategory(req: Request, res: Response): Promise<void> {
        const body = categoryCreateSchema.parse(req.body);
        const category = await categoriesRepo.create(body);
        await writeAudit({ userId: req.user?.id, action: 'CATEGORY_CREATED', entityType: 'product_categories', entityId: category.id });
        created(res, { category }, 'Category created');
    },

    async updateCategory(req: Request, res: Response): Promise<void> {
        const id = parseId(req.params.id);
        if (id === null) { badRequest(res, 'Invalid category id'); return; }
        const body = categoryUpdateSchema.parse(req.body);
        const updated = await categoriesRepo.update(String(id), body);
        if (!updated) { notFound(res, 'Category not found'); return; }
        await writeAudit({ userId: req.user?.id, action: 'CATEGORY_UPDATED', entityType: 'product_categories', entityId: updated.id });
        ok(res, { category: updated }, 'Category updated');
    },

    async setCategoryActive(req: Request, res: Response): Promise<void> {
        const id = parseId(req.params.id);
        if (id === null) { badRequest(res, 'Invalid category id'); return; }
        const { is_active } = z.object({ is_active: z.boolean() }).parse(req.body);
        const updated = await categoriesRepo.setActive(String(id), is_active);
        if (!updated) { notFound(res, 'Category not found'); return; }
        await writeAudit({
            userId: req.user?.id,
            action: is_active ? 'CATEGORY_ACTIVATED' : 'CATEGORY_DEACTIVATED',
            entityType: 'product_categories',
            entityId: updated.id,
        });
        ok(res, { category: updated }, `Category ${is_active ? 'activated' : 'deactivated'}`);
    },
};