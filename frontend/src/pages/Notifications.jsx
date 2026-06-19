import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, CheckCheck, Trash2, BookOpen, Package, Star,
  Users, ShoppingBag, AlertCircle, Inbox,
} from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

const TYPE_CONFIG = {
  booking_created:   { icon: BookOpen,    bg: 'rgba(59,130,246,0.12)',   color: '#3B82F6', label: 'Booking'    },
  pandit_assigned:   { icon: Users,       bg: 'rgba(16,185,129,0.12)',   color: '#10B981', label: 'Assignment' },
  new_booking:       { icon: BookOpen,    bg: 'rgba(212,96,42,0.12)',    color: '#D4602A', label: 'New Booking'},
  booking_completed: { icon: CheckCheck,  bg: 'rgba(16,185,129,0.12)',   color: '#10B981', label: 'Completed'  },
  pandit_approved:   { icon: Star,        bg: 'rgba(201,168,76,0.15)',   color: '#C9A84C', label: 'Approved'   },
  pandit_registered: { icon: Users,       bg: 'rgba(139,92,246,0.12)',   color: '#8B5CF6', label: 'Pandit'     },
  user_registered:   { icon: Users,       bg: 'rgba(212,96,42,0.12)',    color: '#D4602A', label: 'Welcome'    },
  order_placed:      { icon: ShoppingBag, bg: 'rgba(99,102,241,0.12)',   color: '#6366F1', label: 'Order'      },
  order_delivered:   { icon: Package,     bg: 'rgba(16,185,129,0.12)',   color: '#10B981', label: 'Delivered'  },
  otp_sent:          { icon: AlertCircle, bg: 'rgba(245,158,11,0.12)',   color: '#F59E0B', label: 'OTP'        },
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7)  return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function NotificationItem({ n, onRead, onDelete }) {
  const cfg  = TYPE_CONFIG[n.type] || { icon: Bell, bg: 'rgba(107,114,128,0.12)', color: '#6B7280', label: 'Info' };
  const Icon = cfg.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.2 }}
      onClick={() => !n.isRead && onRead(n._id)}
      className="group flex gap-3 items-start p-4 rounded-2xl border cursor-pointer transition-all duration-200"
      style={{
        background: n.isRead ? 'var(--t-card)' : `${cfg.bg.replace('0.12', '0.06')}`,
        borderColor: n.isRead ? 'var(--t-border)' : cfg.color + '33',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
    >
      {/* Icon */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: cfg.bg }}
      >
        <Icon size={16} style={{ color: cfg.color }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p
              className="text-sm leading-snug"
              style={{
                color: 'var(--t-text)',
                fontWeight: n.isRead ? 500 : 700,
              }}
            >
              {n.title}
            </p>
            <p className="text-sm mt-0.5 leading-snug" style={{ color: 'var(--t-muted)' }}>
              {n.message}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {!n.isRead && (
              <div
                className="w-2 h-2 rounded-full flex-shrink-0 mt-1"
                style={{ background: 'var(--t-primary)' }}
              />
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(n._id); }}
              className="opacity-0 group-hover:opacity-100 p-1 rounded-lg transition-all duration-150 hover:bg-red-50 hover:text-red-500"
              style={{ color: 'var(--t-muted)' }}
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-1.5">
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{ background: cfg.bg, color: cfg.color }}
          >
            {cfg.label}
          </span>
          <span className="text-xs" style={{ color: 'var(--t-muted)' }}>
            {timeAgo(n.createdAt)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export default function Notifications() {
  const {
    notifications, unreadCount, loading,
    fetchNotifications, markRead, markAllRead, deleteNotification, clearAll,
  } = useNotifications();

  const [page,    setPage]    = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filter,  setFilter]  = useState('all'); // all | unread

  useEffect(() => {
    fetchNotifications(1).then((data) => {
      setHasMore((data?.notifications?.length ?? 0) === 20);
      setPage(1);
    });
  }, []);

  const loadMore = async () => {
    const next = page + 1;
    const data = await fetchNotifications(next);
    if ((data?.notifications?.length ?? 0) < 20) setHasMore(false);
    setPage(next);
  };

  const displayed = filter === 'unread'
    ? notifications.filter(n => !n.isRead)
    : notifications;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-2xl mx-auto pb-16">

      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Bell size={20} style={{ color: 'var(--t-primary)' }} />
            Notifications
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-white text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'var(--t-primary)' }}
              >
                {unreadCount}
              </motion.span>
            )}
          </h1>
          <p className="page-subtitle">Stay updated on bookings, orders & more</p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border transition-all duration-150"
              style={{
                borderColor: 'var(--t-primary)',
                color: 'var(--t-primary)',
                background: 'var(--t-nav-active-bg)',
              }}
            >
              <CheckCheck size={12} />
              Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={() => { if (window.confirm('Clear all notifications?')) clearAll(); }}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border transition-all duration-150 text-red-500 border-red-200 hover:bg-red-50"
            >
              <Trash2 size={12} />
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* ── Filter tabs ──────────────────────────────────── */}
      <div
        className="flex gap-1 p-1 rounded-xl mb-5"
        style={{ background: 'var(--t-surface)' }}
      >
        {[
          { key: 'all',    label: `All (${notifications.length})` },
          { key: 'unread', label: `Unread (${unreadCount})` },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className="flex-1 text-xs font-semibold py-2 px-3 rounded-lg transition-all duration-200"
            style={{
              background: filter === key ? 'var(--t-card)' : 'transparent',
              color:      filter === key ? 'var(--t-primary)' : 'var(--t-muted)',
              boxShadow:  filter === key ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── List ─────────────────────────────────────────── */}
      {loading && notifications.length === 0 ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-20 rounded-2xl" />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 rounded-3xl border"
          style={{ borderColor: 'var(--t-border)', background: 'var(--t-card)' }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'var(--t-nav-active-bg)' }}
          >
            <Inbox size={28} style={{ color: 'var(--t-muted)', opacity: 0.5 }} />
          </div>
          <p className="font-semibold text-sm" style={{ color: 'var(--t-text)' }}>
            {filter === 'unread' ? 'All caught up!' : 'No notifications yet'}
          </p>
          <p className="text-xs mt-1 text-center max-w-xs" style={{ color: 'var(--t-muted)' }}>
            {filter === 'unread'
              ? 'You have no unread notifications.'
              : 'Booking updates, order status, and more will appear here.'}
          </p>
        </motion.div>
      ) : (
        <motion.div layout className="space-y-2">
          <AnimatePresence mode="popLayout">
            {displayed.map((n) => (
              <NotificationItem
                key={n._id}
                n={n}
                onRead={markRead}
                onDelete={deleteNotification}
              />
            ))}
          </AnimatePresence>

          {hasMore && filter !== 'unread' && (
            <button
              onClick={loadMore}
              disabled={loading}
              className="w-full text-sm font-semibold py-3 rounded-2xl border transition-all duration-200"
              style={{
                borderColor: 'var(--t-border)',
                color: 'var(--t-primary)',
                background: 'var(--t-card)',
              }}
            >
              {loading ? 'Loading…' : 'Load more'}
            </button>
          )}
        </motion.div>
      )}
    </div>
  );
}
