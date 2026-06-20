import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, ArrowRight, ArrowLeft, Shield, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import PincodeInput from '../components/shared/PincodeInput';

const STEPS = [
  { id: 0, label: 'Service',  icon: '🙏', desc: 'Review your pooja'     },
  { id: 1, label: 'Details',  icon: '📋', desc: 'Your ceremony details' },
  { id: 2, label: 'Confirm',  icon: '✨', desc: 'Review & pay'          },
];

export default function BookingFlow() {
  const { poojaSlug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step,    setStep]    = useState(0);
  const [pooja,   setPooja]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying,  setPaying]  = useState(false);

  const [details, setDetails] = useState({
    name:          user?.name    || '',
    phone:         user?.phone   || '',
    email:         user?.email   || '',
    address:       '',
    pincode:       user?.pincode || '',
    state:         user?.state   || '',
    city:          user?.city    || '',
    district:      user?.district|| '',
    scheduledDate: '',
    scheduledTime: '',
    language:      'Hindi',
    specialNote:   '',
  });
  const [errors, setErrors] = useState({});

  const set = (field) => (e) => {
    setDetails({ ...details, [field]: e.target.value });
    setErrors({ ...errors, [field]: '' });
  };

  useEffect(() => {
    API.get(`/poojas/${poojaSlug}`)
      .then(({ data }) => setPooja(data.pooja))
      .catch(() => toast.error('Pooja not found'))
      .finally(() => setLoading(false));
  }, [poojaSlug]);

  const validateDetails = () => {
    const e = {};
    if (!details.name)          e.name          = 'Required';
    if (!details.phone)         e.phone         = 'Required';
    else if (!/^[6-9]\d{9}$/.test(details.phone)) e.phone = 'Invalid phone number';
    if (!details.address)       e.address       = 'Required';
    if (!details.pincode)       e.pincode       = 'Required';
    if (!details.scheduledDate) e.scheduledDate = 'Required';
    if (!details.scheduledTime) e.scheduledTime = 'Required';
    return e;
  };

  const handleNext = () => {
    if (step === 1) {
      const errs = validateDetails();
      if (Object.keys(errs).length) { setErrors(errs); return; }
    }
    setStep((s) => s + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePay = async () => {
    setPaying(true);
    try {
      const { data } = await API.post('/bookings/create-phonepe-order', {
        poojaId:       pooja._id,
        scheduledDate: details.scheduledDate,
        scheduledTime: details.scheduledTime,
        language:      details.language,
        specialNote:   details.specialNote,
        userDetails: {
          name: details.name, phone: details.phone, email: details.email,
          address: details.address, pincode: details.pincode,
          state: details.state, city: details.city, district: details.district,
        },
      });
      window.location.href = data.redirectUrl;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed');
      setPaying(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#FAF6EE' }}>
      <div className="text-center">
        <div className="text-5xl animate-float mb-4">🪔</div>
        <p className="text-gray-400 text-sm font-sans">Loading ceremony details...</p>
      </div>
    </div>
  );

  if (!pooja) return (
    <div className="min-h-screen flex items-center justify-center font-sans" style={{ background: '#FAF6EE' }}>
      <p className="text-gray-500">Pooja not found</p>
    </div>
  );

  return (
    <div className="min-h-screen py-10 sacred-pattern" style={{ background: '#FAF6EE' }}>
      <div className="max-w-2xl mx-auto px-4">

        {/* ── Step progress indicator ─────────────────────── */}
        <div className="mb-10">
          <div className="flex items-center justify-between relative">
            {/* Connecting track */}
            <div className="absolute top-[1.375rem] left-0 right-0 h-0.5 bg-gray-200 z-0">
              <div
                className="h-full bg-gradient-to-r from-saffron-500 to-saffron-400 transition-all duration-500"
                style={{ width: step === 0 ? '0%' : step === 1 ? '50%' : '100%' }}
              />
            </div>

            {STEPS.map((s) => (
              <div key={s.id} className="flex flex-col items-center gap-2 relative z-10">
                {/* Step circle */}
                <div className={`w-11 h-11 rounded-full flex items-center justify-center text-lg transition-all duration-400 ${
                  s.id < step
                    ? 'bg-saffron-500 shadow-glow-saffron'
                    : s.id === step
                      ? 'shadow-glow-saffron'
                      : 'bg-white border-2 border-gray-200'
                }`}
                  style={s.id === step ? { background: 'linear-gradient(135deg, #FF6B00, #ff9020)' } : {}}
                >
                  {s.id < step
                    ? <CheckCircle size={20} className="text-white" />
                    : <span>{s.icon}</span>
                  }
                </div>
                {/* Label */}
                <div className="text-center">
                  <p className={`text-xs font-bold font-sans ${s.id <= step ? 'text-saffron-600' : 'text-gray-400'}`}>{s.label}</p>
                  <p className="text-[10px] text-gray-400 hidden sm:block font-sans">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Step 0: Service Overview ────────────────────── */}
        {step === 0 && (
          <div className="bg-white rounded-3xl shadow-premium overflow-hidden animate-fade-in">
            {/* Pooja hero image or gradient header */}
            {pooja.image ? (
              <div className="h-48 overflow-hidden relative">
                <img src={`https://zutsav-production.up.railway.app/${pooja.image}`} alt={pooja.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-4 left-5 right-5">
                  <h2 className="font-display font-bold text-white text-2xl leading-tight" style={{ letterSpacing: '-0.02em' }}>{pooja.name}</h2>
                </div>
              </div>
            ) : (
              <div className="h-36 flex items-center justify-center relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #FF6B00, #ff9020)' }}>
                <div className="absolute inset-0 sacred-pattern opacity-20" />
                <span className="text-6xl relative z-10">🪔</span>
              </div>
            )}

            <div className="p-6 md:p-8">
              {!pooja.image && (
                <h2 className="font-display font-bold text-gray-900 text-2xl mb-1 leading-tight" style={{ letterSpacing: '-0.02em' }}>{pooja.name}</h2>
              )}
              {pooja.shortDesc && (
                <p className="text-gray-500 text-sm leading-relaxed mt-2 font-sans">{pooja.shortDesc}</p>
              )}

              {/* Duration */}
              {pooja.duration && (
                <div className="flex items-center gap-2 mt-3 text-gray-400 text-sm font-sans">
                  <Clock size={14} className="text-saffron-400" />
                  <span>{pooja.duration}</span>
                </div>
              )}

              {/* Description */}
              {pooja.description && (
                <div className="mt-5">
                  <h4 className="font-semibold text-gray-800 text-sm mb-2 font-sans">About this Ceremony</h4>
                  <p className="text-sm text-gray-500 leading-relaxed font-sans">{pooja.description}</p>
                </div>
              )}

              {/* Requirements */}
              {pooja.requirements?.length > 0 && (
                <div className="mt-5 p-4 rounded-2xl border border-saffron-100" style={{ background: '#fff8f0' }}>
                  <h4 className="font-semibold text-saffron-700 text-sm mb-3 font-sans">Samagri Required</h4>
                  <ul className="space-y-1.5">
                    {pooja.requirements.map((r, i) => (
                      <li key={i} className="text-sm text-gray-600 flex items-center gap-2 font-sans">
                        <span className="w-1.5 h-1.5 rounded-full bg-saffron-400 shrink-0" />{r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Benefits */}
              {pooja.benefits?.length > 0 && (
                <div className="mt-4 p-4 rounded-2xl border border-emerald-100 bg-emerald-50">
                  <h4 className="font-semibold text-emerald-700 text-sm mb-3 font-sans">Spiritual Benefits</h4>
                  <ul className="space-y-1.5">
                    {pooja.benefits.map((b, i) => (
                      <li key={i} className="text-sm text-gray-600 flex items-center gap-2 font-sans">
                        <CheckCircle size={13} className="text-emerald-500 shrink-0" />{b}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Price + CTA */}
              <div className="flex items-center justify-between mt-6 pt-5 border-t border-gray-100">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5 font-sans">Total ceremony fee</p>
                  <span className="font-display text-3xl font-bold text-saffron-600" style={{ letterSpacing: '-0.02em' }}>
                    ₹{pooja.price.toLocaleString('en-IN')}
                  </span>
                </div>
                <button onClick={handleNext} className="btn-primary inline-flex items-center gap-2 px-6 py-3 text-base font-sans">
                  Continue <ArrowRight size={17} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 1: Ceremony Details ────────────────────── */}
        {step === 1 && (
          <div className="bg-white rounded-3xl shadow-premium p-6 md:p-8 animate-fade-in">
            <div className="flex items-center gap-3 mb-7">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl"
                style={{ background: 'linear-gradient(135deg, #FF6B00, #ff9020)' }}>
                📋
              </div>
              <div>
                <h2 className="font-display font-bold text-gray-900 text-2xl" style={{ letterSpacing: '-0.02em' }}>Your Details</h2>
                <p className="text-xs text-gray-400 font-sans">Tell us about you and your ceremony</p>
              </div>
            </div>

            <div className="space-y-5">
              {/* Name + phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Full Name *</label>
                  <input
                    className={`input font-sans ${errors.name ? 'border-red-400 focus:ring-red-200' : ''}`}
                    value={details.name} onChange={set('name')} placeholder="Your full name"
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1 font-sans">{errors.name}</p>}
                </div>
                <div>
                  <label className="label">Phone Number *</label>
                  <input
                    className={`input font-sans ${errors.phone ? 'border-red-400 focus:ring-red-200' : ''}`}
                    value={details.phone}
                    onChange={(e) => { const v = e.target.value.replace(/\D/,'').slice(0,10); setDetails({...details,phone:v}); setErrors({...errors,phone:''}); }}
                    placeholder="10-digit mobile" maxLength={10}
                  />
                  {errors.phone && <p className="text-red-500 text-xs mt-1 font-sans">{errors.phone}</p>}
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="label">Ceremony Address *</label>
                <textarea
                  rows={2}
                  className={`input resize-none font-sans ${errors.address ? 'border-red-400 focus:ring-red-200' : ''}`}
                  value={details.address} onChange={set('address')}
                  placeholder="House no., street, area, landmark..."
                />
                {errors.address && <p className="text-red-500 text-xs mt-1 font-sans">{errors.address}</p>}
              </div>

              {/* Pincode */}
              <div>
                <label className="label">Pincode *</label>
                <PincodeInput
                  value={details.pincode}
                  onChange={(v) => setDetails({ ...details, pincode: v })}
                  onFill={({ state, city, district }) => setDetails((prev) => ({ ...prev, state, city, district }))}
                  error={errors.pincode}
                />
              </div>

              {details.state && (
                <div className="grid grid-cols-3 gap-3">
                  {[['state','State'],['city','City'],['district','District']].map(([f,l]) => (
                    <div key={f}>
                      <label className="label text-xs">{l}</label>
                      <input className="input bg-gray-50 text-sm font-sans" value={details[f]} onChange={set(f)} />
                    </div>
                  ))}
                </div>
              )}

              {/* Date + time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Ceremony Date *</label>
                  <input
                    type="date"
                    className={`input font-sans ${errors.scheduledDate ? 'border-red-400 focus:ring-red-200' : ''}`}
                    min={new Date().toISOString().split('T')[0]}
                    value={details.scheduledDate} onChange={set('scheduledDate')}
                  />
                  {errors.scheduledDate && <p className="text-red-500 text-xs mt-1 font-sans">{errors.scheduledDate}</p>}
                </div>
                <div>
                  <label className="label">Preferred Time *</label>
                  <input
                    type="time"
                    className={`input font-sans ${errors.scheduledTime ? 'border-red-400 focus:ring-red-200' : ''}`}
                    value={details.scheduledTime} onChange={set('scheduledTime')}
                  />
                  {errors.scheduledTime && <p className="text-red-500 text-xs mt-1 font-sans">{errors.scheduledTime}</p>}
                </div>
              </div>

              {/* Language */}
              <div>
                <label className="label">Preferred Language</label>
                <select className="input font-sans" value={details.language} onChange={set('language')}>
                  {['Hindi','Sanskrit','English','Bengali','Tamil','Telugu','Marathi','Gujarati','Kannada'].map((l) => (
                    <option key={l}>{l}</option>
                  ))}
                </select>
              </div>

              {/* Special note */}
              <div>
                <label className="label">Special Note <span className="text-gray-400 font-normal">(optional)</span></label>
                <textarea
                  rows={2}
                  className="input resize-none font-sans"
                  value={details.specialNote} onChange={set('specialNote')}
                  placeholder="Any special requirements or preferences for the pandit..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-7">
              <button onClick={() => setStep(0)} className="btn-outline flex items-center gap-2 font-sans">
                <ArrowLeft size={15} /> Back
              </button>
              <button onClick={handleNext} className="btn-primary flex-1 flex items-center justify-center gap-2 font-sans">
                Review Booking <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Review & Pay ────────────────────────── */}
        {step === 2 && (
          <div className="bg-white rounded-3xl shadow-premium p-6 md:p-8 animate-fade-in">
            <div className="flex items-center gap-3 mb-7">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl"
                style={{ background: 'linear-gradient(135deg, #FF6B00, #ff9020)' }}>
                ✨
              </div>
              <div>
                <h2 className="font-display font-bold text-gray-900 text-2xl" style={{ letterSpacing: '-0.02em' }}>Review &amp; Pay</h2>
                <p className="text-xs text-gray-400 font-sans">Confirm your ceremony booking</p>
              </div>
            </div>

            {/* Pooja summary */}
            <div className="rounded-2xl p-5 mb-4 border border-saffron-100" style={{ background: 'linear-gradient(135deg, #fff8f0, #FAF6EE)' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-saffron-100 shrink-0">
                  {pooja.image
                    ? <img src={`https://zutsav-production.up.railway.app/${pooja.image}`} alt={pooja.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-xl">🪔</div>
                  }
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm font-sans">{pooja.name}</p>
                  {pooja.duration && <p className="text-xs text-gray-400 flex items-center gap-1 font-sans"><Clock size={10} /> {pooja.duration}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                {[
                  ['Date',     details.scheduledDate],
                  ['Time',     details.scheduledTime],
                  ['Language', details.language],
                ].map(([label, value]) => value && (
                  <div key={label} className="flex flex-col">
                    <span className="text-xs text-gray-400 font-sans">{label}</span>
                    <span className="font-medium text-gray-700 font-sans">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* User details */}
            <div className="rounded-2xl p-5 mb-4 border border-gray-100 bg-gray-50">
              <h3 className="font-semibold text-gray-700 text-sm mb-3 font-sans">Ceremony Location</h3>
              <div className="space-y-1 text-sm font-sans">
                <p className="text-gray-700"><span className="text-gray-400">Name: </span>{details.name}</p>
                <p className="text-gray-700"><span className="text-gray-400">Phone: </span>{details.phone}</p>
                <p className="text-gray-700"><span className="text-gray-400">Address: </span>{details.address}{details.city ? `, ${details.city}` : ''}{details.state ? `, ${details.state}` : ''} — {details.pincode}</p>
              </div>
              {details.specialNote && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-400 font-sans">Special Note: <span className="text-gray-600">{details.specialNote}</span></p>
                </div>
              )}
            </div>

            {/* Trust bar */}
            <div className="flex items-center gap-3 py-3 px-4 rounded-xl border border-blue-100 bg-blue-50 mb-4">
              <Shield size={15} className="text-blue-500 shrink-0" />
              <p className="text-xs text-blue-700 font-sans">Secure payment via PhonePe · UPI, Cards, Net Banking & Wallets supported</p>
            </div>

            {/* Total + pay */}
            <div className="flex items-center justify-between p-4 rounded-2xl border border-saffron-200 mb-5"
              style={{ background: 'linear-gradient(135deg, #fff0d9, #fff8f0)' }}>
              <div>
                <p className="text-xs text-gray-400 font-sans">Total Amount</p>
                <span className="font-display text-3xl font-bold text-saffron-600" style={{ letterSpacing: '-0.02em' }}>
                  ₹{pooja.price.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-center gap-1.5 bg-white border border-emerald-200 text-emerald-600 text-xs font-bold px-3 py-1.5 rounded-full font-sans">
                <Sparkles size={11} /> KYC Verified Pandit
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="btn-outline flex items-center gap-2 font-sans">
                <ArrowLeft size={15} /> Edit
              </button>
              <button onClick={handlePay} disabled={paying} className="btn-primary flex-1 py-3.5 text-base font-sans">
                {paying ? 'Processing...' : `Pay ₹${pooja.price.toLocaleString('en-IN')} 🙏`}
              </button>
            </div>
          </div>
        )}

        {/* Reassurance footer */}
        <div className="mt-6 flex items-center justify-center gap-6 text-xs text-gray-400 font-sans">
          <span className="flex items-center gap-1.5"><CheckCircle size={12} className="text-saffron-400" /> Verified Pandit</span>
          <span className="flex items-center gap-1.5"><Shield size={12} className="text-saffron-400" /> Secure Payment</span>
          <span className="flex items-center gap-1.5"><Sparkles size={12} className="text-saffron-400" /> 4.9★ Rated</span>
        </div>
      </div>
    </div>
  );
}

