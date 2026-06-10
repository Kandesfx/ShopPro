import { db } from '../db';
import { ApiError } from '../utils/ApiError';
import { Inventory, InventoryMovement, MovementType } from '../types';
import { paginate } from '../utils/helpers';

export class InventoryService {
  async getAll(params: {
    page?: number;
    limit?: number;
    variant_id?: number;
    product_id?: number;
    low_stock?: boolean;
  } = {}): Promise<{ inventory: any[]; total: number }> {
    const { page = 1, limit = 50, variant_id, product_id, low_stock } = params;
    const { take, skip } = paginate(page, limit);

    let whereClause = 'WHERE 1=1';
    const paramsArray: any[] = [];

    if (variant_id) {
      whereClause += ' AND i.variant_id = ?';
      paramsArray.push(variant_id);
    }

    if (product_id) {
      whereClause += ' AND pv.product_id = ?';
      paramsArray.push(product_id);
    }

    if (low_stock) {
      whereClause += ' AND i.quantity <= i.min_stock_level';
    }

    const totalResult = db.prepare(`
      SELECT COUNT(*) as count 
      FROM inventory i
      JOIN product_variants pv ON i.variant_id = pv.id
      ${whereClause}
    `).get(...paramsArray) as { count: number };

    const inventory = db.prepare(`
      SELECT i.*, pv.sku, pv.size, pv.color, pv.color_hex,
             p.name as product_name, p.sku as product_sku,
             b.name as brand_name,
             (i.quantity - i.reserved) as available_stock
      FROM inventory i
      JOIN product_variants pv ON i.variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
      LEFT JOIN brands b ON p.brand_id = b.id
      ${whereClause}
      ORDER BY i.quantity ASC
      LIMIT ? OFFSET ?
    `).all(...paramsArray, take, skip);

    return { inventory, total: totalResult.count };
  }

  async getByVariantId(variantId: number): Promise<any> {
    const inventory = db.prepare(`
      SELECT i.*, pv.sku, pv.size, pv.color, pv.color_hex,
             p.name as product_name, p.retail_price
      FROM inventory i
      JOIN product_variants pv ON i.variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
      WHERE i.variant_id = ?
    `).get(variantId) as any;

    if (!inventory) {
      throw ApiError.notFound('Inventory not found for this variant');
    }

    return {
      ...inventory,
      available_stock: inventory.quantity - inventory.reserved,
    };
  }

  async adjustInventory(data: {
    variant_id: number;
    quantity_change: number;
    reason: string;
    reference_type?: string;
    reference_id?: number;
    created_by?: number;
  }): Promise<any> {
    const { variant_id, quantity_change, reason, reference_type, reference_id, created_by } = data;

    const inventory = db.prepare('SELECT * FROM inventory WHERE variant_id = ?').get(variant_id) as any;

    if (!inventory) {
      throw ApiError.notFound('Inventory record not found');
    }

    const quantityBefore = inventory.quantity;
    const quantityAfter = quantityBefore + quantity_change;

    if (quantityAfter < 0) {
      throw ApiError.badRequest(`Insufficient stock. Current: ${quantityBefore}, Requested: ${Math.abs(quantity_change)}`);
    }

    // Update inventory
    db.prepare(`
      UPDATE inventory SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE variant_id = ?
    `).run(quantityAfter, variant_id);

    // Log movement
    const movementType: MovementType = quantity_change > 0 ? 'import' : 'export';
    db.prepare(`
      INSERT INTO inventory_movements (
        variant_id, movement_type, quantity_change, quantity_before, quantity_after,
        reference_type, reference_id, reason, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(variant_id, movementType, quantity_change, quantityBefore, quantityAfter, reference_type || null, reference_id || null, reason, created_by || null);

    return this.getByVariantId(variant_id);
  }

  async getMovements(params: {
    page?: number;
    limit?: number;
    variant_id?: number;
    product_id?: number;
    movement_type?: string;
    date_from?: string;
    date_to?: string;
  } = {}): Promise<{ movements: any[]; total: number }> {
    const { page = 1, limit = 50, variant_id, product_id, movement_type, date_from, date_to } = params;
    const { take, skip } = paginate(page, limit);

    let whereClause = 'WHERE 1=1';
    const paramsArray: any[] = [];

    if (variant_id) {
      whereClause += ' AND im.variant_id = ?';
      paramsArray.push(variant_id);
    }

    if (product_id) {
      whereClause += ' AND pv.product_id = ?';
      paramsArray.push(product_id);
    }

    if (movement_type) {
      whereClause += ' AND im.movement_type = ?';
      paramsArray.push(movement_type);
    }

    if (date_from) {
      whereClause += ' AND im.created_at >= ?';
      paramsArray.push(date_from);
    }

    if (date_to) {
      whereClause += ' AND im.created_at <= ?';
      paramsArray.push(date_to + ' 23:59:59');
    }

    const totalResult = db.prepare(`
      SELECT COUNT(*) as count 
      FROM inventory_movements im
      JOIN product_variants pv ON im.variant_id = pv.id
      ${whereClause}
    `).get(...paramsArray) as { count: number };

    const movements = db.prepare(`
      SELECT im.*, pv.sku, pv.size, pv.color,
             p.name as product_name,
             u.full_name as created_by_name
      FROM inventory_movements im
      JOIN product_variants pv ON im.variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
      LEFT JOIN users u ON im.created_by = u.id
      ${whereClause}
      ORDER BY im.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...paramsArray, take, skip);

    return { movements, total: totalResult.count };
  }

