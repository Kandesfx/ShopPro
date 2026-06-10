import { Router } from 'express';
import { orderController } from '../controllers/order.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { rbacMiddleware } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validate.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { z } from 'zod';

const router = Router();

const orderItemSchema = z.object({
  product_id: z.number(),
  variant_id: z.number(),
  quantity: z.number().min(1),
  unit_price: z.number().min(0),
  discount_amount: z.number().optional(),
});

const createOrderSchema = z.object({
  customer_id: z.number().optional(),
  staff_id: z.number().optional(),
  order_type: z.enum(['pos', 'online']),
  items: z.array(orderItemSchema).min(1),
  shipping_full_name: z.string().optional(),
  shipping_phone: z.string().optional(),
  shipping_address: z.string().optional(),
  payment_method: z.enum(['cash', 'bank_transfer', 'vnpay', 'momo', 'cod', 'card', 'combined']),
  promotion_id: z.number().optional(),
  note: z.string().optional(),
  shipping_fee: z.number().optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'completed', 'cancelled', 'returned']),
  reason: z.string().optional(),
});

const paymentSchema = z.object({
  payment_method: z.enum(['cash', 'bank_transfer', 'vnpay', 'momo', 'cod', 'card', 'combined']),
  amount: z.number().min(0),
  transaction_id: z.string().optional(),
});

// Public routes
router.get('/', asyncHandler(orderController.getAll));
router.get('/stats', asyncHandler(orderController.getStats));
router.get('/:id', asyncHandler(orderController.getById));
router.get('/number/:orderNumber', asyncHandler(orderController.getByOrderNumber));

// Protected routes
router.post('/', authMiddleware, validate(createOrderSchema), asyncHandler(orderController.create));
router.put('/:id/status', authMiddleware, validate(updateStatusSchema), asyncHandler(orderController.updateStatus));
router.post('/:id/payment', authMiddleware, validate(paymentSchema), asyncHandler(orderController.recordPayment));

export default router;
