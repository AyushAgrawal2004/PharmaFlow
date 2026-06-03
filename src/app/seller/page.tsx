'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { getProductsAction } from '@/actions/products';
import { createOrderAction } from '@/actions/orders';
import { 
  formatPrice, 
  getPriceForDisplay, 
  convertFromBaseUnit,
  convertToBaseUnit,
  calculateItemPrice,
  toDecimal
} from '@/lib/conversions';
import { 
  Search, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  Loader2, 
  Package,
  ArrowRight,
  Stethoscope,
  Info
} from 'lucide-react';
import { Decimal } from 'decimal.js';

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string | null;
  baseUnit: string;
  unit: string;
  pricePerBaseUnit: any;
  stockQuantity: any;
  minPurchase: any;
}

interface CartItem {
  product: Product;
  quantity: number; // in selected unit
  unit: 'g' | 'kg' | 'mL' | 'L' | 'item';
}

export default function SellerNewOrderPage() {
  const { data: session } = useSession();
  
  // Catalogue State
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [loadingCatalogue, setLoadingCatalogue] = useState(true);
  
  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Checkout / UI state
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Fetch catalogue products
  const fetchCatalogue = async () => {
    setLoadingCatalogue(true);
    const res = await getProductsAction({
      query: search,
      limit: 50
    });
    if (res.success) {
      setProducts(res.products as unknown as Product[]);
    }
    setLoadingCatalogue(false);
  };

  useEffect(() => {
    fetchCatalogue();
  }, [search]);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Add product to cart with default configured unit
  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.product.id === product.id);
    if (existing) {
      showToast('error', `${product.name} is already in the cart. Adjust quantity there.`);
      return;
    }

    const defaultUnit = (product.unit as 'g' | 'kg' | 'mL' | 'L' | 'item') || 'item';
    
    // Set default quantity to the minimum purchase display value (if configured)
    const displayMin = convertFromBaseUnit(product.minPurchase, defaultUnit).toNumber();
    const defaultQty = displayMin > 0 ? displayMin : 1;

    setCart(prev => [...prev, {
      product,
      quantity: defaultQty,
      unit: defaultUnit
    }]);
    
    showToast('success', `Added ${product.name} to order draft`);
  };

  // Remove from cart
  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  // Update cart item quantity
  const updateQuantity = (productId: string, val: number) => {
    if (val <= 0) return;
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        return { ...item, quantity: parseFloat(val.toFixed(6)) };
      }
      return item;
    }));
  };

  // Update cart item unit dynamically (adjust price immediately)
  const updateUnit = (productId: string, unit: 'g' | 'kg' | 'mL' | 'L' | 'item') => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        // Adjust quantity to meet the new display minimum unit conversion dynamically if needed
        const displayMin = convertFromBaseUnit(item.product.minPurchase, unit).toNumber();
        const adjustedQty = item.quantity < displayMin ? displayMin : item.quantity;
        return { ...item, unit, quantity: adjustedQty };
      }
      return item;
    }));
  };

  // Calculate dynamic item price for a cart item
  const calculateCartItemPrice = (item: CartItem) => {
    const pricePerBase = parseFloat(item.product.pricePerBaseUnit.toString());
    const qtyInBase = convertToBaseUnit(item.quantity, item.unit);
    return calculateItemPrice(pricePerBase, qtyInBase).toNumber();
  };

  // Check if a cart item violates the minimum purchase limit
  const checkMinPurchaseViolation = (item: CartItem) => {
    const qtyInBase = convertToBaseUnit(item.quantity, item.unit);
    const minInBase = toDecimal(item.product.minPurchase);
    return minInBase.gt(0) && qtyInBase.lt(minInBase);
  };

  // Total cart price
  const cartTotal = cart.reduce((sum, item) => sum + calculateCartItemPrice(item), 0);

  // Cart validations check
  const hasMinPurchaseViolations = cart.some(item => checkMinPurchaseViolation(item));

  // Handle order checkout
  const handleCheckout = async () => {
    if (cart.length === 0 || hasMinPurchaseViolations) return;
    setCheckoutLoading(true);
    
    const orderItems = cart.map(item => ({
      productId: item.product.id,
      quantity: item.quantity,
      unit: item.unit
    }));

    const res = await createOrderAction(orderItems);

    if (res.success) {
      showToast('success', `Quotation created successfully! Order reference: #${res.order?.id.slice(-6).toUpperCase()}`);
      setCart([]);
      fetchCatalogue(); // Refresh stock in catalogue
    } else {
      showToast('error', res.error || 'Failed to place order.');
    }
    setCheckoutLoading(false);
  };

  // Formats product detail in catalogue
  const formatCatalogueProduct = (product: Product) => {
    const displayUnit = product.unit || 'item';
    const displayPrice = getPriceForDisplay(product.pricePerBaseUnit, displayUnit);
    const displayStock = convertFromBaseUnit(product.stockQuantity, displayUnit);
    const displayMin = convertFromBaseUnit(product.minPurchase, displayUnit);

    let priceStr = `${formatPrice(displayPrice)} / ${displayUnit}`;
    if (displayUnit !== product.baseUnit) {
      priceStr += ` (${formatPrice(product.pricePerBaseUnit)} / ${product.baseUnit})`;
    }

    return {
      priceStr,
      stockStr: `${displayStock.toString()} ${displayUnit}`,
      minStr: displayMin.toNumber() > 0 ? `${displayMin.toString()} ${displayUnit}` : '',
      outOfStock: displayStock.toNumber() <= 0
    };
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-4 rounded-2xl shadow-xl border transition-all duration-300 flex items-center gap-3 ${
          toastMessage.type === 'success' 
            ? 'bg-slate-900 dark:bg-slate-955 border-emerald-500/20 text-emerald-400' 
            : 'bg-slate-900 dark:bg-slate-955 border-rose-500/20 text-rose-400'
        }`}>
          <span className={`w-2 h-2 rounded-full ${toastMessage.type === 'success' ? 'bg-emerald-400 animate-ping' : 'bg-rose-400'}`} />
          <span className="text-xs font-semibold tracking-wide">{toastMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800/80 shadow-xs">
        <div className="p-3.5 bg-teal-50 dark:bg-teal-955/20 text-teal-600 dark:text-teal-400 rounded-2xl border border-teal-100/60 dark:border-teal-900/40">
          <Stethoscope className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-800 dark:text-slate-100">Dispensing Panel</h1>
          <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-0.5">Search pharmacy catalog, configure dosage metrics, and generate digital quotations</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Product Catalogue (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-xs space-y-3.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Prescription Search</span>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Filter by medication name, active ingredients, or SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500 transition-all text-xs font-semibold text-slate-705 dark:text-slate-350 placeholder-slate-400 dark:placeholder-slate-600 bg-white dark:bg-slate-950 input-focus-ring"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {loadingCatalogue ? (
              <div className="col-span-2 flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
                <span className="text-xs font-semibold">Loading medication catalogue...</span>
              </div>
            ) : products.length === 0 ? (
              <div className="col-span-2 text-center py-20 text-slate-400 dark:text-slate-550 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-5 shadow-xs">
                <Package className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                <span className="text-xs font-semibold">No matching compounds found</span>
              </div>
            ) : (
              products.map((product) => {
                const { priceStr, stockStr, minStr, outOfStock } = formatCatalogueProduct(product);
                return (
                  <div key={product.id} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/60 dark:border-slate-800/80 shadow-xs flex flex-col justify-between gap-5 transition-all hover:-translate-y-0.5 hover:shadow-md dark:hover:shadow-slate-950/30 hover:border-slate-250 dark:hover:border-slate-700 group">
                    <div>
                      <div className="flex items-start justify-between gap-2.5">
                        <h3 className="font-extrabold text-slate-805 dark:text-slate-200 text-sm group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors line-clamp-2">{product.name}</h3>
                        <span className="text-[9px] font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded font-bold uppercase shrink-0">
                          {product.sku}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block mt-1 uppercase tracking-wider">{product.category || 'General'}</span>
                      
                      {minStr && (
                        <div className="mt-3.5">
                          <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-indigo-650 dark:text-indigo-400 bg-indigo-50/70 dark:bg-indigo-955/20 border border-indigo-100 dark:border-indigo-900/40 px-2 py-0.5 rounded-lg select-none">
                            Min Purchase: {minStr}
                          </span>
                        </div>
                      )}

                      <div className="mt-4 flex items-baseline justify-between gap-2 border-t border-slate-105 dark:border-slate-800 pt-3">
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-505 uppercase tracking-widest block">Unit Price</span>
                          <span className="text-xs font-black text-slate-700 dark:text-slate-300">{priceStr}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-505 uppercase tracking-widest block">In Stock</span>
                          <span className={`text-xs font-bold ${outOfStock ? 'text-rose-600' : 'text-slate-500 dark:text-slate-400'}`}>{stockStr}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => addToCart(product)}
                      disabled={outOfStock}
                      className="w-full py-2.5 rounded-xl bg-teal-50 hover:bg-teal-100 dark:bg-teal-955/25 dark:hover:bg-teal-950/50 text-teal-700 dark:text-teal-400 disabled:opacity-40 disabled:pointer-events-none active:scale-[0.98] font-bold text-[10px] tracking-wider uppercase border border-teal-150 dark:border-teal-900/40 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Dispense Item</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Quotation Cart Panel (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm overflow-hidden sticky top-[80px]">
          <div className="bg-slate-950 dark:bg-slate-950/80 text-white p-5 flex items-center justify-between border-b border-slate-800 dark:border-slate-850">
            <div className="flex items-center gap-2.5">
              <ShoppingCart className="w-5 h-5 text-teal-400" />
              <h2 className="font-extrabold text-xs tracking-wider uppercase">Order Invoice Draft</h2>
            </div>
            <span className="text-[10px] bg-teal-500/10 border border-teal-500/30 text-teal-400 px-2.5 py-0.5 rounded-full font-bold uppercase select-none">
              {cart.length} Compound(s)
            </span>
          </div>

          <div className="p-5 flex flex-col gap-4 max-h-[58vh] overflow-y-auto min-h-[30vh]">
            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 py-16 gap-3">
                <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 text-slate-300 dark:text-slate-700 rounded-full">
                  <ShoppingCart className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-700 dark:text-slate-300 text-xs">Dispense Draft is Empty</h4>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 max-w-[220px] mx-auto font-medium">Select medications from the chemical catalog on the left to start compounding your order draft.</p>
                </div>
              </div>
            ) : (
              cart.map((item) => {
                const subtotal = calculateCartItemPrice(item);
                const unitPrice = getPriceForDisplay(item.product.pricePerBaseUnit, item.unit);
                const isViolation = checkMinPurchaseViolation(item);
                const displayMinQty = convertFromBaseUnit(item.product.minPurchase, item.unit).toNumber();

                // Form input options based on base unit
                let unitOptions: ('g' | 'kg' | 'mL' | 'L' | 'item')[] = ['item'];
                if (item.product.baseUnit === 'g') unitOptions = ['g', 'kg'];
                else if (item.product.baseUnit === 'mL') unitOptions = ['mL', 'L'];

                return (
                  <div key={item.product.id} className={`p-4 rounded-2xl border transition-colors space-y-3.5 relative overflow-hidden group ${
                    isViolation 
                      ? 'bg-rose-50/40 border-rose-200 dark:bg-rose-955/10 dark:border-rose-900/30' 
                      : 'bg-slate-50 dark:bg-slate-955/20 border-slate-200/50 dark:border-slate-800/80'
                  }`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-black text-slate-805 dark:text-slate-200 text-xs leading-snug">{item.product.name}</h4>
                        <div className="flex items-center gap-2.5 mt-1">
                          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono font-bold">SKU: {item.product.sku}</span>
                          <span className="text-[9px] text-slate-300 dark:text-slate-700">•</span>
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">{item.product.category || 'General'}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-955/25 rounded-lg border border-transparent hover:border-rose-100 dark:hover:border-rose-900/35 transition-all cursor-pointer shrink-0"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Unit price highlight */}
                    <div className="flex items-center justify-between bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-800 px-2.5 py-1.5 rounded-lg">
                      <div className="flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-teal-650 dark:text-teal-400 shrink-0" />
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-550">Unit Price:</span>
                        <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 tracking-wide">
                          {formatPrice(unitPrice)} / {item.unit}
                        </span>
                      </div>
                      {displayMinQty > 0 && (
                        <span className="text-[9px] font-bold text-indigo-650 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-955/30 px-1.5 py-0.5 rounded border border-transparent dark:border-indigo-900/20">
                          Min: {displayMinQty} {item.unit}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-row items-center justify-between gap-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-800/80">
                      <div className="flex flex-col items-start gap-1">
                        <div className="flex items-center rounded-lg border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-xs h-8">
                          <button
                            onClick={() => updateQuantity(item.product.id, Math.max(0.000001, item.quantity - 0.1))}
                            className="px-2 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors text-slate-550 dark:text-slate-400 h-full border-r border-slate-200 dark:border-slate-800 cursor-pointer"
                          >
                            <Minus className="w-2.5 h-2.5" />
                          </button>
                          <input
                            type="number"
                            step="any"
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.product.id, parseFloat(e.target.value) || 1)}
                            className="w-16 text-center text-[10px] font-black text-slate-800 dark:text-slate-200 bg-transparent focus:outline-none h-full"
                          />
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + 0.1)}
                            className="px-2 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors text-slate-550 dark:text-slate-400 h-full border-l border-slate-200 dark:border-slate-800 cursor-pointer"
                          >
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                        </div>

                        {/* Unit Selectors */}
                        <select
                          value={item.unit}
                          onChange={(e) => updateUnit(item.product.id, e.target.value as any)}
                          className="mt-1 h-8 py-1 pl-2 pr-6 rounded-lg border border-slate-250 dark:border-slate-805 text-[10px] focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all bg-white dark:bg-slate-950 font-bold text-slate-650 dark:text-slate-350 cursor-pointer"
                        >
                          {unitOptions.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>

                      <div className="text-right">
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-505 block uppercase tracking-widest">Subtotal</span>
                        <span className="text-xs font-extrabold text-slate-800 dark:text-slate-205">{formatPrice(subtotal)}</span>
                      </div>
                    </div>

                    {isViolation && (
                      <div className="text-[10px] text-rose-600 dark:text-rose-400 font-extrabold bg-rose-50 dark:bg-rose-955/25 border border-rose-100 dark:border-rose-900/35 p-2 rounded-xl text-center">
                        ⚠️ Limit Error: Ordered quantity must be at least {displayMinQty} {item.unit}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Cart Footer */}
          {cart.length > 0 && (
            <div className="p-5 bg-slate-50 dark:bg-slate-950/20 border-t border-slate-200/80 dark:border-slate-805/85 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-3">
                <span className="font-bold text-slate-500 dark:text-slate-455 text-xs tracking-wider uppercase">Prescription Total</span>
                <span className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight">{formatPrice(cartTotal)}</span>
              </div>

              {hasMinPurchaseViolations && (
                <div className="p-3 bg-rose-50 dark:bg-rose-955/15 border border-rose-100 dark:border-rose-900/35 rounded-xl text-rose-600 dark:text-rose-400 font-extrabold text-[10px] leading-relaxed text-center animate-pulse">
                  Cannot place order. One or more items violate minimum purchase requirements.
                </div>
              )}

              <button
                onClick={handleCheckout}
                disabled={checkoutLoading || hasMinPurchaseViolations}
                className="w-full py-3.5 px-4 rounded-xl bg-slate-950 dark:bg-slate-955 dark:hover:bg-slate-900 hover:bg-slate-850 text-white font-bold text-xs tracking-wider uppercase shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {checkoutLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
                    Generating Quotation...
                  </>
                ) : (
                  <>
                    <span>Submit & Dispense Medication</span>
                    <ArrowRight className="w-4 h-4 text-teal-400" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
