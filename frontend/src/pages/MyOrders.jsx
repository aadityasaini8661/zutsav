import React, { useEffect, useState, useCallback } from 'react';
import {
  Package, ChevronDown, ChevronUp, MapPin, CreditCard,
  Truck, CheckCircle, Clock, XCircle, RefreshCw, RotateCcw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../api/axios';

const STATUS_META = {
  pending_payment:  { label: 'Awaiting Payment', color: 'bg-yellow-100 text-yellow-700',   dot: 'bg-yellow-400' },
  paid:             { label: 'Order Placed',      color: 'bg-blue-100 text-blue-700',       dot: 'bg-blue-500'   },
  confirmed:        { label: 'Confirmed',          color: 'bg-indigo-100 text-indigo-700',   dot: 'bg-indigo-500' },
  processing:       { label: 'Confirmed',          color: 'bg-indigo-100 text-indigo-700',   dot: 'bg-indigo-500' },
  packed:           { label: 'Packed',             color: 'bg-purple-100 text-purple-700',   dot: 'bg-purple-500' },
  shipped:          { label: 'Shipped',            color: 'bg-orange-100 text-orange-700',   dot: 'bg-orange-500' },
  out_for_delivery: { label: 'Out for Delivery',   color: 'bg-amber-100 text-amber-700',     dot: 'bg-amber-500'  },
  delivered:        { label: 'Delivered',          color: 'bg-green-100 text-green-700',     dot: 'bg-green-500'  },
  cancelled:        { label: 'Cancelled',          color: 'bg-red-100 text-red-700',         dot: 'bg-red-500'    },
  refunded:         { label: 'Refunded',           color: 'bg-gray-100 text-gray-600',       dot: 'bg-gray-400'   },
  payment_failed:   { label: 'Payment Failed',     color: 'bg-red-100 text-red-700',         dot: 'bg-red-500'    },
};

const TIMELINE_STEPS = [
  { key: 'paid',             label: 'Order Placed'       },
  { key: 'confirmed',        label: 'Confirmed'          },
  { key: 'packed',           label: 'Packed'             },
  { key: 'shipped',          label: 'Shipped'            },
  { key: 'out_for_delivery', label: 'Out for Delivery'   },
  { key: 'delivered',        label: 'Delivered'          },
];

const FILTERS = [
  { key: '',                value: 'All Orders'    },
  { key: 'active',          value: 'Active'        },
  { key: 'delivered',       value: 'Delivered'     },
  { key: 'cancelled',       value: 'Cancelled'     },
];

function OrderTimeline({ order }) {
  const timelineMap = {};
  (order.statusTimeline || []).forEach((e) => { timelineMap[e.status] = e; });
  // Also treat 'processing' as 'confirmed'
  if (timelineMap.processing && !timelineMap.confirmed) timelineMap.confirmed = timelineMap.processing;

  const cancelledOrRefunded = ['cancelled', 'refunded', 'payment_failed'].includes(order.status);

  if (cancelledOrRefunded) {
    return (
      <div className="flex items-center gap-3 py-3 px-4 bg-red-50 rounded-xl border border-red-100">
        <XCircle size={20} className="text-red-500 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-red-700">{STATUS_META[order.status]?.label || order.status}</p>
          {order.cancelReason && <p className="text-xs text-red-500 mt-0.5">Reason: {order.cancelReason}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {TIMELINE_STEPS.map((step, idx) => {
        const entry = timelineMap[step.key];
        const isReached = !!entry;
        const isCurrent = order.status === step.key ||
          (step.key === 'confirmed' && order.status === 'processing');

        return (
          <div key={step.key} className="flex items-start gap-3 relative">
            {/* connector line */}
            {idx < TIMELINE_STEPS.length - 1 && (
              <div
                className="absolute left-[9px] top-5 w-0.5 h-8"
                style={{ background: isReached ? '#1B1F3B' : '#e5e7eb' }}
              />
            )}
            <div
              className="w-5 h-5 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center"
              style={{
                borderColor: isReached ? '#1B1F3B' : '#e5e7eb',
                background: isReached ? '#1B1F3B' : 'white',
              }}
            >
              {isReached && <CheckCircle size={10} className="text-white" />}
            </div>
            <div className="pb-8">
              <p className={`text-sm font-semibold ${isReached ? 'text-gray-800' : 'text-gray-400'}`}>{step.label}</p>
              {entry?.timestamp && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(entry.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
              {isCurrent && !entry && (
                <p className="text-xs text-indigo-500 font-medium mt-0.5">Current stage</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function OrderCard({ order }) {
  const [expanded, setExpanded] = useState(false);
  const meta = STATUS_META[order.status] || STATUS_META.paid;
  const firstItem = order.items?.[0];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
      {/* Card header */}
      <button
        onClick={() => setExpanded((p) => !p)}
        className="w-full text-left px-5 py-4 flex items-center gap-4"
      >
        <div className="w-12 h-12 rounded-xl bg-saffron-50 flex items-center justify-center shrink-0">
          <Package size={22} style={{ color: '#1B1F3B' }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-gray-800">#{order.orderNumber}</p>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${meta.color}`}>{meta.label}</span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5 font-sans">
            {firstItem?.name}{order.items?.length > 1 ? ` +${order.items.length - 1} more` : ''} · {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>

        <div className="text-right shrink-0">
          <p className="font-bold text-gray-800 text-sm" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            ₹{order.totalAmount?.toLocaleString('en-IN')}
          </p>
          {expanded ? <ChevronUp size={16} className="text-gray-400 ml-auto mt-1" /> : <ChevronDown size={16} className="text-gray-400 ml-auto mt-1" />}
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-gray-100 px-5 py-5 space-y-5">
          {/* Items */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Items Ordered</p>
            <div className="space-y-2">
              {order.items?.map((item, i) => (
                <div key={i} className="flex justify-between items-center text-sm">
                  <span className="text-gray-700">{item.name} <span className="text-gray-400">×{item.quantity}</span></span>
                  <span className="font-semibold text-gray-800">₹{item.total?.toLocaleString('en-IN')}</span>
                </div>
              ))}
              <div className="border-t border-dashed border-gray-200 pt-2 flex justify-between font-bold">
                <span className="text-gray-800">Total</span>
                <span style={{ color: '#1B1F3B', fontFamily: "'Cormorant Garamond', serif", fontSize: '1.1rem' }}>
                  ₹{order.totalAmount?.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Shipping address */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <MapPin size={12} /> Delivery Address
            </p>
            <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-700 leading-relaxed">
              <p className="font-semibold">{order.shippingAddress?.name}</p>
              <p className="text-gray-500 text-xs">{order.shippingAddress?.phone}</p>
              <p className="text-gray-600 text-xs mt-1">
                {[order.shippingAddress?.address, order.shippingAddress?.city, order.shippingAddress?.district, order.shippingAddress?.state, order.shippingAddress?.pincode].filter(Boolean).join(', ')}
              </p>
            </div>
          </div>

          {/* Tracking info */}
          {(order.trackingId || order.courier) && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Truck size={12} /> Tracking
              </p>
              <div className="bg-indigo-50 rounded-xl p-3 text-sm">
                {order.courier && <p className="font-semibold text-indigo-800">{order.courier}</p>}
                {order.trackingId && (
                  <p className="text-indigo-600 font-mono text-xs mt-0.5">{order.trackingId}</p>
                )}
              </div>
            </div>
          )}

          {/* Payment info */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <CreditCard size={12} /> Payment
            </p>
            <div className="flex items-center gap-2 text-sm">
              <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">PhonePe</span>
              {order.phonePeTransactionId && (
                <span className="text-gray-400 text-xs font-mono">{order.phonePeTransactionId}</span>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Order Timeline</p>
            <OrderTimeline order={order} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const ACTIVE_STATUSES = ['paid', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery'];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/marketplace/orders/my');
      setOrders(data.orders || []);
    } catch {
      toast.error('Could not load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = orders.filter((o) => {
    if (!filter) return o.status !== 'pending_payment';
    if (filter === 'active')    return ACTIVE_STATUSES.includes(o.status);
    if (filter === 'delivered') return o.status === 'delivered';
    if (filter === 'cancelled') return ['cancelled', 'refunded', 'payment_failed'].includes(o.status);
    return true;
  });

  const activeCount    = orders.filter((o) => ACTIVE_STATUSES.includes(o.status)).length;
  const deliveredCount = orders.filter((o) => o.status === 'delivered').length;

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#1B1F3B', fontFamily: "'Cormorant Garamond', serif" }}>My Orders</h1>
          <p className="text-sm text-gray-500 mt-0.5">{orders.length > 0 ? `${orders.length} total order${orders.length !== 1 ? 's' : ''}` : 'No orders yet'}</p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Stats row */}
      {orders.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total',     value: orders.filter((o) => o.status !== 'pending_payment').length, color: '#1B1F3B' },
            { label: 'Active',    value: activeCount,    color: '#7c3aed' },
            { label: 'Delivered', value: deliveredCount, color: '#059669' },
            { label: 'Cancelled', value: orders.filter((o) => ['cancelled', 'refunded'].includes(o.status)).length, color: '#dc2626' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
              <p className="text-2xl font-bold" style={{ color, fontFamily: "'Cormorant Garamond', serif" }}>{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(({ key, value }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={{
              background: filter === key ? '#1B1F3B' : 'white',
              color:      filter === key ? 'white'   : '#6b7280',
              border:     `1px solid ${filter === key ? '#1B1F3B' : '#e5e7eb'}`,
            }}
          >
            {value}
          </button>
        ))}
      </div>

      {/* Orders list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 skeleton rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <Package size={36} className="text-gray-300" />
          </div>
          <p className="font-bold text-gray-700 text-lg" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            {filter ? 'No orders in this category' : 'No orders yet'}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {filter ? 'Try a different filter' : 'Your marketplace orders will appear here after purchase'}
          </p>
          {filter && (
            <button onClick={() => setFilter('')} className="mt-4 btn-outline text-sm">
              <RotateCcw size={13} /> Clear Filter
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => (
            <OrderCard key={order._id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
