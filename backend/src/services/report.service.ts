import { db } from '../db';
import { paginate } from '../utils/helpers';

export class ReportService {
  async getSalesReport(params: {
    date_from?: string;
    date_to?: string;
    group_by?: 'day' | 'week' | 'month';
  }): Promise<any> {
    const { date_from, date_to, group_by = 'day' } = params;

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

    let dateGrouping: string;
    switch (group_by) {
      case 'week':
        dateGrouping = "strftime('%Y-W%W', ordered_at)";
        break;
      case 'month':
        dateGrouping = "strftime('%Y-%m', ordered_at)";
        break;
      default:
        dateGrouping = "strftime('%Y-%m-%d', ordered_at)";
    }

    const salesByPeriod = db.prepare(`
      SELECT 
        ${dateGrouping} as period,
        COUNT(*) as orders,
        COALESCE(SUM(subtotal), 0) as subtotal,
        COALESCE(SUM(discount_amount), 0) as discount,
        COALESCE(SUM(tax_amount), 0) as tax,
        COALESCE(SUM(shipping_fee), 0) as shipping,
        COALESCE(SUM(total_amount), 0) as total,
        COALESCE(SUM(paid_amount), 0) as paid
      FROM orders
      WHERE 1=1 ${dateFilter}
      GROUP BY ${dateGrouping}
      ORDER BY period DESC
    `).all(...dateParams);

    const summary = db.prepare(`
      SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(subtotal), 0) as total_subtotal,
        COALESCE(SUM(discount_amount), 0) as total_discount,
        COALESCE(SUM(tax_amount), 0) as total_tax,
        COALESCE(SUM(shipping_fee), 0) as total_shipping,
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(SUM(paid_amount), 0) as total_paid,
        COALESCE(AVG(total_amount), 0) as avg_order_value
      FROM orders
      WHERE 1=1 ${dateFilter}
    `).get(...dateParams);

    return {
      summary,
      sales_by_period: salesByPeriod,
    };
  }

  async getProductReport(params: {
    date_from?: string;
    date_to?: string;
    limit?: number;
    sort_by?: 'revenue' | 'quantity';
  }): Promise<any> {
    const { date_from, date_to, limit = 20, sort_by = 'revenue' } = params;

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

    const orderBy = sort_by === 'quantity' ? 'total_quantity DESC' : 'total_revenue DESC';

    const topProducts = db.prepare(`
      SELECT 
        oi.product_id,
        oi.product_name,
        oi.sku,
        p.images,
        c.name as category_name,
        b.name as brand_name,
        COUNT(DISTINCT oi.order_id) as order_count,
        SUM(oi.quantity) as total_quantity,
        SUM(oi.line_total) as total_revenue,
        SUM(oi.discount_amount) as total_discount,
        AVG(oi.unit_price) as avg_price
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN products p ON oi.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE o.payment_status = 'paid' ${dateFilter}
      GROUP BY oi.product_id
      ORDER BY ${orderBy}
      LIMIT ?
    `).all(...dateParams, limit);

    const productStats = db.prepare(`
      SELECT 
        COUNT(DISTINCT oi.product_id) as total_products_sold,
        SUM(oi.quantity) as total_items_sold,
        SUM(oi.line_total) as total_revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.payment_status = 'paid' ${dateFilter}
    `).get(...dateParams);

    return {
      summary: productStats,
      top_products: topProducts,
    };
  }

  async getCategoryReport(params: {
    date_from?: string;
    date_to?: string;
  } = {}): Promise<any> {
    const { date_from, date_to } = params;

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

    const categorySales = db.prepare(`
      SELECT 
        c.id as category_id,
        c.name as category_name,
        COUNT(DISTINCT oi.order_id) as order_count,
        COUNT(DISTINCT oi.product_id) as product_count,
        SUM(oi.quantity) as total_quantity,
        SUM(oi.line_total) as total_revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN products p ON oi.product_id = p.id
      JOIN categories c ON p.category_id = c.id
      WHERE o.payment_status = 'paid' ${dateFilter}
      GROUP BY c.id
      ORDER BY total_revenue DESC
    `).all(...dateParams);

    const totalRevenue = categorySales.reduce((sum: number, cat: any) => sum + cat.total_revenue, 0);

    const categoryWithPercent = categorySales.map((cat: any) => ({
      ...cat,
      revenue_percent: totalRevenue > 0 ? (cat.total_revenue / totalRevenue) * 100 : 0,
    }));

    return {
      category_sales: categoryWithPercent,
    };
  }

