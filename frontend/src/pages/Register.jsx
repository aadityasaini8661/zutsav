import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle, Mail, MessageCircle, Upload, X, Gift } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import PincodeInput from '../components/shared/PincodeInput';
import API from '../api/axios';

// ─── Step 1: Role selection ────────────────────────────────────
function RoleStep({ onSelect }) {
  return (
    <div className="space-y-6 text-center">
      <h2 className="text-xl font-bold text-gray-800">Who are you joining as?</h2>
      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => onSelect('devotee')}
          className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-saffron-200 hover:border-saffron-500 hover:bg-saffron-50 transition-all">
          <span className="text-4xl">🙏</span>
          <div>
            <p className="font-bold text-gray-800">Devotee</p>
            <p className="text-xs text-gray-500 mt-1">Book poojas, explore rituals</p>
          </div>
        </button>
        <button onClick={() => onSelect('pandit')}
          className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-saffron-200 hover:border-saffron-500 hover:bg-saffron-50 transition-all">
          <span className="text-4xl">🪔</span>
          <div>
            <p className="font-bold text-gray-800">Pandit / Purohit</p>
            <p className="text-xs text-gray-500 mt-1">Offer spiritual services</p>
          </div>
        </button>
      </div>
    </div>
  );
}

// ─── Shared: basic info step ───────────────────────────────────
function BasicInfoStep({ form, setForm, errors, onBack, onNext, loading, backLabel = 'Change role' }) {
  return (
    <div className="space-y-5">
      <button type="button" onClick={onBack} className="text-sm text-saffron-600 hover:underline">
        ← {backLabel}
      </button>
      <div>
        <label className="label">Full Name *</label>
        <input className={`input ${errors.name ? 'border-red-400' : ''}`} placeholder="Your full name"
          value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
      </div>
      <div>
        <label className="label">Email Address *</label>
        <input type="email" className={`input ${errors.email ? 'border-red-400' : ''}`} placeholder="your@email.com"
          value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
      </div>
      <div>
        <label className="label">Phone Number *</label>
        <input className={`input ${errors.phone ? 'border-red-400' : ''}`} placeholder="10-digit mobile" maxLength={10}
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/, '') })} />
        {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
      </div>
      <button onClick={onNext} disabled={loading} className="btn-primary w-full py-3 text-base">
        {loading ? 'Please wait...' : 'Continue →'}
      </button>
    </div>
  );
}

// ─── Shared: OTP channel selection ───────────────────────────
function OTPChannelStep({ form, onSend, loading, onBack }) {
  const [channel, setChannel] = useState('');

  return (
    <div className="space-y-5">
      <button type="button" onClick={onBack} className="text-sm text-saffron-600 hover:underline">← Back</button>
      <div>
        <p className="text-gray-700 font-semibold mb-3">How would you like to receive your OTP?</p>
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={() => setChannel('email')}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${channel === 'email' ? 'border-saffron-500 bg-saffron-50' : 'border-gray-200 hover:border-saffron-300'}`}>
            <Mail size={22} className={channel === 'email' ? 'text-saffron-600' : 'text-gray-400'} />
            <div className="text-center">
              <p className="font-semibold text-sm text-gray-800">Email OTP</p>
              <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[100px]">{form.email}</p>
            </div>
          </button>
          <button type="button" onClick={() => setChannel('whatsapp')}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${channel === 'whatsapp' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300'}`}>
            <MessageCircle size={22} className={channel === 'whatsapp' ? 'text-green-600' : 'text-gray-400'} />
            <div className="text-center">
              <p className="font-semibold text-sm text-gray-800">WhatsApp OTP</p>
              <p className="text-xs text-gray-500 mt-0.5">+91 {form.phone}</p>
            </div>
          </button>
        </div>
        {!channel && <p className="text-xs text-gray-400 text-center mt-2">Select a delivery method to continue</p>}
      </div>
      <button onClick={() => channel && onSend(channel)} disabled={!channel || loading}
        className="btn-primary w-full py-3">
        {loading ? 'Sending OTP...' : 'Send OTP'}
      </button>
    </div>
  );
}

