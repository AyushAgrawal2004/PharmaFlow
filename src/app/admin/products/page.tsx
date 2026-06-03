'use client';

import { useState, useEffect } from 'react';
import { 
  getProductsAction, 
  createProductAction, 
  updateProductAction, 
  deleteProductAction,
  ProductInput 
} from '@/actions/products';
import { 
  formatPrice, 
  getPriceForDisplay, 
  convertFromBaseUnit 
} from '@/lib/conversions';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  X,
  PackageOpen,
  Filter,
  Layers,
  FileSpreadsheet
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  category: string | null;
  baseUnit: string;
  unit: string;
  pricePerBaseUnit: any;
  stockQuantity: any;
  minPurchase: any;
  createdAt: Date;
  updatedAt: Date;
}

export default function AdminProductsPage() {
  // Products list state
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filter / Search state
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Form inputs
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState<'g' | 'kg' | 'mL' | 'L' | 'item'>('item');
  const [stock, setStock] = useState('');
  const [minPurchase, setMinPurchase] = useState('');

  // Fetch products
  const fetchProducts = async () => {
    setLoading(true);
    const res = await getProductsAction({
      query: search,
      category: categoryFilter,
      page: currentPage,
      limit: 8
    });

    if (res.success) {
      setProducts(res.products as unknown as Product[]);
      setCategories(res.categories || ['All']);
      setTotalCount(res.totalCount || 0);
      setTotalPages(res.totalPages || 1);
    } else {
      showToast('error', res.error || 'Failed to fetch products');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, [search, categoryFilter, currentPage]);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Open modal for Create
  const handleCreateOpen = () => {
    setModalMode('create');
    setEditingId(null);
    setName('');
    setSku('');
    setDescription('');
    setCategory('');
    setPrice('');
    setUnit('item');
    setStock('');
    setMinPurchase('');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleEditOpen = (product: Product) => {
    setModalMode('edit');
    setEditingId(product.id);
    setName(product.name);
    setSku(product.sku);
    setDescription(product.description || '');
    setCategory(product.category || '');
    
    // Convert base values back to display values for editing based on configured unit
    const displayUnit = (product.unit as 'g' | 'kg' | 'mL' | 'L' | 'item') || 'item';
    const displayPrice = getPriceForDisplay(product.pricePerBaseUnit, displayUnit).toNumber();
    const displayStock = convertFromBaseUnit(product.stockQuantity, displayUnit).toNumber();
    const displayMin = convertFromBaseUnit(product.minPurchase, displayUnit).toNumber();

    setPrice(displayPrice.toString());
    setUnit(displayUnit);
    setStock(displayStock.toString());
    setMinPurchase(displayMin === 0 ? '' : displayMin.toString());
    setFormError(null);
    setIsModalOpen(true);
  };

  // Handle Form Submit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !sku || !category || !price || !stock) {
      setFormError('Please fill in all required fields');
      return;
    }

    setFormError(null);
    setFormLoading(true);

    const inputData: ProductInput = {
      name,
      sku,
      description: description || undefined,
      category,
      price: parseFloat(price),
      unit,
      stock: parseFloat(stock),
      minPurchase: minPurchase ? parseFloat(minPurchase) : 0,
    };

    let res;
    if (modalMode === 'create') {
      res = await createProductAction(inputData);
    } else {
      res = await updateProductAction(editingId!, inputData);
    }

    if (res.success) {
      showToast('success', `Product ${modalMode === 'create' ? 'created' : 'updated'} successfully`);
      setIsModalOpen(false);
      fetchProducts();
    } else {
      setFormError(res.error || 'Failed to save product');
    }
    setFormLoading(false);
  };

  // Handle Delete
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    const res = await deleteProductAction(id);
    if (res.success) {
      showToast('success', 'Product deleted successfully');
      fetchProducts();
    } else {
      showToast('error', res.error || 'Failed to delete product');
    }
  };

  // Helper to render Display Unit & Conversion
  const getProductDisplayValues = (product: Product) => {
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
      minPurchaseVal: displayMin.toNumber(),
      minPurchaseStr: displayMin.toNumber() > 0 ? `${displayMin.toString()} ${displayUnit}` : 'None'
    };
  };

  // Get nice color pill based on category
  const getCategoryColor = (cat: string | null) => {
    if (!cat) return 'bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-800';
    const name = cat.toLowerCase();
    if (name.includes('prescription') || name.includes('rx')) return 'bg-indigo-50 dark:bg-indigo-955/20 text-indigo-700 dark:text-indigo-400 border-indigo-100/70 dark:border-indigo-900/35';
    if (name.includes('otc') || name.includes('counter')) return 'bg-teal-50 dark:bg-teal-955/20 text-teal-700 dark:text-teal-400 border-teal-100/70 dark:border-teal-900/35';
    if (name.includes('compounding') || name.includes('raw')) return 'bg-purple-50 dark:bg-purple-955/20 text-purple-700 dark:text-purple-400 border-purple-100/70 dark:border-purple-900/35';
    if (name.includes('syrup') || name.includes('liquid')) return 'bg-amber-50 dark:bg-amber-955/20 text-amber-700 dark:text-amber-400 border-amber-100/70 dark:border-amber-900/35';
    return 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-455 border-slate-200/60 dark:border-slate-800/80';
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

      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800/80 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-teal-50 dark:bg-teal-955/20 text-teal-600 dark:text-teal-405 rounded-2xl border border-teal-100/60 dark:border-teal-900/40">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-800 dark:text-slate-100">Medicines Catalog</h1>
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-0.5">Configure pharmaceutical inventories, chemical raw materials, and precise pricing</p>
          </div>
        </div>
        <button
          onClick={handleCreateOpen}
          className="flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-teal-600 hover:bg-teal-500 active:scale-95 text-white shadow-md shadow-teal-600/10 hover:shadow-teal-500/20 transition-all font-semibold text-xs tracking-wider uppercase cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Medicine</span>
        </button>
      </div>

      {/* Filters Card */}
      <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-slate-900 p-4.5 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search catalog by name, SKU, or active ingredients..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-xs font-medium bg-white dark:bg-slate-950 input-focus-ring"
          />
        </div>
        <div className="flex items-center gap-3">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
            className="py-2.5 pl-3 pr-8 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-350 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all bg-white dark:bg-slate-950 cursor-pointer"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat === 'All' ? 'All Categories' : cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
            <span className="text-xs font-semibold">Retrieving product lists...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-slate-400">
            <div className="p-4 rounded-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 text-slate-300 dark:text-slate-700">
              <PackageOpen className="w-10 h-10" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-slate-750 dark:text-slate-300 text-sm">No Medications Found</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs mx-auto">Try refining your filter parameters or create a new pharmaceutical entry.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-slate-50/70 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-4 px-6 font-bold">Product Details</th>
                  <th className="py-4 px-6 font-bold">SKU</th>
                  <th className="py-4 px-6 font-bold">Category</th>
                  <th className="py-4 px-6 font-bold">Calculated Selling Price</th>
                  <th className="py-4 px-6 font-bold">Stock Status</th>
                  <th className="py-4 px-6 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {products.map((product) => {
                  const { priceStr, stockStr, minPurchaseVal, minPurchaseStr } = getProductDisplayValues(product);
                  const isLowStock = parseFloat(convertFromBaseUnit(product.stockQuantity, product.unit || 'item').toString()) <= 5;
                  
                  return (
                    <tr key={product.id} className="hover:bg-slate-50/35 dark:hover:bg-slate-950/20 transition-colors group">
                      <td className="py-4.5 px-6">
                        <div className="font-bold text-slate-800 dark:text-slate-200 text-sm group-hover:text-teal-750 dark:group-hover:text-teal-400 transition-colors">{product.name}</div>
                        {product.description && (
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 line-clamp-1 max-w-xs">{product.description}</div>
                        )}
                      </td>
                      <td className="py-4.5 px-6">
                        <span className="font-mono text-[10px] font-bold bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded border border-slate-200/60 dark:border-slate-805/80">
                          {product.sku}
                        </span>
                      </td>
                      <td className="py-4.5 px-6">
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${getCategoryColor(product.category)}`}>
                          {product.category || 'General'}
                        </span>
                      </td>
                      <td className="py-4.5 px-6">
                        <div className="font-bold text-slate-700 dark:text-slate-300">{priceStr}</div>
                        {minPurchaseVal > 0 && (
                          <div className="text-[10px] text-indigo-500 dark:text-indigo-400 font-extrabold mt-0.5 uppercase tracking-wide animate-pulse">
                            Min Order: {minPurchaseStr}
                          </div>
                        )}
                      </td>
                      <td className="py-4.5 px-6">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          isLowStock 
                            ? 'bg-amber-50 border-amber-200 dark:bg-amber-955/20 dark:border-amber-900/35 text-amber-700 dark:text-amber-400' 
                            : 'bg-emerald-50 border-emerald-200 dark:bg-emerald-955/20 dark:border-emerald-900/35 text-emerald-700 dark:text-emerald-400'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isLowStock ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                          {stockStr}
                        </span>
                      </td>
                      <td className="py-4.5 px-6 text-right">
                        <div className="flex justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEditOpen(product)}
                            className="p-2 rounded-xl text-slate-500 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-955/20 border border-transparent hover:border-teal-100 dark:hover:border-teal-900/40 transition-all cursor-pointer"
                            title="Edit"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-955/20 border border-transparent hover:border-rose-100 dark:hover:border-rose-900/40 transition-all cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Panel */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 px-6 py-4 bg-slate-50/50 dark:bg-slate-950/20">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-950 text-slate-650 dark:text-slate-350 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-955 text-slate-650 dark:text-slate-350 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CRUD Overlaid Glassmorphic Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/50 dark:bg-slate-955/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl relative flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-950 text-slate-450 hover:text-slate-600 dark:text-slate-550 dark:hover:text-slate-350 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-1 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-teal-600" />
              <span>{modalMode === 'create' ? 'Register New Medication' : 'Edit Medicine Details'}</span>
            </h2>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-5 font-medium">Configure chemical specifications, preferred measuring unit, and precision pricing</p>

            <form onSubmit={handleFormSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1">
              {formError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-955/20 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 text-xs font-semibold animate-in shake duration-200">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Medicine / Compound Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ibuprofen Powders"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-205 dark:border-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500 transition-all bg-white dark:bg-slate-950 input-focus-ring"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">SKU / Medicine Code *</label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="e.g. PWD-IBP-100"
                    disabled={modalMode === 'edit'}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-205 dark:border-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500 transition-all bg-white dark:bg-slate-950 disabled:bg-slate-50 disabled:dark:bg-slate-950 disabled:text-slate-400 disabled:dark:text-slate-600 disabled:border-slate-150 uppercase input-focus-ring"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Category *</label>
                  <input
                    type="text"
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Compounding Raw Materials"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-250 dark:border-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500 transition-all bg-white dark:bg-slate-950 input-focus-ring"
                  />
                </div>

                <div className="space-y-1.5 col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Active Ingredients & Strength</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide details about chemical strength, active ingredients, dosage form..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-205 dark:border-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500 transition-all bg-white dark:bg-slate-950 resize-none input-focus-ring"
                  />
                </div>

                <div className="space-y-1.5 col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Pricing & Stocking Unit *</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500 transition-all bg-white dark:bg-slate-950 cursor-pointer input-focus-ring"
                  >
                    <option value="item">Items (item)</option>
                    <option value="kg">Kilograms (kg)</option>
                    <option value="g">Grams (g)</option>
                    <option value="L">Liters (L)</option>
                    <option value="mL">Milliliters (mL)</option>
                  </select>
                </div>

                <div className="space-y-1.5 col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Price per Selected Unit *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Supports up to 6 decimals, e.g., 3.504321"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-205 dark:border-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500 transition-all bg-white dark:bg-slate-950 input-focus-ring"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Quantity in Stock *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="e.g. 50"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500 transition-all bg-white dark:bg-slate-955 input-focus-ring"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Min Purchase Quantity</label>
                  <input
                    type="number"
                    step="any"
                    value={minPurchase}
                    onChange={(e) => setMinPurchase(e.target.value)}
                    placeholder="e.g. 10 (Optional)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500 transition-all bg-white dark:bg-slate-955 input-focus-ring"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-455 tracking-wider uppercase transition-all active:scale-[0.98] cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold tracking-wider uppercase shadow-md shadow-teal-600/10 hover:shadow-teal-500/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                >
                  {formLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Medicine'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
