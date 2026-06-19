import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu, X, User, LogOut, LayoutDashboard, BookOpen, ShoppingBag,
  Bell, Moon, Sparkles, Home, CalendarDays, MapPin, Tv,
  ChevronDown, Package, Users, Settings, Star, Flame,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import ThemeToggle from '../ui/ThemeSwitcher';

const PUBLIC_NAV = [
  { to: '/poojas',      label: 'Poojas'      },
  { to: '/festivals',   label: 'Festivals'   },
  { to: '/marketplace', label: 'Marketplace' },
  { to: '/temples',     label: 'Temples'     },
  { to: '/panchang',    label: 'Panchang'    },
];

const USER_NAV = [
  { to: '/',             label: 'Home',       icon: Home         },
  { to: '/poojas',       label: 'Poojas',     icon: Flame        },
  { to: '/festivals',    label: 'Festivals',  icon: CalendarDays },
  { to: '/panchang',     label: 'Panchang',   icon: Moon         },
  { to: '/marketplace',  label: 'Shop',       icon: ShoppingBag  },
  { to: '/ai-assistant', label: 'AI Guide',   icon: Sparkles     },
];

const TEMPLE_SUBMENU = [
  { to: '/temples',             label: 'Temple Directory'   },
  { to: '/temples/livestreams', label: 'Temple Livestreams' },
  { to: '/temples/details',     label: 'Temple Details'     },
  { to: '/temples/location',    label: 'Temple Location'    },
  { to: '/temples/info',        label: 'Temple Information' },
];

const PROFILE_MENU = [
  { to: '/profile',       label: 'My Profile',     icon: User      },
  { to: '/my-bookings',   label: 'My Bookings',    icon: BookOpen  },
  { to: '/my-orders',     label: 'My Orders',      icon: Package   },
  { to: '/family',        label: 'Family Members', icon: Users     },
  { to: '/kundli',        label: 'Kundli',         icon: Star      },
  { to: '/notifications', label: 'Notifications',  icon: Bell      },
  { to: '/settings',      label: 'Settings',       icon: Settings  },
];

