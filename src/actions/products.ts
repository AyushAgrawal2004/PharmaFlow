'use server';

import { prisma } from '@/lib/db';
import { getBaseUnit, getPriceInBaseUnit, convertToBaseUnit, serializeProduct } from '@/lib/conversions';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { Decimal } from 'decimal.js';

// Input Validation Schema using Zod
const productSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  sku: z.string().min(3, 'SKU must be at least 3 characters'),
  description: z.string().optional(),
  category: z.string().min(2, 'Category must be at least 2 characters'),
  price: z.number().positive('Price must be greater than zero'),
  unit: z.enum(['g', 'kg', 'mL', 'L', 'item']),
  stock: z.number().nonnegative('Stock cannot be negative'),
  minPurchase: z.number().nonnegative('Minimum purchase cannot be negative').default(0),
});

export type ProductInput = z.infer<typeof productSchema>;

// CREATE
export async function createProductAction(input: ProductInput) {
  try {
    const validated = productSchema.parse(input);

    // Convert values to base units
    const baseUnit = getBaseUnit(validated.unit);
    const pricePerBaseUnit = getPriceInBaseUnit(validated.price, validated.unit);
    const stockQuantity = convertToBaseUnit(validated.stock, validated.unit);
    const minPurchase = convertToBaseUnit(validated.minPurchase, validated.unit);

    const product = await prisma.product.create({
      data: {
        name: validated.name,
        sku: validated.sku.toUpperCase(),
        description: validated.description,
        category: validated.category,
        baseUnit,
        unit: validated.unit,
        pricePerBaseUnit,
        stockQuantity,
        minPurchase,
      },
    });

    revalidatePath('/admin');
    revalidatePath('/seller');
    return { success: true, product: serializeProduct(product) };
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { success: false, error: 'A product with this SKU already exists.' };
    }
    return { success: false, error: error.message || 'Failed to create product.' };
  }
}

// UPDATE
export async function updateProductAction(id: string, input: ProductInput) {
  try {
    const validated = productSchema.parse(input);

    // Convert values to base units
    const baseUnit = getBaseUnit(validated.unit);
    const pricePerBaseUnit = getPriceInBaseUnit(validated.price, validated.unit);
    const stockQuantity = convertToBaseUnit(validated.stock, validated.unit);
    const minPurchase = convertToBaseUnit(validated.minPurchase, validated.unit);

    const product = await prisma.product.update({
      where: { id },
      data: {
        name: validated.name,
        sku: validated.sku.toUpperCase(),
        description: validated.description,
        category: validated.category,
        baseUnit,
        unit: validated.unit,
        pricePerBaseUnit,
        stockQuantity,
        minPurchase,
      },
    });

    revalidatePath('/admin');
    revalidatePath('/seller');
    return { success: true, product: serializeProduct(product) };
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { success: false, error: 'A product with this SKU already exists.' };
    }
    return { success: false, error: error.message || 'Failed to update product.' };
  }
}

// DELETE
export async function deleteProductAction(id: string) {
  try {
    await prisma.product.delete({
      where: { id },
    });

    revalidatePath('/admin');
    revalidatePath('/seller');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to delete product.' };
  }
}

// GET (PAGINATED, SEARCHED, FILTERED)
export async function getProductsAction(params: {
  query?: string;
  category?: string;
  page?: number;
  limit?: number;
}) {
  try {
    const query = params.query || '';
    const category = params.category || '';
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const whereClause: any = {};
    if (query) {
      whereClause.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { sku: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ];
    }
    if (category && category !== 'All') {
      whereClause.category = category;
    }

    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where: whereClause }),
    ]);

    // Fetch unique categories for filtering
    const categoriesRaw = await prisma.product.findMany({
      select: { category: true },
      distinct: ['category'],
    });
    const categories = ['All', ...categoriesRaw.map((c) => c.category).filter(Boolean) as string[]];

    const serializedProducts = products.map((p) => serializeProduct(p));

    return {
      success: true,
      products: serializedProducts,
      categories,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to fetch products.', products: [], categories: [], totalCount: 0, totalPages: 0, currentPage: 1 };
  }
}
