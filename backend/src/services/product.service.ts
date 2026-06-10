import { db } from '../db';
import { ApiError } from '../utils/ApiError';
import { Product, ProductVariant, Inventory } from '../types';
import { generateBarcode, paginate, generateSlug } from '../utils/helpers';

export class ProductService {
  async getAll(params: {
    page?: number;
    limit?: number;
    category_id?: number;
    brand_id?: number;
    status?: string;
    search?: string;
    sort?: string;
    order?: 'asc' | 'desc';
    min_price?: number;
    max_price?: number;
  }): Promise<{ products: any[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 20, category_id, brand_id, status = 'active', search, sort = 'created_at', order = 'desc', min_price, max_price } = params;
    const { take, skip } = paginate(page, limit);

    let whereClause = 'WHERE 1=1';
    const paramsArray: any[] = [];

    if (status) {
      whereClause += ' AND p.status = ?';
      paramsArray.push(status);
    }

    if (category_id) {
      whereClause += ' AND p.category_id = ?';
      paramsArray.push(category_id);
    }

    if (brand_id) {
      whereClause += ' AND p.brand_id = ?';
      paramsArray.push(brand_id);
    }

    if (search) {
      whereClause += ' AND (p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ?)';
      const searchTerm = `%${search}%`;
      paramsArray.push(searchTerm, searchTerm, searchTerm);
    }

    if (min_price !== undefined) {
      whereClause += ' AND p.retail_price >= ?';
      paramsArray.push(min_price);
    }

    if (max_price !== undefined) {
      whereClause += ' AND p.retail_price <= ?';
      paramsArray.push(max_price);
    }

    const validSortColumns = ['created_at', 'name', 'retail_price', 'sold_count', 'view_count'];
    const sortColumn = validSortColumns.includes(sort) ? sort : 'created_at';
    const sortOrder = order === 'asc' ? 'ASC' : 'DESC';

    const totalResult = db.prepare(`
      SELECT COUNT(*) as count
      FROM products p
      ${whereClause}
    `).get(...paramsArray) as { count: number };

    const products = db.prepare(`
      SELECT p.*, c.name as category_name, c.slug as category_slug,
             b.name as brand_name, b.slug as brand_slug,
             COALESCE(SUM(i.quantity), 0) as total_stock
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN product_variants pv ON p.id = pv.product_id
      LEFT JOIN inventory i ON pv.id = i.variant_id
      ${whereClause}
      GROUP BY p.id
      ORDER BY p.${sortColumn} ${sortOrder}
      LIMIT ? OFFSET ?
    `).all(...paramsArray, take, skip);

    return {
      products,
      total: totalResult.count,
      page,
      limit,
    };
  }

  async getById(id: number): Promise<any> {
    const product = db.prepare(`
      SELECT p.*, c.name as category_name, c.slug as category_slug,
             b.name as brand_name, b.slug as brand_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE p.id = ?
    `).get(id) as any;

    if (!product) {
      throw ApiError.notFound('Product not found');
    }

    // Get variants
    const variants = db.prepare(`
      SELECT pv.*, 
             COALESCE(i.quantity, 0) as stock,
             COALESCE(i.reserved, 0) as reserved
      FROM product_variants pv
      LEFT JOIN inventory i ON pv.id = i.variant_id
      WHERE pv.product_id = ?
      ORDER BY pv.size, pv.color
    `).all(id);

    // Get reviews
    const reviews = db.prepare(`
      SELECT pr.*, c.full_name as customer_name
      FROM product_reviews pr
      LEFT JOIN customers c ON pr.customer_id = c.id
      WHERE pr.product_id = ? AND pr.is_visible = 1
      ORDER BY pr.created_at DESC
      LIMIT 5
    `).all(id);

    // Calculate average rating
    const ratingStats = db.prepare(`
      SELECT AVG(rating) as avg_rating, COUNT(*) as review_count
      FROM product_reviews
      WHERE product_id = ? AND is_visible = 1
    `).get(id) as { avg_rating: number | null; review_count: number };

    // Increment view count
    db.prepare('UPDATE products SET view_count = view_count + 1 WHERE id = ?').run(id);

    return {
      ...product,
      variants,
      reviews,
      rating: {
        average: ratingStats.avg_rating || 0,
        count: ratingStats.review_count,
      },
    };
  }