// ─── Shared: OTP verification step ────────────────────────────
function OTPVerifyStep({ form, channel, onVerify, onResend, loading, onBack }) {
  const [otp, setOtp] = useState('');
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (cooldown > 0) {
      const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [cooldown]);

  const handleDigit = (val, idx) => {
    const digits = val.replace(/\D/, '').slice(-1);
    const arr    = otp.split('');
    arr[idx]     = digits;
    const next   = arr.join('').slice(0, 6);
    setOtp(next);
    if (digits && idx < 5) inputRefs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) inputRefs.current[idx - 1]?.focus();
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await onResend(channel);
      setCooldown(30);
      toast.success('OTP resent!');
    } catch { toast.error('Could not resend OTP'); }
    finally { setResending(false); }
  };

  const identifier = channel === 'email' ? form.email : `+91 ${form.phone}`;

  return (
    <div className="space-y-5">
      <button type="button" onClick={onBack} className="text-sm text-saffron-600 hover:underline">← Back</button>
      <div className="text-center">
        {channel === 'email' ? <Mail size={32} className="mx-auto text-saffron-500 mb-2" /> : <MessageCircle size={32} className="mx-auto text-green-500 mb-2" />}
        <p className="font-semibold text-gray-800">Enter the 6-digit OTP</p>
        <p className="text-sm text-gray-500 mt-1">Sent to <strong>{identifier}</strong></p>
      </div>

      <div className="flex gap-2 justify-center">
        {Array.from({ length: 6 }).map((_, i) => (
          <input
            key={i}
            ref={(el) => (inputRefs.current[i] = el)}
            type="text" inputMode="numeric" maxLength={1}
            value={otp[i] || ''}
            onChange={(e) => handleDigit(e.target.value, i)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            className="w-11 h-12 text-center text-xl font-bold border-2 rounded-xl outline-none focus:border-saffron-500 transition-colors"
          />
        ))}
      </div>

      <button onClick={() => otp.length === 6 && onVerify(otp)} disabled={otp.length < 6 || loading}
        className="btn-primary w-full py-3">
        {loading ? 'Verifying...' : 'Verify OTP'}
      </button>

      <p className="text-center text-sm text-gray-500">
        Didn't receive it?{' '}
        {cooldown > 0
          ? <span className="text-gray-400">Resend in {cooldown}s</span>
          : <button onClick={handleResend} disabled={resending} className="text-saffron-600 font-semibold hover:underline">
              {resending ? 'Sending...' : 'Resend OTP'}
            </button>
        }
      </p>
    </div>
  );
}

// ─── Devotee: password step ────────────────────────────────────
function DevoteePasswordStep({ form, setForm, onSubmit, loading, onBack, initialReferralCode }) {
  const [password, setPassword]       = useState('');
  const [confirm, setConfirm]         = useState('');
  const [referralCode, setReferralCode] = useState(initialReferralCode || '');
  const [show, setShow]               = useState(false);
  const [errors, setErrors]           = useState({});

  const validate = () => {
    const e = {};
    if (!password)            e.password = 'Password is required';
    else if (password.length < 6) e.password = 'Min 6 characters';
    if (password !== confirm) e.confirm  = 'Passwords do not match';
    return e;
  };

  const handleSubmit = () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSubmit(password, referralCode);
  };

  return (
    <div className="space-y-5">
      <button type="button" onClick={onBack} className="text-sm text-saffron-600 hover:underline">← Back</button>
      <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2 text-green-700">
        <CheckCircle size={18} className="shrink-0" />
        <p className="text-sm font-medium">Phone verified! Set your password to complete registration.</p>
      </div>
      <div>
        <label className="label">Password *</label>
        <div className="relative">
          <input type={show ? 'text' : 'password'} className={`input pr-10 ${errors.password ? 'border-red-400' : ''}`}
            placeholder="Min 6 characters" value={password} onChange={(e) => { setPassword(e.target.value); setErrors({ ...errors, password: '' }); }} />
          <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
      </div>
      <div>
        <label className="label">Confirm Password *</label>
        <input type="password" className={`input ${errors.confirm ? 'border-red-400' : ''}`}
          placeholder="Re-enter password" value={confirm} onChange={(e) => { setConfirm(e.target.value); setErrors({ ...errors, confirm: '' }); }} />
        {errors.confirm && <p className="text-red-500 text-xs mt-1">{errors.confirm}</p>}
      </div>
      <div>
        <label className="label flex items-center gap-1.5"><Gift size={13} className="text-saffron-500" /> Referral Code (optional)</label>
        <input className="input uppercase" placeholder="e.g. AMIT3C4D" maxLength={10}
          value={referralCode} onChange={(e) => setReferralCode(e.target.value.toUpperCase())} />
      </div>
      <button onClick={handleSubmit} disabled={loading} className="btn-primary w-full py-3">
        {loading ? 'Creating account...' : 'Create Account 🙏'}
      </button>
    </div>
  );
}

