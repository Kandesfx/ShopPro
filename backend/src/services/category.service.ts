import { db } from '../db';
import { ApiError } from '../utils/ApiError';
import { Category, Brand } from '../types';
import { paginate, slugify } from '../utils/helpers';

export class CategoryService {
  async getAll(params: {
    page?: number;
    limit?: number;
    parent_id?: number | null;
    is_active?: number;
  } = {}): Promise<{ categories: any[]; total: number }> {
    const { page = 1, limit = 100, parent_id, is_active = 1 } = params;
    const { take, skip } = paginate(page, limit);

    let whereClause = 'WHERE 1=1';
    const paramsArray: any[] = [];

    if (is_active !== undefined) {
      whereClause += ' AND c.is_active = ?';
      paramsArray.push(is_active);
    }

    if (parent_id !== undefined) {
      if (parent_id === null) {
        whereClause += ' AND c.parent_id IS NULL';
      } else {
        whereClause += ' AND c.parent_id = ?';
        paramsArray.push(parent_id);
      }
    }

    const totalResult = db.prepare(`
      SELECT COUNT(*) as count FROM categories c ${whereClause}
    `).get(...paramsArray) as { count: number };

    const categories = db.prepare(`
      SELECT c.*, 
             p.name as parent_name,
             COUNT(DISTINCT p2.id) as subcategory_count,
             COUNT(DISTINCT prod.id) as product_count
      FROM categories c
      LEFT JOIN categories p ON c.parent_id = p.id
      LEFT JOIN categories p2 ON c.id = p2.parent_id
      LEFT JOIN products prod ON c.id = prod.category_id AND prod.status = 'active'
      ${whereClause}
      GROUP BY c.id
      ORDER BY c.sort_order, c.name
      LIMIT ? OFFSET ?
    `).all(...paramsArray, take, skip);

    return { categories, total: totalResult.count };
  }

  async getAllFlat(): Promise<any[]> {
    return db.prepare(`
      SELECT c.*, p.name as parent_name
      FROM categories c
      LEFT JOIN categories p ON c.parent_id = p.id
      WHERE c.is_active = 1
      ORDER BY c.sort_order, c.name
    `).all();
  }

  async getById(id: number): Promise<any> {
    const category = db.prepare(`
      SELECT c.*, p.name as parent_name
      FROM categories c
      LEFT JOIN categories p ON c.parent_id = p.id
      WHERE c.id = ?
    `).get(id) as any;

    if (!category) {
      throw ApiError.notFound('Category not found');
    }

    // Get subcategories
    const subcategories = db.prepare(`
      SELECT * FROM categories WHERE parent_id = ? AND is_active = 1
      ORDER BY sort_order, name
    `).all(id);

    // Get products in this category (including subcategories)
    const productCount = db.prepare(`
      SELECT COUNT(DISTINCT p.id) as count
      FROM products p
      WHERE p.category_id = ? AND p.status = 'active'
    `).get(id) as { count: number };

    return {
      ...category,
      subcategories,
      product_count: productCount.count,
    };
  }

  async getBySlug(slug: string): Promise<any> {
    const category = db.prepare(`
      SELECT c.*, p.name as parent_name
      FROM categories c
      LEFT JOIN categories p ON c.parent_id = p.id
      WHERE c.slug = ?
    `).get(slug) as any;

    if (!category) {
      throw ApiError.notFound('Category not found');
    }

    // Get subcategories
    const subcategories = db.prepare(`
      SELECT * FROM categories WHERE parent_id = ? AND is_active = 1
      ORDER BY sort_order, name
    `).all(category.id);

    // Get products
    const products = db.prepare(`
      SELECT p.*, b.name as brand_name,
             COALESCE(SUM(i.quantity), 0) as total_stock
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN product_variants pv ON p.id = pv.product_id
      LEFT JOIN inventory i ON pv.id = i.variant_id
      WHERE p.category_id = ? AND p.status = 'active'
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `).all(category.id);

    return {
      ...category,
      subcategories,
      products,
    };
  }

