import { db } from '../db';
import { ApiError } from '../utils/ApiError';
import { Order, OrderItem, Payment, OrderStatus } from '../types';
import { generateOrderNumber, paginate, calculateDiscount, addLoyaltyPoints, getLoyaltyTier } from '../utils/helpers';

export class OrderService {
  async getAll(params: {
    page?: number;
    limit?: number;
    customer_id?: number;
    staff_id?: number;
    status?: string;
    payment_status?: string;
    order_type?: string;
    date_from?: string;
    date_to?: string;
    search?: string;
  } = {}): Promise<{ orders: any[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 20, customer_id, staff_id, status, payment_status, order_type, date_from, date_to, search } = params;
    const { take, skip } = paginate(page, limit);

    let whereClause = 'WHERE 1=1';
    const paramsArray: any[] = [];

    if (customer_id) {
      whereClause += ' AND o.customer_id = ?';
      paramsArray.push(customer_id);
    }

    if (staff_id) {
      whereClause += ' AND o.staff_id = ?';
      paramsArray.push(staff_id);
    }

    if (status) {
      whereClause += ' AND o.status = ?';
      paramsArray.push(status);
    }

    if (payment_status) {
      whereClause += ' AND o.payment_status = ?';
      paramsArray.push(payment_status);
    }

    if (order_type) {
      whereClause += ' AND o.order_type = ?';
      paramsArray.push(order_type);
    }

    if (date_from) {
      whereClause += ' AND o.ordered_at >= ?';
      paramsArray.push(date_from);
    }

    if (date_to) {
      whereClause += ' AND o.ordered_at <= ?';
      paramsArray.push(date_to + ' 23:59:59');
    }

    if (search) {
      whereClause += ' AND (o.order_number LIKE ? OR o.shipping_full_name LIKE ? OR o.shipping_phone LIKE ?)';
      const searchTerm = `%${search}%`;
      paramsArray.push(searchTerm, searchTerm, searchTerm);
    }

    const totalResult = db.prepare(`
      SELECT COUNT(*) as count FROM orders o ${whereClause}
    `).get(...paramsArray) as { count: number };

    const orders = db.prepare(`
      SELECT o.*, 
             c.full_name as customer_name,
             c.phone as customer_phone,
             e.staff_code,
             u.full_name as staff_name,
             prom.code as promotion_code
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN employees e ON o.staff_id = e.id
      LEFT JOIN users u ON e.user_id = u.id
      LEFT JOIN promotions prom ON o.promotion_id = prom.id
      ${whereClause}
      ORDER BY o.ordered_at DESC
      LIMIT ? OFFSET ?
    `).all(...paramsArray, take, skip);

    return {
      orders,
      total: totalResult.count,
      page,
      limit,
    };
  }

  async getById(id: number): Promise<any> {
    const order = db.prepare(`
      SELECT o.*, 
             c.full_name as customer_name,
             c.phone as customer_phone,
             c.email as customer_email,
             e.staff_code,
             u.full_name as staff_name,
             prom.code as promotion_code,
             prom.name as promotion_name
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN employees e ON o.staff_id = e.id
      LEFT JOIN users u ON e.user_id = u.id
      LEFT JOIN promotions prom ON o.promotion_id = prom.id
      WHERE o.id = ?
    `).get(id) as any;

    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    // Get order items
    const items = db.prepare(`
      SELECT oi.*, p.images as product_images
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `).all(id);

    // Get payments
    const payments = db.prepare(`
      SELECT * FROM payments WHERE order_id = ?
    `).all(id);

    return {
      ...order,
      items,
      payments,
    };
  }

  async getByOrderNumber(orderNumber: string): Promise<any> {
    const order = db.prepare(`
      SELECT o.*, 
             c.full_name as customer_name,
             c.phone as customer_phone,
             e.staff_code,
             u.full_name as staff_name
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN employees e ON o.staff_id = e.id
      LEFT JOIN users u ON e.user_id = u.id
      WHERE o.order_number = ?
    `).get(orderNumber) as any;

    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    const items = db.prepare(`
      SELECT oi.*, p.images as product_images
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `).all(order.id);

    const payments = db.prepare(`
      SELECT * FROM payments WHERE order_id = ?
    `).all(order.id);

    return {
      ...order,
      items,
      payments,
    };
  }

