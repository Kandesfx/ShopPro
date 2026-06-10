import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import { slugify } from '../utils/helpers';

const dbPath = path.resolve(__dirname, '../../data/shoppro.db');

function saveDb(database: SqlJsDatabase) {
  const data = database.export();
  const buffer = Buffer.from(data);
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(dbPath, buffer);
}

const generateBarcode = (): string => crypto.randomBytes(6).toString('hex').toUpperCase();

const sizes = ['38', '39', '40', '41', '42', '43', '44'];
const colors = [
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Red', hex: '#FF0000' },
  { name: 'Blue', hex: '#0000FF' },
  { name: 'Grey', hex: '#808080' },
  { name: 'Navy', hex: '#000080' },
];

const products = [
  // Nike (brand_id=1)
  { id: 7, sku: 'NIKE-AM90-001', name: 'Nike Air Max 90', description: 'Nothing as iconic as the original. The Nike Air Max 90 stays true to its OG running roots with the iconic Waffle outsole.', category_id: 1, brand_id: 1, cost: 1400000, retail: 2490000, images: '["https://images.unsplash.com/photo-1605348532760-6753d2c43329?w=800"]' },
  { id: 8, sku: 'NIKE-PEG-001', name: 'Nike Pegasus 40', description: 'A springy ride for every run. The Nike Pegasus 40 offers responsive cushioning and a breathable upper for your everyday miles.', category_id: 1, brand_id: 1, cost: 1600000, retail: 2790000, images: '["https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800"]' },
  { id: 9, sku: 'NIKE-REV-001', name: 'Nike Revolution 6', description: 'Comfortable miles start here. The Nike Revolution 6 delivers soft cushioning and a breathable mesh upper for everyday running.', category_id: 1, brand_id: 1, cost: 900000, retail: 1590000, images: '["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800"]' },
  { id: 10, sku: 'NIKE-DUNK-001', name: 'Nike Dunk Low', description: 'Created for the hardwood but taken to the streets, the Nike Dunk Low returns with crisp overlays and original team colors.', category_id: 2, brand_id: 1, cost: 1100000, retail: 1990000, images: '["https://images.unsplash.com/photo-1597045566677-8cf032ed6634?w=800"]' },
  { id: 11, sku: 'NIKE-BLAZER-001', name: "Nike Blazer Mid '77", description: 'The Nike Blazer Mid \'77 takes the classic basketball silhouette and makes it a timeless street-style staple.', category_id: 2, brand_id: 1, cost: 1000000, retail: 1790000, images: '["https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800"]' },
  { id: 12, sku: 'NIKE-AF1L-001', name: "Nike Air Force 1 Low '07 LV8", description: "Elevated with premium materials, the Nike Air Force 1 Low '07 LV8 brings a fresh take on the legendary hoops shoe.", category_id: 2, brand_id: 1, cost: 1050000, retail: 1890000, images: '["https://images.unsplash.com/photo-1607522370275-f14206abe5d3?w=800"]' },
  { id: 13, sku: 'NIKE-JRD-001', name: 'Nike Jordan Delta 3', description: 'The Nike Jordan Delta 3 is a bold fusion of heritage Jordan style and React foam comfort for everyday wear.', category_id: 3, brand_id: 1, cost: 2200000, retail: 3790000, images: '["https://images.unsplash.com/photo-1612902456551-333ac5afa26e?w=800"]' },
  { id: 14, sku: 'NIKE-VAPOR-001', name: 'Nike Vaporfly 3', description: 'Engineered for speed. The Nike Vaporfly 3 features a carbon fiber plate and ZoomX foam for maximum energy return.', category_id: 1, brand_id: 1, cost: 3200000, retail: 5290000, images: '["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800"]' },
  { id: 15, sku: 'NIKE-TN-001', name: 'Nike Air Max Plus', description: 'The Nike Air Max Plus brings an ocean-inspired design with TPU plates and dynamic Air cushioning.', category_id: 3, brand_id: 1, cost: 2100000, retail: 3590000, images: '["https://images.unsplash.com/photo-1605348532760-6753d2c43329?w=800"]' },
  // Adidas (brand_id=2)
  { id: 16, sku: 'ADI-NMD-001', name: 'Adidas NMD_R1', description: 'The Adidas NMD_R1 is a modern streetwear icon that blends heritage sport inspiration with contemporary sneaker design.', category_id: 2, brand_id: 2, cost: 1500000, retail: 2690000, images: '["https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800"]' },
  { id: 17, sku: 'ADI-STM-001', name: 'Adidas Stan Smith', description: 'Clean and classic. The Adidas Stan Smith is an iconic tennis shoe turned street staple with a minimalist design.', category_id: 2, brand_id: 2, cost: 850000, retail: 1490000, images: '["https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800"]' },
  { id: 18, sku: 'ADI-SUP-001', name: 'Adidas Superstar', description: 'The shoe that changed culture. The Adidas Superstar features the iconic shell toe and serrated 3-Stripes.', category_id: 2, brand_id: 2, cost: 900000, retail: 1590000, images: '["https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800"]' },
  { id: 19, sku: 'ADI-ZX-001', name: 'Adidas ZX 500', description: 'Originally designed for running, the Adidas ZX 500 is now a casual classic with a bold aesthetic.', category_id: 2, brand_id: 2, cost: 1300000, retail: 2290000, images: '["https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800"]' },
  { id: 20, sku: 'ADI-GAZ-001', name: 'Adidas Gazelle', description: 'The Adidas Gazelle is a timeless court classic that transitions effortlessly from sport to street.', category_id: 2, brand_id: 2, cost: 1000000, retail: 1790000, images: '["https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800"]' },
  { id: 21, sku: 'ADI-FO-001', name: 'Adidas Forum Low', description: 'Born on the basketball court in 1984, the Adidas Forum Low brings retro court style to everyday life.', category_id: 3, brand_id: 2, cost: 1400000, retail: 2490000, images: '["https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800"]' },
  { id: 22, sku: 'ADI-UB23-001', name: 'Adidas Ultraboost Light', description: 'Every step feels like the first. The Adidas Ultraboost Light delivers incredible energy return with responsive cushioning.', category_id: 1, brand_id: 2, cost: 2100000, retail: 3490000, images: '["https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800"]' },
  { id: 23, sku: 'ADI-FOAM-001', name: 'Adidas 4DFWD 3', description: 'Engineered to convert vertical impact into forward motion. The Adidas 4DFWD 3 redefines running cushioning.', category_id: 1, brand_id: 2, cost: 2500000, retail: 4190000, images: '["https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800"]' },
  { id: 24, sku: 'ADI-ZNE-001', name: 'Adidas 4KRFT', description: 'The Adidas 4KRFT combines sport heritage with modern training design for versatile athletic wear.', category_id: 3, brand_id: 2, cost: 1200000, retail: 2090000, images: '["https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800"]' },
  // Puma (brand_id=3)
  { id: 25, sku: 'PUMA-SFT-001', name: 'Puma Soft Ride', description: 'Experience cloud-like comfort with the Puma Soft Ride. Designed for all-day wear with plush cushioning.', category_id: 1, brand_id: 3, cost: 1000000, retail: 1790000, images: '["https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=800"]' },
  { id: 26, sku: 'PUMA-CA-001', name: 'Puma Clyde All Pro', description: 'The Puma Clyde All Pro combines basketball heritage with modern performance technology.', category_id: 3, brand_id: 3, cost: 1500000, retail: 2590000, images: '["https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=800"]' },
  { id: 27, sku: 'PUMA-SUEDE-001', name: 'Puma Suede Classic', description: 'The Puma Suede Classic has been an icon since 1968. Soft suede upper with the signature formstrip.', category_id: 2, brand_id: 3, cost: 700000, retail: 1290000, images: '["https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=800"]' },
  { id: 28, sku: 'PUMA-RS-001', name: 'Puma RS-X', description: 'Bold, loud, and unapologetic. The Puma RS-X amplifies the retro running aesthetic to the extreme.', category_id: 2, brand_id: 3, cost: 1200000, retail: 2090000, images: '["https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=800"]' },
  { id: 29, sku: 'PUMA-FTR-001', name: 'Puma Future Rider Play', description: 'The Puma Future Rider Play brings chunky retro vibes with lightweight cushioning for everyday style.', category_id: 2, brand_id: 3, cost: 1100000, retail: 1890000, images: '["https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=800"]' },
  { id: 30, sku: 'PUMA-DVR-001', name: 'Puma Deviate Nitro 2', description: 'The Puma Deviate Nitro 2 features nitrogen-infused cushioning for maximum speed and energy return.', category_id: 1, brand_id: 3, cost: 2300000, retail: 3890000, images: '["https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=800"]' },
  // New Balance (brand_id=4)
  { id: 31, sku: 'NB-327-001', name: 'New Balance 327', description: 'The New Balance 327 is a modern reinterpretation of 1970s running shoes with exaggerated details.', category_id: 2, brand_id: 4, cost: 1100000, retail: 1990000, images: '["https://images.unsplash.com/photo-1539185441755-769473a23570?w=800"]' },
  { id: 32, sku: 'NB-550-001', name: 'New Balance 550', description: 'Originally a basketball shoe from 1989, the New Balance 550 is now a street-style essential.', category_id: 2, brand_id: 4, cost: 1200000, retail: 2190000, images: '["https://images.unsplash.com/photo-1539185441755-769473a23570?w=800"]' },
  { id: 33, sku: 'NB-2002R-001', name: 'New Balance 2002R', description: 'The New Balance 2002R brings premium ABZORB cushioning with a sleek retro-running silhouette.', category_id: 1, brand_id: 4, cost: 1900000, retail: 3290000, images: '["https://images.unsplash.com/photo-1539185441755-769473a23570?w=800"]' },
  { id: 34, sku: 'NB-1080-001', name: 'New Balance Fresh Foam 1080v12', description: 'Plush comfort for your longest runs. The Fresh Foam 1080v12 delivers a smooth, cushioned ride.', category_id: 1, brand_id: 4, cost: 2200000, retail: 3690000, images: '["https://images.unsplash.com/photo-1539185441755-769473a23570?w=800"]' },
  { id: 35, sku: 'NB-9060-001', name: 'New Balance 9060', description: 'The New Balance 9060 takes inspiration from Y2K design with chunky proportions and bold colorways.', category_id: 2, brand_id: 4, cost: 1700000, retail: 2890000, images: '["https://images.unsplash.com/photo-1539185441755-769473a23570?w=800"]' },
  { id: 36, sku: 'NB-990V6-001', name: 'New Balance 990v6', description: 'The quintessential Made in USA running shoe. The 990v6 continues the legacy of premium American craftsmanship.', category_id: 1, brand_id: 4, cost: 3100000, retail: 4990000, images: '["https://images.unsplash.com/photo-1539185441755-769473a23570?w=800"]' },
  // Converse (brand_id=5)
  { id: 37, sku: 'CONV-CD-001', name: "Converse Chuck 70", description: 'Premium version of the classic Chuck Taylor with vintage details, higher rubber foxing, and cushioned insole.', category_id: 2, brand_id: 5, cost: 800000, retail: 1390000, images: '["https://images.unsplash.com/photo-1607522370275-f14206abe5d3?w=800"]' },
  { id: 38, sku: 'CONV-RN-001', name: 'Converse Run Star Hike', description: 'Bold platform and jagged rubber outsole give the Run Star Hike an exaggerated street-ready look.', category_id: 2, brand_id: 5, cost: 1100000, retail: 1890000, images: '["https://images.unsplash.com/photo-1607522370275-f14206abe5d3?w=800"]' },
  { id: 39, sku: 'CONV-ONE-001', name: 'Converse One Star', description: 'Originally a basketball shoe in the 1970s, the One Star is now a cult classic in skate and street culture.', category_id: 2, brand_id: 5, cost: 700000, retail: 1190000, images: '["https://images.unsplash.com/photo-1607522370275-f14206abe5d3?w=800"]' },
  { id: 40, sku: 'CONV-ADD-001', name: "Converse Chuck Taylor All Star Elevate", description: 'The iconic Chuck Taylor with an elevated platform midsole for added height and style.', category_id: 2, brand_id: 5, cost: 900000, retail: 1590000, images: '["https://images.unsplash.com/photo-1607522370275-f14206abe5d3?w=800"]' },
  // Vans (brand_id=6)
  { id: 41, sku: 'VANS-OS-001', name: 'Vans Old Skool', description: 'The Vans Old Skool is the first shoe to feature the iconic side stripe, a durable suede and canvas upper.', category_id: 2, brand_id: 6, cost: 600000, retail: 1090000, images: '["https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800"]' },
  { id: 42, sku: 'VANS-AUTH-001', name: 'Vans Authentic', description: 'The Vans Authentic is the original Vans heritage style. Simple, timeless, and effortlessly cool.', category_id: 2, brand_id: 6, cost: 500000, retail: 890000, images: '["https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800"]' },
  { id: 43, sku: 'VANS-SK8-001', name: 'Vans Sk8-Hi', description: 'The Vans Sk8-Hi is a high-top classic with padded ankle protection and the signature side stripe.', category_id: 2, brand_id: 6, cost: 700000, retail: 1190000, images: '["https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800"]' },
  { id: 44, sku: 'VANS-ERA-001', name: 'Vans Era', description: 'The Vans Era was the first shoe designed specifically for skateboarders, featuring padded collars and multiple color options.', category_id: 2, brand_id: 6, cost: 550000, retail: 990000, images: '["https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800"]' },
  { id: 45, sku: 'VANS-CL-001', name: 'Vans Classic Slip-On', description: 'The Vans Classic Slip-On is an icon of off-board style with elastic side accents and a waffle outsole.', category_id: 2, brand_id: 6, cost: 500000, retail: 850000, images: '["https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800"]' },
  { id: 46, sku: 'VANS-KNM-001', name: 'Vans Knu School', description: 'The Vans Knu School features premium fleece padding and a vintage silhouette for ultimate comfort.', category_id: 2, brand_id: 6, cost: 800000, retail: 1390000, images: '["https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800"]' },
  // Additional Nike products
  { id: 47, sku: 'NIKE-VFN-001', name: 'Nike ZoomX Vaporfly NEXT% 2', description: "Nike's pinnacle of racing technology. ZoomX foam with a carbon fiber plate for elite performance.", category_id: 1, brand_id: 1, cost: 3400000, retail: 5490000, images: '["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800"]' },
  { id: 48, sku: 'NIKE-FREE-001', name: 'Nike Free Run 5.0', description: 'Natural motion redesigned. The Nike Free Run 5.0 features a sole that moves with your foot for a barefoot-like feel.', category_id: 1, brand_id: 1, cost: 1300000, retail: 2290000, images: '["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800"]' },
  // Additional Adidas products
  { id: 49, sku: 'ADI-1K-001', name: 'Adidas 1K Street', description: 'The Adidas 1K Street brings chunky retro vibes with a bold silhouette and premium materials.', category_id: 2, brand_id: 2, cost: 1600000, retail: 2790000, images: '["https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800"]' },
  { id: 50, sku: 'ADI-RDY-001', name: 'Adidas Run 70s', description: 'Inspired by 1970s marathon runners, the Adidas Run 70s blends vintage aesthetics with modern comfort.', category_id: 2, brand_id: 2, cost: 1200000, retail: 2090000, images: '["https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800"]' },
];

