import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { prisma } from '../src/lib/db';

async function main() {
  // Clear existing data
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Seeding users...');
  
  const adminPassword = await bcrypt.hash('Admin123!', 10);
  const sellerPassword = await bcrypt.hash('Seller123!', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Pharma Admin',
      email: 'admin@inventory.com',
      password: adminPassword,
      role: Role.ADMIN,
    },
  });

  const seller = await prisma.user.create({
    data: {
      name: 'Pharma Pharmacist',
      email: 'seller@inventory.com',
      password: sellerPassword,
      role: Role.SELLER,
    },
  });

  console.log(`Seeded users: admin (${admin.email}), pharmacist/seller (${seller.email})`);

  console.log('Seeding pharmacy products...');

  await prisma.product.createMany({
    data: [
      {
        name: 'Paracetamol 500mg Tablets (Strip of 10)',
        sku: 'MD-PRC-500',
        description: 'Over-the-counter analgesic and antipyretic for pain and fever relief',
        category: 'OTC Medicines',
        baseUnit: 'item',
        unit: 'item',
        pricePerBaseUnit: 15.00, // ₹15 per strip
        stockQuantity: 500.0,
        minPurchase: 0.0,
      },
      {
        name: 'Amoxicillin 250mg Capsules (Strip of 15)',
        sku: 'MD-AMX-250',
        description: 'Prescription antibiotic used to treat bacterial infections (Rx)',
        category: 'Antibiotics (Prescription)',
        baseUnit: 'item',
        unit: 'item',
        pricePerBaseUnit: 75.00, // ₹75 per strip
        stockQuantity: 200.0,
        minPurchase: 0.0,
      },
      {
        name: 'Pediatric Cough Syrup (100ml)',
        sku: 'SYR-CGH-100',
        description: 'Soothes dry cough and throat irritation in children. Dosages in mL',
        category: 'Syrups & Liquids',
        baseUnit: 'mL',
        unit: 'mL',
        pricePerBaseUnit: 0.95, // ₹95 per 100mL bottle
        stockQuantity: 15000.0, // 150 bottles
        minPurchase: 100.0, // 100ml minimum purchase (1 bottle)
      },
      {
        name: 'Vitamin C 500mg Chewable (Bottle of 60)',
        sku: 'SUP-VIT-C',
        description: 'Immune health support nutritional supplements',
        category: 'Supplements',
        baseUnit: 'item',
        unit: 'item',
        pricePerBaseUnit: 250.00, // ₹250 per bottle
        stockQuantity: 80.0,
        minPurchase: 0.0,
      },
      {
        name: 'Antiseptic Liquid (500ml)',
        sku: 'ANT-LQD-500',
        description: 'First aid antiseptic for wound cleaning and surface sanitization',
        category: 'First Aid',
        baseUnit: 'mL',
        unit: 'mL',
        pricePerBaseUnit: 0.36, // ₹180 per 500mL bottle
        stockQuantity: 25000.0, // 50 bottles
        minPurchase: 500.0, // 500ml minimum purchase (1 bottle)
      },
      {
        name: 'Ibuprofen Powders (Bulk Dispensing)',
        sku: 'PWD-IBP-100',
        description: 'Bulk compound powder used for custom pharmacist capsule compounding',
        category: 'Compounding Raw Materials',
        baseUnit: 'g',
        unit: 'g',
        pricePerBaseUnit: 3.50, // ₹3.50 per gram (₹3500 per kg)
        stockQuantity: 5000.0, // 5 kg
        minPurchase: 50.0, // 50g minimum purchase limit
      }
    ],
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
