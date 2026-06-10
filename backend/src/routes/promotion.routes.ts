import { Router } from 'express';
import { promotionController } from '../controllers/promotion.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { rbacMiddleware } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validate.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { z } from 'zod';

const router = Router();

const promotionSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(255),
  type: z.enum(['percentage', 'fixed_amount', 'free_shipping']),
  value: z.number().min(0),
  max_discount: z.number().optional(),
  min_order_amount: z.number().optional(),
  max_uses: z.number().optional(),
  max_uses_per_customer: z.number().optional(),
  start_date: z.string(),
  end_date: z.string(),
  applicable_type: z.string().optional(),
  applicable_ids: z.string().optional(),
  is_active: z.number().optional(),
  is_public: z.number().optional(),
  priority: z.number().optional(),
});

// Public routes
router.get('/', asyncHandler(promotionController.getAll));
router.get('/active', asyncHandler(promotionController.getActivePromotions));
router.get('/validate', asyncHandler(promotionController.validateCode));
router.get('/:id', asyncHandler(promotionController.getById));
router.get('/code/:code', asyncHandler(promotionController.getByCode));

// Protected routes
router.post('/', authMiddleware, rbacMiddleware('admin', 'manager'), validate(promotionSchema), asyncHandler(promotionController.create));
router.put('/:id', authMiddleware, rbacMiddleware('admin', 'manager'), asyncHandler(promotionController.update));
router.delete('/:id', authMiddleware, rbacMiddleware('admin'), asyncHandler(promotionController.delete));
router.get('/:id/stats', authMiddleware, rbacMiddleware('admin', 'manager'), asyncHandler(promotionController.getPromotionStats));

export default router;
