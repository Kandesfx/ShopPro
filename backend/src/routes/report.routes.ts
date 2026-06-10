import { Router } from 'express';
import { reportController } from '../controllers/report.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { rbacMiddleware } from '../middleware/rbac.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// All report routes require authentication
router.use(authMiddleware);

router.get('/dashboard', rbacMiddleware('admin', 'manager', 'staff', 'accountant'), asyncHandler(reportController.getDashboardStats));
router.get('/sales', rbacMiddleware('admin', 'manager', 'accountant'), asyncHandler(reportController.getSalesReport));
router.get('/products', rbacMiddleware('admin', 'manager', 'accountant'), asyncHandler(reportController.getProductReport));
router.get('/categories', rbacMiddleware('admin', 'manager', 'accountant'), asyncHandler(reportController.getCategoryReport));
router.get('/inventory', rbacMiddleware('admin', 'manager'), asyncHandler(reportController.getInventoryReport));
router.get('/customers', rbacMiddleware('admin', 'manager', 'accountant'), asyncHandler(reportController.getCustomerReport));
router.get('/payment-methods', rbacMiddleware('admin', 'manager', 'accountant'), asyncHandler(reportController.getRevenueByPaymentMethod));

export default router;