  async getBySlug(slug: string): Promise<any> {
    const product = db.prepare(`
      SELECT p.*, c.name as category_name, c.slug as category_slug,
             b.name as brand_name, b.slug as brand_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE p.slug = ?
    `).get(slug) as any;

    if (!product) {
      throw ApiError.notFound('Product not found');
    }

    // Get variants
    const variants = db.prepare(`
      SELECT pv.*, 
             COALESCE(i.quantity, 0) as stock,
             COALESCE(i.reserved, 0) as reserved
      FROM product_variants pv
      LEFT JOIN inventory i ON pv.id = i.variant_id
      WHERE pv.product_id = ?
      ORDER BY pv.size, pv.color
    `).all(product.id);

    // Get reviews
    const reviews = db.prepare(`
      SELECT pr.*, c.full_name as customer_name
      FROM product_reviews pr
      LEFT JOIN customers c ON pr.customer_id = c.id
      WHERE pr.product_id = ? AND pr.is_visible = 1
      ORDER BY pr.created_at DESC
      LIMIT 5
    `).all(product.id);

    // Calculate average rating
    const ratingStats = db.prepare(`
      SELECT AVG(rating) as avg_rating, COUNT(*) as review_count
      FROM product_reviews
      WHERE product_id = ? AND is_visible = 1
    `).get(product.id) as { avg_rating: number | null; review_count: number };

    // Increment view count
    db.prepare('UPDATE products SET view_count = view_count + 1 WHERE id = ?').run(product.id);

    return {
      ...product,
      variants,
      reviews,
      rating: {
        average: ratingStats.avg_rating || 0,
        count: ratingStats.review_count,
      },
    };
  }

