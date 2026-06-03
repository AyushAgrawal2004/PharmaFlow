'use server';

import { prisma } from '@/lib/db';
import { convertToBaseUnit, convertFromBaseUnit, calculateItemPrice, serializeOrder } from '@/lib/conversions';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { Decimal } from 'decimal.js';

export interface OrderItemInput {
  productId: string;
  quantity: number; // e.g. 1.5 (kg)
  unit: string; // e.g. 'kg'
}

// CREATE ORDER/QUOTATION
export async function createOrderAction(items: OrderItemInput[]) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: 'Unauthorized. Please sign in.' };
    }

    if (!items || items.length === 0) {
      return { success: false, error: 'No items in the order.' };
    }

    // Run order creation in a transaction to ensure integrity and stock checks
    const order = await prisma.$transaction(async (tx) => {
      let totalPrice = new Decimal(0);
      const itemsToCreate = [];

      for (const item of items) {
        // Fetch product
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw new Error(`Product not found.`);
        }

        // Convert ordered quantity to base unit quantity
        const convertedQty = convertToBaseUnit(item.quantity, item.unit);

        // Check minimum purchase quantity
        const minQty = new Decimal(product.minPurchase.toString());
        if (minQty.gt(0) && convertedQty.lt(minQty)) {
          const displayMin = convertFromBaseUnit(minQty, item.unit).toNumber();
          throw new Error(`Minimum purchase quantity for ${product.name} is ${displayMin} ${item.unit}.`);
        }

        // Check stock availability
        const currentStock = new Decimal(product.stockQuantity.toString());
        if (currentStock.lt(convertedQty)) {
          throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stockQuantity} ${product.baseUnit}`);
        }

        // Calculate item price: pricePerBaseUnit * quantityInBase
        const itemPrice = calculateItemPrice(product.pricePerBaseUnit.toString(), convertedQty);
        totalPrice = totalPrice.add(itemPrice);

        // Deduct product stock
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: {
              decrement: convertedQty,
            },
          },
        });

        itemsToCreate.push({
          productId: item.productId,
          orderedQuantity: new Decimal(item.quantity),
          orderedUnit: item.unit,
          convertedQuantity: convertedQty,
          price: itemPrice,
        });
      }

      // Create the Order
      const newOrder = await tx.order.create({
        data: {
          userId: session.user.id,
          status: 'PENDING',
          totalPrice,
          items: {
            create: itemsToCreate,
          },
        },
        include: {
          items: true,
        },
      });

      return newOrder;
    });

    revalidatePath('/seller');
    revalidatePath('/admin');
    return { success: true, order: serializeOrder(order) };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to place order.' };
  }
}

// UPDATE STATUS WITH STOCK REFUNDS
export async function updateOrderStatusAction(
  orderId: string,
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED'
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized. Admin only.' };
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      return { success: false, error: 'Order not found.' };
    }

    const oldStatus = order.status;

    // Run status update and conditional stock adjustments in a transaction
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // 1. If transitioning TO Rejected from non-Rejected: Refund the reserved stock
      if (status === 'REJECTED' && oldStatus !== 'REJECTED') {
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stockQuantity: {
                increment: item.convertedQuantity,
              },
            },
          });
        }
      }
      // 2. If transitioning OUT of Rejected to non-Rejected: Deduct the stock again (with check)
      else if (oldStatus === 'REJECTED' && status !== 'REJECTED') {
        for (const item of order.items) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });

          if (!product) {
            throw new Error(`Product not found.`);
          }

          const stockQuantityDecimal = new Decimal(product.stockQuantity.toString());
          const convertedQuantityDecimal = new Decimal(item.convertedQuantity.toString());

          if (stockQuantityDecimal.lt(convertedQuantityDecimal)) {
            throw new Error(`Insufficient stock to re-approve order for product ${product.name}.`);
          }

          await tx.product.update({
            where: { id: item.productId },
            data: {
              stockQuantity: {
                decrement: item.convertedQuantity,
              },
            },
          });
        }
      }

      // Update order status
      return await tx.order.update({
        where: { id: orderId },
        data: { status },
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      });
    });

    revalidatePath('/admin');
    revalidatePath('/seller');
    return { success: true, order: serializeOrder(updatedOrder) };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update status.' };
  }
}

// GET ORDERS (ADMIN SEE ALL, SELLER SEE OWN)
export async function getOrdersAction(params: {
  userId?: string;
  role?: string;
  status?: string;
}) {
  try {
    const whereClause: any = {};
    
    // Role protection - if not admin, restrict to owner's orders
    if (params.role !== 'ADMIN' && params.userId) {
      whereClause.userId = params.userId;
    }
    
    if (params.status && params.status !== 'All') {
      whereClause.status = params.status;
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const serializedOrders = orders.map((o) => serializeOrder(o));

    return { success: true, orders: serializedOrders };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to fetch orders.', orders: [] };
  }
}