  async getInventoryReport(): Promise<any> {
    const inventorySummary = db.prepare(`
      SELECT 
        COUNT(DISTINCT pv.product_id) as total_products,
        COUNT(DISTINCT pv.id) as total_variants,
        SUM(i.quantity) as total_quantity,
        SUM(i.reserved) as total_reserved,
        SUM(i.quantity - i.reserved) as total_available,
        COUNT(CASE WHEN i.quantity <= i.min_stock_level THEN 1 END) as low_stock_items,
        COUNT(CASE WHEN i.quantity = 0 THEN 1 END) as out_of_stock_items
      FROM inventory i
      JOIN product_variants pv ON i.variant_id = pv.id
    `).get();

    const stockByCategory = db.prepare(`
      SELECT 
        c.id,
        c.name as category_name,
        COUNT(DISTINCT p.id) as product_count,
        COUNT(DISTINCT pv.id) as variant_count,
        SUM(i.quantity) as total_stock,
        SUM(i.quantity - i.reserved) as available_stock
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.status = 'active'
      LEFT JOIN product_variants pv ON p.id = pv.product_id
      LEFT JOIN inventory i ON pv.id = i.variant_id
      WHERE c.is_active = 1
      GROUP BY c.id
      HAVING total_stock > 0
      ORDER BY total_stock DESC
    `).all();

    const lowStockProducts = db.prepare(`
      SELECT 
        pv.id as variant_id,
        pv.sku,
        pv.size,
        pv.color,
        p.name as product_name,
        p.images,
        i.quantity,
        i.reserved,
        (i.quantity - i.reserved) as available,
        i.min_stock_level
      FROM inventory i
      JOIN product_variants pv ON i.variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
      WHERE i.quantity <= i.min_stock_level
      ORDER BY (i.quantity - i.reserved) ASC
    `).all();

    const inventoryValue = db.prepare(`
      SELECT 
        SUM(i.quantity * p.cost_price) as total_cost_value,
        SUM(i.quantity * p.retail_price) as total_retail_value,
        SUM((p.retail_price - p.cost_price) * i.quantity) as total_potential_profit
      FROM inventory i
      JOIN product_variants pv ON i.variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
    `).get();

    return {
      summary: inventorySummary,
      stock_by_category: stockByCategory,
      low_stock_products: lowStockProducts,
      inventory_value: inventoryValue,
    };
  }

  async getCustomerReport(params: {
    date_from?: string;
    date_to?: string;
    limit?: number;
  } = {}): Promise<any> {
    const { date_from, date_to, limit = 20 } = params;

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

    const topCustomers = db.prepare(`
      SELECT 
        c.id,
        c.full_name,
        c.phone,
        c.email,
        c.loyalty_tier,
        c.loyalty_points,
        COUNT(DISTINCT o.id) as order_count,
        COALESCE(SUM(o.total_amount), 0) as total_spent,
        COALESCE(AVG(o.total_amount), 0) as avg_order_value,
        MAX(o.ordered_at) as last_order_date
      FROM customers c
      LEFT JOIN orders o ON c.id = o.customer_id AND o.payment_status = 'paid' ${dateFilter}
      GROUP BY c.id
      HAVING order_count > 0
      ORDER BY total_spent DESC
      LIMIT ?
    `).all(...dateParams, limit);

    const customerStats = db.prepare(`
      SELECT 
        COUNT(*) as total_customers,
        COUNT(CASE WHEN total_orders > 0 THEN 1 END) as active_customers,
        AVG(total_spent) as avg_spent,
        AVG(total_orders) as avg_orders
      FROM customers
    `).get();

    const newCustomersTrend = db.prepare(`
      SELECT 
        strftime('%Y-%m', created_at) as month,
        COUNT(*) as new_customers
      FROM customers
      WHERE created_at >= date('now', '-12 months')
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY month DESC
    `).all();

    return {
      summary: customerStats,
      top_customers: topCustomers,
      new_customers_trend: newCustomersTrend,
    };
  }

  async getDashboardStats(): Promise<any> {
    const today = new Date().toISOString().split('T')[0];

    // Today's stats
    const todayOrders = db.prepare(`
      SELECT 
        COUNT(*) as orders,
        COALESCE(SUM(total_amount), 0) as revenue
      FROM orders
      WHERE date(ordered_at) = ?
    `).get(today) as any;

    // This month's stats
    const monthOrders = db.prepare(`
      SELECT 
        COUNT(*) as orders,
        COALESCE(SUM(total_amount), 0) as revenue
      FROM orders
      WHERE strftime('%Y-%m', ordered_at) = strftime('%Y-%m', 'now')
        AND payment_status = 'paid'
    `).get() as any;

    // Pending orders
    const pendingOrders = db.prepare(`
      SELECT COUNT(*) as count FROM orders WHERE status = 'pending'
    `).get() as { count: number };

    // Low stock alerts
    const lowStockAlerts = db.prepare(`
      SELECT COUNT(*) as count FROM inventory WHERE quantity <= min_stock_level
    `).get() as { count: number };

    // Recent orders
    const recentOrders = db.prepare(`
      SELECT o.*, c.full_name as customer_name
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      ORDER BY o.ordered_at DESC
      LIMIT 5
    `).all();

    // Top selling products today
    const topSellingToday = db.prepare(`
      SELECT 
        oi.product_name,
        oi.sku,
        SUM(oi.quantity) as quantity
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE date(o.ordered_at) = ?
      GROUP BY oi.product_id
      ORDER BY quantity DESC
      LIMIT 5
    `).all(today);

    return {
      today: {
        orders: todayOrders.orders,
        revenue: todayOrders.revenue,
      },
      this_month: {
        orders: monthOrders.orders,
        revenue: monthOrders.revenue,
      },
      pending_orders: pendingOrders.count,
      low_stock_alerts: lowStockAlerts.count,
      recent_orders: recentOrders,
      top_selling_today: topSellingToday,
    };
  }

  async getRevenueByPaymentMethod(params: {
    date_from?: string;
    date_to?: string;
  } = {}): Promise<any> {
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

    return db.prepare(`
      SELECT 
        payment_method,
        COUNT(*) as order_count,
        SUM(total_amount) as total_revenue,
        SUM(paid_amount) as total_paid
      FROM orders
      WHERE payment_status = 'paid' ${dateFilter}
      GROUP BY payment_method
      ORDER BY total_revenue DESC
    `).all(...dateParams);
  }
}

export const reportService = new ReportService();