  async create(data: {
    name: string;
    parent_id?: number;
    description?: string;
    image?: string;
    sort_order?: number;
    is_active?: number;
  }): Promise<any> {
    const { name, parent_id, description, image, sort_order = 0, is_active = 1 } = data;

    // Generate unique slug
    let slug = slugify(name);
    let counter = 1;
    while (db.prepare('SELECT id FROM categories WHERE slug = ?').get(slug)) {
      slug = `${slugify(name)}-${counter}`;
      counter++;
    }

    const result = db.prepare(`
      INSERT INTO categories (name, slug, parent_id, description, image, sort_order, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(name, slug, parent_id || null, description || null, image || null, sort_order, is_active);

    return this.getById(result.lastInsertRowid as number);
  }

  async update(id: number, data: Partial<Category>): Promise<any> {
    const existingCategory = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);

    if (!existingCategory) {
      throw ApiError.notFound('Category not found');
    }

    const fields: string[] = [];
    const values: any[] = [];

    const allowedFields = ['name', 'parent_id', 'description', 'image', 'sort_order', 'is_active'];

    for (const field of allowedFields) {
      if (data[field as keyof Category] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(data[field as keyof Category]);
      }
    }

    if (data.name) {
      // Generate new slug
      let slug = slugify(data.name);
      let counter = 1;
      while (db.prepare('SELECT id FROM categories WHERE slug = ? AND id != ?').get(slug, id)) {
        slug = `${slugify(data.name)}-${counter}`;
        counter++;
      }
      fields.push('slug = ?');
      values.push(slug);
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    db.prepare(`
      UPDATE categories SET ${fields.join(', ')} WHERE id = ?
    `).run(...values);

    return this.getById(id);
  }

  async delete(id: number): Promise<void> {
    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);

    if (!category) {
      throw ApiError.notFound('Category not found');
    }

    // Check if has subcategories
    const subcategories = db.prepare('SELECT COUNT(*) as count FROM categories WHERE parent_id = ?').get(id) as { count: number };

    if (subcategories.count > 0) {
      throw ApiError.badRequest('Cannot delete category with subcategories. Delete subcategories first.');
    }

    // Check if has products
    const products = db.prepare('SELECT COUNT(*) as count FROM products WHERE category_id = ?').get(id) as { count: number };

    if (products.count > 0) {
      // Soft delete
      db.prepare('UPDATE categories SET is_active = 0 WHERE id = ?').run(id);
    } else {
      // Hard delete
      db.prepare('DELETE FROM categories WHERE id = ?').run(id);
    }
  }
}

export class BrandService {
  async getAll(params: { page?: number; limit?: number; is_active?: number } = {}): Promise<{ brands: any[]; total: number }> {
    const { page = 1, limit = 100, is_active = 1 } = params;
    const { take, skip } = paginate(page, limit);

    let whereClause = '';
    const paramsArray: any[] = [];

    if (is_active !== undefined) {
      whereClause = 'WHERE b.is_active = ?';
      paramsArray.push(is_active);
    }

    const totalResult = db.prepare(`
      SELECT COUNT(*) as count FROM brands b ${whereClause}
    `).get(...paramsArray) as { count: number };

    const brands = db.prepare(`
      SELECT b.*, COUNT(DISTINCT p.id) as product_count
      FROM brands b
      LEFT JOIN products p ON b.id = p.brand_id AND p.status = 'active'
      ${whereClause}
      GROUP BY b.id
      ORDER BY b.name
      LIMIT ? OFFSET ?
    `).all(...paramsArray, take, skip);

    return { brands, total: totalResult.count };
  }

  async getById(id: number): Promise<any> {
    const brand = db.prepare(`
      SELECT b.*, COUNT(DISTINCT p.id) as product_count
      FROM brands b
      LEFT JOIN products p ON b.id = p.brand_id AND p.status = 'active'
      WHERE b.id = ?
      GROUP BY b.id
    `).get(id) as any;

    if (!brand) {
      throw ApiError.notFound('Brand not found');
    }

    return brand;
  }

  async getBySlug(slug: string): Promise<any> {
    const brand = db.prepare(`
      SELECT b.*, COUNT(DISTINCT p.id) as product_count
      FROM brands b
      LEFT JOIN products p ON b.id = p.brand_id AND p.status = 'active'
      WHERE b.slug = ?
      GROUP BY b.id
    `).get(slug) as any;

    if (!brand) {
      throw ApiError.notFound('Brand not found');
    }

    // Get products
    const products = db.prepare(`
      SELECT p.*, COALESCE(SUM(i.quantity), 0) as total_stock
      FROM products p
      LEFT JOIN product_variants pv ON p.id = pv.product_id
      LEFT JOIN inventory i ON pv.id = i.variant_id
      WHERE p.brand_id = ? AND p.status = 'active'
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `).all(brand.id);

    return {
      ...brand,
      products,
    };
  }

  async create(data: {
    name: string;
    description?: string;
    logo?: string;
    is_active?: number;
  }): Promise<any> {
    const { name, description, logo, is_active = 1 } = data;

    // Generate unique slug
    let slug = slugify(name);
    let counter = 1;
    while (db.prepare('SELECT id FROM brands WHERE slug = ?').get(slug)) {
      slug = `${slugify(name)}-${counter}`;
      counter++;
    }

    const result = db.prepare(`
      INSERT INTO brands (name, slug, description, logo, is_active)
      VALUES (?, ?, ?, ?, ?)
    `).run(name, slug, description || null, logo || null, is_active);

    return this.getById(result.lastInsertRowid as number);
  }

  async update(id: number, data: Partial<Brand>): Promise<any> {
    const existingBrand = db.prepare('SELECT * FROM brands WHERE id = ?').get(id);

    if (!existingBrand) {
      throw ApiError.notFound('Brand not found');
    }

    const fields: string[] = [];
    const values: any[] = [];

    const allowedFields = ['name', 'description', 'logo', 'is_active'];

    for (const field of allowedFields) {
      if (data[field as keyof Brand] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(data[field as keyof Brand]);
      }
    }

    if (data.name) {
      let slug = slugify(data.name);
      let counter = 1;
      while (db.prepare('SELECT id FROM brands WHERE slug = ? AND id != ?').get(slug, id)) {
        slug = `${slugify(data.name)}-${counter}`;
        counter++;
      }
      fields.push('slug = ?');
      values.push(slug);
    }

    values.push(id);

    db.prepare(`
      UPDATE brands SET ${fields.join(', ')} WHERE id = ?
    `).run(...values);

    return this.getById(id);
  }

  async delete(id: number): Promise<void> {
    const brand = db.prepare('SELECT * FROM brands WHERE id = ?').get(id);

    if (!brand) {
      throw ApiError.notFound('Brand not found');
    }

    // Check if has products
    const products = db.prepare('SELECT COUNT(*) as count FROM products WHERE brand_id = ?').get(id) as { count: number };

    if (products.count > 0) {
      // Soft delete
      db.prepare('UPDATE brands SET is_active = 0 WHERE id = ?').run(id);
    } else {
      // Hard delete
      db.prepare('DELETE FROM brands WHERE id = ?').run(id);
    }
  }
}

export const categoryService = new CategoryService();
export const brandService = new BrandService();
