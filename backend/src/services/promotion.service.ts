import { db } from '../db';
import { ApiError } from '../utils/ApiError';
import { Promotion, PromotionType } from '../types';
import { paginate } from '../utils/helpers';

export class PromotionService {
  async getAll(params: {
    page?: number;
    limit?: number;
    is_active?: number;
    type?: PromotionType;
    search?: string;
    include_expired?: boolean;
  } = {}): Promise<{ promotions: any[]; total: number }> {
    const { page = 1, limit = 20, is_active = 1, type, search, include_expired = false } = params;
    const { take, skip } = paginate(page, limit);

    let whereClause = 'WHERE 1=1';
    const paramsArray: any[] = [];

    if (is_active !== undefined) {
      whereClause += ' AND p.is_active = ?';
      paramsArray.push(is_active);
    }

    if (type) {
      whereClause += ' AND p.type = ?';
      paramsArray.push(type);
    }

    if (search) {
      whereClause += ' AND (p.code LIKE ? OR p.name LIKE ?)';
      const searchTerm = `%${search}%`;
      paramsArray.push(searchTerm, searchTerm);
    }

    if (!include_expired) {
      whereClause += " AND p.end_date >= date('now')";
    }

    const totalResult = db.prepare(`
      SELECT COUNT(*) as count FROM promotions p ${whereClause}
    `).get(...paramsArray) as { count: number };

    const promotions = db.prepare(`
      SELECT * FROM promotions p
      ${whereClause}
      ORDER BY p.priority DESC, p.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...paramsArray, take, skip);

    return { promotions, total: totalResult.count };
  }

  async getById(id: number): Promise<any> {
    const promotion = db.prepare('SELECT * FROM promotions WHERE id = ?').get(id) as any;

    if (!promotion) {
      throw ApiError.notFound('Promotion not found');
    }

    return promotion;
  }

  async getByCode(code: string): Promise<any> {
    const promotion = db.prepare('SELECT * FROM promotions WHERE code = ?').get(code.toUpperCase()) as any;

    if (!promotion) {
      throw ApiError.notFound('Promotion not found');
    }

    return promotion;
  }

  async validateCode(code: string, orderAmount: number, customerId?: number): Promise<any> {
    const promotion = db.prepare('SELECT * FROM promotions WHERE code = ? AND is_active = 1').get(code.toUpperCase()) as any;

    if (!promotion) {
      throw ApiError.notFound('Promotion not found or inactive');
    }

    // Check date validity
    const now = new Date();
    const startDate = new Date(promotion.start_date);
    const endDate = new Date(promotion.end_date);

    if (now < startDate) {
      throw ApiError.badRequest('Promotion has not started yet');
    }

    if (now > endDate) {
      throw ApiError.badRequest('Promotion has expired');
    }

    // Check usage limit
    if (promotion.max_uses > 0 && promotion.current_uses >= promotion.max_uses) {
      throw ApiError.badRequest('Promotion usage limit reached');
    }

    // Check customer usage limit
    if (customerId && promotion.max_uses_per_customer > 0) {
      const customerUsage = db.prepare(`
        SELECT COUNT(*) as count FROM orders
        WHERE promotion_id = ? AND customer_id = ? AND payment_status != 'cancelled'
      `).get(promotion.id, customerId) as { count: number };

      if (customerUsage.count >= promotion.max_uses_per_customer) {
        throw ApiError.badRequest('You have already used this promotion the maximum number of times');
      }
    }

    // Check minimum order amount
    if (orderAmount < promotion.min_order_amount) {
      throw ApiError.badRequest(`Minimum order amount is ${promotion.min_order_amount}`);
    }

    return promotion;
  }

  async create(data: {
    code: string;
    name: string;
    type: PromotionType;
    value: number;
    max_discount?: number;
    min_order_amount?: number;
    max_uses?: number;
    max_uses_per_customer?: number;
    start_date: string;
    end_date: string;
    applicable_type?: string;
    applicable_ids?: string;
    is_active?: number;
    is_public?: number;
    priority?: number;
  }): Promise<any> {
    const {
      code, name, type, value, max_discount, min_order_amount = 0,
      max_uses = 0, max_uses_per_customer = 1, start_date, end_date,
      applicable_type = 'all', applicable_ids, is_active = 1, is_public = 0, priority = 0
    } = data;

    // Check if code exists
    const existingCode = db.prepare('SELECT id FROM promotions WHERE code = ?').get(code.toUpperCase());
    if (existingCode) {
      throw ApiError.conflict('Promotion code already exists');
    }

    // Validate dates
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    if (endDate <= startDate) {
      throw ApiError.badRequest('End date must be after start date');
    }

    const result = db.prepare(`
      INSERT INTO promotions (
        code, name, type, value, max_discount, min_order_amount,
        max_uses, max_uses_per_customer, start_date, end_date,
        applicable_type, applicable_ids, is_active, is_public, priority
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      code.toUpperCase(), name, type, value, max_discount || null, min_order_amount,
      max_uses, max_uses_per_customer, start_date, end_date,
      applicable_type, applicable_ids || null, is_active, is_public, priority
    );

    return this.getById(result.lastInsertRowid as number);
  }

  async update(id: number, data: Partial<Promotion>): Promise<any> {
    const existingPromotion = db.prepare('SELECT * FROM promotions WHERE id = ?').get(id);

    if (!existingPromotion) {
      throw ApiError.notFound('Promotion not found');
    }

    const fields: string[] = [];
    const values: any[] = [];

    const allowedFields = [
      'name', 'type', 'value', 'max_discount', 'min_order_amount',
      'max_uses', 'max_uses_per_customer', 'start_date', 'end_date',
      'applicable_type', 'applicable_ids', 'is_active', 'is_public', 'priority'
    ];

    for (const field of allowedFields) {
      if (data[field as keyof Promotion] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(data[field as keyof Promotion]);
      }
    }

    if (fields.length === 0) {
      return this.getById(id);
    }

    values.push(id);

    db.prepare(`
      UPDATE promotions SET ${fields.join(', ')} WHERE id = ?
    `).run(...values);

    return this.getById(id);
  }

  async delete(id: number): Promise<void> {
    const promotion = db.prepare('SELECT * FROM promotions WHERE id = ?').get(id);

    if (!promotion) {
      throw ApiError.notFound('Promotion not found');
    }

    // Check if used in orders
    const usedInOrders = db.prepare('SELECT COUNT(*) as count FROM orders WHERE promotion_id = ?').get(id) as { count: number };

    if (usedInOrders.count > 0) {
      // Soft delete
      db.prepare('UPDATE promotions SET is_active = 0 WHERE id = ?').run(id);
    } else {
      // Hard delete
      db.prepare('DELETE FROM promotions WHERE id = ?').run(id);
    }
  }

  async getActivePromotions(): Promise<any[]> {
    return db.prepare(`
      SELECT * FROM promotions
      WHERE is_active = 1
        AND is_public = 1
        AND start_date <= date('now')
        AND end_date >= date('now')
        AND (max_uses = 0 OR current_uses < max_uses)
      ORDER BY priority DESC, created_at DESC
    `).all();
  }

  async getPromotionStats(id: number): Promise<any> {
    const promotion = db.prepare('SELECT * FROM promotions WHERE id = ?').get(id) as any;

    if (!promotion) {
      throw ApiError.notFound('Promotion not found');
    }

    const usageStats = db.prepare(`
      SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(total_amount), 0) as total_sales,
        COALESCE(SUM(discount_amount), 0) as total_discount,
        COALESCE(AVG(discount_amount), 0) as avg_discount
      FROM orders
      WHERE promotion_id = ? AND payment_status != 'cancelled'
    `).get(id) as any;

    const usageByDay = db.prepare(`
      SELECT 
        date(ordered_at) as date,
        COUNT(*) as orders,
        COALESCE(SUM(discount_amount), 0) as discount
      FROM orders
      WHERE promotion_id = ? AND payment_status != 'cancelled'
      GROUP BY date(ordered_at)
      ORDER BY date DESC
      LIMIT 30
    `).all(id);

    return {
      promotion,
      usage_stats: usageStats,
      usage_by_day: usageByDay,
    };
  }
}

export const promotionService = new PromotionService();
