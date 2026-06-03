'use client';

import { useState, useEffect } from 'react';
import { getProductsAction } from '@/actions/products';
import { convertFromBaseUnit } from '@/lib/conversions';
import { 
  Search, 
  Layers, 
  AlertTriangle, 
  Loader2, 
  Info,
  ArrowRight,
  TrendingDown,
  Activity
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  sku: string;
  baseUnit: string;
  unit: string;
  stockQuantity: any;
  category: string | null;
}

export default function AdminInventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Statistics
  const [totalItems, setTotalItems] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [outOfStockCount, setOutOfStockCount] = useState(0);

  const fetchInventory = async () => {
    setLoading(true);
    const res = await getProductsAction({
      query: search,
      limit: 100
    });

    if (res.success) {
      const prodList = res.products as unknown as Product[];
      setProducts(prodList);
      
      // Calculate inventory stats based on configured unit
      let low = 0;
      let out = 0;
      
      prodList.forEach((prod) => {
        const displayUnit = prod.unit || 'item';
        const qty = parseFloat(convertFromBaseUnit(prod.stockQuantity, displayUnit).toString());
        if (qty === 0) out++;
        else if (qty <= 5) low++; // Alert threshold of <= 5 display units
      });
      
      setTotalItems(prodList.length);
      setLowStockCount(low);
      setOutOfStockCount(out);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchInventory();
  }, [search]);

  // Convert and format stock using stored unit
  const formatStockDetail = (product: Product) => {
    const qtyBase = parseFloat(product.stockQuantity.toString());
    const displayUnit = product.unit || 'item';
    
    let label = 'Count';
    if (product.baseUnit === 'g') {
      label = 'Weight';
    } else if (product.baseUnit === 'mL') {
      label = 'Volume';
    }

    const qtyDisplay = convertFromBaseUnit(product.stockQuantity, displayUnit);

    return {
      qtyBase: `${qtyBase.toLocaleString()} ${product.baseUnit}`,
      qtyDisplay: `${qtyDisplay.toString()} ${displayUnit}`,
      displayUnit,
      label
    };
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800/80 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-100/60 dark:border-indigo-900/50">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-800 dark:text-slate-100">Inventory Monitoring</h1>
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-0.5">Real-time surveillance of compound levels, clinical stocks, and custom unit metrics</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Total SKUs */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full blur-2xl pointer-events-none group-hover:scale-110 transition-transform" />
          <div className="p-3.5 rounded-xl bg-teal-50 dark:bg-teal-955/20 text-teal-600 dark:text-teal-400 border border-teal-100/50 dark:border-teal-900/35">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Total Registered SKUs</span>
            <span className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-0.5">{totalItems}</span>
          </div>
        </div>

        {/* Low Stock Warning */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl pointer-events-none group-hover:scale-110 transition-transform ${lowStockCount > 0 ? 'bg-amber-500/5' : 'bg-slate-500/5'}`} />
          <div className={`p-3.5 rounded-xl border ${
            lowStockCount > 0 
              ? 'bg-amber-50 dark:bg-amber-955/20 text-amber-600 dark:text-amber-400 border-amber-100/50 dark:border-amber-900/35 animate-pulse' 
              : 'bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-600 border-slate-200/50 dark:border-slate-800/80'
          }`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Low Levels (≤5 Units)</span>
            <span className={`text-2xl font-black mt-0.5 ${lowStockCount > 0 ? 'text-amber-600' : 'text-slate-800 dark:text-slate-100'}`}>{lowStockCount}</span>
          </div>
        </div>

        {/* Out Of Stock */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl pointer-events-none group-hover:scale-110 transition-transform ${outOfStockCount > 0 ? 'bg-rose-500/5' : 'bg-slate-500/5'}`} />
          <div className={`p-3.5 rounded-xl border ${
            outOfStockCount > 0 
              ? 'bg-rose-50 dark:bg-rose-955/20 text-rose-600 dark:text-rose-450 border-rose-100/50 dark:border-rose-900/35 glow-teal' 
              : 'bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-600 border-slate-200/50 dark:border-slate-800/80'
          }`}>
            <TrendingDown className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Out of Stock Compounds</span>
            <span className={`text-2xl font-black mt-0.5 ${outOfStockCount > 0 ? 'text-rose-650' : 'text-slate-800 dark:text-slate-100'}`}>{outOfStockCount}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search levels by SKU code, compound name, active ingredients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500 transition-all bg-white dark:bg-slate-955 text-xs font-semibold input-focus-ring"
          />
        </div>
      </div>

      {/* Stock Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <span className="text-xs font-semibold">Running inventory audit...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
            <Info className="w-8 h-8 text-slate-350" />
            <span className="text-xs font-semibold">No stock results match criteria.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-slate-50/70 dark:bg-slate-955/40 border-b border-slate-100 dark:border-slate-800 text-slate-550 dark:text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-4 px-6">Medication / Compound Details</th>
                  <th className="py-4 px-6">SKU Code</th>
                  <th className="py-4 px-6">Internal Base Unit Stock</th>
                  <th className="py-4 px-2"></th>
                  <th className="py-4 px-6">Configured Selling Stock</th>
                  <th className="py-4 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {products.map((product) => {
                  const { qtyBase, qtyDisplay, displayUnit } = formatStockDetail(product);
                  const displayVal = parseFloat(convertFromBaseUnit(product.stockQuantity, displayUnit).toString());
                  
                  let status = 'In Stock';
                  let statusClass = 'bg-emerald-50 border-emerald-205 dark:bg-emerald-955/20 dark:border-emerald-900/35 text-emerald-700 dark:text-emerald-455';
                  let dotClass = 'bg-emerald-500';

                  if (displayVal === 0) {
                    status = 'Out of Stock';
                    statusClass = 'bg-rose-50 border-rose-250 dark:bg-rose-955/20 dark:border-rose-900/35 text-rose-700 dark:text-rose-455';
                    dotClass = 'bg-rose-500';
                  } else if (displayVal <= 5) {
                    status = 'Low Stock';
                    statusClass = 'bg-amber-50 border-amber-250 dark:bg-amber-955/20 dark:border-amber-900/35 text-amber-700 dark:text-amber-455';
                    dotClass = 'bg-amber-500';
                  }

                  return (
                    <tr key={product.id} className="hover:bg-slate-50/35 dark:hover:bg-slate-950/20 transition-colors group">
                      <td className="py-4.5 px-6">
                        <div className="font-bold text-slate-800 dark:text-slate-200 text-sm group-hover:text-teal-750 dark:group-hover:text-teal-400 transition-colors">{product.name}</div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{product.category || 'No Category'}</div>
                      </td>
                      <td className="py-4.5 px-6">
                        <span className="font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-805/80 px-1.5 py-0.5 rounded">
                          {product.sku}
                        </span>
                      </td>
                      <td className="py-4.5 px-6 font-mono text-slate-500 dark:text-slate-400 font-semibold">{qtyBase}</td>
                      <td className="py-4.5 px-2 text-slate-400">
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </td>
                      <td className="py-4.5 px-6 font-black text-slate-800 dark:text-slate-200 text-sm">{qtyDisplay}</td>
                      <td className="py-4.5 px-6">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusClass}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