  async reserveStock(variantId: number, quantity: number, orderId: number, userId?: number): Promise<any> {
    const inventory = db.prepare('SELECT * FROM inventory WHERE variant_id = ?').get(variantId) as any;

    if (!inventory) {
      throw ApiError.notFound('Inventory record not found');
    }

    const availableStock = inventory.quantity - inventory.reserved;
    if (availableStock < quantity) {
      throw ApiError.badRequest(`Insufficient available stock. Available: ${availableStock}, Requested: ${quantity}`);
    }

    const reservedBefore = inventory.reserved;
    const reservedAfter = reservedBefore + quantity;

    db.prepare(`
      UPDATE inventory 
      SET reserved = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE variant_id = ?
    `).run(reservedAfter, variantId);

    // Log movement
    db.prepare(`
      INSERT INTO inventory_movements (
        variant_id, movement_type, quantity_change, quantity_before, quantity_after,
        reference_type, reference_id, reason, created_by
      ) VALUES (?, 'reserve', ?, ?, ?, 'order', ?, 'Stock reserved for order', ?)
    `).run(variantId, quantity, reservedBefore, reservedAfter, orderId, userId);

    return this.getByVariantId(variantId);
  }

  async releaseStock(variantId: number, quantity: number, reason: string, referenceType?: string, referenceId?: number, userId?: number): Promise<any> {
    const inventory = db.prepare('SELECT * FROM inventory WHERE variant_id = ?').get(variantId) as any;

    if (!inventory) {
      throw ApiError.notFound('Inventory record not found');
    }

    if (inventory.reserved < quantity) {
      throw ApiError.badRequest(`Cannot release more than reserved. Reserved: ${inventory.reserved}, Requested: ${quantity}`);
    }

    const reservedBefore = inventory.reserved;
    const reservedAfter = reservedBefore - quantity;

    db.prepare(`
      UPDATE inventory 
      SET reserved = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE variant_id = ?
    `).run(reservedAfter, variantId);

    // Log movement
    db.prepare(`
      INSERT INTO inventory_movements (
        variant_id, movement_type, quantity_change, quantity_before, quantity_after,
        reference_type, reference_id, reason, created_by
      ) VALUES (?, 'release', ?, ?, ?, ?, ?, ?, ?)
    `).run(variantId, -quantity, reservedBefore, reservedAfter, referenceType || null, referenceId || null, reason, userId);

    return this.getByVariantId(variantId);
  }