  async create(data: {
    customer_id?: number;
    staff_id?: number;
    order_type: 'pos' | 'online';
    items: Array<{
      product_id: number;
      variant_id: number;
      quantity: number;
      unit_price: number;
      discount_amount?: number;
    }>;
    shipping_full_name?: string;
    shipping_phone?: string;
    shipping_address?: string;
    payment_method: string;
    promotion_id?: number;
    note?: string;
    shipping_fee?: number;
  }): Promise<any> {
    const { customer_id, staff_id, order_type, items, shipping_full_name, shipping_phone, shipping_address, payment_method, promotion_id, note, shipping_fee = 0 } = data;

    if (!items || items.length === 0) {
      throw ApiError.badRequest('Order must have at least one item');
    }

    // Validate and calculate totals
    let subtotal = 0;
    const processedItems: any[] = [];
    const variantIds: number[] = [];

    for (const item of items) {
      const variant = db.prepare(`
        SELECT pv.*, p.name as product_name, p.sku as product_sku, p.cost_price
        FROM product_variants pv
        JOIN products p ON pv.product_id = p.id
        WHERE pv.id = ?
      `).get(item.variant_id) as any;

      if (!variant) {
        throw ApiError.notFound(`Variant ${item.variant_id} not found`);
      }

      // Check stock
      const inventory = db.prepare('SELECT * FROM inventory WHERE variant_id = ?').get(item.variant_id) as any;
      if (!inventory || inventory.quantity < item.quantity) {
        throw ApiError.badRequest(`Insufficient stock for ${variant.product_name} (${variant.size}, ${variant.color})`);
      }

      const discountAmount = item.discount_amount || 0;
      const lineTotal = (item.unit_price - discountAmount) * item.quantity;

      processedItems.push({
        variant_id: item.variant_id,
        product_id: variant.product_id,
        product_name: variant.product_name,
        sku: variant.sku,
        quantity: item.quantity,
        unit_price: item.unit_price,
        cost_price: variant.cost_price,
        discount_amount: discountAmount,
        line_total: lineTotal,
      });

      subtotal += lineTotal;
      variantIds.push(item.variant_id);
    }

    // Calculate discount
    let discountAmount = 0;
    let appliedPromotion = null;

    if (promotion_id) {
      appliedPromotion = db.prepare('SELECT * FROM promotions WHERE id = ? AND is_active = 1').get(promotion_id) as any;

      if (appliedPromotion) {
        const now = new Date();
        const startDate = new Date(appliedPromotion.start_date);
        const endDate = new Date(appliedPromotion.end_date);

        if (now >= startDate && now <= endDate) {
          discountAmount = calculateDiscount(
            subtotal,
            appliedPromotion.type,
            appliedPromotion.value,
            appliedPromotion.max_discount
          );

          if (subtotal < appliedPromotion.min_order_amount) {
            throw ApiError.badRequest(`Minimum order amount is ${appliedPromotion.min_order_amount}`);
          }

          if (appliedPromotion.max_uses > 0 && appliedPromotion.current_uses >= appliedPromotion.max_uses) {
            throw ApiError.badRequest('Promotion usage limit reached');
          }
        } else {
          appliedPromotion = null;
        }
      }
    }

    const taxAmount = Math.round((subtotal - discountAmount) * 0.1);
    const totalAmount = subtotal - discountAmount + taxAmount + shipping_fee;

    // Create order
    const orderNumber = generateOrderNumber();
    const result = db.prepare(`
      INSERT INTO orders (
        order_number, customer_id, staff_id, order_type, status, subtotal, discount_amount,
        promotion_id, tax_amount, shipping_fee, total_amount, paid_amount, payment_method,
        payment_status, shipping_full_name, shipping_phone, shipping_address, note
      ) VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      orderNumber, customer_id || null, staff_id || null, order_type, subtotal, discountAmount,
      promotion_id || null, taxAmount, shipping_fee, totalAmount, 0, payment_method, 'pending',
      shipping_full_name || null, shipping_phone || null, shipping_address || null, note || null
    );

    const orderId = result.lastInsertRowid as number;

    // Insert order items
    const insertItem = db.prepare(`
      INSERT INTO order_items (order_id, product_id, variant_id, product_name, sku, quantity, unit_price, cost_price, discount_amount, line_total)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const item of processedItems) {
      insertItem.run(
        orderId, item.product_id, item.variant_id, item.product_name, item.sku,
        item.quantity, item.unit_price, item.cost_price, item.discount_amount, item.line_total
      );

      // Reserve inventory
      db.prepare(`
        UPDATE inventory 
        SET quantity = quantity - ?, reserved = reserved + ?, updated_at = CURRENT_TIMESTAMP
        WHERE variant_id = ?
      `).run(item.quantity, item.quantity, item.variant_id);

      // Log inventory movement
      const inventory = db.prepare('SELECT quantity FROM inventory WHERE variant_id = ?').get(item.variant_id) as any;
      db.prepare(`
        INSERT INTO inventory_movements (variant_id, movement_type, quantity_change, quantity_before, quantity_after, reference_type, reference_id, reason, created_by)
        VALUES (?, 'reserve', ?, ?, ?, 'order', ?, 'Order created', ?)
      `).run(item.variant_id, -item.quantity, inventory.quantity + item.quantity, inventory.quantity, orderId, staff_id);
    }

    // Update promotion usage
    if (appliedPromotion) {
      db.prepare('UPDATE promotions SET current_uses = current_uses + 1 WHERE id = ?').run(promotion_id);
    }

    return this.getById(orderId);
  }

