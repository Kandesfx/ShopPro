import { Router } from 'express';
import { productController } from '../controllers/product.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { rbacMiddleware } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validate.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { z } from 'zod';

const router = Router();

const productSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  category_id: z.number().optional(),
  brand_id: z.number().optional(),
  cost_price: z.number().min(0),
  retail_price: z.number().min(0),
  wholesale_price: z.number().min(0),
  barcode: z.string().optional(),
  weight: z.number().optional(),
  images: z.array(z.string()).optional(),
  status: z.enum(['active', 'inactive', 'draft', 'discontinued']).optional(),
});

const variantSchema = z.object({
  size: z.string().optional(),
  color: z.string().optional(),
  color_hex: z.string().optional(),
  price_override: z.number().optional(),
  barcode: z.string().optional(),
  initial_stock: z.number().optional(),
});

// Public routes
router.get('/', asyncHandler(productController.getAll));
router.get('/featured', asyncHandler(productController.getFeatured));
router.get('/related/:id', asyncHandler(productController.getRelated));
router.get('/:id', asyncHandler(productController.getById));
router.get('/slug/:slug', asyncHandler(productController.getBySlug));

// Protected routes
router.post('/', authMiddleware, rbacMiddleware('admin', 'manager', 'staff'), validate(productSchema), asyncHandler(productController.create));
router.put('/:id', authMiddleware, rbacMiddleware('admin', 'manager', 'staff'), asyncHandler(productController.update));
router.delete('/:id', authMiddleware, rbacMiddleware('admin', 'manager'), asyncHandler(productController.delete));

// Variant routes
router.post('/:id/variants', authMiddleware, rbacMiddleware('admin', 'manager', 'staff'), validate(variantSchema), asyncHandler(productController.addVariant));
router.get('/variants/:variantId', asyncHandler(productController.getVariant));
router.put('/variants/:variantId', authMiddleware, rbacMiddleware('admin', 'manager', 'staff'), asyncHandler(productController.updateVariant));
router.delete('/variants/:variantId', authMiddleware, rbacMiddleware('admin', 'manager'), asyncHandler(productController.deleteVariant));

export default router;
