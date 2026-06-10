import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create admin user
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@shoppro.com',
      password_hash: adminPasswordHash,
      phone: '0909123456',
      full_name: 'Administrator',
      role: 'admin',
      is_active: 1,
    },
  });

  console.log('Admin user created:', admin.username);

  // Create staff users
  const staffPasswordHash = await bcrypt.hash('staff123', 10);
  
  const manager = await prisma.user.upsert({
    where: { username: 'manager' },
    update: {},
    create: {
      username: 'manager',
      email: 'manager@shoppro.com',
      password_hash: staffPasswordHash,
      phone: '0909123457',
      full_name: 'Store Manager',
      role: 'manager',
      is_active: 1,
    },
  });

  const staff = await prisma.user.upsert({
    where: { username: 'staff' },
    update: {},
    create: {
      username: 'staff',
      email: 'staff@shoppro.com',
      password_hash: staffPasswordHash,
      phone: '0909123458',
      full_name: 'Sales Staff',
      role: 'staff',
      is_active: 1,
    },
  });

  // Create employee records
  await prisma.employee.upsert({
    where: { user_id: admin.id },
    update: {},
    create: {
      user_id: admin.id,
      staff_code: 'EMP001',
      position: 'Administrator',
      hire_date: new Date().toISOString().split('T')[0],
      commission_rate: 0,
      is_active: 1,
    },
  });

  await prisma.employee.upsert({
    where: { user_id: manager.id },
    update: {},
    create: {
      user_id: manager.id,
      staff_code: 'EMP002',
      position: 'Store Manager',
      hire_date: new Date().toISOString().split('T')[0],
      commission_rate: 0,
      is_active: 1,
    },
  });

  await prisma.employee.upsert({
    where: { user_id: staff.id },
    update: {},
    create: {
      user_id: staff.id,
      staff_code: 'EMP003',
      position: 'Sales Associate',
      hire_date: new Date().toISOString().split('T')[0],
      commission_rate: 5,
      is_active: 1,
    },
  });

  console.log('Staff users created');

  // Create categories
  const running = await prisma.category.upsert({
    where: { slug: 'running-shoes' },
    update: {},
    create: {
      name: 'Running Shoes',
      slug: 'running-shoes',
      description: 'High-performance running shoes for all levels',
      sort_order: 1,
      is_active: 1,
    },
  });

  const casual = await prisma.category.upsert({
    where: { slug: 'casual-shoes' },
    update: {},
    create: {
      name: 'Casual Shoes',
      slug: 'casual-shoes',
      description: 'Comfortable everyday shoes',
      sort_order: 2,
      is_active: 1,
    },
  });

  const sports = await prisma.category.upsert({
    where: { slug: 'sports-shoes' },
    update: {},
    create: {
      name: 'Sports Shoes',
      slug: 'sports-shoes',
      description: 'Athletic footwear for various sports',
      sort_order: 3,
      is_active: 1,
    },
  });

  console.log('Categories created');

  // Create brands
  const nike = await prisma.brand.upsert({
    where: { slug: 'nike' },
    update: {},
    create: {
      name: 'Nike',
      slug: 'nike',
      description: 'Just Do It - World famous athletic brand',
      is_active: 1,
    },
  });

  const adidas = await prisma.brand.upsert({
    where: { slug: 'adidas' },
    update: {},
    create: {
      name: 'Adidas',
      slug: 'adidas',
      description: 'Adidas - All or Nothing',
      is_active: 1,
    },
  });

  const converse = await prisma.brand.upsert({
    where: { slug: 'converse' },
    update: {},
    create: {
      name: 'Converse',
      slug: 'converse',
      description: 'Converse - All Star',
      is_active: 1,
    },
  });

  console.log('Brands created');

  // Create promotions
  const today = new Date();
  const nextMonth = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

  await prisma.promotion.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: {
      code: 'WELCOME10',
      name: 'Welcome 10% Off',
      type: 'percentage',
      value: 10,
      max_discount: 200000,
      min_order_amount: 0,
      max_uses: 1000,
      max_uses_per_customer: 1,
      start_date: today.toISOString().split('T')[0],
      end_date: nextMonth.toISOString().split('T')[0],
      applicable_type: 'all',
      is_active: 1,
      is_public: 1,
      priority: 1,
    },
  });

  await prisma.promotion.upsert({
    where: { code: 'SUMMER20' },
    update: {},
    create: {
      code: 'SUMMER20',
      name: 'Summer Sale 20%',
      type: 'percentage',
      value: 20,
      max_discount: 500000,
      min_order_amount: 500000,
      max_uses: 500,
      max_uses_per_customer: 1,
      start_date: today.toISOString().split('T')[0],
      end_date: nextMonth.toISOString().split('T')[0],
      applicable_type: 'all',
      is_active: 1,
      is_public: 1,
      priority: 2,
    },
  });

  console.log('Promotions created');

  // Create suppliers
  await prisma.supplier.upsert({
    where: { code: 'SUP001' },
    update: {},
    create: {
      name: 'Nike Vietnam Distributor',
      code: 'SUP001',
      contact_name: 'John Smith',
      email: 'john@nike-vn.com',
      phone: '0281234567',
      address: '123 Nguyen Hue, District 1, HCMC',
      is_active: 1,
    },
  });

  await prisma.supplier.upsert({
    where: { code: 'SUP002' },
    update: {},
    create: {
      name: 'Adidas Vietnam',
      code: 'SUP002',
      contact_name: 'Jane Doe',
      email: 'jane@adidas-vn.com',
      phone: '0282345678',
      address: '456 Le Duan, District 3, HCMC',
      is_active: 1,
    },
  });

  console.log('Suppliers created');

  console.log('Database seeded successfully!');
  console.log('Default credentials:');
  console.log('  Admin: username: admin, password: admin123');
  console.log('  Manager: username: manager, password: staff123');
  console.log('  Staff: username: staff, password: staff123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
