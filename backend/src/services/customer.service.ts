import { db } from '../db';
import { ApiError } from '../utils/ApiError';
import { Customer, CustomerType } from '../types';
import { paginate, generateReferralCode, addLoyaltyPoints, getLoyaltyTier } from '../utils/helpers';

export class CustomerService {
  async getAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    customer_type?: CustomerType;
    loyalty_tier?: string;
    is_active?: number;
  } = {}): Promise<{ customers: any[]; total: number }> {
    const { page = 1, limit = 20, search, customer_type, loyalty_tier, is_active = 1 } = params;
    const { take, skip } = paginate(page, limit);

    let whereClause = 'WHERE 1=1';
    const paramsArray: any[] = [];

    if (is_active !== undefined) {
      whereClause += ' AND c.is_active = ?';
      paramsArray.push(is_active);
    }

    if (customer_type) {
      whereClause += ' AND c.customer_type = ?';
      paramsArray.push(customer_type);
    }

    if (loyalty_tier) {
      whereClause += ' AND c.loyalty_tier = ?';
      paramsArray.push(loyalty_tier);
    }

    if (search) {
      whereClause += ' AND (c.full_name LIKE ? OR c.phone LIKE ? OR c.email LIKE ?)';
      const searchTerm = `%${search}%`;
      paramsArray.push(searchTerm, searchTerm, searchTerm);
    }

    const totalResult = db.prepare(`
      SELECT COUNT(*) as count FROM customers c ${whereClause}
    `).get(...paramsArray) as { count: number };

    const customers = db.prepare(`
      SELECT c.*, u.username
      FROM customers c
      LEFT JOIN users u ON c.user_id = u.id
      ${whereClause}
      ORDER BY c.total_spent DESC
      LIMIT ? OFFSET ?
    `).all(...paramsArray, take, skip);

    return { customers, total: totalResult.count };
  }

  async getById(id: number): Promise<any> {
    const customer = db.prepare(`
      SELECT c.*, u.username
      FROM customers c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `).get(id) as any;

    if (!customer) {
      throw ApiError.notFound('Customer not found');
    }

    // Get recent orders
    const recentOrders = db.prepare(`
      SELECT * FROM orders
      WHERE customer_id = ?
      ORDER BY ordered_at DESC
      LIMIT 5
    `).all(id);

    // Get stats
    const orderStats = db.prepare(`
      SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(total_amount), 0) as total_spent,
        COALESCE(AVG(total_amount), 0) as avg_order_value,
        COALESCE(MAX(total_amount), 0) as max_order_value
      FROM orders
      WHERE customer_id = ? AND payment_status = 'paid'
    `).get(id) as any;

    return {
      ...customer,
      recent_orders: recentOrders,
      order_stats: orderStats,
    };
  }

  async getByPhone(phone: string): Promise<any> {
    const customer = db.prepare(`
      SELECT c.*, u.username
      FROM customers c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.phone = ?
    `).get(phone) as any;

    if (!customer) {
      throw ApiError.notFound('Customer not found');
    }

    return this.getById(customer.id);
  }

  async getByReferralCode(referralCode: string): Promise<any> {
    const customer = db.prepare('SELECT * FROM customers WHERE referral_code = ?').get(referralCode);
    return customer;
  }

  async create(data: {
    full_name: string;
    phone: string;
    email?: string;
    gender?: string;
    date_of_birth?: string;
    customer_type?: CustomerType;
    user_id?: number;
  }): Promise<any> {
    const { full_name, phone, email, gender, date_of_birth, customer_type = 'regular', user_id } = data;

    // Check if phone exists
    const existingPhone = db.prepare('SELECT id FROM customers WHERE phone = ?').get(phone);
    if (existingPhone) {
      throw ApiError.conflict('Phone number already registered');
    }

    if (email) {
      const existingEmail = db.prepare('SELECT id FROM customers WHERE email = ?').get(email);
      if (existingEmail) {
        throw ApiError.conflict('Email already registered');
      }
    }

    const referralCode = generateReferralCode();

    const result = db.prepare(`
      INSERT INTO customers (user_id, full_name, phone, email, gender, date_of_birth, customer_type, referral_code)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(user_id || null, full_name, phone, email || null, gender || null, date_of_birth || null, customer_type, referralCode);

    return this.getById(result.lastInsertRowid as number);
  }

  async update(id: number, data: Partial<Customer>): Promise<any> {
    const existingCustomer = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);

    if (!existingCustomer) {
      throw ApiError.notFound('Customer not found');
    }

    const fields: string[] = [];
    const values: any[] = [];

    const allowedFields = ['full_name', 'phone', 'email', 'gender', 'date_of_birth', 'customer_type'];

    for (const field of allowedFields) {
      if (data[field as keyof Customer] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(data[field as keyof Customer]);
      }
    }

    if (fields.length === 0) {
      return this.getById(id);
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    db.prepare(`
      UPDATE customers SET ${fields.join(', ')} WHERE id = ?
    `).run(...values);

    return this.getById(id);
  }

  async addPoints(id: number, points: number, reason: string): Promise<any> {
    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(id) as any;

    if (!customer) {
      throw ApiError.notFound('Customer not found');
    }

    const newPoints = customer.loyalty_points + points;
    const newTier = getLoyaltyTier(customer.total_spent);

    db.prepare(`
      UPDATE customers 
      SET loyalty_points = ?, loyalty_tier = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newPoints, newTier.tier, id);

    return this.getById(id);
  }

  async redeemPoints(id: number, points: number, discountAmount: number): Promise<any> {
    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(id) as any;

    if (!customer) {
      throw ApiError.notFound('Customer not found');
    }

    if (customer.loyalty_points < points) {
      throw ApiError.badRequest('Insufficient loyalty points');
    }

    const newPoints = customer.loyalty_points - points;
    const newTier = getLoyaltyTier(customer.total_spent);

    db.prepare(`
      UPDATE customers 
      SET loyalty_points = ?, loyalty_tier = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newPoints, newTier.tier, id);

    return this.getById(id);
  }

  async getLoyaltyTiers(): Promise<any> {
    const tiers = db.prepare(`
      SELECT 
        loyalty_tier,
        COUNT(*) as customer_count,
        AVG(total_spent) as avg_spent,
        AVG(loyalty_points) as avg_points
      FROM customers
      GROUP BY loyalty_tier
      ORDER BY 
        CASE loyalty_tier 
          WHEN 'platinum' THEN 1 
          WHEN 'gold' THEN 2 
          WHEN 'silver' THEN 3 
          WHEN 'bronze' THEN 4 
        END
    `).all();

    return tiers;
  }

  async getTopCustomers(params: { limit?: number; date_from?: string; date_to?: string } = {}): Promise<any[]> {
    const { limit = 10, date_from, date_to } = params;

    let dateFilter = '';
    const dateParams: any[] = [];

    if (date_from) {
      dateFilter += ' AND o.ordered_at >= ?';
      dateParams.push(date_from);
    }

    if (date_to) {
      dateFilter += ' AND o.ordered_at <= ?';
      dateParams.push(date_to + ' 23:59:59');
    }

    return db.prepare(`
      SELECT c.*, 
             COUNT(DISTINCT o.id) as order_count,
             COALESCE(SUM(o.total_amount), 0) as total_spent
      FROM customers c
      LEFT JOIN orders o ON c.id = o.customer_id AND o.payment_status = 'paid' ${dateFilter}
      GROUP BY c.id
      HAVING total_spent > 0
      ORDER BY total_spent DESC
      LIMIT ?
    `).all(...dateParams, limit);
  }

  async getCustomerStats(): Promise<any> {
    const totalCustomers = db.prepare('SELECT COUNT(*) as count FROM customers').get() as { count: number };

    const newCustomersThisMonth = db.prepare(`
      SELECT COUNT(*) as count FROM customers
      WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')
    `).get() as { count: number };

    const tierDistribution = db.prepare(`
      SELECT loyalty_tier, COUNT(*) as count
      FROM customers
      GROUP BY loyalty_tier
    `).all();

    const typeDistribution = db.prepare(`
      SELECT customer_type, COUNT(*) as count
      FROM customers
      GROUP BY customer_type
    `).all();

    return {
      total_customers: totalCustomers.count,
      new_this_month: newCustomersThisMonth.count,
      tier_distribution: tierDistribution,
      type_distribution: typeDistribution,
    };
  }
}

export const customerService = new CustomerService();
