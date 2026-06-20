import React, { useEffect, useState } from 'react';
import { Calendar, Clock, Hash, User, BookOpen, CheckCircle, Sparkles, Star } from 'lucide-react';
import API from '../api/axios';
import toast from 'react-hot-toast';

const STATUS_META = {
  pending_payment:      { label: 'Pending Payment',   color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200',   bar: 'bg-amber-400',   step: 0 },
  paid:                 { label: 'Confirmed',          color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200',    bar: 'bg-blue-500',    step: 1 },
  pandit_assigned:      { label: 'Pandit Assigned',   color: 'text-purple-700',  bg: 'bg-purple-50',  border: 'border-purple-200',  bar: 'bg-purple-500',  step: 2 },
  pandit_accepted:      { label: 'Pandit Confirmed',  color: 'text-teal-700',    bg: 'bg-teal-50',    border: 'border-teal-200',    bar: 'bg-teal-500',    step: 2 },
  pending_reassignment: { label: 'Finding Pandit',    color: 'text-orange-700',  bg: 'bg-orange-50',  border: 'border-orange-200',  bar: 'bg-orange-400',  step: 1 },
  completion_requested: { label: 'Verifying',         color: 'text-indigo-700',  bg: 'bg-indigo-50',  border: 'border-indigo-200',  bar: 'bg-indigo-400',  step: 3 },
  completed:            { label: 'Completed',         color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', bar: 'bg-emerald-500', step: 4 },
  cancelled:            { label: 'Cancelled',         color: 'text-red-700',     bg: 'bg-red-50',     border: 'border-red-200',     bar: 'bg-red-400',     step: -1 },
};

const JOURNEY_STEPS = [
  { id: 0, label: 'Booked' },
  { id: 1, label: 'Confirmed' },
  { id: 2, label: 'Assigned' },
  { id: 3, label: 'Verifying' },
  { id: 4, label: 'Complete' },
];

const FILTERS = [
  { value: '',                      label: 'All Bookings'  },
  { value: 'paid',                  label: 'Confirmed'     },
  { value: 'pandit_assigned',       label: 'Assigned'      },
  { value: 'pandit_accepted',       label: 'Confirmed'     },
  { value: 'completed',             label: 'Completed'     },
  { value: 'cancelled',             label: 'Cancelled'     },
];

function JourneyTracker({ status }) {
  if (status === 'cancelled') {
    return (
      <div className="flex items-center gap-2 text-xs text-red-500 font-semibold">
        <div className="w-2 h-2 rounded-full bg-red-400" />
        Booking Cancelled
      </div>
    );
  }
  if (status === 'pending_reassignment') {
    return (
      <div className="flex items-center gap-2 text-xs text-orange-600 font-semibold">
        <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
        Finding the right pandit for you…
      </div>
    );
  }
  const step = STATUS_META[status]?.step ?? 0;
  return (
    <div className="flex items-center gap-0">
      {JOURNEY_STEPS.map((s, i) => (
        <React.Fragment key={s.id}>
          <div className="flex flex-col items-center gap-1">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all text-[10px] font-bold ${
              i < step  ? 'border-gold-400 bg-gold-400 text-indigo-800' :
              i === step ? 'border-indigo-600 bg-indigo-600 text-white' :
                           'border-gray-200 bg-white text-gray-300'
            }`}>
              {i < step ? <CheckCircle size={11} /> : i + 1}
            </div>
            <span className={`text-[9px] font-semibold whitespace-nowrap ${
              i <= step ? 'text-indigo-700' : 'text-gray-300'
            }`}>{s.label}</span>
          </div>
          {i < JOURNEY_STEPS.length - 1 && (
            <div className={`w-6 h-0.5 mb-4 transition-all ${i < step ? 'bg-gold-400' : 'bg-gray-200'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function StarRating({ bookingId, onRated }) {
  const [hovered,    setHovered]    = useState(0);
  const [selected,   setSelected]   = useState(0);
  const [review,     setReview]     = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!selected) { toast.error('Please select a star rating'); return; }
    setSubmitting(true);
    try {
      await API.post(`/bookings/${bookingId}/rate`, { rating: selected, review });
      toast.success('Thank you for your rating!');
      onRated();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
      <p className="text-sm font-bold text-gray-800">Rate your experience</p>
      <div className="flex gap-1">
        {[1,2,3,4,5].map((s) => (
          <button key={s} type="button"
            onMouseEnter={() => setHovered(s)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => setSelected(s)}
            className="transition-transform hover:scale-110"
          >
            <Star
              size={28}
              className={`transition-colors ${s <= (hovered || selected) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`}
            />
          </button>
        ))}
        {selected > 0 && (
          <span className="ml-2 text-sm font-semibold text-gray-600 self-center">
            {['','Poor','Fair','Good','Very Good','Excellent'][selected]}
          </span>
        )}
      </div>
      <textarea
        className="w-full text-sm border border-amber-200 rounded-lg p-2.5 resize-none bg-white focus:outline-none focus:ring-2 focus:ring-amber-300"
        rows={2}
        placeholder="Share your experience (optional)…"
        value={review}
        onChange={(e) => setReview(e.target.value)}
      />
      <button
        onClick={submit}
        disabled={submitting || !selected}
        className="w-full py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50 transition-colors"
        style={{ background: '#1B1F3B' }}
      >
        {submitting ? 'Submitting…' : 'Submit Rating'}
      </button>
    </div>
  );
}

function BookingCard({ b, onReload }) {
  const meta = STATUS_META[b.status] || STATUS_META.pending_payment;
  return (
    <div className="bg-white rounded-2xl overflow-hidden transition-all duration-300 border border-gray-100"
         style={{ boxShadow: '0 2px 20px rgba(0,0,0,0.06)' }}>
      <div className={`h-1 w-full ${meta.bar}`} />

      <div className="p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-2">
              <Hash size={11} className="text-gray-300" />
              <span className="text-xs font-mono text-gray-400">{b.bookingNumber}</span>
            </div>
            <h3 className="font-bold text-gray-900 leading-tight mb-2"
                style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: '1.2rem', letterSpacing: '-0.01em' }}>
              {b.poojaId?.name}
            </h3>
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <Calendar size={13} className="text-indigo-400" />
                {b.scheduledDate?.split('T')[0]}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={13} className="text-indigo-400" />
                {b.scheduledTime}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <span style={{ fontFamily: '"Cormorant Garamond"' }} className="text-2xl font-bold text-gray-900">
              ₹{b.amount?.toLocaleString('en-IN')}
            </span>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${meta.bg} ${meta.color} ${meta.border}`}>
              {meta.label}
            </span>
          </div>
        </div>

        {/* Pandit confirmation notice */}
        {b.status === 'pandit_accepted' && b.panditId && (
          <div className="mt-3 bg-teal-50 border border-teal-100 rounded-xl p-3 text-xs text-teal-700">
            <span className="font-semibold">{b.panditId.name}</span> has confirmed attendance for your ceremony.
          </div>
        )}

        {/* Pending reassignment notice */}
        {b.status === 'pending_reassignment' && (
          <div className="mt-3 bg-orange-50 border border-orange-100 rounded-xl p-3 text-xs text-orange-700">
            We are finding a new pandit for your booking. You will be notified once assigned.
          </div>
        )}

        {/* Journey tracker + pandit */}
        <div className="mt-5 pt-4 border-t border-gray-100 flex items-end justify-between flex-wrap gap-4">
          <JourneyTracker status={b.status} />

          {b.panditId && b.status !== 'pending_reassignment' && (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-indigo-50 flex items-center justify-center border border-indigo-100 shrink-0">
                {b.panditId.profilePhoto
                  ? <img src={`https://zutsav-production.up.railway.app/${b.panditId.profilePhoto}`} className="w-full h-full object-cover" alt="" />
                  : <User size={13} className="text-indigo-400" />}
              </div>
              <div>
                <p className="text-xs text-gray-400">Pandit</p>
                <p className="text-xs font-semibold text-gray-700">{b.panditId.name}</p>
              </div>
            </div>
          )}
        </div>

        {/* Rating section for completed bookings */}
        {b.status === 'completed' && (
          <div className="mt-4 border-t border-gray-100 pt-4">
            {b.rating ? (
              <div className="flex items-center gap-3">
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map((s) => (
                    <Star key={s} size={16} className={s <= b.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'} />
                  ))}
                </div>
                <span className="text-xs text-gray-500">Your rating: <strong>{b.rating}/5</strong></span>
                {b.review && <span className="text-xs text-gray-400 italic truncate">"{b.review}"</span>}
              </div>
            ) : (
              <StarRating bookingId={b._id} onRated={onReload} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100"
         style={{ boxShadow: '0 2px 20px rgba(0,0,0,0.06)' }}>
      <div className="h-1 bg-gray-100" />
      <div className="p-5 space-y-3">
        <div className="skeleton h-3 w-32 rounded" />
        <div className="skeleton h-7 w-56 rounded" />
        <div className="skeleton h-4 w-48 rounded" />
        <div className="pt-4 border-t border-gray-100">
          <div className="skeleton h-8 w-48 rounded" />
        </div>
      </div>
    </div>
  );
}

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('');

  const load = () => {
    setLoading(true);
    API.get(`/bookings/my${filter ? `?status=${filter}` : ''}`)
      .then(({ data }) => setBookings(data.bookings))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  return (
    <div className="min-h-screen" style={{ background: '#FAF7F2' }}>
      {/* Hero */}
      <div className="relative overflow-hidden sacred-pattern" style={{ background: '#1B1F3B' }}>
        <div className="absolute inset-0" style={{ background: 'rgba(27,31,59,0.88)' }} />
        <div className="relative max-w-3xl mx-auto px-4 py-12 md:py-16">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="w-6 h-px" style={{ background: 'rgba(212,175,55,0.5)' }} />
            <span className="text-xs font-bold tracking-widest uppercase" style={{ color: '#D4AF37' }}>Your Sacred Journeys</span>
            <span className="w-6 h-px" style={{ background: 'rgba(212,175,55,0.5)' }} />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white"
              style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', letterSpacing: '-0.02em' }}>
            My Bookings
          </h1>
          <p className="text-white/50 mt-2 text-sm font-sans">Track your ceremony bookings from confirmation to completion</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Filter chips */}
        <div className="flex gap-2 mb-7 flex-wrap">
          {FILTERS.map(({ value, label }) => (
            <button key={value} onClick={() => setFilter(value)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                filter === value
                  ? 'text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
              }`}
              style={filter === value ? { background: '#1B1F3B' } : {}}>
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <LoadingSkeleton key={i} />)}
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5"
                 style={{ background: 'rgba(27,31,59,0.06)' }}>
              <BookOpen size={32} style={{ color: 'rgba(27,31,59,0.35)' }} />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2"
                style={{ fontFamily: '"Cormorant Garamond"' }}>
              No Bookings Yet
            </h3>
            <p className="text-gray-500 text-sm max-w-xs mx-auto mb-6">
              Your sacred journey awaits. Book a pooja ceremony to begin your spiritual experience.
            </p>
            <a href="/poojas"
               className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow-sm"
               style={{ background: '#1B1F3B' }}>
              <Sparkles size={15} /> Explore Poojas
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((b) => <BookingCard key={b._id} b={b} onReload={load} />)}
          </div>
        )}
      </div>
    </div>
  );
}

