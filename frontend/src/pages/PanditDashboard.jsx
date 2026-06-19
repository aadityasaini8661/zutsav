import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  LayoutDashboard, BookOpen, Calendar, CalendarDays,
  IndianRupee, Ban,
  CheckCircle, Power, AlertCircle, XCircle, RefreshCw, Upload,
  Clock, Star, User, CreditCard, Save, FileText, GraduationCap,
  MapPin, Languages, Briefcase, Heart, Plus, Trash2, Search,
  CheckSquare, Square, BadgeCheck, AlertTriangle, Info, ShieldCheck,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import API from '../api/axios';
import ProfilePhoto from '../components/shared/ProfilePhoto';
import AvailabilityManager from '../components/availability/AvailabilityManager';
import PincodeInput from '../components/shared/PincodeInput';
import MapPicker from '../components/shared/MapPicker';

// QUALIFICATION_CATEGORIES removed — now loaded from admin Education Masters API

const LANGUAGE_OPTIONS = [
  'Hindi','English','Sanskrit','Marathi','Punjabi','Gujarati',
  'Tamil','Telugu','Kannada','Bengali','Odia','Malayalam','Urdu','Bhojpuri',
];


const PROFILE_TABS = [
  { id: 'personal',    label: 'Personal Details',             icon: User },
  { id: 'address',     label: 'Languages & Address',          icon: MapPin },
  { id: 'education',   label: 'Education',                    icon: GraduationCap },
  { id: 'experience',  label: 'Experience & Specializations', icon: Briefcase },
  { id: 'poojas',      label: 'Pooja Services',               icon: Star },
  { id: 'family',      label: 'Family Information',           icon: Heart },
  { id: 'payment',     label: 'Bank & UPI Details',           icon: CreditCard },
  { id: 'kyc',         label: 'KYC Verification',             icon: ShieldCheck },
];

// ─── Profile completion ─────────────────────────────────────────
function calcCompletion(pandit) {
  const checks = [
    !!pandit.profilePhoto,
    !!pandit.fatherName,
    !!pandit.gender,
    !!pandit.dob,
    !!pandit.bio,
    !!pandit.address,
    (pandit.languages?.length > 0),
    (pandit.qualifications?.length > 0),
    (pandit.specializations?.length > 0),
    (pandit.selectedPoojas?.length > 0),
    !!(pandit.bankDetails?.accountNumber || pandit.upiDetails?.upiId),
    !!(pandit.kycStatus && pandit.kycStatus !== 'not_submitted'),
  ];
  const done = checks.filter(Boolean).length;
  return Math.round((done / checks.length) * 100);
}

const KYC_STATUS_CONFIG = {
  not_submitted:    { label: 'Not Submitted',    color: 'bg-gray-100 text-gray-600',    dot: 'bg-gray-400'   },
  submitted:        { label: 'Under Review',     color: 'bg-blue-100 text-blue-700',    dot: 'bg-blue-500'   },
  approved:         { label: 'Approved',         color: 'bg-green-100 text-green-700',  dot: 'bg-green-500'  },
  rejected:         { label: 'Rejected',         color: 'bg-red-100 text-red-700',      dot: 'bg-red-500'    },
  reupload_required:{ label: 'Re-upload Required',color: 'bg-purple-100 text-purple-700',dot:'bg-purple-500' },
};

