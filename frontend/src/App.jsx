import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext';

import Navbar           from './components/layout/Navbar';
import Footer           from './components/layout/Footer';
import DashboardLayout  from './components/layout/DashboardLayout';

import Home             from './pages/Home';
import Login            from './pages/Login';
import Register         from './pages/Register';
import PoojaCategories  from './pages/PoojaCategories';
import PoojaList        from './pages/PoojaList';
import BookingFlow      from './pages/BookingFlow';
import PanditRegistration from './pages/PanditRegistration';
import PanditDashboard  from './pages/PanditDashboard';
import PanditStatus     from './pages/PanditStatus';
import AdminDashboard   from './pages/AdminDashboard';
import Profile          from './pages/Profile';
import Festivals        from './pages/Festivals';
import Marketplace      from './pages/Marketplace';
import BookingSuccess   from './pages/BookingSuccess';
import MyBookings       from './pages/MyBookings';
import TempleDirectory  from './pages/TempleDirectory';
import LivestreamsPage  from './pages/LivestreamsPage';
import AIAssistant      from './pages/AIAssistant';
import PanchangPage     from './pages/PanchangPage';
import PaymentCallback  from './pages/PaymentCallback';
import Notifications    from './pages/Notifications';
import UserDashboard    from './pages/UserDashboard';
import MyOrders         from './pages/MyOrders';

/* ── Auth guard ─────────────────────────────────────── */
const ProtectedRoute = ({ children, roles }) => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user?.role)) return <Navigate to="/" replace />;
  return children;
};

/* ── Public layout (Navbar + content + Footer) ───────── */
const PublicLayout = ({ children }) => (
  <div className="min-h-screen flex flex-col" style={{ background: 'var(--t-bg)' }}>
    <Navbar />
    <main className="flex-1">{children}</main>
    <Footer />
  </div>
);

/* ── Coming soon stub ────────────────────────────────── */
const ComingSoon = ({ title }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
    <div
      className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl mb-4"
      style={{ background: 'var(--t-nav-active-bg)' }}
    >
      🪔
    </div>
    <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--t-text)', fontFamily: "'Cormorant Garamond', serif" }}>
      {title}
    </h1>
    <p className="text-sm" style={{ color: 'var(--t-muted)' }}>
      This feature is coming soon. Stay tuned!
    </p>
  </div>
);

/* ── All routes ──────────────────────────────────────── */
const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <ThemeProvider user={user}>
      <NotificationProvider user={user}>
        <Routes>
          {/* Public pages */}
          <Route path="/"          element={<PublicLayout><Home /></PublicLayout>} />
          <Route path="/login"     element={<Login />} />
          <Route path="/register"  element={<Register />} />
          <Route path="/poojas"    element={<PublicLayout><PoojaCategories /></PublicLayout>} />
          <Route path="/poojas/:categorySlug" element={<PublicLayout><PoojaList /></PublicLayout>} />
          <Route path="/festivals"   element={<PublicLayout><Festivals /></PublicLayout>} />
          <Route path="/marketplace" element={<PublicLayout><Marketplace /></PublicLayout>} />
          <Route path="/temples"     element={<PublicLayout><TempleDirectory /></PublicLayout>} />
          <Route path="/temples/livestreams" element={<PublicLayout><ComingSoon title="Temple Livestreams" /></PublicLayout>} />
          <Route path="/temples/details"     element={<PublicLayout><ComingSoon title="Temple Details" /></PublicLayout>} />
          <Route path="/temples/location"    element={<PublicLayout><ComingSoon title="Temple Location" /></PublicLayout>} />
          <Route path="/temples/info"        element={<PublicLayout><ComingSoon title="Temple Information" /></PublicLayout>} />
          <Route path="/panchang" element={<PublicLayout><PanchangPage /></PublicLayout>} />

          {/* Booking flow (uses public layout) */}
          <Route path="/book/:poojaSlug" element={
            <ProtectedRoute><PublicLayout><BookingFlow /></PublicLayout></ProtectedRoute>
          } />
          <Route path="/booking-success" element={
            <ProtectedRoute><PublicLayout><BookingSuccess /></PublicLayout></ProtectedRoute>
          } />
          <Route path="/payment-callback/:merchantTransactionId" element={
            <ProtectedRoute><PaymentCallback /></ProtectedRoute>
          } />

          {/* User dashboard pages (sidebar layout) */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardLayout><UserDashboard /></DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/my-bookings" element={
            <ProtectedRoute>
              <DashboardLayout><MyBookings /></DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/my-orders" element={
            <ProtectedRoute>
              <DashboardLayout><MyOrders /></DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <DashboardLayout><Profile /></DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/livestreams" element={
            <ProtectedRoute>
              <DashboardLayout><LivestreamsPage /></DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/ai-assistant" element={
            <ProtectedRoute>
              <DashboardLayout><AIAssistant /></DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/notifications" element={
            <ProtectedRoute>
              <DashboardLayout><Notifications /></DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/family" element={
            <ProtectedRoute>
              <DashboardLayout><ComingSoon title="Family Members" /></DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/kundli" element={
            <ProtectedRoute>
              <DashboardLayout><ComingSoon title="Kundli" /></DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <DashboardLayout><ComingSoon title="Settings" /></DashboardLayout>
            </ProtectedRoute>
          } />

          {/* Pandit routes */}
          <Route path="/pandit/register" element={<Navigate to="/register" replace />} />
          <Route path="/pandit/dashboard" element={
            <ProtectedRoute roles={['pandit', 'admin']}>
              <DashboardLayout><PanditDashboard /></DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/pandit/status" element={
            <ProtectedRoute roles={['pandit']}>
              <DashboardLayout><PanditStatus /></DashboardLayout>
            </ProtectedRoute>
          } />

          {/* Admin routes */}
          <Route path="/admin" element={
            <ProtectedRoute roles={['admin']}>
              <DashboardLayout><AdminDashboard /></DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </NotificationProvider>
    </ThemeProvider>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: 'var(--t-card)',
              color: 'var(--t-text)',
              border: '1px solid var(--t-border)',
              borderRadius: '16px',
              fontSize: '14px',
              fontWeight: '500',
            },
          }}
        />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
