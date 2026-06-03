'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { getOrdersAction, updateOrderStatusAction } from '@/actions/orders';
import { formatPrice, convertFromBaseUnit, getPriceForDisplay } from '@/lib/conversions';
import { 
  ClipboardList, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ShoppingBag, 
  Loader2, 
  DollarSign, 
  ChevronDown,
  ChevronUp,
  User,
  Truck,
  Activity,
  Calendar
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
  user: {
    name: string | null;
    email: string;
  };
  items: OrderItem[];
}

export default function AdminDashboardPage() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Summary statistics
  const [stats, setStats] = useState({
    totalRevenue: 0,
    pending: 0,
    approved: 0,
    completed: 0,
    rejected: 0,
  });

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchOrders = async () => {
    setLoading(true);
    const res = await getOrdersAction({
      role: 'ADMIN',
      status: statusFilter
    });

    if (res.success) {
      const orderList = res.orders as unknown as Order[];
      setOrders(orderList);
      
      // Calculate statistics based on ALL orders
      let rev = 0;
      let pend = 0;
      let app = 0;
      let comp = 0;
      let rej = 0;

      orderList.forEach((ord) => {
        const price = parseFloat(ord.totalPrice.toString());
        if (ord.status === 'COMPLETED' || ord.status === 'APPROVED') {
          rev += price;
        }
        
        if (ord.status === 'PENDING') pend++;
        else if (ord.status === 'APPROVED') app++;
        else if (ord.status === 'COMPLETED') comp++;
        else if (ord.status === 'REJECTED') rej++;
      });

      setStats({
        totalRevenue: rev,
        pending: pend,
        approved: app,
        completed: comp,
        rejected: rej,
      });
    } else {
      showToast('error', res.error || 'Failed to fetch orders');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleStatusChange = async (orderId: string, newStatus: any) => {
    setUpdatingId(orderId);
    const res = await updateOrderStatusAction(orderId, newStatus);
    if (res.success) {
      showToast('success', `Order status updated to ${newStatus}`);
      fetchOrders();
    } else {
      showToast('error', res.error || 'Failed to update order status');
    }
    setUpdatingId(null);
  };

  const toggleExpandOrder = (id: string) => {
    setExpandedOrderId(prev => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-4 rounded-2xl shadow-xl border transition-all duration-300 flex items-center gap-3 ${
          toastMessage.type === 'success' 
            ? 'bg-slate-900 border-emerald-500/20 text-emerald-400' 
            : 'bg-slate-900 border-rose-500/20 text-rose-400'
        }`}>
          <span className={`w-2 h-2 rounded-full ${toastMessage.type === 'success' ? 'bg-emerald-400 animate-ping' : 'bg-rose-400'}`} />
          <span className="text-xs font-semibold tracking-wide">{toastMessage.text}</span>
        </div>
      )}

      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/60 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100/60">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-800">Admin Operations</h1>
            <p className="text-xs font-medium text-slate-400 mt-0.5">Approve compounding drafts, audit pharmacy bills, and monitor earnings statistics</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Revenue */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/60 shadow-xs flex items-center gap-3 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100/40">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Earnings</span>
            <span className="text-base font-black text-slate-800 mt-0.5 truncate max-w-[130px] block">{formatPrice(stats.totalRevenue)}</span>
          </div>
        </div>

        {/* Pending */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/60 shadow-xs flex items-center gap-3 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100/40">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Pending Approval</span>
            <span className="text-base font-black text-slate-800 mt-0.5">{stats.pending}</span>
          </div>
        </div>

        {/* Approved */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/60 shadow-xs flex items-center gap-3 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100/40">
            <CheckCircle className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Approved</span>
            <span className="text-base font-black text-slate-800 mt-0.5">{stats.approved}</span>
          </div>
        </div>

        {/* Completed */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/60 shadow-xs flex items-center gap-3 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-teal-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600 border border-teal-100/40">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Dispensed</span>
            <span className="text-base font-black text-slate-800 mt-0.5">{stats.completed}</span>
          </div>
        </div>

        {/* Rejected */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/60 shadow-xs flex items-center gap-3 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-100/40">
            <XCircle className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Rejected</span>
            <span className="text-base font-black text-slate-800 mt-0.5">{stats.rejected}</span>
          </div>
        </div>
      </div>

      {/* Orders Filter Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/60 shadow-xs">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-teal-600" />
          <span>Prescriptions & Orders List</span>
        </h2>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-1.5 pl-2.5 pr-8 rounded-lg border border-slate-200 text-[10px] font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500 transition-all bg-white cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="COMPLETED">Completed</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-slate-200/60 shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
            <span className="text-xs font-semibold">Fetching orders inventory...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
            <ShoppingBag className="w-8 h-8 text-slate-350" />
            <span className="text-xs font-semibold">No order logs found.</span>
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
                          <span className="font-extrabold text-slate-800 text-xs tracking-wider">ORDER #{order.id.slice(-6).toUpperCase()}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border tracking-wider ${badgeClass}`}>
                            {order.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-450 font-medium">
                          <span className="flex items-center gap-1 bg-slate-50 border border-slate-200/60 px-1.5 py-0.5 rounded text-slate-600">
                            <User className="w-3 h-3 text-slate-450" />
                            {order.user.name || order.user.email}
                          </span>
                          <span className="flex items-center gap-1 bg-slate-50 border border-slate-200/60 px-1.5 py-0.5 rounded text-slate-600">
                            <Calendar className="w-3 h-3 text-slate-450" />
                            {formattedDate}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                      <div className="text-right">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Total Billing</span>
                        <span className="text-sm font-black text-slate-800">{formatPrice(order.totalPrice)}</span>
                      </div>

                      {/* Status Selector dropdown */}
                      <div className="flex items-center gap-2">
                        <select
                          value={order.status}
                          disabled={updatingId === order.id}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          className="py-1.5 pl-2.5 pr-8 rounded-lg border border-slate-200 text-[10px] font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500 transition-all bg-white cursor-pointer disabled:opacity-40"
                        >
                          <option value="PENDING">Pending</option>
                          <option value="APPROVED">Approved</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="REJECTED">Rejected</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Order Expanded Details */}
                  {isExpanded && (
                    <div className="bg-slate-50/50 p-4 sm:p-5 border-t border-b border-slate-100 space-y-4 animate-in slide-in-from-top-1 duration-200">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Compounded items invoice breakdown</span>
                      <div className="bg-white rounded-2xl border border-slate-200/50 overflow-hidden shadow-xs">
                        <table className="w-full text-left text-[10px] border-collapse">
                          <thead>
                            <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                              <th className="py-2.5 px-4 font-bold">Item Details</th>
                              <th className="py-2.5 px-4 font-bold">Ordered Quantity</th>
                              <th className="py-2.5 px-4 text-center font-bold">Billing Unit Price</th>
                              <th className="py-2.5 px-4 font-bold">Converted Quantity</th>
                              <th className="py-2.5 px-4 text-right font-bold">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {order.items.map((item) => {
                              const displayUnit = item.orderedUnit;

                              // Convert quantities
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
                                    <span className="text-[9px] bg-slate-50 px-2 py-0.5 rounded border border-slate-200 font-bold text-slate-600">
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