async function main() {
  const SQL = await initSqlJs();

  let database: SqlJsDatabase;
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    database = new SQL.Database(buffer);
    console.log('Database loaded from file:', dbPath);
  } else {
    console.error('Database file not found at:', dbPath);
    process.exit(1);
  }

  // Check existing products with IDs >= 7
  const existingNew = database.exec("SELECT COUNT(*) as count FROM products WHERE id >= 7");
  const newCount = existingNew[0]?.values[0]?.[0] as number ?? 0;

  if (newCount > 0) {
    console.log(`Products 7-50 already exist (${newCount} found). Skipping product seeding.`);
  } else {
    console.log(`Seeding ${products.length} products...`);
    for (const p of products) {
      const slug = slugify(p.name) + '-' + p.id;
      const wholesale = Math.round(p.retail * 0.8);
      const weight = 300 + Math.floor(Math.random() * 200);
      const viewCount = Math.floor(Math.random() * 2000);
      const soldCount = Math.floor(Math.random() * 200);
      const barcode = generateBarcode();

      database.exec(`
        INSERT INTO products (id, sku, name, slug, description, category_id, brand_id, cost_price, retail_price, wholesale_price, barcode, weight, images, status, view_count, sold_count)
        VALUES (${p.id}, '${p.sku}', '${p.name.replace(/'/g, "''")}', '${slug}', '${p.description.replace(/'/g, "''")}', ${p.category_id}, ${p.brand_id}, ${p.cost}, ${p.retail}, ${wholesale}, '${barcode}', ${weight}, '${p.images}', 'active', ${viewCount}, ${soldCount})
      `);
    }
    saveDb(database);
    console.log(`Inserted ${products.length} products.`);
  }

  // Seed variants and inventory
  const existingVariants = database.exec('SELECT COUNT(*) as count FROM product_variants WHERE product_id >= 7');
  const variantCount = existingVariants[0]?.values[0]?.[0] as number ?? 0;

  const maxVidResult = database.exec('SELECT MAX(id) as maxId FROM product_variants');
  let nextVid = ((maxVidResult[0]?.values[0]?.[0] as number) ?? 0) + 1;

  if (variantCount > 0) {
    console.log(`Product variants already exist (${variantCount} found). Skipping variant seeding.`);
  } else {
    console.log('Seeding product variants and inventory...');
    let variantsAdded = 0;
    for (const p of products) {
      const productColors = colors.slice(0, 2 + (p.id % 3));
      const sizeCount = 4 + (p.id % 4);
      const productSizes = sizes.slice(0, sizeCount);

      for (const c of productColors) {
        for (const s of productSizes) {
          const vsku = `${p.sku}-${s}-${c.name.replace(/[\s/]/g, '')}`;
          const vbc = generateBarcode();
          const qty = Math.floor(Math.random() * 50) + 10;

          try {
            database.exec(`
              INSERT INTO product_variants (id, product_id, sku, barcode, size, color, color_hex, status)
              VALUES (${nextVid}, ${p.id}, '${vsku}', '${vbc}', '${s}', '${c.name}', '${c.hex}', 'active')
            `);
            database.exec(`
              INSERT INTO inventory (id, variant_id, quantity, reserved, min_stock_level, max_stock_level)
              VALUES (${nextVid}, ${nextVid}, ${qty}, 0, 5, 100)
            `);
            variantsAdded++;
            nextVid++;
          } catch (e: any) {
            // Skip constraint errors (duplicates, etc.)
          }
        }
      }
    }
    saveDb(database);
    console.log(`Inserted ${variantsAdded} product variants with inventory.`);
  }

  // Summary
  const finalCount = database.exec('SELECT COUNT(*) as count FROM products')[0]?.values[0]?.[0] as number ?? 0;
  const finalVariantCount = database.exec('SELECT COUNT(*) as count FROM product_variants')[0]?.values[0]?.[0] as number ?? 0;
  const finalInventoryCount = database.exec('SELECT COUNT(*) as count FROM inventory')[0]?.values[0]?.[0] as number ?? 0;

  console.log('\n========== SEED SUMMARY ==========');
  console.log(`Total products:    ${finalCount}`);
  console.log(`Total variants:    ${finalVariantCount}`);
  console.log(`Total inventory:   ${finalInventoryCount}`);
  console.log('==================================');
  console.log('\nSeeding complete!');

  database.close();
}

main().catch(console.error);
