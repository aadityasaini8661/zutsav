import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CalendarDays, ShoppingBag, Flame, Bot, Bell, Star,
  ArrowRight, TrendingUp, Clock, MapPin, Sun, Moon,
  Sparkles, BookOpen, ChevronRight, Package, Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';
import API from '../api/axios';

/* ── Animation variants ─────────────────────────────── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.45, delay, ease: 'easeOut' } },
});

const stagger = {
  animate: { transition: { staggerChildren: 0.07 } },
};

/* ── Greeting based on time ─────────────────────────── */
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

/* ── Quick action card ──────────────────────────────── */
function QuickAction({ icon: Icon, label, sub, to, color }) {
  return (
    <motion.div variants={fadeUp()}>
      <Link
        to={to}
        className="flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200 group"
        style={{ background: 'var(--t-card)', borderColor: 'var(--t-border)' }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'var(--t-primary)';
          e.currentTarget.style.boxShadow = '0 4px 20px var(--t-glow)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'var(--t-border)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}15`, color }}
        >
          <Icon size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold" style={{ color: 'var(--t-text)' }}>{label}</p>
          <p className="text-xs" style={{ color: 'var(--t-muted)' }}>{sub}</p>
        </div>
        <ChevronRight
          size={16}
          className="flex-shrink-0 group-hover:translate-x-1 transition-transform duration-200"
          style={{ color: 'var(--t-muted)' }}
        />
      </Link>
    </motion.div>
  );
}

/* ── Booking card ───────────────────────────────────── */
function BookingCard({ booking }) {
  const statusColors = {
    pending:   { bg: '#FEF3C7', text: '#92400E' },
    confirmed: { bg: '#D1FAE5', text: '#065F46' },
    completed: { bg: '#EDE9FE', text: '#4C1D95' },
    cancelled: { bg: '#FEE2E2', text: '#991B1B' },
  };
  const sc = statusColors[booking.status] || statusColors.pending;

  return (
    <motion.div
      variants={fadeUp()}
      className="flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200"
      style={{ background: 'var(--t-card)', borderColor: 'var(--t-border)' }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
        style={{ background: 'var(--t-nav-active-bg)' }}
      >
        🪔
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: 'var(--t-text)' }}>
          {booking.pooja?.name || 'Pooja'}
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--t-muted)' }}>
          {booking.pandit?.name || 'Pandit TBD'}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <span
          className="text-xs font-semibold px-2.5 py-1 rounded-full"
          style={{ background: sc.bg, color: sc.text }}
        >
          {booking.status}
        </span>
        <p className="text-xs mt-1" style={{ color: 'var(--t-muted)' }}>
          {booking.scheduledDate
            ? new Date(booking.scheduledDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
            : 'TBD'}
        </p>
      </div>
    </motion.div>
  );
}

/* ── Stat chip ──────────────────────────────────────── */
function StatChip({ label, value, icon: Icon }) {
  return (
    <div
      className="flex items-center gap-3 p-4 rounded-2xl"
      style={{ background: 'var(--t-card)', border: '1px solid var(--t-border)' }}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: 'var(--t-nav-active-bg)' }}
      >
        <Icon size={16} style={{ color: 'var(--t-primary)' }} />
      </div>
      <div>
        <p className="text-lg font-bold" style={{ color: 'var(--t-text)' }}>{value}</p>
        <p className="text-xs" style={{ color: 'var(--t-muted)' }}>{label}</p>
      </div>
    </div>
  );
}

/* ── Daily Insight Card (WOW Section) ───────────────── */
function DailyInsightCard({ panchang, loading }) {
  return (
    <motion.div
      variants={fadeUp(0.1)}
      className="relative overflow-hidden rounded-3xl p-6 md:p-8"
      style={{
        background: 'linear-gradient(135deg, var(--t-primary) 0%, var(--t-primary-dark) 60%, var(--t-accent, #8B1A1A) 100%)',
      }}
    >
      {/* Sacred geometry decoration */}
      <div className="absolute -right-8 -top-8 w-48 h-48 opacity-10">
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="100" cy="100" r="90" stroke="white" strokeWidth="1"/>
          <circle cx="100" cy="100" r="60" stroke="white" strokeWidth="1"/>
          <circle cx="100" cy="100" r="30" stroke="white" strokeWidth="1"/>
          <line x1="10" y1="100" x2="190" y2="100" stroke="white" strokeWidth="0.5"/>
          <line x1="100" y1="10" x2="100" y2="190" stroke="white" strokeWidth="0.5"/>
          <line x1="27" y1="27" x2="173" y2="173" stroke="white" strokeWidth="0.5"/>
          <line x1="173" y1="27" x2="27" y2="173" stroke="white" strokeWidth="0.5"/>
        </svg>
      </div>
      <div className="absolute -left-4 -bottom-4 w-32 h-32 opacity-5">
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <polygon points="50,5 95,25 95,75 50,95 5,75 5,25" stroke="white" strokeWidth="1" fill="none"/>
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            <Sun size={12} className="text-white" />
          </div>
          <span className="text-white/80 text-xs font-bold uppercase tracking-widest">
            Daily Spiritual Insight
          </span>
        </div>

        <h2 className="text-white font-bold text-xl md:text-2xl mb-1" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          {loading ? 'Loading today\'s panchang…' : (panchang?.yoga ? `${panchang.yoga} Yoga` : 'Auspicious Day')}
        </h2>
        <p className="text-white/70 text-sm mb-6">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Tithi',     value: panchang?.tithi     || 'Data Not Available', icon: '📿' },
            { label: 'Nakshatra', value: panchang?.nakshatra  || 'Data Not Available', icon: '⭐' },
            { label: 'Moon Phase',value: panchang?.moonPhase  || 'Data Not Available', icon: '🌙' },
            { label: 'Auspicious',value: panchang?.muhurta    || 'Data Not Available', icon: '🪔' },
          ].map(({ label, value, icon }) => (
            <div key={label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-3">
              <p className="text-white/60 text-[10px] uppercase tracking-wider mb-1">{label}</p>
              <p className="text-white font-semibold text-sm leading-tight">
                {icon} {typeof value === 'string' ? value : 'Data Not Available'}
              </p>
            </div>
          ))}
        </div>

        {panchang?.recommendation && (
          <div className="mt-4 bg-white/10 rounded-2xl p-3">
            <p className="text-white/80 text-xs leading-relaxed">
              <Sparkles size={10} className="inline mr-1" />
              {panchang.recommendation}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ── Main Dashboard ─────────────────────────────────── */
export default function UserDashboard() {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const { currentTheme } = useTheme();

  const [bookings,  setBookings]  = useState([]);
  const [orders,    setOrders]    = useState([]);
  const [panchang,  setPanchang]  = useState(null);
  const [festivals, setFestivals] = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [bRes, oRes, pRes, fRes] = await Promise.allSettled([
          API.get('/bookings/my?limit=3'),
          API.get('/orders/my?limit=3'),
          API.get('/panchang'),
          API.get('/festivals?limit=4&upcoming=true'),
        ]);
        if (bRes.status === 'fulfilled') setBookings(bRes.value.data?.bookings || bRes.value.data || []);
        if (oRes.status === 'fulfilled') setOrders(oRes.value.data?.orders   || oRes.value.data || []);
        if (pRes.status === 'fulfilled') setPanchang(pRes.value.data?.panchang || null);
        if (fRes.status === 'fulfilled') setFestivals(fRes.value.data?.festivals || fRes.value.data || []);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const greeting = getGreeting();
  const firstName = user?.name?.split(' ')[0] || 'Devotee';
  const primaryColor = 'var(--t-primary)';

  const QUICK_ACTIONS = [
    { icon: Flame,      label: 'Book a Pooja',    sub: 'Find pandits & schedule', to: '/poojas',       color: '#D4602A' },
    { icon: ShoppingBag,label: 'Marketplace',     sub: 'Sacred items & samagri',  to: '/marketplace',  color: '#059669' },
    { icon: Bot,        label: 'AI Spiritual Guide', sub: 'Ask divine questions',  to: '/ai-assistant', color: '#8B5CF6' },
    { icon: CalendarDays,label:'Festivals',        sub: 'Upcoming celebrations',   to: '/festivals',    color: '#D4AF37' },
    { icon: Sun,        label: 'Panchang',         sub: 'Daily auspicious times',  to: '/panchang',     color: '#0EA5E9' },
    { icon: MapPin,     label: 'Temples',          sub: 'Find nearby temples',     to: '/temples',      color: '#EC4899' },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto space-y-8 pb-16">

      {/* ── Welcome section ──────────────────────────────── */}
      <motion.div
        variants={stagger}
        initial="initial"
        animate="animate"
        className="space-y-6"
      >
        {/* Greeting */}
        <motion.div variants={fadeUp()} className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--t-muted)' }}>
              {greeting}
            </p>
            <h1
              className="text-2xl md:text-3xl font-bold tracking-tight"
              style={{ color: 'var(--t-text)', fontFamily: "'Cormorant Garamond', serif" }}
            >
              Welcome back, {firstName} 🙏
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--t-muted)' }}>
              Your spiritual journey continues today.
            </p>
          </div>

          {/* Unread badge */}
          {unreadCount > 0 && (
            <Link
              to="/notifications"
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-white text-sm font-semibold flex-shrink-0 shadow-sm hover:shadow-md transition-all duration-200"
              style={{ background: 'var(--t-primary)' }}
            >
              <Bell size={14} />
              {unreadCount} new
            </Link>
          )}
        </motion.div>

        {/* Stats row */}
        <motion.div variants={stagger} className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total Bookings', value: bookings.length || '—', icon: CalendarDays },
            { label: 'Orders Placed',  value: orders.length   || '—', icon: Package      },
            { label: 'Notifications',  value: unreadCount,              icon: Bell         },
            { label: 'Days Active',    value: '∞',                      icon: Star         },
          ].map((s) => (
            <motion.div key={s.label} variants={fadeUp()}>
              <StatChip {...s} />
            </motion.div>
          ))}
        </motion.div>

        {/* Daily Spiritual Insight */}
        <DailyInsightCard panchang={panchang} loading={loading} />
      </motion.div>

      {/* ── Main grid ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left column — Bookings + Orders */}
        <div className="lg:col-span-2 space-y-6">

          {/* Upcoming Bookings */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold" style={{ color: 'var(--t-text)' }}>
                  Upcoming Bookings
                </h2>
                <p className="text-xs" style={{ color: 'var(--t-muted)' }}>Your scheduled poojas</p>
              </div>
              <Link
                to="/my-bookings"
                className="flex items-center gap-1 text-xs font-semibold transition-colors"
                style={{ color: 'var(--t-primary)' }}
              >
                View all <ArrowRight size={12} />
              </Link>
            </div>

            <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-3">
              {loading ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="skeleton h-20 rounded-2xl" />
                ))
              ) : bookings.length > 0 ? (
                bookings.slice(0, 3).map((b) => (
                  <BookingCard key={b._id} booking={b} />
                ))
              ) : (
                <motion.div
                  variants={fadeUp()}
                  className="flex flex-col items-center justify-center py-10 rounded-2xl border border-dashed"
                  style={{ borderColor: 'var(--t-border)', background: 'var(--t-surface)' }}
                >
                  <Flame size={28} className="mb-3" style={{ color: 'var(--t-muted)', opacity: 0.4 }} />
                  <p className="text-sm font-medium" style={{ color: 'var(--t-muted)' }}>No bookings yet</p>
                  <Link
                    to="/poojas"
                    className="mt-3 text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
                    style={{ background: 'var(--t-nav-active-bg)', color: 'var(--t-primary)' }}
                  >
                    Book a Pooja
                  </Link>
                </motion.div>
              )}
            </motion.div>
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="text-base font-bold mb-4" style={{ color: 'var(--t-text)' }}>
              Quick Actions
            </h2>
            <motion.div
              variants={stagger}
              initial="initial"
              animate="animate"
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            >
              {QUICK_ACTIONS.map((qa) => (
                <QuickAction key={qa.to} {...qa} />
              ))}
            </motion.div>
          </div>
        </div>

        {/* Right column — Orders + Festivals */}
        <div className="space-y-6">

          {/* Recent Orders */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold" style={{ color: 'var(--t-text)' }}>Recent Orders</h2>
              <Link
                to="/my-orders"
                className="text-xs font-semibold"
                style={{ color: 'var(--t-primary)' }}
              >
                View all
              </Link>
            </div>

            <div className="space-y-3">
              {loading ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="skeleton h-16 rounded-2xl" />
                ))
              ) : orders.length > 0 ? (
                orders.slice(0, 3).map((o, i) => (
                  <motion.div
                    key={o._id || i}
                    variants={fadeUp(i * 0.05)}
                    initial="initial"
                    animate="animate"
                    className="flex items-center gap-3 p-3 rounded-2xl border"
                    style={{ background: 'var(--t-card)', borderColor: 'var(--t-border)' }}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'var(--t-nav-active-bg)' }}
                    >
                      <Package size={14} style={{ color: 'var(--t-primary)' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--t-text)' }}>
                        {o.items?.[0]?.name || 'Order'}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--t-muted)' }}>
                        ₹{o.total || o.amount || '—'}
                      </p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div
                  className="text-center py-8 rounded-2xl border border-dashed"
                  style={{ borderColor: 'var(--t-border)', background: 'var(--t-surface)' }}
                >
                  <ShoppingBag size={24} className="mx-auto mb-2" style={{ color: 'var(--t-muted)', opacity: 0.4 }} />
                  <p className="text-xs" style={{ color: 'var(--t-muted)' }}>No orders yet</p>
                  <Link
                    to="/marketplace"
                    className="mt-2 inline-block text-xs font-semibold"
                    style={{ color: 'var(--t-primary)' }}
                  >
                    Explore Marketplace →
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Festivals */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold" style={{ color: 'var(--t-text)' }}>Upcoming Festivals</h2>
              <Link to="/festivals" className="text-xs font-semibold" style={{ color: 'var(--t-primary)' }}>
                View all
              </Link>
            </div>

            <div className="space-y-2">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="skeleton h-14 rounded-2xl" />
                ))
              ) : festivals.length > 0 ? (
                festivals.slice(0, 4).map((f, i) => (
                  <motion.div
                    key={f._id || i}
                    variants={fadeUp(i * 0.05)}
                    initial="initial"
                    animate="animate"
                    className="flex items-center gap-3 p-3 rounded-2xl transition-all duration-200"
                    style={{ background: 'var(--t-card)', border: '1px solid var(--t-border)' }}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                      style={{ background: 'var(--t-nav-active-bg)' }}
                    >
                      {f.emoji || '🎉'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--t-text)' }}>
                        {f.name}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--t-muted)' }}>
                        {f.date
                          ? new Date(f.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                          : f.tithiDate || f.tithi || 'Upcoming'}
                      </p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div
                  className="text-center py-8 rounded-2xl border border-dashed"
                  style={{ borderColor: 'var(--t-border)', background: 'var(--t-surface)' }}
                >
                  <CalendarDays size={24} className="mx-auto mb-2" style={{ color: 'var(--t-muted)', opacity: 0.4 }} />
                  <p className="text-xs" style={{ color: 'var(--t-muted)' }}>No upcoming festivals</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
