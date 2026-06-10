import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';

const dbPath = path.resolve(__dirname, '../../data/shoppro.db');

initSqlJs().then((SQL) => {
  const db = new SQL.Database(fs.readFileSync(dbPath));

  const count = db.exec('SELECT COUNT(*) as total FROM products')[0];
  const variants = db.exec('SELECT COUNT(*) as total FROM product_variants')[0];
  const inventory = db.exec('SELECT SUM(quantity) as total_stock FROM inventory')[0];
  const brands = db.exec('SELECT b.name, COUNT(p.id) as count FROM brands b LEFT JOIN products p ON b.id = p.brand_id GROUP BY b.id ORDER BY count DESC');
  const cats = db.exec('SELECT c.name, COUNT(p.id) as count FROM categories c LEFT JOIN products p ON c.id = p.category_id GROUP BY c.id ORDER BY count DESC');
  const sample = db.exec('SELECT id, sku, name, retail_price FROM products ORDER BY id LIMIT 20');

  console.log('\n=== PRODUCT SEED VERIFICATION ===');
  console.log(`Total products:    ${count?.values[0]?.[0] ?? 0}`);
  console.log(`Total variants:    ${variants?.values[0]?.[0] ?? 0}`);
  console.log(`Total stock units: ${inventory?.values[0]?.[0] ?? 0}`);
  console.log('\n--- Products by Brand ---');
  (brands[0]?.values ?? []).forEach(row => console.log(`  ${row.join(' | ')}`));
  console.log('\n--- Products by Category ---');
  (cats[0]?.values ?? []).forEach(row => console.log(`  ${row.join(' | ')}`));
  console.log('\n--- All Products ---');
  (sample[0]?.values ?? []).forEach(row => console.log(`  ${row.join(' | ')}`));

  db.close();
}).catch(console.error);
