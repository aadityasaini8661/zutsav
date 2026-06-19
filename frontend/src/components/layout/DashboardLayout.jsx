import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Menu, Bell, Search } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useNotifications } from '../../context/NotificationContext';
import ThemeToggle from '../ui/ThemeSwitcher';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

function TopBar({ onMenuClick }) {
  const { unreadCount } = useNotifications();
  const location = useLocation();

  // Derive page title from path
  const getTitle = () => {
    const p = location.pathname;
    if (p === '/dashboard')            return 'Dashboard';
    if (p === '/my-bookings')          return 'My Bookings';
    if (p === '/my-orders')            return 'My Orders';
    if (p.startsWith('/poojas'))       return 'Poojas';
    if (p === '/marketplace')          return 'Marketplace';
    if (p === '/temples')              return 'Temples';
    if (p === '/festivals')            return 'Festivals';
    if (p === '/panchang')             return 'Panchang';
    if (p === '/ai-assistant')         return 'AI Assistant';
    if (p === '/notifications')        return 'Notifications';
    if (p === '/profile')              return 'Profile';
    if (p === '/settings')             return 'Settings';
    if (p === '/pandit/dashboard')     return 'Pandit Dashboard';
    if (p.startsWith('/pandit'))       return 'Pandit Portal';
    if (p === '/admin')                return 'Admin Dashboard';
    return 'Zutsav';
  };

  return (
    <header
      className="sticky top-0 z-30 flex items-center h-16 px-4 md:px-6 border-b flex-shrink-0"
      style={{
        background: 'var(--t-card)',
        borderColor: 'var(--t-border)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 -ml-1 rounded-xl mr-3 transition-colors"
        style={{ color: 'var(--t-muted)' }}
      >
        <Menu size={20} />
      </button>

      {/* Page title */}
      <h1
        className="text-base font-semibold flex-1 truncate"
        style={{ color: 'var(--t-text)' }}
      >
        {getTitle()}
      </h1>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <ThemeToggle />

        {/* Notifications */}
        <Link
          to="/notifications"
          className="relative p-2 rounded-xl transition-all duration-200"
          style={{ background: unreadCount > 0 ? 'var(--t-nav-active-bg)' : 'transparent' }}
        >
          <Bell
            size={18}
            style={{ color: unreadCount > 0 ? 'var(--t-primary)' : 'var(--t-muted)' }}
          />
          {unreadCount > 0 && (
            <span
              className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
              style={{ background: 'var(--t-primary)' }}
            />
          )}
        </Link>
      </div>
    </header>
  );
}

export default function DashboardLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: 'var(--t-bg)' }}
    >
      {/* Sidebar */}
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar onMenuClick={() => setMobileOpen(true)} />

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto">
          <motion.div
            key={location.pathname}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="min-h-full"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
