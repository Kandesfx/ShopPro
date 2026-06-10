import { Router } from 'express';
import { categoryController, brandController } from '../controllers/category.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { rbacMiddleware } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validate.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { z } from 'zod';

const router = Router();

const categorySchema = z.object({
  name: z.string().min(1).max(255),
  parent_id: z.number().optional().nullable(),
  description: z.string().optional(),
  image: z.string().optional(),
  sort_order: z.number().optional(),
  is_active: z.number().optional(),
});

const brandSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  logo: z.string().optional(),
  is_active: z.number().optional(),
});

// Category routes
router.get('/categories', asyncHandler(categoryController.getAll));
router.get('/categories/flat', asyncHandler(categoryController.getAllFlat));
router.get('/categories/:id', asyncHandler(categoryController.getById));
router.get('/categories/slug/:slug', asyncHandler(categoryController.getBySlug));
router.post('/categories', authMiddleware, rbacMiddleware('admin', 'manager'), validate(categorySchema), asyncHandler(categoryController.create));
router.put('/categories/:id', authMiddleware, rbacMiddleware('admin', 'manager'), asyncHandler(categoryController.update));
router.delete('/categories/:id', authMiddleware, rbacMiddleware('admin'), asyncHandler(categoryController.delete));

// Brand routes
router.get('/brands', asyncHandler(brandController.getAll));
router.get('/brands/:id', asyncHandler(brandController.getById));
router.get('/brands/slug/:slug', asyncHandler(brandController.getBySlug));
router.post('/brands', authMiddleware, rbacMiddleware('admin', 'manager'), validate(brandSchema), asyncHandler(brandController.create));
router.put('/brands/:id', authMiddleware, rbacMiddleware('admin', 'manager'), asyncHandler(brandController.update));
router.delete('/brands/:id', authMiddleware, rbacMiddleware('admin'), asyncHandler(brandController.delete));

export default router;
