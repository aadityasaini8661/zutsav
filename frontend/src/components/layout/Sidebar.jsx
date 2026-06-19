import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, CalendarDays, ShoppingBag, Flame, Store,
  Landmark, Calendar, Sun, Bot, Bell, User, Settings, LogOut,
  ChevronLeft, ChevronRight, Search, Star, Users, BarChart3,
  BookOpen, Menu, X, Shield, CreditCard, MessageSquare,
  Package, MapPin, Tv, Gift, Mail, ClipboardList,
  GraduationCap, Briefcase,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { ThemeSwatchRow } from '../ui/ThemeSwitcher';
import { useNotifications } from '../../context/NotificationContext';

/* ── Nav item configs per role ─────────────────────────── */
const USER_NAV = [
  { icon: LayoutDashboard, label: 'Dashboard',     path: '/dashboard' },
  { icon: CalendarDays,    label: 'My Bookings',   path: '/my-bookings' },
  { icon: ShoppingBag,     label: 'My Orders',     path: '/my-orders' },
  { icon: Flame,           label: 'Browse Poojas', path: '/poojas' },
  { icon: Store,           label: 'Marketplace',   path: '/marketplace' },
  { icon: Landmark,        label: 'Temples',       path: '/temples' },
  { icon: Calendar,        label: 'Festivals',     path: '/festivals' },
  { icon: Sun,             label: 'Panchang',      path: '/panchang' },
  { icon: Bot,             label: 'AI Assistant',  path: '/ai-assistant' },
  { icon: Bell,            label: 'Notifications', path: '/notifications', badge: true },
];

const PANDIT_NAV = [
  { icon: LayoutDashboard, label: 'Dashboard',        path: '/pandit/dashboard' },
  { icon: User,            label: 'My Profile',        path: '/pandit/dashboard?tab=profile' },
  { icon: BookOpen,        label: 'My Bookings',       path: '/pandit/dashboard?tab=bookings' },
  { icon: Calendar,        label: 'Availability',      path: '/pandit/dashboard?tab=availability' },
  { icon: CalendarDays,    label: 'Festival Calendar', path: '/pandit/dashboard?tab=festivals' },
  { icon: BarChart3,       label: 'Earnings',          path: '/pandit/dashboard?tab=earnings' },
  { icon: Bell,            label: 'Notifications',     path: '/notifications', badge: true },
  { icon: Settings,        label: 'Settings',          path: '/settings' },
];

const ADMIN_NAV = [
  { icon: LayoutDashboard, label: 'Dashboard',         path: '/admin' },
  { icon: BookOpen,        label: 'Bookings',          path: '/admin?tab=bookings' },
  { icon: Users,           label: 'Pandit Management', path: '/admin?tab=pandits' },
  { icon: Star,            label: 'Pandit Poojas',     path: '/admin?tab=pandit-poojas' },
  { icon: User,            label: 'User Management',   path: '/admin?tab=users' },
  { icon: ShoppingBag,     label: 'Pooja Catalogue',   path: '/admin?tab=poojas' },
  { icon: Package,         label: 'Marketplace',       path: '/admin?tab=marketplace' },
  { icon: ClipboardList,   label: 'Orders',            path: '/admin?tab=orders' },
  { icon: CalendarDays,    label: 'Festivals',            path: '/admin?tab=festivals' },
  { icon: GraduationCap,  label: 'Education Masters',    path: '/admin?tab=education-masters' },
  { icon: Briefcase,      label: 'Specializations',      path: '/admin?tab=specialization-masters' },
  { icon: MapPin,         label: 'Temple Directory',     path: '/admin?tab=temples' },
  { icon: Tv,              label: 'Livestreams',       path: '/admin?tab=livestreams' },
  { icon: Gift,            label: 'Referral Stats',    path: '/admin?tab=referrals' },
  { icon: Mail,            label: 'Communication',     path: '/admin?tab=comm-center' },
  { icon: Settings,        label: 'System Settings',   path: '/admin?tab=system-settings' },
  { icon: Bell,            label: 'Notifications',     path: '/notifications', badge: true },
  { icon: User,            label: 'My Profile',        path: '/admin?tab=profile' },
];

