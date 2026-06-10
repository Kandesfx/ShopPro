// sql.js compatible wrapper that provides better-sqlite3-like API
// This allows existing services using db.prepare().get()/run() to work without changes
import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { config } from '../config';
import {
  generateBarcode,
  generateOrderNumber,
  generateReferralCode,
} from '../utils/helpers';

const dbPath = path.resolve(__dirname, '../../data/shoppro.db');

function saveDb(database: SqlJsDatabase) {
  const data = database.export();
  const buffer = Buffer.from(data);
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(dbPath, buffer);
}

class SqlJsPreparedStatement {
  constructor(private getDb: () => SqlJsDatabase, private sql: string) {}

  private db() {
    const d = this.getDb();
    if (!d) throw new Error('Database not initialized');
    return d;
  }

  run(...params: any[]) {
    this.db().run(this.sql, params);
    saveDb(this.db());
    return {
      lastInsertRowid: this.db().exec('SELECT last_insert_rowid()')[0]?.values[0]?.[0] ?? 0,
      changes: this.db().getRowsModified(),
    };
  }

  get(...params: any[]) {
    const result = this.db().exec(this.sql, params);
    if (!result.length || !result[0].values.length) return undefined;
    const columns = result[0].columns;
    const row = result[0].values[0];
    const obj: any = {};
    columns.forEach((col: string, i: number) => { obj[col] = row[i]; });
    return obj;
  }

  all(...params: any[]) {
    const result = this.db().exec(this.sql, params);
    if (!result.length) return [];
    const columns = result[0].columns;
    return result[0].values.map((row: any[]) => {
      const obj: any = {};
      columns.forEach((col: string, i: number) => { obj[col] = row[i]; });
      return obj;
    });
  }
}

class SqlJsWrapper {
  private db: SqlJsDatabase | null = null;
  private initPromise: Promise<SqlJsDatabase>;

  constructor() {
    this.initPromise = this.initialize();
  }

