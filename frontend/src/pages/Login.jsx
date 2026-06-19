import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, AlertTriangle, RotateCcw, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';

export default function Login() {
  const { login, logout, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const [form, setForm] = useState({ emailOrPhone: '', password: '' });
  const [show, setShow]  = useState(false);
  const [errors, setErrors] = useState({});
  const [deletionData, setDeletionData] = useState(null); // set when account is deletion_pending
  const [restoring, setRestoring] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.emailOrPhone) e.emailOrPhone = 'Email or phone is required';
    if (!form.password)      e.password     = 'Password is required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    try {
      const data = await login(form.emailOrPhone, form.password);

      // Account is in the 30-day deletion grace period — show restore prompt
      if (data.deletionPending) {
        setDeletionData(data);
        return;
      }

      toast.success(`Welcome back, ${data.user.name}! 🙏`);
      if (data.user.role === 'admin')  return navigate('/admin', { replace: true });
      if (data.user.role === 'pandit') return navigate('/pandit/dashboard', { replace: true });
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    }
  };

  const handleRestoreAccount = async () => {
    setRestoring(true);
    try {
      await API.post('/auth/delete-account/cancel');
      toast.success('Account restored! Welcome back 🙏');
      setDeletionData(null);
      const data = deletionData;
      if (data.user.role === 'admin')  return navigate('/admin', { replace: true });
      if (data.user.role === 'pandit') return navigate('/pandit/dashboard', { replace: true });
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to restore account');
    } finally {
      setRestoring(false);
    }
  };

  const handleContinueLogout = () => {
    logout();
    setDeletionData(null);
    toast('You have been logged out.', { icon: '👋' });
  };

  return (
    <div className="min-h-screen bg-spiritual-light flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <span className="text-3xl">🪔</span>
            <span className="font-serif text-3xl font-bold text-maroon-600">Zutsav</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Welcome Back</h1>
          <p className="text-gray-500 mt-1 text-sm">Sign in to your spiritual journey</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 border border-saffron-100">
          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label className="label">Email or Phone Number</label>
              <input
                className={`input ${errors.emailOrPhone ? 'border-red-400' : ''}`}
                placeholder="Enter email or 10-digit mobile"
                value={form.emailOrPhone}
                onChange={(e) => { setForm({ ...form, emailOrPhone: e.target.value }); setErrors({ ...errors, emailOrPhone: '' }); }}
              />
              {errors.emailOrPhone && <p className="text-red-500 text-xs mt-1">{errors.emailOrPhone}</p>}
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  className={`input pr-10 ${errors.password ? 'border-red-400' : ''}`}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(e) => { setForm({ ...form, password: e.target.value }); setErrors({ ...errors, password: '' }); }}
                />
                <button type="button" onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
              {loading ? 'Signing in...' : 'Sign In 🙏'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-saffron-600 font-semibold hover:underline">Register here</Link>
          </p>
        </div>
      </div>

      {/* ── Deletion-pending restore modal ──────────────────────────── */}
      {deletionData && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm">
            <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center mb-4">
              <AlertTriangle size={22} className="text-amber-600" />
            </div>
            <h3 className="font-bold text-gray-800 text-lg mb-2">Account Scheduled for Deletion</h3>
            <p className="text-sm text-gray-500 mb-1">
              Welcome back, <strong>{deletionData.user.name}</strong>.
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Your account was scheduled for permanent deletion on{' '}
              <strong className="text-red-600">
                {deletionData.scheduledDeletionDate
                  ? new Date(deletionData.scheduledDeletionDate).toLocaleDateString('en-IN')
                  : '—'}
              </strong>.
              Would you like to restore your account?
            </p>
            <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-xs text-green-700 mb-5">
              Restoring will cancel the deletion request. No data was deleted.
            </div>
            <div className="flex gap-3">
              <button onClick={handleContinueLogout} disabled={restoring}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors">
                <LogOut size={14} /> Continue Logout
              </button>
              <button onClick={handleRestoreAccount} disabled={restoring}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 transition-colors">
                <RotateCcw size={14} /> {restoring ? 'Restoring…' : 'Restore Account'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