// ─── Application Gate (only for blocked accounts) ──────────────
function ApplicationGate({ pandit }) {
  const STATUS_CONFIG = {
    rejected: {
      icon: <XCircle size={40} className="text-red-500" />,
      bg: 'bg-red-50 border-red-200',
      title: 'Account Rejected',
      message: 'Your account was not approved. Please contact support for assistance.',
    },
    suspended: {
      icon: <Ban size={40} className="text-orange-500" />,
      bg: 'bg-orange-50 border-orange-200',
      title: 'Account Suspended',
      message: 'Your account has been suspended. Contact support to resolve this.',
    },
  };

  const cfg = STATUS_CONFIG[pandit.status] || STATUS_CONFIG.pending;

  return (
    <div className="min-h-screen bg-spiritual-light flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-5">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <span className="text-3xl">🪔</span>
            <span className="font-serif text-3xl font-bold text-maroon-600">Zutsav</span>
          </Link>
        </div>
        <div className={`bg-white rounded-3xl shadow-xl p-8 border ${cfg.bg} space-y-5`}>
          <div className="flex flex-col items-center gap-3 text-center">
            {cfg.icon}
            <h1 className="text-xl font-bold text-gray-800">{cfg.title}</h1>
            <p className="text-gray-600 text-sm leading-relaxed">{cfg.message}</p>
            {pandit.adminNote && (
              <div className="w-full bg-gray-50 rounded-xl p-3 text-left border border-gray-200">
                <p className="text-xs text-gray-500 font-semibold mb-1">Note from Admin:</p>
                <p className="text-sm text-gray-700">{pandit.adminNote}</p>
              </div>
            )}
          </div>
          {cfg.steps && (
            <div className="space-y-2">
              {cfg.steps.map((s, i) => (
                <div key={i} className={`flex items-center gap-3 text-sm ${s.done ? 'text-green-700' : 'text-gray-400'}`}>
                  {s.done ? <CheckCircle size={16} className="text-green-500 shrink-0" /> : <div className="w-4 h-4 rounded-full border-2 border-current shrink-0" />}
                  {s.label}
                </div>
              ))}
            </div>
          )}
          <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
            <button onClick={() => window.location.reload()} className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 text-sm">
              <RefreshCw size={15} /> Refresh Status
            </button>
            <Link to="/" className="text-center text-sm text-saffron-600 hover:underline">← Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Incomplete / KYC Banner ────────────────────────────────────
function IncompleteBanner({ pandit, onGoToKYC }) {
  const completion      = calcCompletion(pandit);
  const kycStatus       = pandit.kycStatus || 'not_submitted';
  const kycApproved     = kycStatus === 'approved';
  const kycRejected     = kycStatus === 'rejected';
  const kycReupload     = kycStatus === 'reupload_required';
  const kycSubmitted    = kycStatus === 'submitted';
  const profileOK       = completion >= 70;

  if (kycApproved && profileOK) return null; // nothing to show

  return (
    <div className="mb-5 space-y-2">
      {/* Main CTA banner */}
      {(!kycApproved || !profileOK) && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <AlertTriangle size={22} className="text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
          <div className="flex-1">
            <p className="font-semibold text-amber-900 text-sm">
              Complete your profile and KYC verification to start receiving bookings.
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Profile: {completion}% complete
              {' · '}
              KYC: {KYC_STATUS_CONFIG[kycStatus]?.label}
            </p>
          </div>
          <button
            onClick={onGoToKYC}
            className="shrink-0 text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
            style={{ background: '#D4AF37', color: '#1B1F3B' }}
          >
            Complete Profile
          </button>
        </div>
      )}

      {/* KYC-specific status banners */}
      {kycSubmitted && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-3 flex items-center gap-3">
          <Clock size={16} className="text-blue-600 shrink-0" />
          <p className="text-sm text-blue-800">
            <span className="font-semibold">KYC Under Review — </span>
            Your documents have been submitted. We'll notify you once verified.
          </p>
        </div>
      )}

      {kycRejected && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3 flex items-start gap-3">
          <XCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">KYC Rejected</p>
            {pandit.kycRejectionReason && (
              <p className="text-xs text-red-700 mt-0.5">Reason: {pandit.kycRejectionReason}</p>
            )}
            <button onClick={onGoToKYC} className="text-xs text-red-600 font-semibold underline mt-1">
              Re-submit Documents
            </button>
          </div>
        </div>
      )}

      {kycReupload && (
        <div className="rounded-2xl border border-purple-200 bg-purple-50 px-5 py-3 flex items-start gap-3">
          <Upload size={16} className="text-purple-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-purple-800">Document Re-upload Required</p>
            {pandit.kycRejectionReason && (
              <p className="text-xs text-purple-700 mt-0.5">Reason: {pandit.kycRejectionReason}</p>
            )}
            <button onClick={onGoToKYC} className="text-xs text-purple-600 font-semibold underline mt-1">
              Re-upload Documents
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Overview Tab ───────────────────────────────────────────────
function OverviewTab({ pandit, reload }) {
  const completion = calcCompletion(pandit);

  const toggleOnline = async () => {
    try {
      await API.patch('/pandits/me/online-status', { isOnline: !pandit.isOnline });
      await reload();
      toast.success(pandit.isOnline ? 'You are now offline' : 'You are now online');
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-sm border border-saffron-100 p-5 flex flex-col sm:flex-row items-center gap-5">
        <ProfilePhoto currentPhoto={pandit.profilePhoto} onUpdate={reload}
          endpoint="/pandits/me/photo" deleteEndpoint="/pandits/me/photo" size="md" />
        <div className="flex-1 text-center sm:text-left">
          <h2 className="text-xl font-bold text-gray-800">{pandit.name}</h2>
          <p className="text-gray-500 text-sm">{pandit.email} · {pandit.phone}</p>
          <div className="flex flex-wrap items-center gap-2 mt-2 justify-center sm:justify-start">
            <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">Approved</span>
            <button onClick={toggleOnline}
              className={`flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold border transition-colors ${pandit.isOnline ? 'bg-green-500 text-white border-green-500' : 'bg-gray-100 text-gray-600 border-gray-300'}`}>
              <Power size={11} /> {pandit.isOnline ? 'Online' : 'Offline'}
            </button>
          </div>

          {/* Profile completion bar */}
          <div className="mt-3 max-w-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500">Profile Completion</span>
              <span className="text-xs font-bold" style={{ color: '#D4AF37' }}>{completion}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${completion}%`, background: 'linear-gradient(90deg, #D4AF37, #f5e09a)' }} />
            </div>
          </div>
        </div>
        <div className="flex gap-6 text-center">
          <div><p className="text-2xl font-bold" style={{ color: '#1B1F3B', fontFamily: '"Cormorant Garamond"' }}>{pandit.totalBookings}</p><p className="text-xs text-gray-400">Bookings</p></div>
          <div><p className="text-2xl font-bold" style={{ color: '#D4AF37', fontFamily: '"Cormorant Garamond"' }}>{pandit.rating || '—'}</p><p className="text-xs text-gray-400">Rating</p></div>
          <div><p className="text-2xl font-bold" style={{ color: '#1B1F3B', fontFamily: '"Cormorant Garamond"' }}>{pandit.totalReviews}</p><p className="text-xs text-gray-400">Reviews</p></div>
        </div>
      </div>

      {/* Verification status widget */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          {
            label: 'Profile Completion',
            value: `${completion}%`,
            color: completion >= 70 ? 'text-green-700 bg-green-50 border-green-100' : 'text-amber-700 bg-amber-50 border-amber-100',
            icon: completion >= 70 ? <CheckCircle size={16} className="text-green-500" /> : <AlertCircle size={16} className="text-amber-500" />,
          },
          {
            label: 'KYC Status',
            value: KYC_STATUS_CONFIG[pandit.kycStatus || 'not_submitted']?.label,
            color: pandit.kycStatus === 'approved' ? 'text-green-700 bg-green-50 border-green-100' : pandit.kycStatus === 'submitted' ? 'text-blue-700 bg-blue-50 border-blue-100' : 'text-gray-600 bg-gray-50 border-gray-100',
            icon: pandit.kycStatus === 'approved' ? <ShieldCheck size={16} className="text-green-500" /> : <FileText size={16} className="text-gray-400" />,
          },
          {
            label: 'Booking Eligibility',
            value: pandit.canReceiveBookings ? 'Active' : 'Not Eligible',
            color: pandit.canReceiveBookings ? 'text-green-700 bg-green-50 border-green-100' : 'text-red-600 bg-red-50 border-red-100',
            icon: pandit.canReceiveBookings ? <CheckCircle size={16} className="text-green-500" /> : <XCircle size={16} className="text-red-400" />,
          },
        ].map(({ label, value, color, icon }) => (
          <div key={label} className={`rounded-xl border p-3 flex items-center gap-3 ${color}`}>
            {icon}
            <div>
              <p className="text-xs font-medium opacity-70">{label}</p>
              <p className="text-sm font-bold">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-saffron-100 p-5">
        <h3 className="font-bold text-gray-800 mb-4">Profile Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            ['Experience', `${pandit.experience || 0} years`],
            ['Languages', pandit.languages?.join(', ') || '—'],
            ['Govt ID', pandit.govtIdType?.toUpperCase()],
            ['Member Since', new Date(pandit.createdAt).toLocaleDateString('en-IN')],
            ['Location', pandit.city ? `${pandit.city}, ${pandit.state}` : '—'],
          ].map(([label, value]) => (
            <div key={label} className="bg-saffron-50 rounded-xl p-3">
              <p className="text-xs text-gray-400">{label}</p>
              <p className="font-semibold text-gray-700 text-sm capitalize">{value}</p>
            </div>
          ))}
        </div>
        {pandit.specializations?.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-semibold text-gray-600 mb-2">Specializations</p>
            <div className="flex flex-wrap gap-2">
              {pandit.specializations.map((s, i) => (
                <span key={i} className="bg-saffron-100 text-saffron-700 text-xs px-3 py-1 rounded-full">
                  {s.name}{s.yearsOfExperience > 0 ? ` · ${s.yearsOfExperience}y` : ''}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Bookings Tab ───────────────────────────────────────────────
const BOOKING_STATUS_META = {
  pending_payment:       { label: 'Awaiting Payment',      color: 'bg-yellow-100 text-yellow-700'  },
  paid:                  { label: 'Paid',                  color: 'bg-blue-100 text-blue-700'      },
  pandit_assigned:       { label: 'Action Required',       color: 'bg-purple-100 text-purple-700'  },
  pandit_accepted:       { label: 'Accepted by You',       color: 'bg-teal-100 text-teal-700'      },
  pending_reassignment:  { label: 'Rejected',              color: 'bg-red-100 text-red-600'        },
  completion_requested:  { label: 'Completion Pending',    color: 'bg-orange-100 text-orange-700'  },
  completed:             { label: 'Completed',             color: 'bg-green-100 text-green-700'    },
  cancelled:             { label: 'Cancelled',             color: 'bg-red-100 text-red-700'        },
};

function BookingsTab() {
  const [bookings,         setBookings]         = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [statusFilter,     setStatusFilter]     = useState('');
  const [expanded,         setExpanded]         = useState(null);
  const [completing,       setCompleting]       = useState(null);
  const [accepting,        setAccepting]        = useState(null);
  const [rejectModal,      setRejectModal]      = useState(null); // { bookingId, bookingNumber }
  const [rejectReason,     setRejectReason]     = useState('');
  const [submittingReject, setSubmittingReject] = useState(false);

  const QUICK_REASONS = ['Already booked on that date', 'Out of station', 'Medical emergency', 'Personal reason', 'Other'];

  const load = useCallback(() => {
    setLoading(true);
    const params = statusFilter ? `?status=${statusFilter}` : '';
    API.get(`/pandits/me/bookings${params}`)
      .then(({ data }) => setBookings(data.bookings || []))
      .catch(() => toast.error('Could not load bookings'))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  const handleAccept = async (bookingId) => {
    setAccepting(bookingId);
    try {
      await API.patch(`/pandits/me/bookings/${bookingId}/accept`);
      toast.success('Booking accepted! Customer and admin have been notified.');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not accept booking');
    } finally {
      setAccepting(null);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim() || rejectReason.trim().length < 10) {
      toast.error('Please provide a reason (minimum 10 characters)');
      return;
    }
    setSubmittingReject(true);
    try {
      await API.patch(`/pandits/me/bookings/${rejectModal.bookingId}/reject`, { reason: rejectReason });
      toast.success('Booking rejected. Admin has been notified to reassign.');
      setRejectModal(null);
      setRejectReason('');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not reject booking');
    } finally {
      setSubmittingReject(false);
    }
  };

  const handleRequestCompletion = async (bookingId) => {
    if (!window.confirm('Confirm that the pooja has been performed? Admin will verify before marking it as completed.')) return;
    setCompleting(bookingId);
    try {
      await API.patch(`/pandits/me/bookings/${bookingId}/request-completion`);
      toast.success('Completion request sent to admin for approval.');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not submit completion request');
    } finally {
      setCompleting(null);
    }
  };

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div className="space-y-3 animate-pulse">
      {[1,2,3].map((i) => <div key={i} className="h-28 bg-white rounded-2xl border border-gray-100" />)}
    </div>
  );

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold" style={{ color: '#1B1F3B', fontFamily: "'Cormorant Garamond', serif" }}>
          My Bookings
          {bookings.length > 0 && <span className="ml-2 text-sm font-normal text-gray-400">({bookings.length})</span>}
        </h2>
        <button onClick={load} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors">
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: '',                      label: 'All'               },
          { key: 'pandit_assigned',       label: 'Action Required'   },
          { key: 'pandit_accepted',       label: 'Accepted'          },
          { key: 'completion_requested',  label: 'Pending Approval'  },
          { key: 'completed',             label: 'Completed'         },
          { key: 'cancelled',             label: 'Cancelled'         },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setStatusFilter(key)}
            className="px-3 py-1 rounded-full text-xs font-medium transition-all"
            style={{
              background: statusFilter === key ? '#1B1F3B' : 'white',
              color:      statusFilter === key ? 'white'   : '#6b7280',
              border:     `1px solid ${statusFilter === key ? '#1B1F3B' : '#e5e7eb'}`,
            }}>
            {label}
          </button>
        ))}
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <BookOpen size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No bookings found.</p>
          <p className="text-xs text-gray-400 mt-1">Admin will assign bookings based on your availability and location.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => {
            const meta     = BOOKING_STATUS_META[b.status] || { label: b.status, color: 'bg-gray-100 text-gray-600' };
            const customer = b.userId || {};
            const isOpen   = expanded === b._id;
            const addr     = b.userDetails;
            const needsAction = b.status === 'pandit_assigned';

            return (
              <div key={b._id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${needsAction ? 'border-purple-200 ring-1 ring-purple-100' : 'border-gray-100'}`}>
                {/* Card header */}
                <button className="w-full text-left p-4 flex items-start gap-3" onClick={() => setExpanded(isOpen ? null : b._id)}>
                  <div className="w-1 self-stretch rounded-full shrink-0" style={{ background: needsAction ? '#7c3aed' : '#1B1F3B', minHeight: '48px' }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-gray-800 text-sm">{b.poojaId?.name || 'Pooja Service'}</p>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${meta.color}`}>{meta.label}</span>
                      {needsAction && <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full animate-pulse">Action needed</span>}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {addr?.name || customer.name || '—'} · {new Date(b.scheduledDate).toLocaleDateString('en-IN', { weekday:'short', day:'numeric', month:'short', year:'numeric' })} at {b.scheduledTime}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5 font-mono">#{b.bookingNumber}</p>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1 shrink-0">{isOpen ? '▲ hide' : '▼ details'}</p>
                </button>

                {/* Expanded detail */}
                {isOpen && (
                  <div className="border-t border-gray-100 px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    {/* Customer info */}
                    <div className="space-y-1">
                      <p className="font-bold text-gray-500 uppercase tracking-wide mb-1.5">Customer</p>
                      <p className="font-semibold text-gray-800">{addr?.name || customer.name || '—'}</p>
                      <p className="text-gray-500">{addr?.phone || customer.phone || '—'}</p>
                      {(addr?.email || customer.email) && <p className="text-gray-400">{addr?.email || customer.email}</p>}
                    </div>

                    {/* Schedule */}
                    <div className="space-y-1">
                      <p className="font-bold text-gray-500 uppercase tracking-wide mb-1.5">Schedule</p>
                      <p className="font-semibold text-gray-800">
                        {new Date(b.scheduledDate).toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
                      </p>
                      <p className="text-gray-500">{b.scheduledTime}</p>
                      {b.language && <p className="text-gray-400">Language: {b.language}</p>}
                    </div>

                    {/* Full address */}
                    <div className="space-y-1 sm:col-span-2">
                      <p className="font-bold text-gray-500 uppercase tracking-wide mb-1.5">Service Address</p>
                      <div className="bg-gray-50 rounded-xl p-3 leading-relaxed">
                        <p className="text-gray-700">{[addr?.address, addr?.city, addr?.district, addr?.state, addr?.pincode].filter(Boolean).join(', ')}</p>
                      </div>
                    </div>

                    {/* Booking status */}
                    <div className="space-y-1">
                      <p className="font-bold text-gray-500 uppercase tracking-wide mb-1.5">Status</p>
                      <span className={`inline-block text-[10px] font-semibold px-2.5 py-1 rounded-full ${meta.color}`}>{meta.label}</span>
                      {b.panditAssignedAt && (
                        <p className="text-gray-400 mt-1">Assigned: {new Date(b.panditAssignedAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}</p>
                      )}
                    </div>

                    {/* Pooja */}
                    <div className="space-y-1">
                      <p className="font-bold text-gray-500 uppercase tracking-wide mb-1.5">Pooja</p>
                      <p className="font-semibold text-gray-800">{b.poojaId?.name || '—'}</p>
                      {b.poojaId?.duration && <p className="text-gray-400">Duration: {b.poojaId.duration}</p>}
                    </div>

                    {/* Special note */}
                    {b.specialNote && (
                      <div className="sm:col-span-2">
                        <p className="font-bold text-gray-500 uppercase tracking-wide mb-1.5">Special Instructions</p>
                        <p className="text-gray-600 bg-amber-50 rounded-xl p-3">{b.specialNote}</p>
                      </div>
                    )}

                    {/* ── ACCEPT / REJECT (only when status is pandit_assigned) ── */}
                    {b.status === 'pandit_assigned' && (
                      <div className="sm:col-span-2 pt-3 border-t border-gray-100 space-y-3">
                        <div className="bg-purple-50 border border-purple-100 rounded-xl p-3">
                          <p className="text-purple-800 font-semibold text-sm mb-0.5">Please respond to this booking</p>
                          <p className="text-purple-600 text-[11px]">Accept if you are available on {new Date(b.scheduledDate).toLocaleDateString('en-IN', { day:'numeric', month:'short' })} at {b.scheduledTime}. Reject if you cannot attend.</p>
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleAccept(b._id)}
                            disabled={accepting === b._id}
                            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 transition-colors"
                          >
                            {accepting === b._id ? 'Accepting…' : '✓ Accept Booking'}
                          </button>
                          <button
                            onClick={() => { setRejectModal({ bookingId: b._id, bookingNumber: b.bookingNumber }); setRejectReason(''); }}
                            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-100 hover:bg-red-200 text-red-700 transition-colors"
                          >
                            ✗ Reject Booking
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Accepted confirmation */}
                    {b.status === 'pandit_accepted' && (
                      <div className="sm:col-span-2 pt-2 border-t border-gray-100">
                        <div className="bg-teal-50 border border-teal-200 rounded-xl p-3">
                          <p className="text-teal-700 font-semibold text-sm">✓ You have accepted this booking</p>
                          <p className="text-teal-600 text-[11px] mt-0.5">Perform the pooja on {new Date(b.scheduledDate).toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long' })} and then mark it as completed below.</p>
                        </div>
                        <button
                          onClick={() => handleRequestCompletion(b._id)}
                          disabled={completing === b._id}
                          className="w-full mt-3 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                          style={{ background: '#1B1F3B', color: 'white' }}
                        >
                          {completing === b._id ? 'Submitting…' : 'Mark Pooja as Completed'}
                        </button>
                        <p className="text-[10px] text-gray-400 text-center mt-1.5">Admin will verify and approve the completion</p>
                      </div>
                    )}

                    {/* Legacy: mark completed also available when pandit_assigned (backward compat) */}
                    {b.status === 'pandit_assigned' && false /* replaced by accept flow above */ && (
                      <div className="sm:col-span-2 pt-2 border-t border-gray-100">
                        <button onClick={() => handleRequestCompletion(b._id)} disabled={completing === b._id}
                          className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                          style={{ background: '#1B1F3B', color: 'white' }}>
                          {completing === b._id ? 'Submitting…' : 'Mark Pooja as Completed'}
                        </button>
                      </div>
                    )}

                    {b.status === 'completion_requested' && (
                      <div className="sm:col-span-2 pt-2 border-t border-gray-100">
                        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-center">
                          <p className="text-orange-700 font-semibold text-sm">Completion Pending Admin Approval</p>
                          <p className="text-orange-500 text-[10px] mt-0.5">Admin has been notified and will verify shortly</p>
                        </div>
                      </div>
                    )}

                    {b.status === 'completed' && (
                      <div className="sm:col-span-2 pt-2 border-t border-gray-100">
                        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                          <p className="text-green-700 font-semibold text-sm">✓ Booking Completed</p>
                          {b.completedAt && <p className="text-green-500 text-[10px] mt-0.5">Verified on {new Date(b.completedAt).toLocaleDateString('en-IN')}{b.verifiedByName ? ` by ${b.verifiedByName}` : ''}</p>}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Reject reason modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md">
            <h3 className="font-bold text-gray-800 text-lg mb-0.5">Reject Booking</h3>
            <p className="text-xs text-gray-400 mb-4 font-mono">#{rejectModal.bookingNumber}</p>

            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Quick reasons</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {QUICK_REASONS.map((r) => (
                <button key={r} type="button"
                  onClick={() => setRejectReason(r)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${rejectReason === r ? 'bg-red-100 border-red-300 text-red-700' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                  {r}
                </button>
              ))}
            </div>

            <label className="label">Reason <span className="text-gray-400 font-normal">(min 10 characters)</span></label>
            <textarea
              className="input min-h-[80px] resize-none text-sm mb-4"
              placeholder="Describe why you cannot accept this booking…"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            {rejectReason.length > 0 && rejectReason.length < 10 && (
              <p className="text-xs text-red-500 -mt-3 mb-3">{10 - rejectReason.length} more characters needed</p>
            )}

            <div className="flex gap-3">
              <button onClick={() => { setRejectModal(null); setRejectReason(''); }} className="btn-outline flex-1">
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={submittingReject || rejectReason.trim().length < 10}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 transition-colors"
              >
                {submittingReject ? 'Submitting…' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Festival Calendar Tab ──────────────────────────────────────
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
function FestivalsTab() {
  const [festivals, setFestivals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year,  setYear]  = useState(new Date().getFullYear());

  useEffect(() => {
    setLoading(true);
    API.get(`/festivals?month=${month}&year=${year}`)
      .then(({ data }) => setFestivals(data.festivals))
      .finally(() => setLoading(false));
  }, [month, year]);

  return (
    <div className="animate-fade-in">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Festival Calendar</h2>
      <div className="flex gap-3 mb-5 flex-wrap">
        <select className="input w-40 text-sm" value={month} onChange={(e) => setMonth(+e.target.value)}>
          {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
        </select>
        <select className="input w-28 text-sm" value={year} onChange={(e) => setYear(+e.target.value)}>
          {[2024,2025,2026,2027].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      {loading ? <div className="animate-pulse space-y-3">{[1,2,3].map((i) => <div key={i} className="h-16 bg-white rounded-2xl border border-gray-100" />)}</div>
      : festivals.length === 0 ? <div className="text-center py-10 text-gray-400">No festivals this month.</div>
      : (
        <div className="space-y-3">
          {festivals.map((f) => (
            <div key={f._id} className="bg-white rounded-2xl border border-saffron-100 p-4 shadow-sm flex gap-4 items-start">
              <div className="bg-saffron-50 rounded-xl p-2.5 text-center min-w-[48px]">
                <p className="text-xs text-saffron-600 font-bold">{new Date(f.date).toLocaleDateString('en-IN',{day:'2-digit'})}</p>
                <p className="text-xs text-saffron-500">{new Date(f.date).toLocaleDateString('en-IN',{month:'short'})}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-800">{f.name}</p>
                {f.tithiDate && <p className="text-xs text-saffron-600 mt-0.5">{f.tithiDate}</p>}
                {f.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{f.description}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Earnings Tab ───────────────────────────────────────────────
function EarningsTab({ pandit }) {
  const [ratings,      setRatings]      = useState([]);
  const [ratingsLoad,  setRatingsLoad]  = useState(true);

  useEffect(() => {
    API.get('/pandits/me/ratings')
      .then(({ data }) => setRatings(data.ratings || []))
      .catch(() => {})
      .finally(() => setRatingsLoad(false));
  }, []);

  const StarDisplay = ({ value }) => (
    <span className="inline-flex gap-0.5">
      {[1,2,3,4,5].map((s) => (
        <Star key={s} size={13} className={s <= Math.round(value) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'} />
      ))}
    </span>
  );

  return (
    <div className="animate-fade-in space-y-5">
      <h2 className="text-xl font-bold" style={{ color: '#1B1F3B', fontFamily: "'Cormorant Garamond', serif" }}>Earnings &amp; Reviews</h2>

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Bookings', value: pandit.totalBookings || 0, icon: BookOpen, color: 'text-blue-600 bg-blue-50' },
          { label: 'Avg Rating',     value: pandit.rating ? pandit.rating.toFixed(1) : '—', icon: Star, color: 'text-amber-600 bg-amber-50' },
          { label: 'Reviews',        value: pandit.totalReviews || 0,  icon: User,     color: 'text-green-600 bg-green-50' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center shrink-0`}><Icon size={22} /></div>
            <div><p className="text-2xl font-bold text-gray-800">{value}</p><p className="text-sm text-gray-500">{label}</p></div>
          </div>
        ))}
      </div>

      {/* Earnings placeholder */}
      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 text-center">
        <IndianRupee size={36} className="text-amber-400 mx-auto mb-2" />
        <p className="text-gray-600 text-sm">Detailed earnings reports and payouts coming soon.</p>
      </div>

      {/* Ratings & Reviews */}
      <div>
        <h3 className="text-base font-bold text-gray-700 mb-3">Customer Ratings &amp; Reviews</h3>
        {ratingsLoad ? (
          <div className="space-y-3 animate-pulse">{[1,2].map((i) => <div key={i} className="h-20 bg-white rounded-2xl border border-gray-100" />)}</div>
        ) : ratings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 py-12 text-center">
            <Star size={36} className="text-gray-200 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">No reviews yet. Complete bookings to start receiving ratings.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {ratings.map((b) => (
              <div key={b._id} className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <StarDisplay value={b.rating} />
                      <span className="text-xs font-bold text-gray-700">{b.rating}/5</span>
                      <span className="text-[10px] text-gray-400 font-mono">#{b.bookingNumber}</span>
                    </div>
                    <p className="text-xs font-semibold text-gray-700">{b.poojaId?.name || 'Pooja Service'}</p>
                    {b.review && <p className="text-xs text-gray-500 mt-1 italic">"{b.review}"</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-gray-400">
                      {b.ratingDate ? new Date(b.ratingDate).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }) : '—'}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {new Date(b.scheduledDate).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PROFILE EDITOR — 7-tab system
// ═══════════════════════════════════════════════════════════════

// ── Tab 1: Personal Details ─────────────────────────────────────
function PersonalDetailsTab({ pandit, reload }) {
  const [form, setForm] = useState({
    name:       pandit.name       || '',
    fatherName: pandit.fatherName || '',
    phone:      pandit.phone      || '',
    gender:     pandit.gender     || '',
    dob:        pandit.dob ? pandit.dob.split('T')[0] : '',
    bio:        pandit.bio        || '',
  });
  const [saving, setSaving] = useState(false);
  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const age = form.dob ? Math.floor((Date.now() - new Date(form.dob)) / (365.25 * 864e5)) : null;

  const save = async () => {
    setSaving(true);
    try {
      await API.patch('/pandits/me/personal', form);
      await reload();
      toast.success('Personal details saved');
    } catch { toast.error('Failed to save'); } finally { setSaving(false); }
  };

  const completion = calcCompletion(pandit);

  return (
    <div className="space-y-5">
      {/* Profile photo + completion */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col sm:flex-row items-center gap-5">
        <ProfilePhoto currentPhoto={pandit.profilePhoto} onUpdate={reload}
          endpoint="/pandits/me/photo" deleteEndpoint="/pandits/me/photo" size="md" />
        <div className="flex-1 text-center sm:text-left w-full">
          <p className="font-semibold text-gray-700 mb-1">Profile Completion</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-saffron-500 rounded-full transition-all" style={{ width: `${completion}%` }} />
            </div>
            <span className="text-sm font-bold text-saffron-600 shrink-0">{completion}%</span>
          </div>
          {/* Status badges */}
          <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${pandit.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
              KYC: {pandit.govtIdType?.toUpperCase() || 'Pending'}
            </span>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${pandit.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
              {pandit.status === 'approved' ? '✓ Verified' : pandit.status?.replace(/_/g, ' ')}
            </span>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Full Name *</label>
            <input className="input" value={form.name} onChange={set('name')} placeholder="Your full name" />
          </div>
          <div>
            <label className="label">Father's Name</label>
            <input className="input" value={form.fatherName} onChange={set('fatherName')} placeholder="Father's full name" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Mobile Number *</label>
            <input className="input" value={form.phone} onChange={set('phone')} maxLength={10} placeholder="10-digit number" />
          </div>
          <div>
            <label className="label">Email (read-only)</label>
            <input className="input bg-gray-50 cursor-not-allowed" value={pandit.email} readOnly />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Gender</label>
            <select className="input" value={form.gender} onChange={set('gender')}>
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="label">Date of Birth</label>
            <div className="flex gap-2 items-center">
              <input type="date" className="input flex-1" value={form.dob} onChange={set('dob')}
                max={new Date().toISOString().split('T')[0]} />
              {age !== null && <span className="text-sm text-saffron-600 font-semibold shrink-0">{age} yrs</span>}
            </div>
          </div>
        </div>

        <div>
          <label className="label">About Me</label>
          <textarea className="input min-h-[90px] resize-none text-sm" value={form.bio}
            onChange={set('bio')} placeholder="Tell devotees about your background, approach, and experience..." />
        </div>

        <button onClick={save} disabled={saving} className="btn-primary px-6 py-2.5 flex items-center gap-2">
          <Save size={15} /> {saving ? 'Saving...' : 'Save Personal Details'}
        </button>
      </div>
    </div>
  );
}

// ── Tab 2: Languages & Address ──────────────────────────────────
const COVERAGE_OPTIONS = [
  { value: 'radius',   label: 'Custom Radius' },
  { value: 'city',     label: 'Entire City' },
  { value: 'district', label: 'Entire District' },
  { value: 'state',    label: 'Entire State' },
  { value: 'pan_india',label: 'Pan India' },
];
const RADIUS_OPTIONS = [5, 10, 20, 25, 50, 100];

function LanguagesAddressTab({ pandit, reload }) {
  const [selectedLangs, setSelectedLangs] = useState(pandit.languages || []);
  const [customLang, setCustomLang] = useState('');
  const [addrForm, setAddrForm] = useState({
    pincode:  pandit.pincode   || '',
    state:    pandit.state     || '',
    city:     pandit.city      || '',
    district: pandit.district  || '',
    address:  pandit.address   || '',
  });
  const [coords, setCoords] = useState({
    lat: pandit.latitude  || 20.5937,
    lng: pandit.longitude || 78.9629,
  });
  const [coverage, setCoverage] = useState({
    type:     pandit.serviceCoverage?.type     || 'city',
    radiusKm: pandit.serviceCoverage?.radiusKm || 25,
  });
  const [saving, setSaving] = useState(false);

  const toggleLang = (lang) => {
    setSelectedLangs((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  const addCustom = () => {
    const v = customLang.trim();
    if (v && !selectedLangs.includes(v)) { setSelectedLangs((p) => [...p, v]); setCustomLang(''); }
  };

  const onPinMove = (lat, lng, address) => {
    setCoords({ lat, lng });
    if (address) setAddrForm((p) => ({ ...p, address }));
  };

  const save = async () => {
    setSaving(true);
    try {
      await API.patch('/pandits/me/languages-address', {
        languages: selectedLangs,
        ...addrForm,
        latitude:       coords.lat,
        longitude:      coords.lng,
        serviceCoverage: coverage,
      });
      await reload();
      toast.success('Languages & Address saved');
    } catch { toast.error('Failed to save'); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      {/* Languages */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Languages size={18} className="text-saffron-500" />
          <h3 className="font-semibold text-gray-800">Languages Known</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {LANGUAGE_OPTIONS.map((lang) => {
            const active = selectedLangs.includes(lang);
            return (
              <button key={lang} type="button" onClick={() => toggleLang(lang)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${active ? 'bg-saffron-500 text-white border-saffron-500' : 'bg-white text-gray-600 border-gray-200 hover:border-saffron-300'}`}>
                {active && <span className="mr-1">✓</span>}{lang}
              </button>
            );
          })}
        </div>
        {/* Custom language input */}
        <div className="flex gap-2">
          <input className="input flex-1 text-sm" value={customLang} onChange={(e) => setCustomLang(e.target.value)}
            placeholder="Add other language..." onKeyDown={(e) => e.key === 'Enter' && addCustom()} />
          <button onClick={addCustom} className="btn-outline px-4 py-2 text-sm">Add</button>
        </div>
        {/* Custom chips */}
        {selectedLangs.filter((l) => !LANGUAGE_OPTIONS.includes(l)).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedLangs.filter((l) => !LANGUAGE_OPTIONS.includes(l)).map((lang) => (
              <span key={lang} className="bg-saffron-100 text-saffron-700 text-sm px-3 py-1 rounded-full flex items-center gap-1">
                {lang}
                <button onClick={() => setSelectedLangs((p) => p.filter((l) => l !== lang))} className="hover:text-red-500 ml-1">×</button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Address */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <MapPin size={18} className="text-saffron-500" />
          <h3 className="font-semibold text-gray-800">Address</h3>
        </div>

        <PincodeInput
          value={addrForm.pincode}
          onChange={(v) => setAddrForm((p) => ({ ...p, pincode: v }))}
          onFill={({ state, city, district, lat, lng }) => {
            setAddrForm((p) => ({ ...p, state, city, district }));
            if (lat && lng) setCoords({ lat, lng });
          }}
        />

        {addrForm.state && (
          <div className="grid grid-cols-3 gap-3">
            {[['state','State'],['city','City'],['district','District']].map(([f,l]) => (
              <div key={f}>
                <label className="label text-xs">{l}</label>
                <input className="input bg-saffron-50 text-sm" value={addrForm[f]}
                  onChange={(e) => setAddrForm((p) => ({ ...p, [f]: e.target.value }))} />
              </div>
            ))}
          </div>
        )}

        <div>
          <label className="label">Full Address</label>
          <textarea className="input min-h-[60px] resize-none text-sm" value={addrForm.address}
            onChange={(e) => setAddrForm((p) => ({ ...p, address: e.target.value }))}
            placeholder="House/flat, street, locality..." />
        </div>

        {/* Map */}
        <div>
          <label className="label">Pin Location on Map</label>
          <p className="text-xs text-gray-400 mb-2">Drag the pin or click on the map to set your exact location</p>
          <div className="rounded-xl overflow-hidden border border-gray-200" style={{ height: 320 }}>
            <MapPicker lat={coords.lat} lng={coords.lng} onPinMove={onPinMove} />
          </div>
          {coords.lat && (
            <p className="text-xs text-gray-400 mt-1.5">
              Coordinates: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
            </p>
          )}
        </div>
      </div>

      {/* Service Coverage Settings */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <MapPin size={18} className="text-saffron-500" />
          <h3 className="font-semibold text-gray-800">Service Coverage Area</h3>
        </div>
        <p className="text-xs text-gray-500">Define the area where you are willing to travel for pooja services. Admin will use this to assign you to bookings within your coverage zone.</p>

        <div>
          <label className="label">Coverage Type</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {COVERAGE_OPTIONS.map((opt) => (
              <button key={opt.value} type="button"
                onClick={() => setCoverage((c) => ({ ...c, type: opt.value }))}
                className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all text-left ${coverage.type === opt.value ? 'bg-saffron-500 text-white border-saffron-500' : 'bg-white text-gray-600 border-gray-200 hover:border-saffron-300'}`}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {coverage.type === 'radius' && (
          <div>
            <label className="label">Coverage Radius</label>
            <div className="flex flex-wrap gap-2">
              {RADIUS_OPTIONS.map((r) => (
                <button key={r} type="button"
                  onClick={() => setCoverage((c) => ({ ...c, radiusKm: r }))}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${coverage.radiusKm === r ? 'bg-saffron-500 text-white border-saffron-500' : 'bg-white text-gray-600 border-gray-200 hover:border-saffron-300'}`}>
                  {r} KM
                </button>
              ))}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <label className="text-xs text-gray-500 shrink-0">Custom KM:</label>
              <input type="number" min="1" max="500"
                className="input w-24 text-sm"
                value={coverage.radiusKm}
                onChange={(e) => setCoverage((c) => ({ ...c, radiusKm: Math.max(1, parseInt(e.target.value) || 1) }))} />
            </div>
          </div>
        )}

        <div className="bg-saffron-50 rounded-xl p-3 text-xs text-saffron-700">
          <strong>Current setting:</strong>{' '}
          {coverage.type === 'radius' ? `${coverage.radiusKm} KM radius from your pinned location` :
           coverage.type === 'city'   ? `Entire city (${addrForm.city || 'set your city above'})` :
           coverage.type === 'district' ? `Entire district (${addrForm.district || 'set your district above'})` :
           coverage.type === 'state' ? `Entire state (${addrForm.state || 'set your state above'})` :
           'Pan India (all locations)'}
        </div>
      </div>

      <button onClick={save} disabled={saving} className="btn-primary px-6 py-2.5 flex items-center gap-2">
        <Save size={15} /> {saving ? 'Saving...' : 'Save Languages & Address'}
      </button>
    </div>
  );
}

// ── Tab 3: Education ────────────────────────────────────────────
function EducationTab({ pandit, reload }) {
  const [quals, setQuals] = useState(
    pandit.qualifications?.length > 0
      ? pandit.qualifications
      : [{ category: '', customName: '', description: '', certificationDetails: '', institution: '', passingYear: '' }]
  );
  const [categories, setCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    API.get('/masters/education-masters')
      .then(({ data }) => {
        console.log('Education Masters API Response', data);
        setCategories(data.masters || []);
      })
      .catch((err) => {
        console.error('Education Masters fetch error', err?.response?.data || err.message);
        setCategories([]);
      })
      .finally(() => setLoadingCats(false));
  }, []);

  const setQ = (idx, field, val) => setQuals((prev) => prev.map((q, i) => i === idx ? { ...q, [field]: val } : q));

  const addQual = () => setQuals((p) => [...p, { category: '', customName: '', description: '', certificationDetails: '', institution: '', passingYear: '' }]);
  const removeQual = (idx) => setQuals((p) => p.filter((_, i) => i !== idx));

  const save = async () => {
    const valid = quals.filter((q) => q.category.trim());
    if (valid.length === 0) { toast.error('Add at least one qualification'); return; }
    setSaving(true);
    try {
      await API.patch('/pandits/me/qualifications', { qualifications: valid });
      await reload();
      toast.success('Education saved');
    } catch { toast.error('Failed to save'); } finally { setSaving(false); }
  };

  const allowsCustom = (catName) => {
    const cat = categories.find((c) => c.name === catName);
    return cat?.allowCustom;
  };

  return (
    <div className="space-y-4">
      {loadingCats ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="animate-pulse h-8 bg-gray-100 rounded-xl w-48" />
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5 text-sm text-yellow-800">
          Education categories are not set up yet. Please ask the admin to add education categories before filling this section.
        </div>
      ) : (
        <>
          {quals.map((q, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-700">Qualification #{idx + 1}</h4>
                {quals.length > 1 && (
                  <button onClick={() => removeQual(idx)} className="text-red-400 hover:text-red-600 p-1">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              <div>
                <label className="label">Qualification Category *</label>
                <select className="input" value={q.category} onChange={(e) => setQ(idx, 'category', e.target.value)}>
                  <option value="">Select category</option>
                  {categories.map((c) => <option key={c._id} value={c.name}>{c.name}</option>)}
                </select>
              </div>

              {/* Show custom entry only if the selected category allows it */}
              {q.category && allowsCustom(q.category) && (
                <div className="space-y-3 border-l-4 border-saffron-200 pl-4">
                  <div>
                    <label className="label">Custom Qualification Name *</label>
                    <input className="input" value={q.customName} onChange={(e) => setQ(idx, 'customName', e.target.value)} placeholder="Enter qualification name" />
                  </div>
                  <div>
                    <label className="label">Description</label>
                    <textarea className="input min-h-[60px] resize-none text-sm" value={q.description}
                      onChange={(e) => setQ(idx, 'description', e.target.value)} placeholder="Describe this qualification..." />
                  </div>
                  <div>
                    <label className="label">Certification Details</label>
                    <input className="input" value={q.certificationDetails} onChange={(e) => setQ(idx, 'certificationDetails', e.target.value)} placeholder="Certificate number or issuing body" />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Institution / University</label>
                  <input className="input" value={q.institution} onChange={(e) => setQ(idx, 'institution', e.target.value)} placeholder="e.g. Banaras Hindu University" />
                </div>
                <div>
                  <label className="label">Passing Year</label>
                  <input type="number" className="input" value={q.passingYear} onChange={(e) => setQ(idx, 'passingYear', e.target.value)}
                    placeholder="e.g. 2005" min="1950" max={new Date().getFullYear()} />
                </div>
              </div>
            </div>
          ))}

          <button onClick={addQual} className="w-full border-2 border-dashed border-saffron-200 text-saffron-600 rounded-2xl py-3 flex items-center justify-center gap-2 hover:bg-saffron-50 transition-colors text-sm font-medium">
            <Plus size={16} /> Add More Qualification
          </button>

          <button onClick={save} disabled={saving} className="btn-primary px-6 py-2.5 flex items-center gap-2">
            <Save size={15} /> {saving ? 'Saving...' : 'Save Education'}
          </button>
        </>
      )}
    </div>
  );
}

// ── Tab 4: Experience & Specializations ────────────────────────
function ExperienceTab({ pandit, reload }) {
  const [overall,       setOverall]       = useState(pandit.experience || '');
  const [specs,         setSpecs]         = useState(
    pandit.specializations?.length > 0
      ? pandit.specializations
      : [{ name: '', yearsOfExperience: '' }]
  );
  const [specMasters,   setSpecMasters]   = useState([]);
  const [loadingMasters,setLoadingMasters]= useState(true);
  const [saving,        setSaving]        = useState(false);

  useEffect(() => {
    API.get('/masters/specialization-masters')
      .then(({ data }) => {
        console.log('Specialization Masters API Response', data);
        setSpecMasters(data.masters || []);
      })
      .catch((err) => {
        console.error('Specialization Masters fetch error', err?.response?.data || err.message);
        setSpecMasters([]);
      })
      .finally(() => setLoadingMasters(false));
  }, []);

  const panditAge = pandit.dob
    ? Math.floor((Date.now() - new Date(pandit.dob)) / (365.25 * 864e5))
    : null;

  const setS = (idx, field, val) => setSpecs((p) => p.map((s, i) => i === idx ? { ...s, [field]: val } : s));
  const addSpec = () => setSpecs((p) => [...p, { name: '', yearsOfExperience: '' }]);
  const removeSpec = (idx) => setSpecs((p) => p.filter((_, i) => i !== idx));

  // Avoid duplicate selections
  const usedNames = (currentIdx) => specs
    .filter((_, i) => i !== currentIdx)
    .map((s) => s.name)
    .filter(Boolean);

  const save = async () => {
    const valid = specs.filter((s) => s.name.trim());
    if (valid.length === 0) { toast.error('Add at least one specialization'); return; }

    if (panditAge !== null) {
      for (const s of valid) {
        if (+s.yearsOfExperience > panditAge) {
          toast.error(`Experience in "${s.name}" cannot exceed your age (${panditAge} years)`);
          return;
        }
      }
    }

    setSaving(true);
    try {
      await API.patch('/pandits/me/specializations', {
        specializations: valid.map((s) => ({ name: s.name.trim(), yearsOfExperience: +s.yearsOfExperience || 0 })),
        experience: overall || 0,
      });
      await reload();
      toast.success('Experience & Specializations saved');
    } catch { toast.error('Failed to save'); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      {/* Overall experience */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
        <h3 className="font-semibold text-gray-800">Overall Experience (Optional)</h3>
        <div className="flex items-center gap-3 max-w-xs">
          <input type="number" min="0" className="input flex-1" value={overall}
            onChange={(e) => setOverall(e.target.value)} placeholder="Total years" />
          <span className="text-sm text-gray-500 shrink-0">years</span>
        </div>
      </div>

      {/* Specialization rows */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">Specializations</h3>
          {panditAge && <span className="text-xs text-gray-400">Max experience: {panditAge} years</span>}
        </div>

        {loadingMasters ? (
          <div className="animate-pulse space-y-2">{[1,2].map((i) => <div key={i} className="h-10 bg-gray-100 rounded-xl" />)}</div>
        ) : specMasters.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
            Specialization options are not set up yet. Please ask the admin to add specializations.
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="hidden sm:grid grid-cols-[1fr_140px_40px] gap-3 text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">
              <span>Specialization</span><span>Years of Experience</span><span />
            </div>

            {specs.map((s, idx) => {
              const taken = usedNames(idx);
              const available = specMasters.filter((m) => !taken.includes(m.name));
              return (
                <div key={idx} className="grid grid-cols-1 sm:grid-cols-[1fr_140px_40px] gap-3 items-center">
                  <select
                    className="input text-sm"
                    value={s.name}
                    onChange={(e) => setS(idx, 'name', e.target.value)}
                  >
                    <option value="">Select specialization</option>
                    {/* always show the currently selected option even if "taken" by another row */}
                    {s.name && !available.find((m) => m.name === s.name) && (
                      <option value={s.name}>{s.name}</option>
                    )}
                    {available.map((m) => <option key={m._id} value={m.name}>{m.name}</option>)}
                  </select>
                  <div className="flex items-center gap-2">
                    <input type="number" min="0" className="input text-sm" value={s.yearsOfExperience}
                      onChange={(e) => setS(idx, 'yearsOfExperience', e.target.value)} placeholder="Years" />
                    <span className="text-xs text-gray-400 sm:hidden">yrs</span>
                  </div>
                  {specs.length > 1 ? (
                    <button onClick={() => removeSpec(idx)} className="text-red-400 hover:text-red-600 flex items-center justify-center">
                      <Trash2 size={16} />
                    </button>
                  ) : <div />}
                </div>
              );
            })}

            {specs.length < specMasters.length && (
              <button onClick={addSpec} className="w-full border-2 border-dashed border-saffron-200 text-saffron-600 rounded-xl py-2.5 flex items-center justify-center gap-2 hover:bg-saffron-50 transition-colors text-sm">
                <Plus size={15} /> Add Specialization
              </button>
            )}
          </>
        )}
      </div>

      <button onClick={save} disabled={saving || loadingMasters} className="btn-primary px-6 py-2.5 flex items-center gap-2">
        <Save size={15} /> {saving ? 'Saving...' : 'Save Experience & Specializations'}
      </button>
    </div>
  );
}

// ── Tab 5: Pooja Services ───────────────────────────────────────
function PoojasTab({ pandit, reload }) {
  const [catalog, setCatalog] = useState([]);
  const [search, setSearch] = useState('');
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [selected, setSelected] = useState(
    new Set((pandit.selectedPoojas || []).map((p) => (typeof p === 'string' ? p : p._id)))
  );
  const [saving, setSaving] = useState(false);
  const [savingCharges, setSavingCharges] = useState(false);

  // charges: { [poojaId]: amount }
  const [charges, setCharges] = useState(() => {
    const map = {};
    (pandit.poojaCharges || []).forEach((c) => {
      const id = typeof c.poojaId === 'string' ? c.poojaId : c.poojaId?._id || c.poojaId;
      if (id) map[id] = c.expectedCharges ?? 0;
    });
    return map;
  });

  // Request new pooja form
  const [showRequest, setShowRequest] = useState(false);
  const [reqForm, setReqForm] = useState({ name: '', description: '', duration: '', categoryId: '' });
  const [categories, setCategories] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [myRequests, setMyRequests] = useState([]);

  useEffect(() => {
    Promise.all([
      API.get('/pandits/catalog-poojas'),
      API.get('/poojas/categories'),
      API.get('/pandit/my-poojas'),
    ]).then(([{ data: c }, { data: cats }, { data: reqs }]) => {
      setCatalog(c.poojas || []);
      setCategories(cats.categories || cats || []);
      setMyRequests(reqs.poojas || []);
    }).catch(() => toast.error('Could not load poojas'))
      .finally(() => setLoadingCatalog(false));
  }, []);

  const togglePooja = (id) => {
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const saveSelection = async () => {
    setSaving(true);
    try {
      await API.patch('/pandits/me/selected-poojas', { selectedPoojas: Array.from(selected) });
      await reload();
      toast.success('Pooja services updated');
    } catch { toast.error('Failed to save'); } finally { setSaving(false); }
  };

  const saveCharges = async () => {
    setSavingCharges(true);
    try {
      const poojaCharges = Object.entries(charges)
        .filter(([id]) => selected.has(id))
        .map(([poojaId, expectedCharges]) => ({ poojaId, expectedCharges: +expectedCharges || 0 }));
      await API.patch('/pandits/me/pooja-charges', { poojaCharges });
      toast.success('Expected charges saved');
    } catch { toast.error('Failed to save charges'); } finally { setSavingCharges(false); }
  };

  const submitRequest = async (e) => {
    e.preventDefault();
    if (!reqForm.name || !reqForm.categoryId) { toast.error('Name and category are required'); return; }
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(reqForm).forEach(([k, v]) => { if (v) fd.append(k, v); });
      const { data } = await API.post('/pandit/my-poojas', fd);
      setMyRequests((p) => [data.pooja, ...p]);
      setReqForm({ name: '', description: '', duration: '', categoryId: '' });
      setShowRequest(false);
      toast.success('Pooja request submitted! Pending admin approval.');
    } catch { toast.error('Failed to submit request'); } finally { setSubmitting(false); }
  };

  const filtered = catalog.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
  const selectedCount = selected.size;

  const STATUS_BADGE = { pending: 'bg-yellow-100 text-yellow-700', approved: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700' };

  return (
    <div className="space-y-5">
      {/* Catalog selection */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="font-semibold text-gray-800">Select Poojas You Offer</h3>
            <p className="text-xs text-gray-400 mt-0.5">Choose from our admin-approved service catalog</p>
          </div>
          {selectedCount > 0 && (
            <span className="bg-saffron-100 text-saffron-700 text-xs font-bold px-3 py-1 rounded-full">
              {selectedCount} selected
            </span>
          )}
        </div>

        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9 text-sm" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search poojas..." />
        </div>

        {loadingCatalog ? (
          <div className="space-y-2">{[1,2,3,4].map((i) => <div key={i} className="h-12 bg-gray-50 rounded-xl animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">No poojas found</div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {filtered.map((p) => {
              const isSelected = selected.has(p._id);
              return (
                <button key={p._id} type="button" onClick={() => togglePooja(p._id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${isSelected ? 'border-saffron-300 bg-saffron-50' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'}`}>
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${isSelected ? 'bg-saffron-500 border-saffron-500' : 'border-gray-300'}`}>
                    {isSelected && <CheckCircle size={12} className="text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                    {p.categoryId?.name && <p className="text-xs text-gray-400">{p.categoryId.name}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    {p.price > 0 && <p className="text-xs font-semibold text-saffron-600">₹{p.price}</p>}
                    {p.duration && <p className="text-xs text-gray-400">{p.duration}</p>}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <button onClick={saveSelection} disabled={saving || loadingCatalog} className="btn-primary px-6 py-2.5 flex items-center gap-2">
          <Save size={15} /> {saving ? 'Saving...' : 'Save Pooja Selection'}
        </button>
      </div>

      {/* Expected charges per selected pooja */}
      {selected.size > 0 && !loadingCatalog && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <div>
            <h3 className="font-semibold text-gray-800">Expected Charges</h3>
            <p className="text-xs text-gray-400 mt-0.5">Set your expected fee for each selected pooja. Admin uses this to compare pandits during assignment.</p>
          </div>
          <div className="space-y-3">
            {catalog.filter((p) => selected.has(p._id)).map((p) => (
              <div key={p._id} className="flex items-center gap-3 p-3 bg-saffron-50 rounded-xl border border-saffron-100">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                  {p.price > 0 && <p className="text-xs text-gray-400">Catalogue price: ₹{p.price}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm text-gray-500 font-medium">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    className="input text-sm w-28 text-right"
                    placeholder="0"
                    value={charges[p._id] ?? ''}
                    onChange={(e) => setCharges((prev) => ({ ...prev, [p._id]: e.target.value }))}
                  />
                </div>
              </div>
            ))}
          </div>
          <button onClick={saveCharges} disabled={savingCharges} className="btn-primary px-6 py-2.5 flex items-center gap-2">
            <Save size={15} /> {savingCharges ? 'Saving...' : 'Save Expected Charges'}
          </button>
        </div>
      )}

      {/* Request new pooja */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-800">Request New Pooja</h3>
            <p className="text-xs text-gray-400 mt-0.5">Know a pooja not in our catalog? Request it for admin review.</p>
          </div>
          <button onClick={() => setShowRequest(!showRequest)}
            className="text-sm text-saffron-600 border border-saffron-200 px-3 py-1.5 rounded-xl hover:bg-saffron-50 flex items-center gap-1.5">
            <Plus size={14} /> Request Pooja
          </button>
        </div>

        {showRequest && (
          <form onSubmit={submitRequest} className="space-y-3 border-t border-gray-100 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Pooja Name *</label>
                <input className="input text-sm" value={reqForm.name}
                  onChange={(e) => setReqForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Mahamrityunjaya Jaap" />
              </div>
              <div>
                <label className="label">Category *</label>
                <select className="input text-sm" value={reqForm.categoryId}
                  onChange={(e) => setReqForm((p) => ({ ...p, categoryId: e.target.value }))}>
                  <option value="">Select category</option>
                  {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="label">Description</label>
              <textarea className="input min-h-[60px] resize-none text-sm" value={reqForm.description}
                onChange={(e) => setReqForm((p) => ({ ...p, description: e.target.value }))} placeholder="Brief description of this pooja..." />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="label">Estimated Duration</label>
                <input className="input text-sm" value={reqForm.duration}
                  onChange={(e) => setReqForm((p) => ({ ...p, duration: e.target.value }))} placeholder="e.g. 2 hours" />
              </div>
              <div className="flex items-end gap-2">
                <button type="submit" disabled={submitting} className="btn-primary px-4 py-2.5 text-sm">
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
                <button type="button" onClick={() => setShowRequest(false)} className="btn-outline px-4 py-2.5 text-sm">Cancel</button>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex gap-2 text-xs text-amber-700">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              Your request will be reviewed by admin. It will appear for bookings only after approval.
            </div>
          </form>
        )}

        {/* Existing requests */}
        {myRequests.length > 0 && (
          <div className="space-y-2 border-t border-gray-100 pt-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">My Requests</p>
            {myRequests.map((r) => (
              <div key={r._id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5">
                <div>
                  <p className="text-sm font-medium text-gray-700">{r.name}</p>
                  {r.adminNote && <p className="text-xs text-red-500 mt-0.5">{r.adminNote}</p>}
                </div>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${STATUS_BADGE[r.approvalStatus] || 'bg-gray-100 text-gray-500'}`}>
                  {r.approvalStatus}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tab 6: Family Information ───────────────────────────────────
function FamilyTab({ pandit, reload }) {
  const fi = pandit.familyInfo || {};
  const [form, setForm] = useState({
    maritalStatus: fi.maritalStatus || '',
    spouseName:    fi.spouseName    || '',
    children:      fi.children      ?? 0,
  });
  const [members, setMembers] = useState(fi.members || []);
  const [saving, setSaving] = useState(false);

  const setF = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));
  const setM = (idx, field, val) => setMembers((p) => p.map((m, i) => i === idx ? { ...m, [field]: val } : m));
  const addMember = () => setMembers((p) => [...p, { name: '', relation: '', age: '' }]);
  const removeMember = (idx) => setMembers((p) => p.filter((_, i) => i !== idx));

  const save = async () => {
    setSaving(true);
    try {
      await API.patch('/pandits/me/family', {
        ...form,
        children: +form.children || 0,
        members: members.filter((m) => m.name.trim()),
      });
      await reload();
      toast.success('Family information saved');
    } catch { toast.error('Failed to save'); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Marital Status</label>
            <select className="input" value={form.maritalStatus} onChange={setF('maritalStatus')}>
              <option value="">Select status</option>
              <option value="single">Single</option>
              <option value="married">Married</option>
              <option value="widowed">Widowed</option>
              <option value="divorced">Divorced</option>
            </select>
          </div>
          <div>
            <label className="label">Number of Children</label>
            <input type="number" min="0" className="input" value={form.children}
              onChange={setF('children')} placeholder="0" />
          </div>
        </div>

        {form.maritalStatus === 'married' && (
          <div>
            <label className="label">Spouse Name</label>
            <input className="input" value={form.spouseName} onChange={setF('spouseName')} placeholder="Spouse's full name" />
          </div>
        )}
      </div>

      {/* Family members */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <h3 className="font-semibold text-gray-800">Family Members</h3>
        {members.map((m, idx) => (
          <div key={idx} className="grid grid-cols-[1fr_1fr_80px_40px] gap-3 items-end">
            <div>
              {idx === 0 && <label className="label text-xs">Name</label>}
              <input className="input text-sm" value={m.name} onChange={(e) => setM(idx, 'name', e.target.value)} placeholder="Full name" />
            </div>
            <div>
              {idx === 0 && <label className="label text-xs">Relation</label>}
              <input className="input text-sm" value={m.relation} onChange={(e) => setM(idx, 'relation', e.target.value)} placeholder="e.g. Son, Mother" />
            </div>
            <div>
              {idx === 0 && <label className="label text-xs">Age</label>}
              <input type="number" min="0" className="input text-sm" value={m.age} onChange={(e) => setM(idx, 'age', e.target.value)} placeholder="Age" />
            </div>
            <div className={idx === 0 ? 'pt-5' : ''}>
              <button onClick={() => removeMember(idx)} className="text-red-400 hover:text-red-600">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}

        <button onClick={addMember} className="w-full border-2 border-dashed border-gray-200 text-gray-500 rounded-xl py-2.5 flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors text-sm">
          <Plus size={15} /> Add Family Member
        </button>
      </div>

      <button onClick={save} disabled={saving} className="btn-primary px-6 py-2.5 flex items-center gap-2">
        <Save size={15} /> {saving ? 'Saving...' : 'Save Family Information'}
      </button>
    </div>
  );
}

// ── Tab 7: Bank & UPI Details ───────────────────────────────────
function PaymentTab({ pandit, reload }) {
  const [bankForm, setBankForm] = useState({
    accountHolderName: pandit.bankDetails?.accountHolderName || '',
    accountNumber:     pandit.bankDetails?.accountNumber     || '',
    ifscCode:          pandit.bankDetails?.ifscCode          || '',
    bankName:          pandit.bankDetails?.bankName          || '',
  });
  const [upiId, setUpiId] = useState(pandit.upiDetails?.upiId || '');
  const [upiVerified, setUpiVerified] = useState({
    isVerified:   pandit.upiDetails?.isVerified   || false,
    verifiedName: pandit.upiDetails?.verifiedName || '',
    bankName:     pandit.upiDetails?.bankName     || '',
  });
  const [verifying, setVerifying] = useState(false);
  const [savingBank, setSavingBank] = useState(false);
  const [savingUPI, setSavingUPI] = useState(false);

  const setB = (f) => (e) => setBankForm((p) => ({ ...p, [f]: e.target.value }));

  const saveBank = async () => {
    setSavingBank(true);
    try {
      await API.patch('/pandits/me/bank', bankForm);
      await reload();
      toast.success('Bank details saved');
    } catch { toast.error('Failed to save'); } finally { setSavingBank(false); }
  };

  const verifyUPI = async () => {
    if (!upiId.trim()) { toast.error('Enter UPI ID first'); return; }
    setVerifying(true);
    try {
      const { data } = await API.post('/pandits/me/verify-upi', { upiId: upiId.trim() });
      setUpiVerified({ isVerified: true, verifiedName: data.verifiedName, bankName: data.bankName });
      toast.success('UPI ID verified!');
    } catch (err) {
      setUpiVerified({ isVerified: false, verifiedName: '', bankName: '' });
      toast.error(err.response?.data?.message || 'Verification failed');
    } finally { setVerifying(false); }
  };

  const saveUPI = async () => {
    setSavingUPI(true);
    try {
      await API.patch('/pandits/me/upi', {
        upiId: upiId.trim(),
        ...upiVerified,
      });
      await reload();
      toast.success('UPI details saved');
    } catch { toast.error('Failed to save'); } finally { setSavingUPI(false); }
  };

  return (
    <div className="space-y-5">
      {/* Bank Details */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <CreditCard size={18} className="text-saffron-500" />
          <h3 className="font-semibold text-gray-800">Bank Account Details</h3>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-sm text-blue-700">
          Bank details are used for processing payouts. They are stored securely and never shared.
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Account Holder Name</label>
            <input className="input" value={bankForm.accountHolderName} onChange={setB('accountHolderName')} placeholder="As per bank records" />
          </div>
          <div>
            <label className="label">Bank Name</label>
            <input className="input" value={bankForm.bankName} onChange={setB('bankName')} placeholder="e.g. SBI, HDFC" />
          </div>
        </div>
        <div>
          <label className="label">Account Number</label>
          <input className="input" value={bankForm.accountNumber} onChange={setB('accountNumber')} placeholder="Your bank account number" />
        </div>
        <div>
          <label className="label">IFSC Code</label>
          <input className="input uppercase" value={bankForm.ifscCode}
            onChange={(e) => setBankForm((p) => ({ ...p, ifscCode: e.target.value.toUpperCase() }))}
            placeholder="e.g. SBIN0001234" maxLength={11} />
        </div>
        <button onClick={saveBank} disabled={savingBank} className="btn-primary px-6 py-2.5 flex items-center gap-2">
          <Save size={15} /> {savingBank ? 'Saving...' : 'Save Bank Details'}
        </button>
      </div>

      {/* UPI Details */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <BadgeCheck size={18} className="text-saffron-500" />
          <h3 className="font-semibold text-gray-800">UPI Details</h3>
        </div>

        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="label">UPI ID</label>
            <input className="input" value={upiId}
              onChange={(e) => { setUpiId(e.target.value); setUpiVerified({ isVerified: false, verifiedName: '', bankName: '' }); }}
              placeholder="e.g. name@paytm or 9876543210@upi" />
          </div>
          <button onClick={verifyUPI} disabled={verifying || !upiId.trim()}
            className="btn-outline px-4 py-2.5 text-sm flex items-center gap-2 shrink-0 mb-0.5">
            {verifying ? <><RefreshCw size={14} className="animate-spin" /> Verifying...</>
                       : <><BadgeCheck size={14} /> Verify UPI</>}
          </button>
        </div>

        {/* Verified result */}
        {upiVerified.isVerified && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-green-600" />
              <span className="text-sm font-semibold text-green-700">Verified Successfully</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-xs text-gray-400">Account Holder</p>
                <p className="font-semibold text-gray-800">{upiVerified.verifiedName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Bank</p>
                <p className="font-semibold text-gray-800">{upiVerified.bankName}</p>
              </div>
            </div>
          </div>
        )}

        {!upiVerified.isVerified && upiId && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex gap-2 text-xs text-amber-700">
            <Info size={14} className="shrink-0 mt-0.5" />
            UPI not verified. Click "Verify UPI" to confirm your account details.
          </div>
        )}

        <button onClick={saveUPI} disabled={savingUPI} className="btn-primary px-6 py-2.5 flex items-center gap-2">
          <Save size={15} /> {savingUPI ? 'Saving...' : 'Save UPI Details'}
        </button>
      </div>

      
    </div>
  );
}

// ── Tab 8: KYC Verification ─────────────────────────────────────
const GOVT_ID_OPTIONS = [
  { value: 'aadhaar',  label: 'Aadhaar Card' },
  { value: 'pan',      label: 'PAN Card' },
  { value: 'passport', label: 'Passport' },
  { value: 'voter',    label: 'Voter ID' },
  { value: 'driving',  label: 'Driving Licence' },
];

function KycVerificationTab({ pandit, reload }) {
  const kycStatus = pandit.kycStatus || 'not_submitted';
  const canEdit   = ['not_submitted', 'rejected', 'reupload_required'].includes(kycStatus);

  const [form, setForm]               = useState({ govtIdType: pandit.govtIdType || '', govtIdNumber: '' });
  const [files, setFiles]             = useState({ frontImage: null, backImage: null, selfieImage: null, addressProof: null });
  const [previews, setPreviews]       = useState({});
  const [submitting, setSubmitting]   = useState(false);

  const setF = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const handleFile = (field) => (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFiles((p) => ({ ...p, [field]: file }));
    const reader = new FileReader();
    reader.onload = () => setPreviews((p) => ({ ...p, [field]: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.govtIdType) { toast.error('Select a Government ID type'); return; }
    if (!files.frontImage && !pandit.kycFrontImage) { toast.error('Front image of document is required'); return; }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('govtIdType', form.govtIdType);
      if (form.govtIdNumber) fd.append('govtIdNumber', form.govtIdNumber);
      if (files.frontImage)   fd.append('frontImage',   files.frontImage);
      if (files.backImage)    fd.append('backImage',    files.backImage);
      if (files.selfieImage)  fd.append('selfieImage',  files.selfieImage);
      if (files.addressProof) fd.append('addressProof', files.addressProof);

      await API.post('/pandits/me/kyc', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      await reload();
      toast.success('KYC submitted! Awaiting admin verification.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const FileUploadField = ({ field, label, required, existingUrl }) => (
    <div>
      <label className="label">{label}{required && ' *'}</label>
      <label className={`flex items-center gap-3 border-2 border-dashed rounded-xl p-4 cursor-pointer transition-colors ${files[field] ? 'border-saffron-400 bg-saffron-50' : 'border-gray-200 hover:border-saffron-300 hover:bg-saffron-50'}`}>
        <Upload size={18} className="text-saffron-500 shrink-0" />
        <span className="text-sm text-gray-600 flex-1 truncate">
          {files[field] ? files[field].name : (existingUrl ? '✓ Already uploaded (re-upload to replace)' : `Upload ${label} (JPG/PNG)`)}
        </span>
        <input type="file" accept="image/*" className="hidden" onChange={handleFile(field)} disabled={!canEdit} />
      </label>
      {previews[field] && (
        <img src={previews[field]} alt={label} className="mt-2 max-h-28 rounded-xl border border-gray-200 object-contain" />
      )}
      {!previews[field] && existingUrl && (
        <a href={`http://localhost:5000/${existingUrl}`} target="_blank" rel="noopener noreferrer"
          className="mt-1 text-xs text-saffron-600 hover:underline flex items-center gap-1">
          <FileText size={12} /> View uploaded file
        </a>
      )}
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Status card */}
      <div className={`rounded-2xl border p-5 flex items-start gap-4 ${
        kycStatus === 'approved'          ? 'bg-green-50 border-green-200' :
        kycStatus === 'submitted'         ? 'bg-blue-50 border-blue-200'  :
        kycStatus === 'rejected'          ? 'bg-red-50 border-red-200'    :
        kycStatus === 'reupload_required' ? 'bg-purple-50 border-purple-200' :
        'bg-gray-50 border-gray-200'
      }`}>
        {kycStatus === 'approved'          && <ShieldCheck  size={28} className="text-green-600 shrink-0" />}
        {kycStatus === 'submitted'         && <Clock        size={28} className="text-blue-600 shrink-0" />}
        {kycStatus === 'rejected'          && <XCircle      size={28} className="text-red-600 shrink-0" />}
        {kycStatus === 'reupload_required' && <Upload       size={28} className="text-purple-600 shrink-0" />}
        {kycStatus === 'not_submitted'     && <FileText     size={28} className="text-gray-500 shrink-0" />}
        <div className="flex-1">
          <p className="font-bold text-gray-800">{KYC_STATUS_CONFIG[kycStatus]?.label}</p>
          {kycStatus === 'not_submitted'     && <p className="text-sm text-gray-600 mt-0.5">Upload your government ID to start the verification process.</p>}
          {kycStatus === 'submitted'         && <p className="text-sm text-gray-600 mt-0.5">Documents submitted. Our team will review within 1–2 business days.</p>}
          {kycStatus === 'approved'          && <p className="text-sm text-green-700 mt-0.5">Your KYC is verified! You are eligible to receive bookings.</p>}
          {(kycStatus === 'rejected' || kycStatus === 'reupload_required') && pandit.kycRejectionReason && (
            <p className="text-sm mt-1"><span className="font-semibold">Reason: </span>{pandit.kycRejectionReason}</p>
          )}
        </div>
      </div>

      {/* Upload form — show when canEdit */}
      {canEdit && (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <FileText size={16} className="text-saffron-500" /> Document Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Government ID Type *</label>
                <select className="input" value={form.govtIdType} onChange={setF('govtIdType')} required>
                  <option value="">Select ID type</option>
                  {GOVT_ID_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Document Number (optional)</label>
                <input className="input" value={form.govtIdNumber} onChange={setF('govtIdNumber')}
                  placeholder="e.g. XXXX XXXX XXXX" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Upload size={16} className="text-saffron-500" /> Upload Documents
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FileUploadField field="frontImage"   label="Front Image"          required existingUrl={pandit.kycFrontImage} />
              <FileUploadField field="backImage"    label="Back Image"           required={false} existingUrl={pandit.kycBackImage} />
              <FileUploadField field="selfieImage"  label="Selfie with Document" required={false} existingUrl={pandit.kycSelfieImage} />
              <FileUploadField field="addressProof" label="Address Proof"        required={false} existingUrl={pandit.kycAddressProof} />
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex gap-2 text-xs text-amber-700">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              Upload clear images. Blurry or incomplete documents will be rejected. Max file size: 10MB.
            </div>
          </div>

          <button type="submit" disabled={submitting} className="btn-primary px-6 py-2.5 flex items-center gap-2">
            <ShieldCheck size={15} /> {submitting ? 'Submitting...' : 'Submit KYC Documents'}
          </button>
        </form>
      )}

      {/* Read-only view when submitted/approved */}
      {!canEdit && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <h3 className="font-semibold text-gray-800">Submitted Documents</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              ['Front Image',          pandit.kycFrontImage],
              ['Back Image',           pandit.kycBackImage],
              ['Selfie with Document', pandit.kycSelfieImage],
              ['Address Proof',        pandit.kycAddressProof],
            ].map(([label, url]) => url && (
              <div key={label} className="bg-saffron-50 border border-saffron-100 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1">{label}</p>
                <a href={`http://localhost:5000/${url}`} target="_blank" rel="noopener noreferrer"
                  className="text-sm text-saffron-600 hover:underline flex items-center gap-1.5">
                  <FileText size={13} /> View Document
                </a>
              </div>
            ))}
            <div className="bg-saffron-50 border border-saffron-100 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1">ID Type</p>
              <p className="font-semibold text-gray-700 capitalize">{pandit.govtIdType || '—'}</p>
            </div>
            {pandit.govtIdNumber && (
              <div className="bg-saffron-50 border border-saffron-100 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1">Document Number</p>
                <p className="font-semibold text-gray-700">{pandit.govtIdNumber}</p>
              </div>
            )}
          </div>
          {kycStatus === 'submitted' && (
            <p className="text-xs text-blue-600 bg-blue-50 rounded-xl p-3 border border-blue-100">
              Documents are being reviewed. You will receive a notification once the review is complete.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Profile Tab Shell (vertical accordion) ──────────────────────
function ProfileTab({ pandit, reload }) {
  const [open, setOpen] = useState({ personal: true });
  const toggle = (id) => setOpen((prev) => ({ ...prev, [id]: !prev[id] }));

  const CONTENT = {
    personal:   <PersonalDetailsTab   pandit={pandit} reload={reload} />,
    address:    <LanguagesAddressTab  pandit={pandit} reload={reload} />,
    education:  <EducationTab         pandit={pandit} reload={reload} />,
    experience: <ExperienceTab        pandit={pandit} reload={reload} />,
    poojas:     <PoojasTab            pandit={pandit} reload={reload} />,
    family:     <FamilyTab            pandit={pandit} reload={reload} />,
    payment:    <PaymentTab           pandit={pandit} reload={reload} />,
    kyc:        <KycVerificationTab   pandit={pandit} reload={reload} />,
  };

  return (
    <div className="animate-fade-in space-y-3">
      <h2 className="text-xl font-bold" style={{ color: '#1B1F3B' }}>My Profile</h2>
      {PROFILE_TABS.map(({ id, label, icon: Icon }) => {
        const kycStatus = pandit.kycStatus || 'not_submitted';
        const kycBadge = id === 'kyc' ? KYC_STATUS_CONFIG[kycStatus] : null;
        return (
        <div key={id} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <button
            onClick={() => toggle(id)}
            className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors"
            style={open[id] ? { background: '#1B1F3B', color: 'white' } : { color: '#1B1F3B' }}
          >
            <div className="flex items-center gap-3">
              <Icon size={17} />
              <span className="font-semibold text-sm">{label}</span>
              {kycBadge && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${open[id] ? 'bg-white/20 text-white' : kycBadge.color}`}>
                  {kycBadge.label}
                </span>
              )}
            </div>
            <svg
              className="w-4 h-4 transition-transform shrink-0"
              style={{ transform: open[id] ? 'rotate(180deg)' : 'rotate(0deg)' }}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {open[id] && (
            <div className="p-4 border-t border-gray-100">
              {CONTENT[id]}
            </div>
          )}
        </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function PanditDashboard() {
  const [pandit,   setPandit]   = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'overview';

  const load = useCallback(() =>
    API.get('/pandits/me')
      .then(({ data }) => setPandit(data.pandit))
      .catch(() => toast.error('Could not load profile'))
      .finally(() => setLoading(false)),
  []);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="animate-spin text-4xl">🪔</div>
    </div>
  );

  if (!pandit) return (
    <div className="flex items-center justify-center py-24 text-center px-4" style={{ color: 'var(--t-muted)' }}>
      <div>
        <p className="text-xl mb-4">Pandit profile not found.</p>
        <Link to="/register" className="btn-primary">Register as Pandit</Link>
      </div>
    </div>
  );

  // Only block fully-suspended or rejected accounts
  if (pandit.status === 'rejected' || pandit.status === 'suspended') {
    return <ApplicationGate pandit={pandit} />;
  }

  const goToKYC = () => {
    // Navigate to profile tab, open KYC accordion
    window.location.href = window.location.pathname + '?tab=profile';
  };

  return (
    <div className="p-4 md:p-6">
      {/* Banner visible until profile 70%+ AND KYC approved */}
      {tab !== 'profile' && (
        <IncompleteBanner pandit={pandit} onGoToKYC={goToKYC} />
      )}

      {tab === 'overview'     && <OverviewTab     pandit={pandit} reload={load} />}
      {tab === 'profile'      && <ProfileTab      pandit={pandit} reload={load} />}
      {tab === 'bookings'     && <BookingsTab />}
      {tab === 'availability' && <AvailabilityManager pandit={pandit} onReload={load} />}
      {tab === 'festivals'    && <FestivalsTab />}
      {tab === 'earnings'     && <EarningsTab     pandit={pandit} />}
    </div>
  );
}
