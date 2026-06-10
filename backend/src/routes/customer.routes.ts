import { Router } from 'express';
import { customerController } from '../controllers/customer.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { rbacMiddleware } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validate.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { z } from 'zod';

const router = Router();

const createCustomerSchema = z.object({
  full_name: z.string().min(1).max(255),
  phone: z.string().min(1).max(20),
  email: z.string().email().optional(),
  gender: z.string().optional(),
  date_of_birth: z.string().optional(),
  customer_type: z.enum(['regular', 'vip', 'wholesale']).optional(),
  user_id: z.number().optional(),
});

const updateCustomerSchema = createCustomerSchema.partial();

// Public routes
router.get('/', asyncHandler(customerController.getAll));
router.get('/stats', asyncHandler(customerController.getStats));
router.get('/loyalty-tiers', asyncHandler(customerController.getLoyaltyTiers));
router.get('/top', asyncHandler(customerController.getTopCustomers));
router.get('/:id', asyncHandler(customerController.getById));
router.get('/phone/:phone', asyncHandler(customerController.getByPhone));

// Protected routes
router.post('/', authMiddleware, rbacMiddleware('admin', 'manager', 'staff'), validate(createCustomerSchema), asyncHandler(customerController.create));
router.put('/:id', authMiddleware, rbacMiddleware('admin', 'manager', 'staff'), validate(updateCustomerSchema), asyncHandler(customerController.update));
router.post('/:id/points', authMiddleware, rbacMiddleware('admin', 'manager'), asyncHandler(customerController.addPoints));
router.post('/:id/redeem', authMiddleware, rbacMiddleware('admin', 'manager', 'staff'), asyncHandler(customerController.redeemPoints));

export default router;