  private async initialize(): Promise<SqlJsDatabase> {
    const SQL = await initSqlJs();
    if (fs.existsSync(dbPath)) {
      const buffer = fs.readFileSync(dbPath);
      this.db = new SQL.Database(buffer);
      console.log('Database loaded from file:', dbPath);
    } else {
      this.db = new SQL.Database();
      console.log('New database created:', dbPath);
    }

    const database = this.db;
    database.exec(`
      PRAGMA foreign_keys = ON;
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        phone TEXT,
        full_name TEXT,
        role TEXT NOT NULL DEFAULT 'customer',
        avatar TEXT,
        is_active INTEGER DEFAULT 1,
        failed_login_attempts INTEGER DEFAULT 0,
        locked_until TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        staff_code TEXT UNIQUE NOT NULL,
        position TEXT NOT NULL,
        hire_date TEXT NOT NULL,
        commission_rate REAL DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        parent_id INTEGER,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        description TEXT,
        image TEXT,
        sort_order INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
      );
      CREATE TABLE IF NOT EXISTS brands (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        logo TEXT,
        description TEXT,
        is_active INTEGER DEFAULT 1
      );
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sku TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        description TEXT,
        category_id INTEGER,
        brand_id INTEGER,
        cost_price REAL NOT NULL DEFAULT 0,
        retail_price REAL NOT NULL DEFAULT 0,
        wholesale_price REAL NOT NULL DEFAULT 0,
        barcode TEXT UNIQUE,
        weight REAL,
        images TEXT,
        status TEXT DEFAULT 'active',
        view_count INTEGER DEFAULT 0,
        sold_count INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
        FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL
      );
      CREATE TABLE IF NOT EXISTS product_variants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        sku TEXT UNIQUE NOT NULL,
        barcode TEXT UNIQUE,
        size TEXT,
        color TEXT,
        color_hex TEXT,
        price_override REAL,
        status TEXT DEFAULT 'active',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS inventory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        variant_id INTEGER NOT NULL UNIQUE,
        quantity INTEGER DEFAULT 0,
        reserved INTEGER DEFAULT 0,
        min_stock_level INTEGER DEFAULT 5,
        max_stock_level INTEGER DEFAULT 100,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS inventory_movements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        variant_id INTEGER NOT NULL,
        movement_type TEXT NOT NULL,
        quantity_change INTEGER NOT NULL,
        quantity_before INTEGER NOT NULL,
        quantity_after INTEGER NOT NULL,
        reference_type TEXT,
        reference_id INTEGER,
        reason TEXT,
        created_by INTEGER,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      );
      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        full_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        gender TEXT,
        date_of_birth TEXT,
        customer_type TEXT DEFAULT 'regular',
        total_spent REAL DEFAULT 0,
        total_orders INTEGER DEFAULT 0,
        loyalty_points INTEGER DEFAULT 0,
        loyalty_tier TEXT DEFAULT 'bronze',
        referral_code TEXT UNIQUE,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      );
      CREATE TABLE IF NOT EXISTS promotions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        value REAL NOT NULL,
        max_discount REAL,
        min_order_amount REAL DEFAULT 0,
        max_uses INTEGER DEFAULT 0,
        max_uses_per_customer INTEGER DEFAULT 1,
        current_uses INTEGER DEFAULT 0,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        applicable_type TEXT DEFAULT 'all',
        applicable_ids TEXT,
        is_active INTEGER DEFAULT 1,
        is_public INTEGER DEFAULT 0,
        priority INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_number TEXT UNIQUE NOT NULL,
        customer_id INTEGER,
        staff_id INTEGER,
        order_type TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        subtotal REAL NOT NULL DEFAULT 0,
        discount_amount REAL DEFAULT 0,
        promotion_id INTEGER,
        tax_amount REAL DEFAULT 0,
        shipping_fee REAL DEFAULT 0,
        total_amount REAL NOT NULL DEFAULT 0,
        paid_amount REAL DEFAULT 0,
        change_amount REAL DEFAULT 0,
        payment_method TEXT DEFAULT 'cash',
        payment_status TEXT DEFAULT 'pending',
        shipping_full_name TEXT,
        shipping_phone TEXT,
        shipping_address TEXT,
        payment_transaction_id TEXT,
        note TEXT,
        ordered_at TEXT DEFAULT CURRENT_TIMESTAMP,
        confirmed_at TEXT,
        shipped_at TEXT,
        delivered_at TEXT,
        completed_at TEXT,
        cancelled_at TEXT,
        cancel_reason TEXT,
        store_id INTEGER,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
        FOREIGN KEY (staff_id) REFERENCES employees(id) ON DELETE SET NULL,
        FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE SET NULL
      );
      CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        variant_id INTEGER NOT NULL,
        product_name TEXT NOT NULL,
        sku TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        unit_price REAL NOT NULL,
        cost_price REAL NOT NULL DEFAULT 0,
        discount_amount REAL DEFAULT 0,
        line_total REAL NOT NULL,
        returned_quantity INTEGER DEFAULT 0,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
        FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE RESTRICT
      );
      CREATE TABLE IF NOT EXISTS suppliers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        code TEXT UNIQUE NOT NULL,
        contact_name TEXT,
        email TEXT,
        phone TEXT,
        address TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS purchase_orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        po_number TEXT UNIQUE NOT NULL,
        supplier_id INTEGER NOT NULL,
        status TEXT DEFAULT 'draft',
        subtotal REAL DEFAULT 0,
        total_amount REAL DEFAULT 0,
        note TEXT,
        approved_by INTEGER,
        received_date TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE RESTRICT,
        FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
      );
      CREATE TABLE IF NOT EXISTS purchase_order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        purchase_order_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        variant_id INTEGER,
        quantity INTEGER NOT NULL,
        unit_cost REAL NOT NULL,
        line_total REAL NOT NULL,
        FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
      );
      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        payment_method TEXT NOT NULL,
        amount REAL NOT NULL,
        status TEXT DEFAULT 'pending',
        transaction_id TEXT,
        paid_at TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS product_reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        customer_id INTEGER NOT NULL,
        order_id INTEGER,
        rating INTEGER NOT NULL,
        title TEXT,
        content TEXT,
        is_visible INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
      );
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        token TEXT UNIQUE NOT NULL,
        device_info TEXT,
        ip_address TEXT,
        expires_at TEXT NOT NULL,
        revoked_at TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        action TEXT NOT NULL,
        table_name TEXT,
        record_id INTEGER,
        old_values TEXT,
        new_values TEXT,
        ip_address TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      );
      CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
      CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
      CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id);
      CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
      CREATE INDEX IF NOT EXISTS idx_product_variants_product ON product_variants(product_id);
      CREATE INDEX IF NOT EXISTS idx_inventory_variant ON inventory(variant_id);
      CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
      CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
      CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
      CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
      CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
      CREATE INDEX IF NOT EXISTS idx_promotions_code ON promotions(code);
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `);
    console.log('Database tables created/verified');

    // Auto-save every 30 seconds
    setInterval(() => {
      if (this.db) saveDb(this.db);
    }, 30000);

    // Save on exit
    process.on('exit', () => { if (this.db) saveDb(this.db); });
    process.on('SIGINT', () => { if (this.db) saveDb(this.db); process.exit(0); });
    process.on('SIGTERM', () => { if (this.db) saveDb(this.db); process.exit(0); });

    return this.db;
  }

