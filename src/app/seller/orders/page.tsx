'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { getOrdersAction } from '@/actions/orders';
import { formatPrice, getPriceForDisplay } from '@/lib/conversions';
import { 
  ClipboardList, 
  Loader2, 
  ChevronDown, 
  ChevronUp, 
  ShoppingBag, 
  Calendar,
  Layers,
  Activity
} from 'lucide-react';

interface OrderItem {
  id: string;
  productId: string;
  orderedQuantity: any;
  orderedUnit: string;
  convertedQuantity: any;
  price: any;
  product: {
    name: string;
    sku: string;
    baseUnit: string;
    pricePerBaseUnit: any;
  };
}

interface Order {
  id: string;
  userId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  totalPrice: any;
  createdAt: Date;
  items: OrderItem[];
}

export default function SellerOrderHistoryPage() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const fetchOrders = async () => {
    if (!session?.user?.id) return;
    setLoading(true);
    const res = await getOrdersAction({
      userId: session.user.id,
      role: 'SELLER',
      status: statusFilter
    });

    if (res.success) {
      setOrders(res.orders as unknown as Order[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, [session, statusFilter]);

  const toggleExpandOrder = (id: string) => {
    setExpandedOrderId(prev => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/60 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-teal-50 text-teal-600 rounded-2xl border border-teal-100/60">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-800">Quotation Logs</h1>
            <p className="text-xs font-medium text-slate-400 mt-0.5">Track prescription history, check approval status, and view exact pricing details</p>
          </div>
        </div>
      </div>

      {/* Filter panel */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/60 shadow-xs">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
          <Layers className="w-4 h-4 text-teal-600" />
          <span>My Quotations Log</span>
        </h2>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-1.5 pl-2.5 pr-8 rounded-lg border border-slate-200 text-[10px] font-bold text-slate-650 focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500 transition-all bg-white cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="COMPLETED">Completed</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Orders list */}
      <div className="bg-white rounded-3xl border border-slate-200/60 shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
            <span className="text-xs font-semibold">Retrieving your quotations...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4 bg-white border border-transparent rounded-3xl p-5 shadow-xs">
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-full text-slate-300">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-slate-700 text-sm">No Orders Found</h3>
              <p className="text-[10px] text-slate-400 mt-1 max-w-[240px] mx-auto">You haven't compounded or dispensed any prescription orders yet.</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {orders.map((order) => {
              const isExpanded = expandedOrderId === order.id;
              const formattedDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              let badgeClass = 'bg-amber-50 border-amber-200 text-amber-700';
              if (order.status === 'APPROVED') badgeClass = 'bg-indigo-50 border-indigo-200 text-indigo-700';
              else if (order.status === 'COMPLETED') badgeClass = 'bg-teal-50 border-teal-200 text-teal-700';
              else if (order.status === 'REJECTED') badgeClass = 'bg-rose-50 border-rose-200 text-rose-700';

              return (
                <div key={order.id} className="transition-all hover:bg-slate-50/15">
                  {/* Order Main Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 gap-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleExpandOrder(order.id)}
                        className="p-2 rounded-xl hover:bg-slate-100 text-slate-450 hover:text-slate-700 transition-all cursor-pointer border border-transparent hover:border-slate-200/50"
                      >
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-800 text-xs tracking-wider">QUOTATION #{order.id.slice(-6).toUpperCase()}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border tracking-wider ${badgeClass}`}>
                            {order.status}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-450 mt-1 flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {formattedDate}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                      <div className="text-right">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Estimated Cost</span>
                        <span className="text-sm font-black text-slate-800">{formatPrice(order.totalPrice)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Order Expanded Details */}
                  {isExpanded && (
                    <div className="bg-slate-50/50 p-4 sm:p-5 border-t border-b border-slate-100 space-y-4 animate-in slide-in-from-top-1 duration-200">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Medication billing details</span>
                      <div className="bg-white rounded-2xl border border-slate-200/50 overflow-hidden shadow-xs">
                        <table className="w-full text-left text-[10px] border-collapse">
                          <thead>
                            <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                              <th className="py-2.5 px-4 font-bold">Item Name</th>
                              <th className="py-2.5 px-4 font-bold">Ordered Quantity</th>
                              <th className="py-2.5 px-4 text-center font-bold">Unit Price Charged</th>
                              <th className="py-2.5 px-4 font-bold">Converts to Base Stock</th>
                              <th className="py-2.5 px-4 text-right font-bold">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {order.items.map((item) => {
                              const displayUnit = item.orderedUnit;
                              const baseQtyVal = parseFloat(item.convertedQuantity.toString());
                              const baseQtyStr = `${baseQtyVal.toLocaleString()} ${item.product.baseUnit}`;

                              const ordQtyVal = parseFloat(item.orderedQuantity.toString());
                              const ordQtyStr = `${ordQtyVal} ${item.orderedUnit}`;

                              // Calculate unit price for ordered unit with high precision
                              const basePriceVal = parseFloat(item.product.pricePerBaseUnit.toString());
                              const priceDisplay = getPriceForDisplay(basePriceVal, displayUnit);

                              return (
                                <tr key={item.id} className="text-slate-700 hover:bg-slate-50/30">
                                  <td className="py-3.5 px-4">
                                    <div className="font-bold text-slate-800 text-xs">{item.product.name}</div>
                                    <div className="text-[9px] text-slate-400 font-mono mt-0.5">SKU: {item.product.sku}</div>
                                  </td>
                                  <td className="py-3.5 px-4 font-bold text-slate-650">{ordQtyStr}</td>
                                  <td className="py-3.5 px-4 text-center">
                                    <span className="text-[9px] bg-slate-50 px-2 py-0.5 rounded border border-slate-200 font-bold text-slate-650">
                                      {formatPrice(priceDisplay)} / {displayUnit}
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-4 font-mono text-slate-500">{baseQtyStr}</td>
                                  <td className="py-3.5 px-4 text-right font-black text-slate-850">
                                    {formatPrice(item.price)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
