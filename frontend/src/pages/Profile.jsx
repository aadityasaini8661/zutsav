import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Save, Trash2, Mail, MessageSquare, AlertTriangle, CheckCircle, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import ProfilePhoto from '../components/shared/ProfilePhoto';
import PincodeInput from '../components/shared/PincodeInput';
import API from '../api/axios';

// ── Account Deletion Modal ─────────────────────────────────────────────────
function DeleteAccountModal({ onClose, onDeleted }) {
  // step: 'warning' | 'password' | 'otp_channel' | 'otp_verify' | 'confirm' | 'done'
  const [step,         setStep]         = useState('warning');
  const [password,     setPassword]     = useState('');
  const [showPw,       setShowPw]       = useState(false);
  const [channel,      setChannel]      = useState(''); // 'email' | 'whatsapp'
  const [otp,          setOtp]          = useState('');
  const [otpId,        setOtpId]        = useState('');   // identifier used for OTP
  const [loading,      setLoading]      = useState(false);
  const [scheduledDate, setScheduledDate] = useState(null);
  const timerRef = useRef(null);

  const { user, logout } = useAuth();

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const verifyPassword = async () => {
    if (!password) { toast.error('Enter your password'); return; }
    setLoading(true);
    try {
      await API.post('/auth/delete-account/check-password', { password });
      setStep('otp_channel');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password verification failed');
    } finally { setLoading(false); }
  };

  const sendOTP = async () => {
    setLoading(true);
    try {
      await API.post('/auth/delete-account/send-otp', { channel });
      const id = channel === 'email' ? user.email : user.phone;
      setOtpId(id);
      setStep('otp_verify');
      toast.success(`Code sent to your ${channel === 'email' ? 'email' : 'WhatsApp'}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally { setLoading(false); }
  };

  const verifyOTP = async () => {
    if (!otp || otp.length !== 6) { toast.error('Enter the 6-digit code'); return; }
    setLoading(true);
    try {
      await API.post('/auth/verify-otp', { identifier: otpId, otp, purpose: 'account_deletion' });
      setStep('confirm');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid code');
    } finally { setLoading(false); }
  };

  const confirmDeletion = async () => {
    setLoading(true);
    try {
      const { data } = await API.post('/auth/delete-account/confirm', { channel });
      setScheduledDate(data.scheduledDeletionDate);
      setStep('done');
      timerRef.current = setTimeout(() => {
        logout();
        onDeleted();
      }, 4000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to schedule deletion');
    } finally { setLoading(false); }
  };

  const STEPS = { warning: 1, password: 2, otp_channel: 3, otp_verify: 3, confirm: 4, done: 5 };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4 py-8 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md my-auto">

        {/* Header */}
        {step !== 'done' && (
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center">
                <Trash2 size={16} className="text-red-600" />
              </div>
              <div>
                <p className="font-bold text-gray-800 text-sm">Delete My Account</p>
                <p className="text-[10px] text-gray-400">Step {STEPS[step]} of 4</p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-light">&times;</button>
          </div>
        )}

        <div className="p-6">

          {/* ── Step 1: Warning ──────────────────── */}
          {step === 'warning' && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex gap-3">
                <AlertTriangle size={20} className="text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-700 mb-1">Before you continue</p>
                  <p className="text-xs text-red-600 leading-relaxed">
                    Deleting your account will remove access to bookings, order history, profile information,
                    saved addresses, and associated services.
                  </p>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                <p className="text-xs text-amber-700 leading-relaxed">
                  <strong>30-day recovery window:</strong> Your account will not be deleted immediately.
                  If you sign in within 30 days, your account will be automatically restored.
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={onClose} className="btn-outline flex-1">Cancel</button>
                <button onClick={() => setStep('password')}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors">
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2: Password verification ────── */}
          {step === 'password' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Enter your current password to continue.</p>
              <div>
                <label className="label">Current Password</label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} className="input pr-10"
                    placeholder="Enter your password"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && verifyPassword()} />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep('warning')} className="btn-outline flex-1">Back</button>
                <button onClick={verifyPassword} disabled={loading}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors">
                  {loading ? 'Verifying…' : 'Verify Password'}
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3a: OTP channel selection ───── */}
          {step === 'otp_channel' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">How would you like to receive your verification code?</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'email', label: 'Email', icon: Mail, desc: user?.email || 'No email', disabled: !user?.email },
                  { value: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, desc: user?.phone },
                ].map(({ value, label, icon: Icon, desc, disabled }) => (
                  <button key={value} type="button" disabled={disabled}
                    onClick={() => setChannel(value)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all disabled:opacity-40 disabled:cursor-not-allowed ${channel === value ? 'border-red-400 bg-red-50' : 'border-gray-100 hover:border-gray-200'}`}>
                    <Icon size={20} className={`mb-2 ${channel === value ? 'text-red-600' : 'text-gray-400'}`} />
                    <p className={`text-sm font-semibold ${channel === value ? 'text-red-700' : 'text-gray-700'}`}>{label}</p>
                    <p className="text-[10px] text-gray-400 truncate mt-0.5">{desc}</p>
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep('password')} className="btn-outline flex-1">Back</button>
                <button onClick={sendOTP} disabled={!channel || loading}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors">
                  {loading ? 'Sending…' : 'Send Code'}
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3b: OTP entry ────────────────── */}
          {step === 'otp_verify' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Enter the 6-digit code sent to your {channel === 'email' ? 'email' : 'WhatsApp'}{' '}
                <span className="font-semibold text-gray-800">{otpId}</span>.
              </p>
              <div>
                <label className="label">Verification Code</label>
                <input className="input text-center text-2xl tracking-[0.4em] font-bold"
                  placeholder="——————" maxLength={6}
                  value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  onKeyDown={(e) => e.key === 'Enter' && verifyOTP()} />
              </div>
              <button onClick={() => { setOtp(''); setStep('otp_channel'); }}
                className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                <RotateCcw size={11} /> Resend / change method
              </button>
              <div className="flex gap-3">
                <button onClick={() => setStep('otp_channel')} className="btn-outline flex-1">Back</button>
                <button onClick={verifyOTP} disabled={loading || otp.length !== 6}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors">
                  {loading ? 'Verifying…' : 'Verify Code'}
                </button>
              </div>
            </div>
          )}

          {/* ── Step 4: Final confirmation ────────── */}
          {step === 'confirm' && (
            <div className="space-y-4">
              <h3 className="font-bold text-gray-800 text-lg">Confirm Account Deletion</h3>
              <div className="bg-gray-50 rounded-2xl p-4 space-y-2 text-sm text-gray-600">
                <p>Your account <strong>will not be deleted immediately.</strong></p>
                <p>It will enter a <strong>30-day deletion period</strong> starting today.</p>
                <p>If you sign in again within the next 30 days, this request will be <strong>automatically cancelled</strong>.</p>
                <p>After 30 days of inactivity, your account and associated data will be <strong>permanently removed.</strong></p>
              </div>
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-xs text-red-600">
                Requested: {new Date().toLocaleDateString('en-IN')} &nbsp;·&nbsp; Scheduled: {new Date(Date.now() + 30 * 86400000).toLocaleDateString('en-IN')}
              </div>
              <div className="flex gap-3">
                <button onClick={onClose} className="btn-outline flex-1">Cancel</button>
                <button onClick={confirmDeletion} disabled={loading}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors">
                  {loading ? 'Processing…' : 'Confirm Deletion Request'}
                </button>
              </div>
            </div>
          )}

          {/* ── Step 5: Done ─────────────────────── */}
          {step === 'done' && (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle size={28} className="text-amber-600" />
              </div>
              <h3 className="font-bold text-gray-800 text-lg">Deletion Scheduled</h3>
              <p className="text-sm text-gray-500">
                Your account will be permanently deleted on{' '}
                <strong>{scheduledDate ? new Date(scheduledDate).toLocaleDateString('en-IN') : '—'}</strong>.
              </p>
              <p className="text-xs text-gray-400">
                Sign in before that date to restore your account. You are being logged out…
              </p>
              <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full animate-[progressbar_4s_linear_forwards]" style={{ width: '100%' }} />
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name:     user?.name     || '',
    email:    user?.email    || '',
    pincode:  user?.pincode  || '',
    state:    user?.state    || '',
    city:     user?.city     || '',
    district: user?.district || '',
    address:  user?.address  || '',
  });
  const [saving, setSaving] = useState(false);

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [showPw, setShowPw] = useState({ current: false, new: false });
  const [pwSaving, setPwSaving] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Referral system temporarily hidden — backend intact, UI disabled
  // const [referral, setReferral] = useState(null);
  // useEffect(() => { API.get('/referral/my').then(({ data }) => setReferral(data)).catch(() => {}); }, []);

  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await API.patch('/users/profile', form);
      await refreshUser();
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) { toast.error('Passwords do not match'); return; }
    if (pwForm.newPassword.length < 6)         { toast.error('Minimum 6 characters');   return; }
    setPwSaving(true);
    try {
      await API.patch('/users/change-password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed!');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-spiritual-light py-10">
      <div className="max-w-3xl mx-auto px-4 space-y-6">

        <h1 className="text-2xl font-bold text-maroon-700">My Profile</h1>

        {/* ── Photo section ─────────────────────────── */}
        <div className="bg-white rounded-3xl shadow-md p-6 border border-saffron-100">
          <h2 className="font-semibold text-gray-700 mb-4">Profile Photo</h2>
          <ProfilePhoto
            currentPhoto={user?.profilePhoto}
            onUpdate={refreshUser}
            endpoint="/users/profile/photo"
            deleteEndpoint="/users/profile/photo"
          />
          <div className="mt-4 text-center">
            <p className="font-bold text-gray-800">{user?.name}</p>
            <p className="text-sm text-gray-500 capitalize">{user?.role} account</p>
            <p className="text-xs text-gray-400">{user?.phone}</p>
          </div>
        </div>

        {/* ── Personal details ──────────────────────── */}
        <div className="bg-white rounded-3xl shadow-md p-6 border border-saffron-100">
          <h2 className="font-semibold text-gray-700 mb-5">Personal Details</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Full Name</label>
                <input className="input" value={form.name} onChange={set('name')} />
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" className="input" value={form.email} onChange={set('email')} placeholder="your@email.com" />
              </div>
            </div>

            <div>
              <label className="label">Pincode</label>
              <PincodeInput
                value={form.pincode}
                onChange={(v) => setForm({ ...form, pincode: v })}
                onFill={({ state, city, district }) => setForm((prev) => ({ ...prev, state, city, district }))}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[['state','State'],['city','City'],['district','District']].map(([f, l]) => (
                <div key={f}>
                  <label className="label text-xs">{l}</label>
                  <input className="input bg-saffron-50 text-sm" value={form[f]} onChange={set(f)} />
                </div>
              ))}
            </div>

            <div>
              <label className="label">Address</label>
              <textarea rows={2} className="input resize-none" value={form.address} onChange={set('address')} placeholder="Your address..." />
            </div>

            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Referral section temporarily hidden */}

        {/* ── Change Password ──────────────────────────────────────────────── */}
        <div className="bg-white rounded-3xl shadow-md p-6 border border-saffron-100">
          <h2 className="font-semibold text-gray-700 mb-5">Change Password</h2>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            {[
              ['currentPassword', 'Current Password', 'current'],
              ['newPassword',     'New Password',     'new'],
              ['confirm',         'Confirm New Password', 'new'],
            ].map(([field, label, showKey]) => (
              <div key={field}>
                <label className="label">{label}</label>
                <div className="relative">
                  <input type={showPw[showKey] ? 'text' : 'password'} className="input pr-10"
                    value={pwForm[field]}
                    onChange={(e) => setPwForm({ ...pwForm, [field]: e.target.value })} />
                  <button type="button" onClick={() => setShowPw({ ...showPw, [showKey]: !showPw[showKey] })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPw[showKey] ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            ))}
            <button type="submit" disabled={pwSaving} className="btn-primary flex items-center gap-2">
              <Save size={16} /> {pwSaving ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>

        {/* ── Privacy & Security ───────────────────────────────────────────── */}
        <div className="bg-white rounded-3xl shadow-md p-6 border border-red-100">
          <h2 className="font-semibold text-gray-700 mb-1">Privacy &amp; Security</h2>
          <p className="text-xs text-gray-400 mb-5">Manage your account data and security settings.</p>

          <div className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-red-50 border border-red-100">
            <div>
              <p className="font-semibold text-red-700 text-sm">Delete My Account</p>
              <p className="text-xs text-red-500 mt-0.5 max-w-xs leading-relaxed">
                Deleting your account will remove access to bookings, order history, profile information,
                saved addresses, and associated services.
              </p>
            </div>
            <button onClick={() => setShowDeleteModal(true)}
              className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-red-600 border border-red-300 bg-white hover:bg-red-50 px-4 py-2 rounded-xl transition-colors whitespace-nowrap">
              <Trash2 size={13} /> Delete Account
            </button>
          </div>
        </div>

      </div>

      {showDeleteModal && (
        <DeleteAccountModal
          onClose={() => setShowDeleteModal(false)}
          onDeleted={() => navigate('/login')}
        />
      )}

    </div>
  );
}