function getNavItems(role) {
  if (role === 'admin')  return ADMIN_NAV;
  if (role === 'pandit') return PANDIT_NAV;
  return USER_NAV;
}

function getRoleLabel(role) {
  if (role === 'admin')  return 'Administrator';
  if (role === 'pandit') return 'Spiritual Guide';
  return 'Devotee';
}

/* ── Determine if a nav item is active, supports ?tab= paths ── */
function computeIsActive(item, location) {
  const [basePath, queryStr] = item.path.split('?');
  const itemTab = queryStr ? new URLSearchParams(queryStr).get('tab') : null;
  const currentTab = new URLSearchParams(location.search).get('tab');

  if (basePath === '/dashboard') return location.pathname === '/dashboard';

  if (basePath === '/admin' || basePath === '/pandit/dashboard') {
    if (location.pathname !== basePath) return false;
    if (!itemTab) {
      // Dashboard item (no tab) — active when no tab or tab=dashboard/overview
      return !currentTab || currentTab === 'dashboard' || currentTab === 'overview';
    }
    return currentTab === itemTab;
  }

  if (basePath === '/') return false;
  return location.pathname.startsWith(basePath);
}

/* ── Single nav item ───────────────────────────────────── */
function NavItem({ item, collapsed, isActive, onClick }) {
  const { unreadCount } = useNotifications();
  const badgeCount = item.badge ? unreadCount : 0;

  return (
    <motion.div
      whileHover={{ x: collapsed ? 0 : 3 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    >
      <Link
        to={item.path}
        onClick={onClick}
        className={`nav-item ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-0' : ''}`}
        title={collapsed ? item.label : undefined}
      >
        {/* Active left bar */}
        {isActive && (
          <motion.div
            layoutId="nav-active-bar"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-r-full"
            style={{ background: 'var(--t-primary)' }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
        )}

        {/* Icon */}
        <div className="relative flex-shrink-0">
          <item.icon
            size={18}
            className={`transition-colors duration-200 ${isActive ? 'text-[var(--t-primary)]' : 'text-[var(--t-muted)]'}`}
          />
          {badgeCount > 0 && (
            <span
              className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-white text-[9px] font-bold flex items-center justify-center"
              style={{ background: 'var(--t-primary)' }}
            >
              {badgeCount > 9 ? '9+' : badgeCount}
            </span>
          )}
        </div>

        {/* Label */}
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              className="text-sm font-medium truncate"
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>
      </Link>
    </motion.div>
  );
}

/* ── Main Sidebar ──────────────────────────────────────── */
export default function Sidebar({ mobileOpen, onMobileClose }) {
  const { user, logout } = useAuth();
  const { currentTheme } = useTheme();
  const location  = useLocation();
  const navigate  = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch]       = useState('');
  const searchRef = useRef(null);

  const navItems   = getNavItems(user?.role);
  const roleLabel  = getRoleLabel(user?.role);
  const initials   = user?.name ? user.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() : 'Z';

  const filtered = search
    ? navItems.filter(i => i.label.toLowerCase().includes(search.toLowerCase()))
    : navItems;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  /* Collapsed sidebar doesn't show search */
  useEffect(() => {
    if (collapsed) setSearch('');
  }, [collapsed]);

  const sidebarContent = (
    <div
      className="flex flex-col h-full"
      style={{ background: 'var(--t-sidebar)' }}
    >
      {/* ── Header ──────────────────────────────────────── */}
      <div
        className="flex items-center px-4 h-16 flex-shrink-0 border-b"
        style={{ borderColor: 'var(--t-sidebar-border)' }}
      >
        <Link to="/" className={`flex items-center min-w-0 flex-1 ${collapsed ? 'justify-center' : ''}`}>
          <AnimatePresence>
            {collapsed ? (
              <motion.img
                key="collapsed-logo"
                src="https://zutsav.com/storage/settings/admin_logo_1778665731.png"
                alt="Zutsav"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="h-7 w-7 object-contain flex-shrink-0"
              />
            ) : (
              <motion.img
                key="expanded-logo"
                src="https://zutsav.com/storage/settings/admin_logo_1778665731.png"
                alt="Zutsav"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
                className="h-8 w-auto object-contain"
              />
            )}
          </AnimatePresence>
        </Link>

        {/* Collapse button */}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="hidden lg:flex w-6 h-6 rounded-lg items-center justify-center transition-colors flex-shrink-0"
          style={{ color: 'var(--t-muted)' }}
        >
          <motion.div animate={{ rotate: collapsed ? 0 : 180 }} transition={{ duration: 0.25 }}>
            <ChevronLeft size={14} />
          </motion.div>
        </button>
      </div>

      {/* ── Search ──────────────────────────────────────── */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-3 pt-3"
          >
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--t-muted)' }}
              />
              <input
                ref={searchRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search navigation…"
                className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border transition-all duration-200 focus:outline-none"
                style={{
                  background: 'var(--t-input-bg)',
                  color: 'var(--t-text)',
                  borderColor: 'var(--t-border)',
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Nav items ───────────────────────────────────── */}
      <nav className={`flex-1 overflow-y-auto py-3 ${collapsed ? 'px-2' : 'px-3'}`}>
        <div className="space-y-0.5">
          {!collapsed && (
            <p
              className="text-[10px] font-bold uppercase tracking-widest px-3 py-2"
              style={{ color: 'var(--t-muted)', opacity: 0.6 }}
            >
              Menu
            </p>
          )}
          {filtered.map(item => (
            <NavItem
              key={item.path + item.label}
              item={item}
              collapsed={collapsed}
              isActive={computeIsActive(item, location)}
              onClick={onMobileClose}
            />
          ))}
        </div>
      </nav>

      {/* ── Bottom section ──────────────────────────────── */}
      <div
        className="flex-shrink-0 border-t p-3 space-y-3"
        style={{ borderColor: 'var(--t-sidebar-border)' }}
      >
        {/* Theme switcher */}
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-1"
            >
              <p
                className="text-[10px] font-bold uppercase tracking-widest mb-2"
                style={{ color: 'var(--t-muted)', opacity: 0.6 }}
              >
                Theme
              </p>
              <ThemeSwatchRow />
            </motion.div>
          )}
        </AnimatePresence>

        {/* User profile */}
        <div
          className={`flex items-center gap-3 p-2 rounded-xl transition-colors duration-200 ${collapsed ? 'justify-center' : ''}`}
          style={{ background: 'var(--t-nav-active-bg)' }}
        >
          {/* Avatar */}
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ background: 'var(--t-primary)' }}
          >
            {initials}
          </div>

          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
                className="min-w-0 flex-1"
              >
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--t-text)' }}>
                  {user?.name || 'User'}
                </p>
                <p className="text-xs truncate" style={{ color: 'var(--t-muted)' }}>
                  {roleLabel}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div className={`flex gap-1 ${collapsed ? 'flex-col items-center' : ''}`}>
          {user?.role === 'user' && (
            <Link
              to="/profile"
              onClick={onMobileClose}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150 flex-1 justify-center"
              style={{ color: 'var(--t-muted)' }}
              title="Profile"
            >
              <User size={14} />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    Profile
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150 flex-1 justify-center"
            style={{ color: 'var(--t-muted)' }}
            title="Logout"
          >
            <LogOut size={14} />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  Logout
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────── */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 280 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="hidden lg:flex flex-col flex-shrink-0 h-screen sticky top-0 overflow-hidden shadow-sidebar"
        style={{
          background: 'var(--t-sidebar)',
          borderRight: '1px solid var(--t-sidebar-border)',
        }}
      >
        {sidebarContent}
      </motion.aside>

      {/* ── Mobile drawer ───────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 lg:hidden"
              style={{ background: 'var(--t-overlay)' }}
              onClick={onMobileClose}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-72 lg:hidden overflow-hidden"
              style={{
                background: 'var(--t-sidebar)',
                borderRight: '1px solid var(--t-sidebar-border)',
              }}
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