  prepare(sql: string): SqlJsPreparedStatement {
    return new SqlJsPreparedStatement(() => this.db, sql);
  }

  exec(sql: string) {
    if (!this.db) throw new Error('Database not initialized');
    this.db.exec(sql);
    saveDb(this.db);
  }

  getRaw(): SqlJsDatabase {
    if (!this.db) throw new Error('Database not initialized');
    return this.db;
  }

  async waitForInit(): Promise<void> {
    await this.initPromise;
  }
}

const wrapper = new SqlJsWrapper();

export const waitForDb = () => wrapper.waitForInit();
export { wrapper as db };

// Seed function
export const seedDatabase = async () => {
  await wrapper.waitForInit();
  const existingUsers = wrapper.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number } | undefined;
  if (existingUsers && existingUsers.count > 0) {
    console.log('Database already seeded, skipping...');
    return;
  }

  console.log('Seeding database...');

  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const staffPasswordHash = await bcrypt.hash('staff123', 10);
  const customerPasswordHash = await bcrypt.hash('customer123', 10);

  // Users (IDs 1-7)
  wrapper.prepare(`INSERT INTO users (id, username, email, password_hash, phone, full_name, role, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(1, 'admin', 'admin@shoppro.com', adminPasswordHash, '0909123456', 'Administrator', 'admin', 1);
  wrapper.prepare(`INSERT INTO users (id, username, email, password_hash, phone, full_name, role, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(2, 'manager', 'manager@shoppro.com', staffPasswordHash, '0909123457', 'Store Manager', 'manager', 1);
  wrapper.prepare(`INSERT INTO users (id, username, email, password_hash, phone, full_name, role, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(3, 'staff', 'staff@shoppro.com', staffPasswordHash, '0909123458', 'Sales Staff', 'staff', 1);
  wrapper.prepare(`INSERT INTO users (id, username, email, password_hash, phone, full_name, role, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(4, 'accountant', 'accountant@shoppro.com', staffPasswordHash, '0909123459', 'Accountant', 'accountant', 1);
  wrapper.prepare(`INSERT INTO users (id, username, email, password_hash, phone, full_name, role, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(5, 'customer1', 'customer@email.com', customerPasswordHash, '0909123460', 'Nguyen Van A', 'customer', 1);
  wrapper.prepare(`INSERT INTO users (id, username, email, password_hash, phone, full_name, role, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(6, 'customer2', 'customer2@email.com', customerPasswordHash, '0909123461', 'Tran Thi B', 'customer', 1);
  wrapper.prepare(`INSERT INTO users (id, username, email, password_hash, phone, full_name, role, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(7, 'customer3', 'customer3@email.com', customerPasswordHash, '0909123462', 'Le Van C', 'customer', 1);

  // Employees
  wrapper.prepare(`INSERT INTO employees (id, user_id, staff_code, position, hire_date, commission_rate, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(1, 1, 'EMP001', 'Administrator', '2024-01-01', 0, 1);
  wrapper.prepare(`INSERT INTO employees (id, user_id, staff_code, position, hire_date, commission_rate, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(2, 2, 'EMP002', 'Store Manager', '2024-01-15', 0, 1);
  wrapper.prepare(`INSERT INTO employees (id, user_id, staff_code, position, hire_date, commission_rate, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(3, 3, 'EMP003', 'Sales Associate', '2024-02-01', 5, 1);
  wrapper.prepare(`INSERT INTO employees (id, user_id, staff_code, position, hire_date, commission_rate, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(4, 4, 'EMP004', 'Accountant', '2024-01-10', 0, 1);

  // Categories (IDs 1-5)
  wrapper.prepare(`INSERT INTO categories (id, name, slug, description, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?)`).run(1, 'Running Shoes', 'running-shoes', 'High-performance running shoes', 1, 1);
  wrapper.prepare(`INSERT INTO categories (id, name, slug, description, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?)`).run(2, 'Casual Shoes', 'casual-shoes', 'Comfortable everyday shoes', 2, 1);
  wrapper.prepare(`INSERT INTO categories (id, name, slug, description, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?)`).run(3, 'Sports Shoes', 'sports-shoes', 'Athletic footwear', 3, 1);
  wrapper.prepare(`INSERT INTO categories (id, name, slug, description, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?)`).run(4, 'Formal Shoes', 'formal-shoes', 'Professional footwear', 4, 1);
  wrapper.prepare(`INSERT INTO categories (id, name, slug, description, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?)`).run(5, 'Sandals', 'sandals', 'Open-toe footwear', 5, 1);

  // Brands (IDs 1-6)
  wrapper.prepare(`INSERT INTO brands (id, name, slug, description, is_active) VALUES (?, ?, ?, ?, ?)`).run(1, 'Nike', 'nike', 'Just Do It', 1);
  wrapper.prepare(`INSERT INTO brands (id, name, slug, description, is_active) VALUES (?, ?, ?, ?, ?)`).run(2, 'Adidas', 'adidas', 'Adidas - All or Nothing', 1);
  wrapper.prepare(`INSERT INTO brands (id, name, slug, description, is_active) VALUES (?, ?, ?, ?, ?)`).run(3, 'Puma', 'puma', 'Puma - Forever Faster', 1);
  wrapper.prepare(`INSERT INTO brands (id, name, slug, description, is_active) VALUES (?, ?, ?, ?, ?)`).run(4, 'New Balance', 'new-balance', 'Fearlessly Independent Since 1906', 1);
  wrapper.prepare(`INSERT INTO brands (id, name, slug, description, is_active) VALUES (?, ?, ?, ?, ?)`).run(5, 'Converse', 'converse', 'Converse - All Star', 1);
  wrapper.prepare(`INSERT INTO brands (id, name, slug, description, is_active) VALUES (?, ?, ?, ?, ?)`).run(6, 'Vans', 'vans', 'Vans - Off The Wall', 1);

  // Products (IDs 1-6) with explicit IDs
  wrapper.prepare(`INSERT INTO products (id, sku, name, slug, description, category_id, brand_id, cost_price, retail_price, wholesale_price, barcode, weight, images, status, view_count, sold_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(1, 'NIKE-AM-001', 'Nike Air Max 270', 'nike-air-max-270', 'Visible cushioning under every step', 1, 1, 1200000, 2190000, 1750000, generateBarcode(), 350, '["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800"]', 'active', 1250, 89);
  wrapper.prepare(`INSERT INTO products (id, sku, name, slug, description, category_id, brand_id, cost_price, retail_price, wholesale_price, barcode, weight, images, status, view_count, sold_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(2, 'ADI-UB-001', 'Adidas Ultraboost 22', 'adidas-ultraboost-22', 'Responsive energy return with every stride', 1, 2, 1800000, 2990000, 2400000, generateBarcode(), 340, '["https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800"]', 'active', 980, 67);
  wrapper.prepare(`INSERT INTO products (id, sku, name, slug, description, category_id, brand_id, cost_price, retail_price, wholesale_price, barcode, weight, images, status, view_count, sold_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(3, 'NIKE-AF1-001', "Nike Air Force 1 '07", 'nike-air-force-1-07', 'The radiance lives on in the Nike Air Force 1', 2, 1, 950000, 1690000, 1350000, generateBarcode(), 420, '["https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800"]', 'active', 2100, 156);
  wrapper.prepare(`INSERT INTO products (id, sku, name, slug, description, category_id, brand_id, cost_price, retail_price, wholesale_price, barcode, weight, images, status, view_count, sold_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(4, 'CONV-CT-001', 'Converse Chuck Taylor All Star', 'converse-chuck-taylor-all-star', 'The most iconic sneaker in the world', 2, 5, 550000, 899000, 720000, generateBarcode(), 380, '["https://images.unsplash.com/photo-1607522370275-f14206abe5d3?w=800"]', 'active', 1800, 203);
  wrapper.prepare(`INSERT INTO products (id, sku, name, slug, description, category_id, brand_id, cost_price, retail_price, wholesale_price, barcode, weight, images, status, view_count, sold_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(5, 'PUMA-RSX-001', 'Puma RS-X', 'puma-rs-x', 'Takes extreme to another level', 3, 3, 1100000, 1890000, 1500000, generateBarcode(), 360, '["https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=800"]', 'active', 650, 42);
  wrapper.prepare(`INSERT INTO products (id, sku, name, slug, description, category_id, brand_id, cost_price, retail_price, wholesale_price, barcode, weight, images, status, view_count, sold_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(6, 'NB-574-001', 'New Balance 574', 'new-balance-574', 'The quintessential New Balance sneaker', 2, 4, 1000000, 1790000, 1430000, generateBarcode(), 390, '["https://images.unsplash.com/photo-1539185441755-769473a23570?w=800"]', 'active', 890, 78);

  // Product Variants (IDs 1-62) - explicit IDs
  const variants: Array<{id: number, product_id: number, sku: string, barcode: string, size: string, color: string, hex: string}> = [];
  let vid = 1;
  const variantDefs = [
    { pid: 1, sku: 'NIKE-AM-001', sizes: ['38','39','40','41','42','43'], colors: [{name:'Black/White',hex:'#000000'},{name:'Red/White',hex:'#FF0000'}] },
    { pid: 2, sku: 'ADI-UB-001', sizes: ['39','40','41','42','43'], colors: [{name:'Core Black',hex:'#1C1C1C'},{name:'Cloud White',hex:'#FFFFFF'}] },
    { pid: 3, sku: 'NIKE-AF1-001', sizes: ['38','39','40','41','42','43','44'], colors: [{name:'White',hex:'#FFFFFF'},{name:'Black',hex:'#000000'}] },
    { pid: 4, sku: 'CONV-CT-001', sizes: ['36','37','38','39','40','41','42','43'], colors: [{name:'Black',hex:'#000000'},{name:'White',hex:'#FFFFFF'}] },
    { pid: 5, sku: 'PUMA-RSX-001', sizes: ['39','40','41','42','43'], colors: [{name:'White/Red',hex:'#FFFFFF'},{name:'Black/Yellow',hex:'#000000'}] },
    { pid: 6, sku: 'NB-574-001', sizes: ['38','39','40','41','42','43'], colors: [{name:'Grey/Navy',hex:'#808080'},{name:'Burgundy/White',hex:'#800020'}] },
  ];
  for (const vd of variantDefs) {
    for (const c of vd.colors) {
      for (const s of vd.sizes) {
        const vsku = `${vd.sku}-${s}-${c.name.replace(/[\s/]/g,'')}`;
        const vbc = generateBarcode();
        wrapper.prepare(`INSERT INTO product_variants (id, product_id, sku, barcode, size, color, color_hex, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`).run(vid, vd.pid, vsku, vbc, s, c.name, c.hex);
        const qty = Math.floor(Math.random() * 50) + 10;
        wrapper.prepare(`INSERT INTO inventory (id, variant_id, quantity, reserved, min_stock_level, max_stock_level) VALUES (?, ?, ?, 0, 5, 100)`).run(vid, vid, qty);
        variants.push({id: vid, product_id: vd.pid, sku: vsku, barcode: vbc, size: s, color: c.name, hex: c.hex});
        vid++;
      }
    }
  }

  // Customers (IDs 1-3)
  wrapper.prepare(`INSERT INTO customers (id, user_id, full_name, phone, email, gender, date_of_birth, customer_type, loyalty_tier, referral_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(1, 5, 'Nguyen Van A', '0909123460', 'customer@email.com', 'male', '1990-05-15', 'vip', 'gold', generateReferralCode());
  wrapper.prepare(`INSERT INTO customers (id, user_id, full_name, phone, email, gender, date_of_birth, customer_type, loyalty_tier, referral_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(2, 6, 'Tran Thi B', '0909123461', 'customer2@email.com', 'female', '1992-08-20', 'regular', 'silver', generateReferralCode());
  wrapper.prepare(`INSERT INTO customers (id, user_id, full_name, phone, email, gender, date_of_birth, customer_type, loyalty_tier, referral_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(3, 7, 'Le Van C', '0909123462', 'customer3@email.com', 'male', '1988-12-10', 'wholesale', 'platinum', generateReferralCode());

  const today = new Date();
  const nextMonth = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Promotions
  wrapper.prepare(`INSERT INTO promotions (id, code, name, type, value, max_discount, min_order_amount, max_uses, max_uses_per_customer, current_uses, start_date, end_date, applicable_type, is_active, is_public, priority) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(1, 'WELCOME10', 'Welcome 10% Off', 'percentage', 10, 200000, 0, 1000, 1, 0, today.toISOString().split('T')[0], nextMonth.toISOString().split('T')[0], 'all', 1, 1, 1);
  wrapper.prepare(`INSERT INTO promotions (id, code, name, type, value, max_discount, min_order_amount, max_uses, max_uses_per_customer, current_uses, start_date, end_date, applicable_type, is_active, is_public, priority) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(2, 'SUMMER20', 'Summer Sale 20%', 'percentage', 20, 500000, 500000, 500, 1, 45, today.toISOString().split('T')[0], nextMonth.toISOString().split('T')[0], 'all', 1, 1, 2);
  wrapper.prepare(`INSERT INTO promotions (id, code, name, type, value, min_order_amount, max_uses, max_uses_per_customer, current_uses, start_date, end_date, applicable_type, is_active, is_public, priority) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(3, 'FREESHIP', 'Free Shipping', 'free_shipping', 0, 300000, 200, 3, 12, today.toISOString().split('T')[0], nextWeek.toISOString().split('T')[0], 'all', 1, 1, 3);
  wrapper.prepare(`INSERT INTO promotions (id, code, name, type, value, min_order_amount, max_uses, max_uses_per_customer, current_uses, start_date, end_date, applicable_type, is_active, is_public, priority) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(4, 'VIP500K', 'VIP 500K Off', 'fixed_amount', 500000, 2000000, 100, 1, 8, today.toISOString().split('T')[0], nextMonth.toISOString().split('T')[0], 'customer_type', 1, 0, 4);

  // Suppliers
  wrapper.prepare(`INSERT INTO suppliers (id, name, code, contact_name, email, phone, address, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(1, 'Nike Vietnam Distributor', 'SUP001', 'John Smith', 'john@nike-vn.com', '0281234567', '123 Nguyen Hue, District 1, HCMC', 1);
  wrapper.prepare(`INSERT INTO suppliers (id, name, code, contact_name, email, phone, address, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(2, 'Adidas Vietnam', 'SUP002', 'Jane Doe', 'jane@adidas-vn.com', '0282345678', '456 Le Duan, District 3, HCMC', 1);
  wrapper.prepare(`INSERT INTO suppliers (id, name, code, contact_name, email, phone, address, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(3, 'Puma SEA', 'SUP003', 'Michael Chen', 'michael@puma-sea.com', '0283456789', '789 Dong Khoi, District 1, HCMC', 1);

  // Find variant IDs for order items (Nike AM size 42 Black/White, Nike AF1 size 42 White, etc.)
  const vNikeAM42 = variants.find(v => v.product_id === 1 && v.size === '42' && v.color === 'Black/White')?.id ?? 5;
  const vNikeAF142 = variants.find(v => v.product_id === 3 && v.size === '42' && v.color === 'White')?.id ?? 20;
  const vAdiUB42 = variants.find(v => v.product_id === 2 && v.size === '42' && v.color === 'Core Black')?.id ?? 8;
  const vConvWhite41 = variants.find(v => v.product_id === 4 && v.size === '41' && v.color === 'White')?.id ?? 12;
  const vNB42 = variants.find(v => v.product_id === 6 && v.size === '42' && v.color === 'Grey/Navy')?.id ?? 17;

  // Orders (IDs 1-3)
  wrapper.prepare(`INSERT INTO orders (id, order_number, customer_id, staff_id, order_type, status, subtotal, discount_amount, tax_amount, shipping_fee, total_amount, paid_amount, payment_method, payment_status, shipping_full_name, shipping_phone, shipping_address, ordered_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(1, generateOrderNumber(), 1, 3, 'online', 'completed', 4190000, 419000, 377100, 0, 4149000, 4149000, 'vnpay', 'paid', 'Nguyen Van A', '0909123460', '123 ABC Street, Ward 1, District 1, HCMC', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
  wrapper.prepare(`INSERT INTO order_items (id, order_id, product_id, variant_id, product_name, sku, quantity, unit_price, cost_price, line_total) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(1, 1, 1, vNikeAM42, 'Nike Air Max 270', 'NIKE-AM-001-42-Black/White', 1, 2190000, 1200000, 2190000);
  wrapper.prepare(`INSERT INTO order_items (id, order_id, product_id, variant_id, product_name, sku, quantity, unit_price, cost_price, line_total) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(2, 1, 3, vNikeAF142, "Nike Air Force 1 '07", 'NIKE-AF1-001-42-White', 1, 1690000, 950000, 1690000);

  wrapper.prepare(`INSERT INTO orders (id, order_number, customer_id, staff_id, order_type, status, subtotal, discount_amount, tax_amount, shipping_fee, total_amount, paid_amount, payment_method, payment_status, shipping_full_name, shipping_phone, shipping_address, ordered_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(2, generateOrderNumber(), 2, 3, 'online', 'processing', 2990000, 0, 299000, 30000, 3319000, 0, 'vnpay', 'pending', 'Tran Thi B', '0909123461', '456 DEF Street, Ward 2, District 3, HCMC', new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString());
  wrapper.prepare(`INSERT INTO order_items (id, order_id, product_id, variant_id, product_name, sku, quantity, unit_price, cost_price, line_total) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(3, 2, 2, vAdiUB42, 'Adidas Ultraboost 22', 'ADI-UB-001-42-CoreBlack', 1, 2990000, 1800000, 2990000);

  wrapper.prepare(`INSERT INTO orders (id, order_number, customer_id, staff_id, order_type, status, subtotal, discount_amount, tax_amount, shipping_fee, total_amount, paid_amount, payment_method, payment_status, shipping_full_name, shipping_phone, ordered_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(3, generateOrderNumber(), null, 3, 'pos', 'completed', 1798000, 0, 179800, 0, 1977800, 2000000, 'cash', 'paid', 'Walk-in Customer', '0909123000', new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString());
  wrapper.prepare(`INSERT INTO order_items (id, order_id, product_id, variant_id, product_name, sku, quantity, unit_price, cost_price, line_total) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(4, 3, 4, vConvWhite41, 'Converse Chuck Taylor All Star', 'CONV-CT-001-41-White', 1, 899000, 550000, 899000);
  wrapper.prepare(`INSERT INTO order_items (id, order_id, product_id, variant_id, product_name, sku, quantity, unit_price, cost_price, line_total) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(5, 3, 6, vNB42, 'New Balance 574', 'NB-574-001-42-Grey/Navy', 1, 1790000, 1000000, 1790000);

  console.log('Database seeded successfully!');
  console.log('Admin credentials: admin / admin123');
  console.log('Manager credentials: manager / staff123');
  console.log('Staff credentials: staff / staff123');
};
