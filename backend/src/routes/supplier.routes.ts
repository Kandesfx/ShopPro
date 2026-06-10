import { Router } from 'express';
import { db } from '../db';
import { authMiddleware } from '../middleware/auth.middleware';
import { rbacMiddleware } from '../middleware/rbac.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { generatePO_NUMBER } from '../utils/helpers';

const router = Router();

// Get all suppliers
router.get('/', authMiddleware, rbacMiddleware('admin', 'manager', 'staff'), asyncHandler(async (req, res) => {
  const { search, is_active } = req.query;
  
  let whereClause = 'WHERE 1=1';
  const params: any[] = [];

  if (is_active !== undefined) {
    whereClause += ' AND is_active = ?';
    params.push(Number(is_active));
  }

  if (search) {
    whereClause += ' AND (name LIKE ? OR code LIKE ? OR contact_name LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  const suppliers = db.prepare(`
    SELECT * FROM suppliers ${whereClause} ORDER BY name
  `).all(...params);

  res.json({
    success: true,
    data: suppliers,
  });
}));

// Get supplier by ID
router.get('/:id', authMiddleware, rbacMiddleware('admin', 'manager', 'staff'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const supplier = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(id);
  
  if (!supplier) {
    throw ApiError.notFound('Supplier not found');
  }

  res.json({
    success: true,
    data: supplier,
  });
}));

// Create supplier
router.post('/', authMiddleware, rbacMiddleware('admin', 'manager'), asyncHandler(async (req, res) => {
  const { name, contact_name, email, phone, address } = req.body;

  if (!name) {
    throw ApiError.badRequest('Supplier name is required');
  }

  // Generate code
  const lastSupplier = db.prepare('SELECT MAX(id) as max_id FROM suppliers').get() as { max_id: number | null };
  const code = `SUP-${String((lastSupplier.max_id || 0) + 1).padStart(4, '0')}`;

  const result = db.prepare(`
    INSERT INTO suppliers (name, code, contact_name, email, phone, address)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(name, code, contact_name || null, email || null, phone || null, address || null);

  const supplier = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(result.lastInsertRowid);

  res.status(201).json({
    success: true,
    message: 'Supplier created successfully',
    data: supplier,
  });
}));

// Update supplier
router.put('/:id', authMiddleware, rbacMiddleware('admin', 'manager'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, contact_name, email, phone, address, is_active } = req.body;

  const supplier = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(id);
  if (!supplier) {
    throw ApiError.notFound('Supplier not found');
  }

  db.prepare(`
    UPDATE suppliers 
    SET name = COALESCE(?, name),
        contact_name = COALESCE(?, contact_name),
        email = COALESCE(?, email),
        phone = COALESCE(?, phone),
        address = COALESCE(?, address),
        is_active = COALESCE(?, is_active)
    WHERE id = ?
  `).run(name, contact_name, email, phone, address, is_active, id);

  const updated = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(id);

  res.json({
    success: true,
    message: 'Supplier updated successfully',
    data: updated,
  });
}));

// Delete supplier
router.delete('/:id', authMiddleware, rbacMiddleware('admin'), asyncHandler(async (req, res) => {
  const { id } = req.params;

  const supplier = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(id);
  if (!supplier) {
    throw ApiError.notFound('Supplier not found');
  }

  // Check if has purchase orders
  const poCount = db.prepare('SELECT COUNT(*) as count FROM purchase_orders WHERE supplier_id = ?').get(id) as { count: number };

  if (poCount.count > 0) {
    db.prepare('UPDATE suppliers SET is_active = 0 WHERE id = ?').run(id);
  } else {
    db.prepare('DELETE FROM suppliers WHERE id = ?').run(id);
  }

  res.json({
    success: true,
    message: 'Supplier deleted successfully',
  });
}));

// Get purchase orders
router.get('/:id/purchase-orders', authMiddleware, rbacMiddleware('admin', 'manager', 'staff'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.query;

  let whereClause = 'WHERE supplier_id = ?';
  const params: any[] = [id];

  if (status) {
    whereClause += ' AND status = ?';
    params.push(status);
  }

  const orders = db.prepare(`
    SELECT * FROM purchase_orders ${whereClause} ORDER BY created_at DESC
  `).all(...params);

  res.json({
    success: true,
    data: orders,
  });
}));

// Create purchase order
router.post('/:id/purchase-orders', authMiddleware, rbacMiddleware('admin', 'manager'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { items, note } = req.body;

  const supplier = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(id);
  if (!supplier) {
    throw ApiError.notFound('Supplier not found');
  }

  if (!items || items.length === 0) {
    throw ApiError.badRequest('Purchase order must have at least one item');
  }

  const poNumber = generatePO_NUMBER();

  // Calculate totals
  let subtotal = 0;
  for (const item of items) {
    subtotal += item.quantity * item.unit_cost;
  }

  const result = db.prepare(`
    INSERT INTO purchase_orders (po_number, supplier_id, subtotal, total_amount, note, status)
    VALUES (?, ?, ?, ?, ?, 'draft')
  `).run(poNumber, id, subtotal, subtotal, note || null);

  const poId = result.lastInsertRowid as number;

  // Insert items
  const insertItem = db.prepare(`
    INSERT INTO purchase_order_items (purchase_order_id, product_id, variant_id, quantity, unit_cost, line_total)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const item of items) {
    const lineTotal = item.quantity * item.unit_cost;
    insertItem.run(poId, item.product_id, item.variant_id || null, item.quantity, item.unit_cost, lineTotal);
  }

  const po = db.prepare('SELECT * FROM purchase_orders WHERE id = ?').get(poId);
  const poItems = db.prepare('SELECT * FROM purchase_order_items WHERE purchase_order_id = ?').all(poId);

  res.status(201).json({
    success: true,
    message: 'Purchase order created successfully',
    data: { ...po, items: poItems },
  });
}));

export default router;
