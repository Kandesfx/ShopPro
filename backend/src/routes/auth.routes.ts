import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { rbacMiddleware } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validate.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { z } from 'zod';

const router = Router();

const registerSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  full_name: z.string().optional(),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

// Public routes
router.post('/register', validate(registerSchema), asyncHandler(authController.register));
router.post('/login', validate(loginSchema), asyncHandler(authController.login));
router.post('/logout', asyncHandler(authController.logout));
router.post('/refresh-token', asyncHandler(authController.refreshToken));

// Protected routes
router.get('/profile', authMiddleware, asyncHandler(authController.getProfile));
router.put('/profile', authMiddleware, asyncHandler(authController.updateProfile));
router.post('/change-password', authMiddleware, asyncHandler(authController.changePassword));

// Admin routes
router.get('/users', authMiddleware, rbacMiddleware('admin', 'manager'), asyncHandler(authController.getAllUsers));
router.put('/users/:id/role', authMiddleware, rbacMiddleware('admin'), asyncHandler(authController.updateUserRole));
router.put('/users/:id/toggle-status', authMiddleware, rbacMiddleware('admin'), asyncHandler(authController.toggleUserStatus));

export default router;
