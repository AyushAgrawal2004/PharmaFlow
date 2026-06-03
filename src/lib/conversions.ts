import { Decimal } from 'decimal.js';

// Helper to check and cast values to Decimal
export function toDecimal(value: number | string | Decimal): Decimal {
  if (value instanceof Decimal) return value;
  return new Decimal(value);
}

// Get the corresponding base unit for a given unit
export function getBaseUnit(unit: string): 'g' | 'mL' | 'item' {
  const normalized = unit.toLowerCase();
  if (normalized === 'kg' || normalized === 'g') {
    return 'g';
  }
  if (normalized === 'l' || normalized === 'ml') {
    return 'mL';
  }
  if (normalized === 'item') {
    return 'item';
  }
  throw new Error(`Unsupported unit: ${unit}`);
}

// Convert an amount from a given unit to its base unit
// e.g. 2kg -> 2000g, 1.5L -> 1500mL
export function convertToBaseUnit(quantity: number | string | Decimal, unit: string): Decimal {
  const decQty = toDecimal(quantity);
  const normalized = unit.toLowerCase();

  if (normalized === 'kg') {
    return decQty.mul(1000);
  }
  if (normalized === 'l') {
    return decQty.mul(1000);
  }
  if (normalized === 'g' || normalized === 'ml' || normalized === 'item') {
    return decQty;
  }
  throw new Error(`Unsupported unit for base conversion: ${unit}`);
}

// Convert an amount from the base unit to a target display unit
// e.g. 2000g -> 2kg, 1500mL -> 1.5L
export function convertFromBaseUnit(quantityInBase: number | string | Decimal, targetUnit: string): Decimal {
  const decQty = toDecimal(quantityInBase);
  const normalized = targetUnit.toLowerCase();

  if (normalized === 'kg') {
    return decQty.div(1000);
  }
  if (normalized === 'l') {
    return decQty.div(1000);
  }
  if (normalized === 'g' || normalized === 'ml' || normalized === 'item') {
    return decQty;
  }
  throw new Error(`Unsupported unit for target conversion: ${targetUnit}`);
}

// Convert user-specified price per unit into internal price per base unit
// e.g. ₹100 per kg -> 100 / 1000 = ₹0.1 per gram
export function getPriceInBaseUnit(pricePerUnit: number | string | Decimal, unit: string): Decimal {
  const decPrice = toDecimal(pricePerUnit);
  const normalized = unit.toLowerCase();

  if (normalized === 'kg' || normalized === 'l') {
    return decPrice.div(1000);
  }
  if (normalized === 'g' || normalized === 'ml' || normalized === 'item') {
    return decPrice;
  }
  throw new Error(`Unsupported unit for price conversion: ${unit}`);
}

// Convert internal price per base unit to price per display unit
// e.g. ₹0.1 per gram -> 0.1 * 1000 = ₹100 per kg
export function getPriceForDisplay(pricePerBaseUnit: number | string | Decimal, unit: string): Decimal {
  const decPrice = toDecimal(pricePerBaseUnit);
  const normalized = unit.toLowerCase();

  if (normalized === 'kg' || normalized === 'l') {
    return decPrice.mul(1000);
  }
  if (normalized === 'g' || normalized === 'ml' || normalized === 'item') {
    return decPrice;
  }
  throw new Error(`Unsupported unit for display price calculation: ${unit}`);
}

// Calculate the item price based on the internal price per base unit and quantity ordered
// e.g. 500g * ₹0.1/g = ₹50
export function calculateItemPrice(pricePerBaseUnit: number | string | Decimal, quantityInBase: number | string | Decimal): Decimal {
  const decPrice = toDecimal(pricePerBaseUnit);
  const decQty = toDecimal(quantityInBase);
  return decPrice.mul(decQty);
}

// Format prices in Indian Rupees (INR) with high precision (up to 6 decimal places)
export function formatPrice(price: number | string | Decimal): string {
  const num = toDecimal(price).toNumber();
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  }).format(num);
}

// Helper to serialize Decimal and Date fields to plain objects for Next.js Client Components
export function serializeProduct(product: any) {
  if (!product) return null;
  return {
    ...product,
    pricePerBaseUnit: product.pricePerBaseUnit ? Number(product.pricePerBaseUnit.toString()) : 0,
    stockQuantity: product.stockQuantity ? Number(product.stockQuantity.toString()) : 0,
    minPurchase: product.minPurchase ? Number(product.minPurchase.toString()) : 0,
    createdAt: product.createdAt instanceof Date ? product.createdAt.toISOString() : product.createdAt,
    updatedAt: product.updatedAt instanceof Date ? product.updatedAt.toISOString() : product.updatedAt,
  };
}

// Helper to serialize Order Items
export function serializeOrderItem(item: any) {
  if (!item) return null;
  return {
    ...item,
    orderedQuantity: item.orderedQuantity ? Number(item.orderedQuantity.toString()) : 0,
    convertedQuantity: item.convertedQuantity ? Number(item.convertedQuantity.toString()) : 0,
    price: item.price ? Number(item.price.toString()) : 0,
    product: item.product ? serializeProduct(item.product) : undefined,
  };
}

// Helper to serialize Orders
export function serializeOrder(order: any) {
  if (!order) return null;
  return {
    ...order,
    totalPrice: order.totalPrice ? Number(order.totalPrice.toString()) : 0,
    createdAt: order.createdAt instanceof Date ? order.createdAt.toISOString() : order.createdAt,
    items: order.items ? order.items.map((i: any) => serializeOrderItem(i)) : [],
  };
}