  async transferStock(fromVariantId: number, toVariantId: number, quantity: number, userId?: number): Promise<any> {
    const fromInventory = db.prepare('SELECT * FROM inventory WHERE variant_id = ?').get(fromVariantId) as any;
    const toInventory = db.prepare('SELECT * FROM inventory WHERE variant_id = ?').get(toVariantId) as any;

    if (!fromInventory) {
      throw ApiError.notFound('Source inventory not found');
    }

    if (!toInventory) {
      throw ApiError.notFound('Destination inventory not found');
    }

    const availableStock = fromInventory.quantity - fromInventory.reserved;
    if (availableStock < quantity) {
      throw ApiError.badRequest(`Insufficient stock to transfer. Available: ${availableStock}, Requested: ${quantity}`);
    }

    // Deduct from source
    db.prepare(`
      UPDATE inventory SET quantity = quantity - ?, updated_at = CURRENT_TIMESTAMP WHERE variant_id = ?
    `).run(quantity, fromVariantId);

    // Add to destination
    db.prepare(`
      UPDATE inventory SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP WHERE variant_id = ?
    `).run(quantity, toVariantId);

    // Log movements
    db.prepare(`
      INSERT INTO inventory_movements (
        variant_id, movement_type, quantity_change, quantity_before, quantity_after,
        reference_type, reference_id, reason, created_by
      ) VALUES (?, 'transfer', ?, ?, ?, 'transfer', ?, 'Transfer to variant ?', ?)
    `).run(fromVariantId, -quantity, fromInventory.quantity, fromInventory.quantity - quantity, toVariantId, toVariantId, userId);

    const newToInventory = db.prepare('SELECT * FROM inventory WHERE variant_id = ?').get(toVariantId) as any;
    db.prepare(`
      INSERT INTO inventory_movements (
        variant_id, movement_type, quantity_change, quantity_before, quantity_after,
        reference_type, reference_id, reason, created_by
      ) VALUES (?, 'transfer', ?, ?, ?, 'transfer', ?, 'Transfer from variant ?', ?)
    `).run(toVariantId, quantity, toInventory.quantity, toInventory.quantity + quantity, toVariantId, fromVariantId, userId);

    return {
      from: await this.getByVariantId(fromVariantId),
      to: await this.getByVariantId(toVariantId),
    };
  }

  async getLowStockAlerts(): Promise<any[]> {
    return db.prepare(`
      SELECT i.*, pv.sku, pv.size, pv.color, pv.color_hex,
             p.name as product_name, p.id as product_id,
             b.name as brand_name,
             (i.quantity - i.reserved) as available_stock
      FROM inventory i
      JOIN product_variants pv ON i.variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE i.quantity <= i.min_stock_level
      ORDER BY (i.quantity - i.reserved) ASC
    `).all();
  }

  async getStockReport(): Promise<any> {
    const totalProducts = db.prepare(`
      SELECT COUNT(DISTINCT product_id) as count FROM product_variants
    `).get() as { count: number };

    const totalVariants = db.prepare('SELECT COUNT(*) as count FROM product_variants').get() as { count: number };

    const stockSummary = db.prepare(`
      SELECT 
        SUM(quantity) as total_quantity,
        SUM(reserved) as total_reserved,
        SUM(quantity - reserved) as total_available,
        AVG(quantity) as avg_quantity,
        COUNT(CASE WHEN quantity <= min_stock_level THEN 1 END) as low_stock_count,
        COUNT(CASE WHEN quantity = 0 THEN 1 END) as out_of_stock_count
      FROM inventory
    `).get() as any;

    const stockByCategory = db.prepare(`
      SELECT c.name as category, 
             SUM(i.quantity) as total_quantity,
             SUM(i.quantity - i.reserved) as available_quantity,
             COUNT(DISTINCT p.id) as product_count
      FROM inventory i
      JOIN product_variants pv ON i.variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
      JOIN categories c ON p.category_id = c.id
      GROUP BY c.id
      ORDER BY total_quantity DESC
    `).all();

    const stockByBrand = db.prepare(`
      SELECT COALESCE(b.name, 'No Brand') as brand,
             SUM(i.quantity) as total_quantity,
             SUM(i.quantity - i.reserved) as available_quantity,
             COUNT(DISTINCT p.id) as product_count
      FROM inventory i
      JOIN product_variants pv ON i.variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
      LEFT JOIN brands b ON p.brand_id = b.id
      GROUP BY b.id
      ORDER BY total_quantity DESC
    `).all();

    return {
      total_products: totalProducts.count,
      total_variants: totalVariants.count,
      stock_summary: stockSummary,
      stock_by_category: stockByCategory,
      stock_by_brand: stockByBrand,
    };
  }
}

export const inventoryService = new InventoryService();
