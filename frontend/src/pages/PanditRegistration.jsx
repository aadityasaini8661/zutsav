import React, { useState } from 'react';
import { CheckCircle, Upload, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../api/axios';
import PincodeInput from '../components/shared/PincodeInput';
import { useAuth } from '../context/AuthContext';

const GOVT_ID_TYPES = ['aadhaar','pan','voter','passport','driving'];
const SPECIALIZATIONS = ['Vedic Poojas','Havans','Astrology','Vastu','Kundli','Griha Pravesh','Satyanarayan Katha','Navratri Puja','Wedding Rituals','Last Rites'];

export default function PanditRegistration() {
  const { refreshUser } = useAuth();
  const [step, setStep] = useState('form'); // 'form' | 'success'
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    govtIdType: 'aadhaar', govtIdNumber: '',
    pincode: '', state: '', city: '', district: '', address: '',
    bio: '', experience: '',
    specializations: [],
    languages: [],
  });
  const [govtIdImage, setGovtIdImage] = useState(null);
  const [preview, setPreview]   = useState(null);
  const [errors,  setErrors]    = useState({});

  const set = (f) => (e) => { setForm({ ...form, [f]: e.target.value }); setErrors({ ...errors, [f]: '' }); };

  const toggleSpec = (s) => {
    setForm((prev) => ({
      ...prev,
      specializations: prev.specializations.includes(s)
        ? prev.specializations.filter((x) => x !== s)
        : [...prev.specializations, s],
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setGovtIdImage(file);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(file);
    setErrors({ ...errors, govtIdImage: '' });
  };

  const validate = () => {
    const e = {};
    if (!form.name)          e.name    = 'Required';
    if (!form.email)         e.email   = 'Required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.phone)         e.phone   = 'Required';
    else if (!/^[6-9]\d{9}$/.test(form.phone)) e.phone = 'Enter valid 10-digit number';
    if (!govtIdImage)        e.govtIdImage = 'Govt ID image is required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (Array.isArray(v)) fd.append(k, JSON.stringify(v));
        else fd.append(k, v);
      });
      fd.append('govtIdImage', govtIdImage);

      await API.post('/pandits/register', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      await refreshUser();
      setStep('success');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-spiritual-light flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-saffron-100 p-8 text-center">
          <div className="w-20 h-20 bg-saffron-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={40} className="text-saffron-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Application Submitted! 🙏</h2>
          <div className="bg-saffron-50 border border-saffron-200 rounded-2xl p-5 mb-6 text-left">
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="text-saffron-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-saffron-800 mb-1">Application Under Review</p>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Aapki application hamare team ke paas review ke liye bhej di gayi hai.
                  Hum jald hi aapko email/WhatsApp par sachiit karenge.
                  Verification complete hone par aap booking accept kar sakenge.
                </p>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-6">
            Agar koi sawal ho toh hume{' '}
            <a href="mailto:support@zutsav.com" className="text-saffron-600 font-medium">support@zutsav.com</a>{' '}
            par sampark karein.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-spiritual-light py-10">
      <div className="max-w-2xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-maroon-700">Register as Pandit</h1>
          <p className="text-gray-500 mt-2 text-sm">Join India's most trusted spiritual platform</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 border border-saffron-100">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* ─ Basic Info ─ */}
            <h3 className="font-semibold text-saffron-700 border-b border-saffron-100 pb-2">Basic Information</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Full Name *</label>
                <input className={`input ${errors.name ? 'border-red-400' : ''}`} value={form.name} onChange={set('name')} placeholder="Pandit ji's full name" />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="label">Phone Number *</label>
                <input className={`input ${errors.phone ? 'border-red-400' : ''}`} value={form.phone}
                  onChange={(e) => { const v = e.target.value.replace(/\D/g,'').slice(0,10); setForm({...form,phone:v}); setErrors({...errors,phone:''}); }}
                  placeholder="10-digit mobile" maxLength={10} />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>
            </div>

            <div>
              <label className="label">Email Address * <span className="text-gray-400 text-xs">(must be unique)</span></label>
              <input type="email" className={`input ${errors.email ? 'border-red-400' : ''}`} value={form.email} onChange={set('email')} placeholder="pandit@email.com" />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Experience (years)</label>
                <input type="number" min={0} className="input" value={form.experience} onChange={set('experience')} placeholder="e.g. 10" />
              </div>
              <div>
                <label className="label">Languages Known</label>
                <input className="input" placeholder="Hindi, Sanskrit, English" onChange={(e) => setForm({ ...form, languages: e.target.value.split(',').map(l=>l.trim()) })} />
              </div>
            </div>

            <div>
              <label className="label">Bio</label>
              <textarea rows={3} className="input resize-none" value={form.bio} onChange={set('bio')} placeholder="Tell us about yourself, your training, experience..." />
            </div>

            {/* ─ Specializations ─ */}
            <div>
              <label className="label mb-2">Specializations</label>
              <div className="flex flex-wrap gap-2">
                {SPECIALIZATIONS.map((s) => (
                  <button key={s} type="button" onClick={() => toggleSpec(s)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      form.specializations.includes(s)
                        ? 'bg-saffron-500 text-white border-saffron-500'
                        : 'border-gray-300 text-gray-600 hover:border-saffron-400'
                    }`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* ─ Location ─ */}
            <h3 className="font-semibold text-saffron-700 border-b border-saffron-100 pb-2 pt-2">Location</h3>

            <div>
              <label className="label">Pincode</label>
              <PincodeInput
                value={form.pincode}
                onChange={(v) => setForm({ ...form, pincode: v })}
                onFill={({ state, city, district }) => setForm((prev) => ({ ...prev, state, city, district }))}
              />
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
              <label className="label">Full Address</label>
              <textarea rows={2} className="input resize-none" value={form.address} onChange={set('address')} placeholder="Complete address..." />
            </div>

            {/* ─ Govt ID ─ */}
            <h3 className="font-semibold text-saffron-700 border-b border-saffron-100 pb-2 pt-2">Government ID Verification</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Select ID Type *</label>
                <select className="input" value={form.govtIdType} onChange={set('govtIdType')}>
                  {GOVT_ID_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)} Card</option>)}
                </select>
              </div>
              <div>
                <label className="label">ID Number</label>
                <input className="input" value={form.govtIdNumber} onChange={set('govtIdNumber')} placeholder="ID number" />
              </div>
            </div>

            <div>
              <label className="label">Upload {form.govtIdType.charAt(0).toUpperCase() + form.govtIdType.slice(1)} Image *</label>
              <div className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer hover:border-saffron-400 transition-colors ${errors.govtIdImage ? 'border-red-400' : 'border-gray-300'}`}
                onClick={() => document.getElementById('govtIdInput').click()}>
                {preview ? (
                  <img src={preview} alt="Preview" className="max-h-32 mx-auto rounded-xl object-contain" />
                ) : (
                  <>
                    <Upload size={28} className="text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Click to upload {form.govtIdType} image</p>
                    <p className="text-xs text-gray-400 mt-1">JPG, PNG up to 10MB</p>
                  </>
                )}
              </div>
              <input id="govtIdInput" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              {errors.govtIdImage && <p className="text-red-500 text-xs mt-1">{errors.govtIdImage}</p>}
            </div>

            <div className="bg-saffron-50 border border-saffron-200 rounded-xl p-4 text-sm text-gray-600">
              ℹ️ After submission, your application will be reviewed by our team. You'll receive a notification once approved. This usually takes 24-48 hours.
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
              {loading ? 'Submitting...' : 'Submit Application 🙏'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
