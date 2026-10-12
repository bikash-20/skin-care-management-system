import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { asyncHandler } from '../utils/asyncHandler';
import { requireAuth, requireRole } from '../middleware/auth';
import { authController } from '../controllers/authController';
import { profileController } from '../controllers/profileController';
import { productsController } from '../controllers/productsController';
import { userProductsController } from '../controllers/userProductsController';
import { routinesController } from '../controllers/routinesController';
import { progressController } from '../controllers/progressController';
import { appointmentsController } from '../controllers/appointmentsController';
import { adminController } from '../controllers/adminController';
import { dashboardController } from '../controllers/dashboardController';

const router = Router();

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many authentication attempts, please try again later.' },
});

// Health
router.get('/health', (_req, res) => {
    res.json({ success: true, data: { status: 'ok' } });
});

// Auth
router.post('/auth/register', authLimiter, asyncHandler(authController.register));
router.post('/auth/login', authLimiter, asyncHandler(authController.login));
router.get('/auth/me', requireAuth, asyncHandler(authController.me));
router.post('/auth/logout', requireAuth, asyncHandler(authController.logout));

// Profile
router.get('/profile', requireAuth, asyncHandler(profileController.get));
router.post('/profile', requireAuth, asyncHandler(profileController.upsert));
router.put('/profile', requireAuth, asyncHandler(profileController.upsert));

// Skin concerns
router.get('/skin-concerns', asyncHandler(profileController.listConcerns));
router.get('/profile/concerns', requireAuth, asyncHandler(profileController.getConcerns));
router.put('/profile/concerns', requireAuth, asyncHandler(profileController.setConcerns));

// Public product endpoints
router.get('/products', asyncHandler(productsController.list));
router.get('/products/:id', asyncHandler(productsController.getOne));

// Admin-only product mutations
router.post('/products', requireAuth, requireRole('ADMIN'), asyncHandler(productsController.create));
router.put('/products/:id', requireAuth, requireRole('ADMIN'), asyncHandler(productsController.update));
router.patch('/products/:id/status', requireAuth, requireRole('ADMIN'), asyncHandler(productsController.setActive));
router.delete('/products/:id', requireAuth, requireRole('ADMIN'), asyncHandler(productsController.softDelete));

// Categories
router.get('/categories', asyncHandler(productsController.listCategories));
router.post('/categories', requireAuth, requireRole('ADMIN'), asyncHandler(productsController.createCategory));
router.put('/categories/:id', requireAuth, requireRole('ADMIN'), asyncHandler(productsController.updateCategory));
router.patch('/categories/:id/status', requireAuth, requireRole('ADMIN'), asyncHandler(productsController.setCategoryActive));

// User products
router.get('/my-products', requireAuth, asyncHandler(userProductsController.list));
router.post('/my-products', requireAuth, asyncHandler(userProductsController.create));
router.put('/my-products/:id', requireAuth, asyncHandler(userProductsController.update));
router.delete('/my-products/:id', requireAuth, asyncHandler(userProductsController.delete));

// Routines
router.get('/routines', requireAuth, asyncHandler(routinesController.list));
router.get('/routines/:id', requireAuth, asyncHandler(routinesController.get));
router.post('/routines', requireAuth, asyncHandler(routinesController.create));
router.put('/routines/:id', requireAuth, asyncHandler(routinesController.update));
router.delete('/routines/:id', requireAuth, asyncHandler(routinesController.delete));

// Routine products
router.post('/routines/:id/products', requireAuth, asyncHandler(routinesController.addProduct));
router.put('/routines/:id/products/:routineProductId', requireAuth, asyncHandler(routinesController.updateProduct));
router.delete('/routines/:id/products/:routineProductId', requireAuth, asyncHandler(routinesController.deleteProduct));

// Progress
router.get('/progress', requireAuth, asyncHandler(progressController.list));
router.get('/progress/:id', requireAuth, asyncHandler(progressController.get));
router.post('/progress', requireAuth, asyncHandler(progressController.create));
router.put('/progress/:id', requireAuth, asyncHandler(progressController.update));
router.delete('/progress/:id', requireAuth, asyncHandler(progressController.delete));

// Appointments
router.get('/appointments', requireAuth, asyncHandler(appointmentsController.list));
router.post('/appointments', requireAuth, asyncHandler(appointmentsController.create));
router.put('/appointments/:id', requireAuth, asyncHandler(appointmentsController.update));
router.patch('/appointments/:id/status', requireAuth, requireRole('ADMIN'), asyncHandler(appointmentsController.setStatus));

// Dashboard
router.get('/dashboard', requireAuth, asyncHandler(dashboardController.get));

// Admin
router.get('/admin/stats', requireAuth, requireRole('ADMIN'), asyncHandler(adminController.stats));
router.get('/admin/users', requireAuth, requireRole('ADMIN'), asyncHandler(adminController.listUsers));
router.patch('/admin/users/:id/status', requireAuth, requireRole('ADMIN'), asyncHandler(adminController.setUserActive));
router.get('/admin/audit-logs', requireAuth, requireRole('ADMIN'), asyncHandler(adminController.listAuditLogs));

export default router;