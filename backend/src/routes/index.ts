import { Router } from 'express';
import authRoutes from './auth.routes';
import productRoutes from './product.routes';
import categoryRoutes from './category.routes';
import orderRoutes from './order.routes';
import inventoryRoutes from './inventory.routes';
import customerRoutes from './customer.routes';
import promotionRoutes from './promotion.routes';
import reportRoutes from './report.routes';
import supplierRoutes from './supplier.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/orders', orderRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/customers', customerRoutes);
router.use('/promotions', promotionRoutes);
router.use('/reports', reportRoutes);
router.use('/suppliers', supplierRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'ShopPro API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

export default router;