// ─── Pandit: full form step ────────────────────────────────────
const SPECIALIZATIONS = [
  'Griha Pravesh','Satyanarayan Katha','Wedding','Mundan','Naamkaran',
  'Rudrabhishek','Kaal Sarp Dosh','Navgraha Puja','Vastu Shanti','Ganesh Puja',
];
const LANGUAGES = ['Hindi','Sanskrit','English','Bengali','Tamil','Telugu','Kannada','Marathi','Gujarati','Punjabi'];

function PanditProfileStep({ basicForm, onSubmit, loading, onBack }) {
  const [form, setForm] = useState({
    pincode:'', state:'', city:'', district:'', address:'',
    govtIdType:'', govtIdNumber:'',
    bio:'', experience:'', password:'', confirmPassword:'',
    specializations:[], languages:[],
  });
  const [govtIdFile, setGovtIdFile] = useState(null);
  const [show, setShow]     = useState(false);
  const [errors, setErrors] = useState({});

  const set = (f) => (e) => { setForm({ ...form, [f]: e.target.value }); setErrors({ ...errors, [f]: '' }); };
  const toggleArr = (field, val) => setForm((p) => ({ ...p, [field]: p[field].includes(val) ? p[field].filter((x) => x !== val) : [...p[field], val] }));

  const validate = () => {
    const e = {};
    if (!form.govtIdType)                       e.govtIdType = 'Select ID type';
    if (!govtIdFile)                            e.govtIdFile = 'Upload your government ID image';
    if (!form.password)                         e.password   = 'Password is required';
    else if (form.password.length < 6)          e.password   = 'Min 6 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const fd = new FormData();
    // Basic info from previous step
    fd.append('name',  basicForm.name);
    fd.append('email', basicForm.email);
    fd.append('phone', basicForm.phone);
    fd.append('password', form.password);
    // Profile info
    Object.entries(form).forEach(([k, v]) => {
      if (k === 'confirmPassword' || k === 'password') return;
      if (Array.isArray(v)) fd.append(k, JSON.stringify(v));
      else if (v !== '') fd.append(k, v);
    });
    fd.append('govtIdImage', govtIdFile);
    onSubmit(fd);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <button type="button" onClick={onBack} className="text-sm text-saffron-600 hover:underline">← Back</button>
      <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2 text-green-700 text-sm">
        <CheckCircle size={16} className="shrink-0" />
        OTP verified for <strong>{basicForm.email}</strong>. Complete your profile below.
      </div>

      {/* Govt ID */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Government ID Type *</label>
          <select className={`input ${errors.govtIdType ? 'border-red-400' : ''}`} value={form.govtIdType} onChange={set('govtIdType')}>
            <option value="">Select ID</option>
            {[['aadhaar','Aadhaar'],['pan','PAN Card'],['voter','Voter ID'],['passport','Passport'],['driving','Driving Licence']].map(([v,l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          {errors.govtIdType && <p className="text-red-500 text-xs mt-1">{errors.govtIdType}</p>}
        </div>
        <div>
          <label className="label">ID Number (optional)</label>
          <input className="input" placeholder="e.g. XXXX XXXX XXXX" value={form.govtIdNumber} onChange={set('govtIdNumber')} />
        </div>
      </div>

      <div>
        <label className="label">Upload Government ID Image *</label>
        <label className={`flex items-center gap-3 border-2 border-dashed rounded-xl p-4 cursor-pointer transition-colors ${errors.govtIdFile ? 'border-red-400 bg-red-50' : 'border-saffron-200 hover:border-saffron-400 hover:bg-saffron-50'}`}>
          <Upload size={20} className="text-saffron-500 shrink-0" />
          <span className="text-sm text-gray-600 flex-1 truncate">
            {govtIdFile ? govtIdFile.name : 'Click to upload JPG / PNG (max 5 MB)'}
          </span>
          {govtIdFile && (
            <button type="button" onClick={(e) => { e.preventDefault(); setGovtIdFile(null); }} className="text-gray-400 hover:text-red-500">
              <X size={16} />
            </button>
          )}
          <input type="file" accept="image/*" className="hidden"
            onChange={(e) => { setGovtIdFile(e.target.files[0] || null); setErrors({ ...errors, govtIdFile: '' }); }} />
        </label>
        {errors.govtIdFile && <p className="text-red-500 text-xs mt-1">{errors.govtIdFile}</p>}
      </div>

      <div>
        <label className="label">Pincode</label>
        <PincodeInput value={form.pincode} onChange={(v) => setForm({ ...form, pincode: v })}
          onFill={({ state, city, district }) => setForm((p) => ({ ...p, state, city, district }))} />
      </div>

      {form.state && (
        <div className="grid grid-cols-3 gap-3">
          {[['state','State'],['city','City'],['district','District']].map(([f,l]) => (
            <div key={f}>
              <label className="label text-xs">{l}</label>
              <input className="input bg-saffron-50 text-sm" value={form[f]} onChange={set(f)} />
            </div>
          ))}
        </div>
      )}

      <div>
        <label className="label">Address</label>
        <textarea className="input min-h-[60px] resize-none" placeholder="Your full address" value={form.address} onChange={set('address')} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <label className="label">Bio (optional)</label>
          <textarea className="input min-h-[60px] resize-none text-sm" placeholder="Briefly describe your background..." value={form.bio} onChange={set('bio')} />
        </div>
        <div>
          <label className="label">Experience (yrs)</label>
          <input type="number" min="0" className="input" placeholder="e.g. 10" value={form.experience} onChange={set('experience')} />
        </div>
      </div>

      <div>
        <label className="label">Specializations</label>
        <div className="flex flex-wrap gap-2 mt-1">
          {SPECIALIZATIONS.map((s) => (
            <button key={s} type="button" onClick={() => toggleArr('specializations', s)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${form.specializations.includes(s) ? 'bg-saffron-500 text-white border-saffron-500' : 'bg-white text-gray-600 border-gray-200 hover:border-saffron-300'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="label">Languages</label>
        <div className="flex flex-wrap gap-2 mt-1">
          {LANGUAGES.map((l) => (
            <button key={l} type="button" onClick={() => toggleArr('languages', l)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${form.languages.includes(l) ? 'bg-maroon-600 text-white border-maroon-600' : 'bg-white text-gray-600 border-gray-200 hover:border-maroon-300'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Password *</label>
          <div className="relative">
            <input type={show ? 'text' : 'password'} className={`input pr-10 ${errors.password ? 'border-red-400' : ''}`}
              placeholder="Min 6 characters" value={form.password} onChange={set('password')} />
            <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
        </div>
        <div>
          <label className="label">Confirm Password *</label>
          <input type="password" className={`input ${errors.confirmPassword ? 'border-red-400' : ''}`}
            placeholder="Re-enter password" value={form.confirmPassword} onChange={set('confirmPassword')} />
          {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
        </div>
      </div>

      <p className="text-xs text-gray-500 bg-saffron-50 rounded-xl p-3 border border-saffron-100">
        Your application will be reviewed by the Zutsav team. You'll be notified once approved.
      </p>

      <button type="submit" disabled={loading} className="btn-primary w-full py-3">
        {loading ? 'Submitting application...' : 'Submit Application 🪔'}
      </button>
    </form>
  );
}

// ─── Success screens ──────────────────────────────────────────
function DevoteeSuccess({ name }) {
  return (
    <div className="text-center space-y-4 py-4">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle size={40} className="text-green-500" />
      </div>
      <h2 className="text-xl font-bold text-gray-800">Welcome, {name}! 🙏</h2>
      <p className="text-gray-600 text-sm">Your account has been created. Start your spiritual journey now.</p>
    </div>
  );
}

function PanditAccountCreated() {
  return (
    <div className="text-center space-y-4 py-4">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle size={40} className="text-green-500" />
      </div>
      <h2 className="text-xl font-bold text-gray-800">Account Created! 🙏</h2>
      <p className="text-gray-600 text-sm leading-relaxed">
        Welcome to Zutsav! You now have access to your dashboard.
      </p>
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-left space-y-2">
        <p className="text-sm font-semibold text-amber-800">Complete these steps to start receiving bookings:</p>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>📋 Complete your profile in the dashboard</li>
          <li>📄 Upload your KYC documents</li>
          <li>⏳ Admin reviews and approves your KYC</li>
          <li>🪔 Start accepting bookings</li>
        </ul>
      </div>
      <p className="text-xs text-gray-400">Redirecting to your dashboard…</p>
    </div>
  );
}

// ─── Main Register page ────────────────────────────────────────
export default function Register() {
  const [searchParams] = useSearchParams();
  const initialRef     = searchParams.get('ref') || '';
  const navigate       = useNavigate();
  const { login }      = useAuth();

  const [role, setRole]     = useState(null);                // 'devotee' | 'pandit'
  const [step, setStep]     = useState('role');              // role | info | channel | otp | password | profile | done
  const [basicForm, setBasicForm] = useState({ name:'', email:'', phone:'' });
  const [channel, setChannel]     = useState('');
  const [loading, setLoading]     = useState(false);
  const [otpErrors, setOtpErrors] = useState({});
  const [successName, setSuccessName] = useState('');

  const validateBasic = () => {
    const e = {};
    if (!basicForm.name)                              e.name  = 'Name is required';
    if (!basicForm.email)                             e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(basicForm.email))  e.email = 'Invalid email';
    if (!basicForm.phone)                             e.phone = 'Phone is required';
    else if (!/^[6-9]\d{9}$/.test(basicForm.phone))  e.phone = 'Enter a valid 10-digit Indian mobile number';
    return e;
  };

  const handleBasicNext = () => {
    const errs = validateBasic();
    if (Object.keys(errs).length) { setOtpErrors(errs); return; }
    setOtpErrors({});
    setStep('channel');
  };

  const sendOTP = async (ch) => {
    setLoading(true);
    setChannel(ch);
    try {
      await API.post('/auth/send-otp', { ...basicForm, channel: ch });
      toast.success(`OTP sent to your ${ch === 'email' ? 'email' : 'WhatsApp'}!`);
      setStep('otp');
    } catch (err) {
      const status  = err.response?.status;
      const message = err.response?.data?.message;
      const hint    = err.response?.data?.hint;

      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        toast.error('Request timed out. Please check your connection and try again.', { duration: 7000 });
      } else if (status === 503) {
        // Email / WhatsApp delivery blocked (Railway SMTP restriction, etc.)
        const altLabel = hint === 'whatsapp' ? 'WhatsApp' : 'Email';
        toast.error(`${message || 'Delivery failed.'} Please try ${altLabel} OTP instead.`, { duration: 8000 });
        setStep('channel'); // Send user back to channel selection
      } else {
        toast.error(message || 'Failed to send OTP. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (otp) => {
    setLoading(true);
    const identifier = channel === 'email' ? basicForm.email : basicForm.phone;
    try {
      await API.post('/auth/verify-otp', { identifier, otp, purpose: 'registration' });
      toast.success('OTP verified!');
      setStep('password'); // both devotee and pandit go to password step
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const completeDevoteeRegistration = async (password, referralCode) => {
    setLoading(true);
    try {
      const { data } = await API.post('/auth/complete-registration', {
        ...basicForm,
        password,
        channel,
        referralCode: referralCode || undefined,
      });
      // Auto-login
      localStorage.setItem('zutsav_token', data.token);
      localStorage.setItem('zutsav_user',  JSON.stringify(data.user));
      setSuccessName(data.user.name);
      setStep('done');
      toast.success(`Welcome to Zutsav, ${data.user.name}!`);
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const completePanditRegistration = async (password) => {
    setLoading(true);
    try {
      const { data } = await API.post('/auth/complete-registration', {
        ...basicForm,
        password,
        channel,
        role: 'pandit',
      });
      localStorage.setItem('zutsav_token', data.token);
      localStorage.setItem('zutsav_user',  JSON.stringify(data.user));
      setStep('done');
      toast.success('Account created! Complete your profile to start receiving bookings.');
      setTimeout(() => navigate('/pandit/dashboard'), 1800);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const stepTitle = {
    role:     'Create Account',
    info:     role === 'devotee' ? 'Devotee Registration' : 'Pandit Registration',
    channel:  'Verify Your Identity',
    otp:      'Enter OTP',
    password: 'Set Your Password',
    done:     role === 'devotee' ? 'Account Created!' : 'Welcome to Zutsav!',
  };

  return (
    <div className="min-h-screen bg-spiritual-light flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <span className="text-3xl">🪔</span>
            <span className="font-serif text-3xl font-bold text-maroon-600">Zutsav</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">{stepTitle[step] || 'Register'}</h1>
          {step === 'role' && <p className="text-gray-500 mt-1 text-sm">Begin your spiritual journey</p>}
        </div>

        <div className={`bg-white rounded-3xl shadow-xl border border-saffron-100 ${step === 'profile' ? 'p-6' : 'p-8'}`}>
          {step === 'role' && (
            <RoleStep onSelect={(r) => { setRole(r); setStep('info'); }} />
          )}

          {step === 'info' && (
            <BasicInfoStep
              form={basicForm} setForm={setBasicForm}
              errors={otpErrors}
              onBack={() => { setStep('role'); setOtpErrors({}); }}
              onNext={handleBasicNext}
              loading={loading}
            />
          )}

          {step === 'channel' && (
            <OTPChannelStep
              form={basicForm}
              onSend={sendOTP}
              loading={loading}
              onBack={() => setStep('info')}
            />
          )}

          {step === 'otp' && (
            <OTPVerifyStep
              form={basicForm}
              channel={channel}
              onVerify={verifyOTP}
              onResend={sendOTP}
              loading={loading}
              onBack={() => setStep('channel')}
            />
          )}

          {step === 'password' && role === 'devotee' && (
            <DevoteePasswordStep
              form={basicForm} setForm={setBasicForm}
              onSubmit={completeDevoteeRegistration}
              loading={loading}
              onBack={() => setStep('otp')}
              initialReferralCode={initialRef}
            />
          )}

          {step === 'password' && role === 'pandit' && (
            <DevoteePasswordStep
              form={basicForm} setForm={setBasicForm}
              onSubmit={(password) => completePanditRegistration(password)}
              loading={loading}
              onBack={() => setStep('otp')}
              initialReferralCode=""
            />
          )}

          {step === 'done' && (
            role === 'devotee'
              ? <DevoteeSuccess name={successName} />
              : <PanditAccountCreated />
          )}

          {!['done'].includes(step) && (
            <p className="text-center text-sm text-gray-500 mt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-saffron-600 font-semibold hover:underline">Sign in</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
