import { Router } from 'express';
import { inventoryController } from '../controllers/inventory.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { rbacMiddleware } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validate.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { z } from 'zod';

const router = Router();

const adjustSchema = z.object({
  variant_id: z.number(),
  quantity_change: z.number(),
  reason: z.string().min(1),
  reference_type: z.string().optional(),
  reference_id: z.number().optional(),
});

// Public routes
router.get('/', authMiddleware, rbacMiddleware('admin', 'manager', 'staff'), asyncHandler(inventoryController.getAll));
router.get('/low-stock', authMiddleware, rbacMiddleware('admin', 'manager', 'staff'), asyncHandler(inventoryController.getLowStockAlerts));
router.get('/report', authMiddleware, rbacMiddleware('admin', 'manager', 'accountant'), asyncHandler(inventoryController.getStockReport));
router.get('/movements', authMiddleware, rbacMiddleware('admin', 'manager', 'staff'), asyncHandler(inventoryController.getMovements));
router.get('/variant/:variantId', asyncHandler(inventoryController.getByVariantId));

// Protected routes
router.post('/adjust', authMiddleware, rbacMiddleware('admin', 'manager', 'staff'), validate(adjustSchema), asyncHandler(inventoryController.adjustInventory));

export default router;