function useClickOutside(ref, handler) {
  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) handler(); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [ref, handler]);
}

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [templeOpen,  setTempleOpen]  = useState(false);
  const [scrolled,    setScrolled]    = useState(false);

  const profileRef = useRef(null);
  const templeRef  = useRef(null);

  useClickOutside(profileRef, () => setProfileOpen(false));
  useClickOutside(templeRef,  () => setTempleOpen(false));

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const handleLogout = () => {
    logout(); navigate('/');
    setProfileOpen(false); setMobileOpen(false);
  };

  const isActive = (path) =>
    path === '/'
      ? location.pathname === '/'
      : location.pathname === path || location.pathname.startsWith(path + '/');

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'Z';

  return (
    <>
      <nav
        className="sticky top-0 z-50 transition-all duration-300"
        style={{
          background: scrolled
            ? 'rgba(var(--t-card, 255,255,255), 0.95)'
            : 'rgba(var(--t-card, 255,255,255), 0.80)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderBottom: `1px solid var(--t-border)`,
          boxShadow: scrolled ? '0 4px 24px rgba(0,0,0,0.06)' : 'none',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`flex items-center justify-between gap-4 transition-all duration-300 ${scrolled ? 'h-14' : 'h-16'}`}>

            {/* ── Logo ─────────────────────────────────────────── */}
            <Link to="/" className="flex items-center shrink-0 group">
              <img
                src="https://zutsav.com/storage/settings/admin_logo_1778665731.png"
                alt="Zutsav"
                className="h-9 w-auto object-contain group-hover:opacity-90 transition-opacity duration-200"
              />
            </Link>

            {/* ── Desktop navigation ───────────────────────────── */}
            <div className="hidden lg:flex items-center gap-0.5 flex-1 justify-center">
              {isAuthenticated ? (
                <>
                  {USER_NAV.map((l) => (
                    <Link
                      key={l.to}
                      to={l.to}
                      className="relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200"
                      style={{
                        color: isActive(l.to) ? 'var(--t-primary)' : 'var(--t-muted)',
                        background: isActive(l.to) ? 'var(--t-nav-active-bg)' : 'transparent',
                      }}
                    >
                      {l.label}
                    </Link>
                  ))}

                  {/* Temples dropdown */}
                  <div className="relative" ref={templeRef}>
                    <button
                      onClick={() => setTempleOpen(!templeOpen)}
                      className="flex items-center gap-1 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200"
                      style={{
                        color: location.pathname.startsWith('/temples') ? 'var(--t-primary)' : 'var(--t-muted)',
                        background: location.pathname.startsWith('/temples') ? 'var(--t-nav-active-bg)' : 'transparent',
                      }}
                    >
                      Temples
                      <motion.div animate={{ rotate: templeOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronDown size={13} />
                      </motion.div>
                    </button>

                    <AnimatePresence>
                      {templeOpen && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -4 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -4 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                          className="absolute top-full left-0 mt-2 w-52 rounded-2xl shadow-float py-2 z-50"
                          style={{ background: 'var(--t-card)', border: '1px solid var(--t-border)' }}
                        >
                          {TEMPLE_SUBMENU.map((item) => (
                            <Link
                              key={item.to}
                              to={item.to}
                              onClick={() => setTempleOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors duration-150"
                              style={{ color: 'var(--t-muted)' }}
                              onMouseEnter={e => e.currentTarget.style.background = 'var(--t-nav-active-bg)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                              <MapPin size={12} style={{ color: 'var(--t-primary)' }} className="shrink-0" />
                              {item.label}
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                PUBLIC_NAV.map((l) => (
                  <Link
                    key={l.to}
                    to={l.to}
                    className="relative px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200"
                    style={{
                      color: isActive(l.to) ? 'var(--t-primary)' : 'var(--t-muted)',
                      background: isActive(l.to) ? 'var(--t-nav-active-bg)' : 'transparent',
                    }}
                  >
                    {l.label}
                  </Link>
                ))
              )}
            </div>

            {/* ── Desktop right area ───────────────────────────── */}
            <div className="hidden lg:flex items-center gap-2 shrink-0">
              {/* Theme toggle */}
              <ThemeToggle />

              {isAuthenticated ? (
                <>
                  {/* Notification bell */}
                  <Link
                    to="/notifications"
                    className="relative p-2 rounded-xl transition-all duration-200"
                    style={{ color: 'var(--t-muted)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--t-nav-active-bg)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <Bell size={18} />
                    {unreadCount > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1"
                        style={{ background: 'var(--t-primary)' }}
                      >
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </motion.span>
                    )}
                  </Link>

                  {/* Profile dropdown */}
                  <div className="relative" ref={profileRef}>
                    <button
                      onClick={() => setProfileOpen(!profileOpen)}
                      className="flex items-center gap-2.5 pl-2.5 pr-3 py-1.5 rounded-xl border transition-all duration-200"
                      style={{
                        borderColor: profileOpen ? 'var(--t-primary)' : 'var(--t-border)',
                        background: 'var(--t-card)',
                        boxShadow: profileOpen ? '0 0 0 3px var(--t-ring)' : 'none',
                      }}
                    >
                      {user?.profilePhoto ? (
                        <img
                          src={`http://localhost:5000/${user.profilePhoto}`}
                          alt="avatar"
                          className="w-7 h-7 rounded-lg object-cover shrink-0"
                        />
                      ) : (
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                          style={{ background: 'var(--t-primary)' }}
                        >
                          {initials}
                        </div>
                      )}
                      <span className="text-sm font-medium max-w-[80px] truncate" style={{ color: 'var(--t-text)' }}>
                        {user?.name?.split(' ')[0]}
                      </span>
                      <motion.div animate={{ rotate: profileOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronDown size={13} style={{ color: 'var(--t-muted)' }} />
                      </motion.div>
                    </button>

                    <AnimatePresence>
                      {profileOpen && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.96, y: -6 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.96, y: -6 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                          className="absolute right-0 mt-2 w-64 rounded-2xl shadow-float py-2 z-50 overflow-hidden"
                          style={{ background: 'var(--t-card)', border: '1px solid var(--t-border)' }}
                        >
                          {/* Profile header */}
                          <div
                            className="px-4 py-3 mb-1 border-b"
                            style={{
                              background: 'var(--t-nav-active-bg)',
                              borderColor: 'var(--t-border)',
                            }}
                          >
                            <div className="flex items-center gap-3">
                              {user?.profilePhoto ? (
                                <img
                                  src={`http://localhost:5000/${user.profilePhoto}`}
                                  alt="avatar"
                                  className="w-10 h-10 rounded-xl object-cover shrink-0"
                                />
                              ) : (
                                <div
                                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shrink-0"
                                  style={{ background: 'var(--t-primary)' }}
                                >
                                  {initials}
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-semibold text-sm truncate" style={{ color: 'var(--t-text)' }}>{user?.name}</p>
                                <p className="text-xs capitalize font-medium" style={{ color: 'var(--t-primary)' }}>{user?.role}</p>
                              </div>
                            </div>
                          </div>

                          {/* Dashboard link */}
                          {user?.role === 'pandit' && (
                            <Link
                              to="/pandit/dashboard"
                              onClick={() => setProfileOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-150"
                              style={{ color: 'var(--t-muted)' }}
                              onMouseEnter={e => e.currentTarget.style.background = 'var(--t-nav-active-bg)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                              <LayoutDashboard size={14} style={{ color: 'var(--t-primary)' }} />
                              Pandit Dashboard
                            </Link>
                          )}
                          {user?.role === 'admin' && (
                            <Link
                              to="/admin"
                              onClick={() => setProfileOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-150"
                              style={{ color: 'var(--t-muted)' }}
                              onMouseEnter={e => e.currentTarget.style.background = 'var(--t-nav-active-bg)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                              <LayoutDashboard size={14} style={{ color: 'var(--t-primary)' }} />
                              Admin Panel
                            </Link>
                          )}

                          {PROFILE_MENU.map(({ to, label, icon: Icon }) => (
                            <Link
                              key={to}
                              to={to}
                              onClick={() => setProfileOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-150"
                              style={{ color: 'var(--t-muted)' }}
                              onMouseEnter={e => e.currentTarget.style.background = 'var(--t-nav-active-bg)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                              <Icon size={14} style={{ color: 'var(--t-muted)', opacity: 0.7 }} className="shrink-0" />
                              <span className="flex-1" style={{ color: 'var(--t-text)' }}>{label}</span>
                              {to === '/notifications' && unreadCount > 0 && (
                                <span
                                  className="text-white text-[9px] font-bold min-w-[16px] h-4 rounded-full flex items-center justify-center px-1"
                                  style={{ background: 'var(--t-primary)' }}
                                >
                                  {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                              )}
                            </Link>
                          ))}

                          <div className="border-t mt-1 pt-1" style={{ borderColor: 'var(--t-border)' }}>
                            <button
                              onClick={handleLogout}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors duration-150"
                            >
                              <LogOut size={14} /> Sign Out
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn-ghost text-sm">Login</Link>
                  <Link to="/register" className="btn-primary text-sm">Get Started</Link>
                </>
              )}
            </div>

            {/* ── Mobile hamburger ─────────────────────────────── */}
            <button
              className="lg:hidden p-2 rounded-xl transition-colors duration-200 shrink-0"
              style={{ color: 'var(--t-muted)' }}
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* ── Mobile drawer ───────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-40"
              style={{ background: 'var(--t-overlay)' }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="lg:hidden fixed top-0 left-0 h-full w-72 z-50 flex flex-col overflow-hidden"
              style={{ background: 'var(--t-sidebar)', borderRight: '1px solid var(--t-sidebar-border)' }}
            >
              {/* Drawer header */}
              <div
                className="flex items-center justify-between px-5 h-16 border-b flex-shrink-0"
                style={{ borderColor: 'var(--t-sidebar-border)' }}
              >
                <Link to="/" className="flex items-center">
                  <img
                    src="https://zutsav.com/storage/settings/admin_logo_1778665731.png"
                    alt="Zutsav"
                    className="h-9 w-auto object-contain"
                  />
                </Link>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-1.5 rounded-xl transition-colors"
                  style={{ color: 'var(--t-muted)' }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Drawer body */}
              <div className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
                {isAuthenticated ? (
                  <>
                    {/* User info */}
                    <div
                      className="flex items-center gap-3 px-3 py-3 rounded-2xl mb-4"
                      style={{ background: 'var(--t-nav-active-bg)' }}
                    >
                      {user?.profilePhoto ? (
                        <img src={`http://localhost:5000/${user.profilePhoto}`} alt="avatar"
                          className="w-10 h-10 rounded-xl object-cover shrink-0" />
                      ) : (
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shrink-0"
                          style={{ background: 'var(--t-primary)' }}
                        >
                          {initials}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate" style={{ color: 'var(--t-text)' }}>{user?.name}</p>
                        <p className="text-xs capitalize font-medium" style={{ color: 'var(--t-primary)' }}>{user?.role}</p>
                      </div>
                    </div>

                    <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--t-muted)', opacity: 0.6 }}>Navigation</p>

                    {USER_NAV.map(({ to, label, icon: Icon }) => (
                      <Link
                        key={to}
                        to={to}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors duration-150"
                        style={{
                          color: isActive(to) ? 'var(--t-primary)' : 'var(--t-muted)',
                          background: isActive(to) ? 'var(--t-nav-active-bg)' : 'transparent',
                        }}
                      >
                        <Icon size={16} style={{ color: isActive(to) ? 'var(--t-primary)' : 'var(--t-muted)' }} />
                        {label}
                      </Link>
                    ))}

                    {user?.role === 'pandit' && (
                      <Link
                        to="/pandit/dashboard"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors"
                        style={{ color: 'var(--t-muted)' }}
                      >
                        <LayoutDashboard size={16} /> Pandit Dashboard
                      </Link>
                    )}
                    {user?.role === 'admin' && (
                      <Link
                        to="/admin"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors"
                        style={{ color: 'var(--t-muted)' }}
                      >
                        <LayoutDashboard size={16} /> Admin Panel
                      </Link>
                    )}

                    <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest mt-2" style={{ color: 'var(--t-muted)', opacity: 0.6 }}>Account</p>

                    {PROFILE_MENU.map(({ to, label, icon: Icon }) => (
                      <Link
                        key={to}
                        to={to}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors duration-150"
                        style={{ color: 'var(--t-muted)' }}
                      >
                        <Icon size={16} style={{ color: 'var(--t-muted)', opacity: 0.7 }} />
                        <span className="flex-1" style={{ color: 'var(--t-text)' }}>{label}</span>
                        {to === '/notifications' && unreadCount > 0 && (
                          <span
                            className="text-white text-[9px] font-bold min-w-[16px] h-4 rounded-full flex items-center justify-center px-1"
                            style={{ background: 'var(--t-primary)' }}
                          >
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </span>
                        )}
                      </Link>
                    ))}
                  </>
                ) : (
                  <>
                    <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--t-muted)', opacity: 0.6 }}>Menu</p>
                    {PUBLIC_NAV.map(({ to, label }) => (
                      <Link
                        key={to}
                        to={to}
                        className="block px-4 py-3 rounded-xl text-sm font-medium transition-colors"
                        style={{
                          color: isActive(to) ? 'var(--t-primary)' : 'var(--t-text)',
                          background: isActive(to) ? 'var(--t-nav-active-bg)' : 'transparent',
                        }}
                      >
                        {label}
                      </Link>
                    ))}
                  </>
                )}
              </div>

              {/* Drawer footer */}
              <div
                className="border-t p-4 flex-shrink-0"
                style={{ borderColor: 'var(--t-sidebar-border)' }}
              >
                {isAuthenticated ? (
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-colors font-medium"
                  >
                    <LogOut size={16} /> Sign Out
                  </button>
                ) : (
                  <div className="flex gap-2.5">
                    <Link to="/login"    className="flex-1 btn-secondary text-center text-sm py-2.5">Login</Link>
                    <Link to="/register" className="flex-1 btn-primary text-center text-sm py-2.5">Get Started</Link>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