  async updateStatus(id: number, status: OrderStatus, userId?: number, reason?: string): Promise<any> {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as any;

    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    const now = new Date().toISOString();
    let updateFields: string[] = ['status = ?', 'updated_at = ?'];
    const updateValues: any[] = [status, now];

    switch (status) {
      case 'confirmed':
        updateFields.push('confirmed_at = ?');
        updateValues.push(now);
        break;
      case 'processing':
        break;
      case 'shipped':
        updateFields.push('shipped_at = ?');
        updateValues.push(now);
        break;
      case 'delivered':
        updateFields.push('delivered_at = ?');
        updateValues.push(now);
        break;
      case 'completed':
        updateFields.push('completed_at = ?');
        updateValues.push(now);

        // Release reserved inventory and reduce actual stock
        const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(id) as any[];
        for (const item of items) {
          const inventory = db.prepare('SELECT * FROM inventory WHERE variant_id = ?').get(item.variant_id) as any;

          db.prepare(`
            UPDATE inventory 
            SET reserved = MAX(0, reserved - ?), quantity = MAX(0, quantity - ?), updated_at = CURRENT_TIMESTAMP
            WHERE variant_id = ?
          `).run(item.quantity, item.quantity, item.variant_id);

          // Log movement
          const newInventory = db.prepare('SELECT quantity FROM inventory WHERE variant_id = ?').get(item.variant_id) as any;
          db.prepare(`
            INSERT INTO inventory_movements (variant_id, movement_type, quantity_change, quantity_before, quantity_after, reference_type, reference_id, reason, created_by)
            VALUES (?, 'export', ?, ?, ?, 'order', ?, 'Order completed', ?)
          `).run(item.variant_id, -item.quantity, inventory.quantity, newInventory.quantity, id, userId);

          // Update sold count
          db.prepare('UPDATE products SET sold_count = sold_count + ? WHERE id = ?').run(item.quantity, item.product_id);
        }

        // Update customer stats if applicable
        if (order.customer_id) {
          const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(order.customer_id) as any;
          if (customer) {
            const newSpent = customer.total_spent + order.total_amount;
            const newOrderCount = customer.total_orders + 1;
            const newPoints = addLoyaltyPoints(customer.loyalty_points, order.total_amount);
            const newTier = getLoyaltyTier(newSpent);

            db.prepare(`
              UPDATE customers 
              SET total_spent = ?, total_orders = ?, loyalty_points = ?, loyalty_tier = ?, updated_at = ?
              WHERE id = ?
            `).run(newSpent, newOrderCount, newPoints, newTier.tier, now, order.customer_id);
          }
        }
        break;
      case 'cancelled':
        updateFields.push('cancelled_at = ?', 'cancel_reason = ?');
        updateValues.push(now, reason || null);

        // Release reserved inventory
        const cancelledItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(id) as any[];
        for (const item of cancelledItems) {
          const inventory = db.prepare('SELECT * FROM inventory WHERE variant_id = ?').get(item.variant_id) as any;

          db.prepare(`
            UPDATE inventory 
            SET reserved = MAX(0, reserved - ?), updated_at = CURRENT_TIMESTAMP
            WHERE variant_id = ?
          `).run(item.quantity, item.variant_id);

          // Log movement
          const newInventory = db.prepare('SELECT quantity, reserved FROM inventory WHERE variant_id = ?').get(item.variant_id) as any;
          db.prepare(`
            INSERT INTO inventory_movements (variant_id, movement_type, quantity_change, quantity_before, quantity_after, reference_type, reference_id, reason, created_by)
            VALUES (?, 'release', ?, ?, ?, 'order', ?, 'Order cancelled', ?)
          `).run(item.variant_id, item.quantity, inventory.quantity + item.quantity, inventory.quantity, id, userId);
        }

        // Refund promotion usage
        if (order.promotion_id) {
          db.prepare('UPDATE promotions SET current_uses = MAX(0, current_uses - 1) WHERE id = ?').run(order.promotion_id);
        }
        break;
    }

    updateValues.push(id);

    db.prepare(`UPDATE orders SET ${updateFields.join(', ')} WHERE id = ?`).run(...updateValues);

    return this.getById(id);
  }