  async create(data: {
    name: string;
    description?: string;
    category_id?: number;
    brand_id?: number;
    cost_price: number;
    retail_price: number;
    wholesale_price: number;
    barcode?: string;
    weight?: number;
    images?: string[];
    status?: string;
  }): Promise<any> {
    const { name, description, category_id, brand_id, cost_price, retail_price, wholesale_price, barcode, weight, images, status = 'draft' } = data;

    // Generate SKU
    const lastProduct = db.prepare('SELECT MAX(id) as max_id FROM products').get() as { max_id: number | null };
    const nextId = (lastProduct.max_id || 0) + 1;
    const sku = `PROD-${String(nextId).padStart(6, '0')}`;

    // Generate slug
    const baseSlug = generateSlug(name, nextId);

    // Use provided barcode or generate
    const finalBarcode = barcode || generateBarcode();

    // Parse images
    const imagesJson = images ? JSON.stringify(images) : null;

    const result = db.prepare(`
      INSERT INTO products (sku, name, slug, description, category_id, brand_id, cost_price, retail_price, wholesale_price, barcode, weight, images, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(sku, name, baseSlug, description || null, category_id || null, brand_id || null, cost_price, retail_price, wholesale_price, finalBarcode, weight || null, imagesJson, status);

    return this.getById(result.lastInsertRowid as number);
  }

  async update(id: number, data: Partial<Product>): Promise<any> {
    const existingProduct = db.prepare('SELECT * FROM products WHERE id = ?').get(id);

    if (!existingProduct) {
      throw ApiError.notFound('Product not found');
    }

    const fields: string[] = [];
    const values: any[] = [];

    const allowedFields = ['name', 'description', 'category_id', 'brand_id', 'cost_price', 'retail_price', 'wholesale_price', 'barcode', 'weight', 'images', 'status'];

    for (const field of allowedFields) {
      if (data[field as keyof Product] !== undefined) {
        fields.push(`${field} = ?`);
        let value = data[field as keyof Product];
        if (field === 'images' && Array.isArray(value)) {
          value = JSON.stringify(value);
        }
        values.push(value);
      }
    }

    if (data.name) {
      fields.push('slug = ?');
      values.push(generateSlug(data.name, id));
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    db.prepare(`
      UPDATE products SET ${fields.join(', ')} WHERE id = ?
    `).run(...values);

    return this.getById(id);
  }

  async delete(id: number): Promise<void> {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);

    if (!product) {
      throw ApiError.notFound('Product not found');
    }

    // Check for related orders
    const orderItems = db.prepare('SELECT COUNT(*) as count FROM order_items WHERE product_id = ?').get(id) as { count: number };

    if (orderItems.count > 0) {
      // Soft delete - just change status
      db.prepare('UPDATE products SET status = ? WHERE id = ?').run('discontinued', id);
    } else {
      // Hard delete
      db.prepare('DELETE FROM products WHERE id = ?').run(id);
    }
  }

  async addVariant(productId: number, data: {
    size?: string;
    color?: string;
    color_hex?: string;
    price_override?: number;
    barcode?: string;
    initial_stock?: number;
  }): Promise<any> {
    const { size, color, color_hex, price_override, barcode, initial_stock = 0 } = data;

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);

    if (!product) {
      throw ApiError.notFound('Product not found');
    }

    // Generate variant SKU
    const lastVariant = db.prepare('SELECT MAX(id) as max_id FROM product_variants').get() as { max_id: number | null };
    const nextId = (lastVariant.max_id || 0) + 1;
    const sku = `VAR-${String(nextId).padStart(6, '0')}`;

    const finalBarcode = barcode || generateBarcode();

    const result = db.prepare(`
      INSERT INTO product_variants (product_id, sku, barcode, size, color, color_hex, price_override, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
    `).run(productId, sku, finalBarcode, size || null, color || null, color_hex || null, price_override || null);

    const variantId = result.lastInsertRowid as number;

    // Add initial inventory
    db.prepare(`
      INSERT INTO inventory (variant_id, quantity, reserved, min_stock_level, max_stock_level)
      VALUES (?, ?, 0, 5, 100)
    `).run(variantId, initial_stock);

    // Log inventory movement if initial stock > 0
    if (initial_stock > 0) {
      db.prepare(`
        INSERT INTO inventory_movements (variant_id, movement_type, quantity_change, quantity_before, quantity_after, reason, created_by)
        VALUES (?, 'import', ?, 0, ?, 'Initial stock', 1)
      `).run(variantId, initial_stock, initial_stock);
    }

    return db.prepare('SELECT * FROM product_variants WHERE id = ?').get(variantId);
  }

  async updateVariant(variantId: number, data: Partial<ProductVariant>): Promise<any> {
    const variant = db.prepare('SELECT * FROM product_variants WHERE id = ?').get(variantId);

    if (!variant) {
      throw ApiError.notFound('Variant not found');
    }

    const fields: string[] = [];
    const values: any[] = [];

    const allowedFields = ['size', 'color', 'color_hex', 'price_override', 'barcode', 'status'];

    for (const field of allowedFields) {
      if (data[field as keyof ProductVariant] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(data[field as keyof ProductVariant]);
      }
    }

    if (fields.length === 0) {
      return variant;
    }

    values.push(variantId);

    db.prepare(`
      UPDATE product_variants SET ${fields.join(', ')} WHERE id = ?
    `).run(...values);

    return db.prepare('SELECT * FROM product_variants WHERE id = ?').get(variantId);
  }

  async deleteVariant(variantId: number): Promise<void> {
    const variant = db.prepare('SELECT * FROM product_variants WHERE id = ?').get(variantId);

    if (!variant) {
      throw ApiError.notFound('Variant not found');
    }

    // Check for related orders
    const orderItems = db.prepare('SELECT COUNT(*) as count FROM order_items WHERE variant_id = ?').get(variantId) as { count: number };

    if (orderItems.count > 0) {
      // Soft delete - just change status
      db.prepare('UPDATE product_variants SET status = ? WHERE id = ?').run('inactive', variantId);
    } else {
      // Hard delete
      db.prepare('DELETE FROM product_variants WHERE id = ?').run(variantId);
    }
  }

  async getVariant(variantId: number): Promise<any> {
    const variant = db.prepare(`
      SELECT pv.*, p.name as product_name, p.sku as product_sku,
             COALESCE(i.quantity, 0) as stock,
             COALESCE(i.reserved, 0) as reserved
      FROM product_variants pv
      JOIN products p ON pv.product_id = p.id
      LEFT JOIN inventory i ON pv.id = i.variant_id
      WHERE pv.id = ?
    `).get(variantId) as any;

    if (!variant) {
      throw ApiError.notFound('Variant not found');
    }

    return variant;
  }

  async getFeatured(limit = 10): Promise<any[]> {
    return db.prepare(`
      SELECT p.*, c.name as category_name, b.name as brand_name,
             COALESCE(AVG(pr.rating), 0) as avg_rating,
             COUNT(DISTINCT pr.id) as review_count,
             COALESCE(SUM(i.quantity), 0) as total_stock
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN product_variants pv ON p.id = pv.product_id
      LEFT JOIN inventory i ON pv.id = i.variant_id
      LEFT JOIN product_reviews pr ON p.id = pr.product_id AND pr.is_visible = 1
      WHERE p.status = 'active'
      GROUP BY p.id
      ORDER BY p.sold_count DESC, p.view_count DESC
      LIMIT ?
    `).all(limit);
  }

  async getRelated(productId: number, limit = 6): Promise<any[]> {
    const product = db.prepare('SELECT category_id, brand_id FROM products WHERE id = ?').get(productId) as { category_id: number; brand_id: number };

    if (!product) {
      throw ApiError.notFound('Product not found');
    }

    return db.prepare(`
      SELECT p.*, c.name as category_name, b.name as brand_name,
             COALESCE(SUM(i.quantity), 0) as total_stock
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN product_variants pv ON p.id = pv.product_id
      LEFT JOIN inventory i ON pv.id = i.variant_id
      WHERE p.id != ? AND p.status = 'active'
        AND (p.category_id = ? OR p.brand_id = ?)
      GROUP BY p.id
      ORDER BY p.sold_count DESC
      LIMIT ?
    `).all(productId, product.category_id, product.brand_id, limit);
  }
}

export const productService = new ProductService();
