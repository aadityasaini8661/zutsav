import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Sun, Moon, Clock, Star, Calendar, Sparkles } from 'lucide-react';
import API from '../api/axios';

const fmt = (d) => d.toISOString().split('T')[0];
const DAY_NAMES   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTH_FULL  = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const PANCHANG_FIELDS = [
  { key: 'tithi',     label: 'Tithi',     icon: Moon,     color: 'text-indigo-500', bg: 'bg-indigo-50', border: 'border-indigo-100' },
  { key: 'nakshatra', label: 'Nakshatra', icon: Star,     color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-100' },
  { key: 'yoga',      label: 'Yoga',      icon: Sparkles, color: 'text-emerald-500',bg: 'bg-emerald-50',border: 'border-emerald-100' },
  { key: 'karana',    label: 'Karana',    icon: Calendar, color: 'text-amber-500',  bg: 'bg-amber-50',  border: 'border-amber-100'  },
  { key: 'sunrise',   label: 'Sunrise',   icon: Sun,      color: 'text-saffron-500',bg: 'bg-saffron-50',border: 'border-saffron-100' },
  { key: 'sunset',    label: 'Sunset',    icon: Moon,     color: 'text-blue-500',   bg: 'bg-blue-50',   border: 'border-blue-100'   },
];

const DATA_STYLES = {
  festival: 'bg-saffron-50 border-saffron-200 text-saffron-800',
  tithi:    'bg-indigo-50  border-indigo-200  text-indigo-800',
  panchang: 'bg-purple-50  border-purple-200  text-purple-800',
  mixed:    'bg-emerald-50 border-emerald-200 text-emerald-800',
};

function getMoonPhase(tithi) {
  if (!tithi) return '🌕';
  const t = tithi.toLowerCase();
  if (t.includes('amavasya') || t.includes('new moon')) return '🌑';
  if (t.includes('purnima') || t.includes('full moon')) return '🌕';
  const numMatch = t.match(/\d+/);
  if (numMatch) {
    const n = parseInt(numMatch[0]);
    if (n <= 4)  return '🌒';
    if (n <= 8)  return '🌓';
    if (n <= 11) return '🌔';
    if (n <= 14) return '🌖';
  }
  return '🌔';
}

function FestivalEntries({ entries }) {
  if (!entries?.length) return null;
  return (
    <div className="space-y-2">
      {entries.map((f) => (
        <div key={f._id} className={`border rounded-xl px-4 py-3 ${DATA_STYLES[f.dataType] || DATA_STYLES.festival}`}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              {f.name && <p className="font-semibold text-sm">{f.name}</p>}
              {f.tithiDate && (
                <p className="text-xs mt-0.5 flex items-center gap-1 opacity-70">
                  <Moon size={10} /> {f.tithiDate}{f.paksha ? ` · ${f.paksha} Paksha` : ''}
                </p>
              )}
              {f.description && <p className="text-xs mt-1 opacity-60 line-clamp-2">{f.description}</p>}
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full border border-current opacity-60 shrink-0 capitalize font-bold whitespace-nowrap">
              {f.dataType || 'festival'}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function PanchangCard({ data, isToday, festivals, dateObj }) {
  if (!data) return null;
  const dow       = dateObj ? DAY_NAMES[dateObj.getDay()] : '';
  const dom       = dateObj ? dateObj.getDate() : '';
  const monthIdx  = dateObj ? dateObj.getMonth() : 0;
  const yr        = dateObj ? dateObj.getFullYear() : '';
  const moonPhase = getMoonPhase(data.tithi);

  return (
    <div className={`bg-white rounded-2xl overflow-hidden transition-all duration-300 ${
      isToday
        ? 'ring-2 ring-gold-400'
        : 'border border-gray-100'
    }`} style={{ boxShadow: isToday ? '0 8px 32px rgba(212,175,55,0.15), 0 2px 8px rgba(0,0,0,0.06)' : '0 2px 20px rgba(0,0,0,0.06)' }}>

      {/* Card header */}
      <div className={`px-5 py-4 border-b ${isToday ? '' : 'border-gray-100 bg-gray-50/50'}`}
           style={isToday ? { background: '#1B1F3B', borderColor: 'transparent' } : {}}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            {/* Date badge */}
            <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center shrink-0 ${
              isToday ? '' : 'bg-white border border-gray-200'
            }`}
                 style={isToday ? { background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)' } : {}}>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${isToday ? '' : 'text-gray-400'}`}
                    style={isToday ? { color: '#D4AF37' } : {}}>
                {MONTH_SHORT[monthIdx]}
              </span>
              <span className={`text-2xl font-bold leading-tight ${isToday ? 'text-white' : 'text-gray-800'}`}>{dom}</span>
              <span className={`text-[9px] ${isToday ? 'text-white/40' : 'text-gray-400'}`}>{yr}</span>
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className={`font-bold text-base ${isToday ? 'text-white' : 'text-gray-900'}`}>
                  {dow}, {MONTH_FULL[monthIdx]} {dom}
                </p>
                {isToday && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
                        style={{ background: '#D4AF37', color: '#1B1F3B' }}>
                    Today
                  </span>
                )}
              </div>
              {data.date && (
                <p className={`text-xs mt-0.5 ${isToday ? 'text-white/40' : 'text-gray-400'}`}>{data.date}</p>
              )}
            </div>
          </div>

          {/* Moon phase */}
          <div className="text-3xl opacity-80 shrink-0 select-none">{moonPhase}</div>
        </div>
      </div>

      {/* Panchang grid */}
      <div className="p-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          {PANCHANG_FIELDS.map(({ key, label, icon: Icon, color, bg, border }) =>
            data[key] ? (
              <div key={key} className={`${bg} border ${border} rounded-xl p-3 flex items-start gap-2.5`}>
                <Icon size={13} className={`${color} mt-0.5 shrink-0`} />
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{label}</p>
                  <p className="text-sm font-semibold text-gray-800 leading-tight mt-0.5 truncate">{data[key]}</p>
                </div>
              </div>
            ) : null
          )}
        </div>

        {/* Rahu Kaal */}
        {data.rahuKaal && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-4">
            <Clock size={14} className="text-red-500 shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-bold text-red-700">Rahu Kaal — Inauspicious Period</p>
              <p className="text-xs text-red-500 mt-0.5">{data.rahuKaal.start} – {data.rahuKaal.end}</p>
            </div>
            <span className="text-[10px] font-semibold text-red-500 bg-red-100 px-2 py-1 rounded-lg shrink-0">Avoid</span>
          </div>
        )}

        {/* Festivals / Tithi */}
        {festivals !== undefined && (
          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                   style={{ background: 'rgba(212,175,55,0.1)' }}>
                <Sparkles size={12} style={{ color: '#D4AF37' }} />
              </div>
              <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">Festivals &amp; Tithi</p>
            </div>
            {festivals?.length > 0
              ? <FestivalEntries entries={festivals} />
              : (
                <div className="text-center py-5 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-400 font-medium">No festival data for this date</p>
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
}

function PanchangSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100"
         style={{ boxShadow: '0 2px 20px rgba(0,0,0,0.06)' }}>
      <div className="bg-gray-50 px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <div className="skeleton w-14 h-14 rounded-2xl" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-5 w-48 rounded" />
            <div className="skeleton h-3 w-28 rounded" />
          </div>
        </div>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
        </div>
      </div>
    </div>
  );
}

export default function PanchangPage() {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(fmt(today));
  const [panchangDay,  setPanchangDay]  = useState(null);
  const [weekData,     setWeekData]     = useState([]);
  const [dayFestivals, setDayFestivals] = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [weekLoading,  setWeekLoading]  = useState(false);
  const [view,         setView]         = useState('day');

  useEffect(() => {
    if (view !== 'day') return;
    setLoading(true);
    setPanchangDay(null);
    setDayFestivals(null);
    Promise.all([
      API.get(`/panchang?date=${selectedDate}`),
      API.get(`/festivals?date=${selectedDate}`),
    ])
      .then(([p, f]) => {
        setPanchangDay(p.data.panchang);
        setDayFestivals(f.data.festivals || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedDate, view]);

  useEffect(() => {
    if (view !== 'week') return;
    setWeekLoading(true);
    API.get(`/panchang/week?date=${selectedDate}`)
      .then(({ data }) => setWeekData(data.panchang || []))
      .catch(() => {})
      .finally(() => setWeekLoading(false));
  }, [selectedDate, view]);

  const shift = (days) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(fmt(d));
  };

  const isToday      = selectedDate === fmt(today);
  const selectedDtObj = new Date(selectedDate + 'T00:00:00');

  return (
    <div className="min-h-screen" style={{ background: '#FAF7F2' }}>
      {/* Hero Header */}
      <div className="relative overflow-hidden sacred-pattern" style={{ background: '#1B1F3B' }}>
        <div className="absolute inset-0" style={{ background: 'rgba(27,31,59,0.88)' }} />
        <div className="relative max-w-2xl mx-auto px-4 py-12 md:py-16 text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="w-8 h-px" style={{ background: 'rgba(212,175,55,0.45)' }} />
            <span className="text-xs font-bold tracking-widest uppercase" style={{ color: '#D4AF37' }}>Hindu Almanac</span>
            <span className="w-8 h-px" style={{ background: 'rgba(212,175,55,0.45)' }} />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-2"
              style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', letterSpacing: '-0.02em' }}>
            Panchang
          </h1>
          <p className="text-sm font-sans" style={{ color: 'rgba(212,175,55,0.6)' }}>
            पञ्चाङ्ग · Tithi · Nakshatra · Yoga · Karana · Muhurat
          </p>
        </div>
      </div>

      {/* Controls — floats above content */}
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-2xl -mt-6 relative z-10 p-4 space-y-3 border border-gray-100"
             style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}>
          {/* View toggle */}
          <div className="flex gap-1 bg-gray-50 rounded-xl p-1">
            {['day', 'week'].map((v) => (
              <button key={v} onClick={() => setView(v)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  view === v ? 'text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'
                }`}
                style={view === v ? { background: '#1B1F3B' } : {}}>
                {v === 'day' ? '📅 Daily View' : '🗓 Weekly View'}
              </button>
            ))}
          </div>

          {/* Date navigation */}
          <div className="flex items-center gap-2">
            <button onClick={() => shift(view === 'week' ? -7 : -1)}
              className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 transition-all hover:border-gray-400 hover:text-gray-700">
              <ChevronLeft size={16} />
            </button>
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
              className="input flex-1 py-2.5 text-sm font-semibold text-center" />
            <button onClick={() => shift(view === 'week' ? 7 : 1)}
              className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 transition-all hover:border-gray-400 hover:text-gray-700">
              <ChevronRight size={16} />
            </button>
          </div>

          {!isToday && (
            <button onClick={() => setSelectedDate(fmt(today))}
              className="w-full text-xs font-bold transition-colors"
              style={{ color: '#D4AF37' }}>
              ← Jump to Today
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {view === 'day' && (
          loading
            ? <PanchangSkeleton />
            : <PanchangCard data={panchangDay} isToday={isToday} festivals={dayFestivals} dateObj={selectedDtObj} />
        )}

        {view === 'week' && (
          weekLoading
            ? <div className="space-y-4">{Array.from({ length: 7 }).map((_, i) => <PanchangSkeleton key={i} />)}</div>
            : <div className="space-y-4">
                {weekData.map((d, i) => {
                  const dt = new Date(selectedDate + 'T00:00:00');
                  dt.setDate(dt.getDate() + i);
                  return (
                    <PanchangCard key={i} data={d} isToday={fmt(dt) === fmt(today)} dateObj={dt} />
                  );
                })}
              </div>
        )}

        {/* About Panchang */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5"
             style={{ boxShadow: '0 2px 20px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                 style={{ background: 'rgba(27,31,59,0.06)' }}>
              <Moon size={15} style={{ color: 'rgba(27,31,59,0.5)' }} />
            </div>
            <p className="font-bold text-gray-800">About Panchang</p>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed">
            Panchang (पञ्चाङ्ग) is the Hindu almanac based on five limbs:{' '}
            <strong className="text-gray-700">Tithi</strong> (lunar day),{' '}
            <strong className="text-gray-700">Vara</strong> (weekday),{' '}
            <strong className="text-gray-700">Nakshatra</strong> (lunar mansion),{' '}
            <strong className="text-gray-700">Yoga</strong> (auspiciousness), and{' '}
            <strong className="text-gray-700">Karana</strong> (half-day).
            It guides auspicious timings for rituals, travel, business, and ceremonies.
            All calculations are based on New Delhi, IST.
          </p>
        </div>
      </div>
    </div>
  );
}