  async recordPayment(id: number, data: {
    payment_method: string;
    amount: number;
    transaction_id?: string;
  }): Promise<any> {
    const { payment_method, amount, transaction_id } = data;

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as any;

    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    if (order.payment_status === 'paid') {
      throw ApiError.badRequest('Order is already fully paid');
    }

    // Record payment
    db.prepare(`
      INSERT INTO payments (order_id, payment_method, amount, status, transaction_id, paid_at)
      VALUES (?, ?, ?, 'paid', ?, ?)
    `).run(id, payment_method, amount, transaction_id || null, new Date().toISOString());

    // Calculate new paid amount
    const totalPaid = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM payments 
      WHERE order_id = ? AND status = 'paid'
    `).get(id) as { total: number };

    const paymentStatus = totalPaid.total >= order.total_amount ? 'paid' : 'partially_refunded';

    db.prepare(`
      UPDATE orders 
      SET paid_amount = ?, payment_status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(totalPaid.total, paymentStatus, id);

    return this.getById(id);
  }

  async getStats(params: { date_from?: string; date_to?: string } = {}): Promise<any> {
    const { date_from, date_to } = params;

    let dateFilter = '';
    const dateParams: any[] = [];

    if (date_from) {
      dateFilter += ' AND ordered_at >= ?';
      dateParams.push(date_from);
    }

    if (date_to) {
      dateFilter += ' AND ordered_at <= ?';
      dateParams.push(date_to + ' 23:59:59');
    }

    // Total orders
    const totalOrders = db.prepare(`
      SELECT COUNT(*) as count FROM orders WHERE 1=1 ${dateFilter}
    `).get(...dateParams) as { count: number };

    // Total revenue
    const totalRevenue = db.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as total FROM orders 
      WHERE payment_status = 'paid' ${dateFilter}
    `).get(...dateParams) as { total: number };

    // Orders by status
    const ordersByStatus = db.prepare(`
      SELECT status, COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total
      FROM orders
      WHERE 1=1 ${dateFilter}
      GROUP BY status
    `).all(...dateParams);

    // Average order value
    const avgOrderValue = db.prepare(`
      SELECT COALESCE(AVG(total_amount), 0) as avg FROM orders
      WHERE payment_status = 'paid' ${dateFilter}
    `).get(...dateParams) as { avg: number };

    // Top selling products
    const topProducts = db.prepare(`
      SELECT oi.product_name, oi.sku, SUM(oi.quantity) as units_sold, SUM(oi.line_total) as revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.payment_status = 'paid' ${dateFilter}
      GROUP BY oi.product_id
      ORDER BY revenue DESC
      LIMIT 10
    `).all(...dateParams);

    return {
      total_orders: totalOrders.count,
      total_revenue: totalRevenue.total,
      average_order_value: avgOrderValue.avg,
      orders_by_status: ordersByStatus,
      top_products: topProducts,
    };
  }
}

export const orderService = new OrderService();
