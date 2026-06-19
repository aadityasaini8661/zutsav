import React, { useEffect, useState } from 'react';
import { Calendar, List, ChevronLeft, ChevronRight, CalendarDays, Sparkles } from 'lucide-react';
import API from '../api/axios';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const MONTH_SHORT = MONTHS.map((m) => m.slice(0, 3));

const TYPE_STYLES = {
  festival: { bg: 'bg-saffron-50', border: 'border-saffron-200', text: 'text-saffron-700', dot: 'bg-saffron-500', badge: 'bg-saffron-100 text-saffron-700' },
  tithi:    { bg: 'bg-blue-50',    border: 'border-blue-200',    text: 'text-blue-700',    dot: 'bg-blue-500',    badge: 'bg-blue-100 text-blue-700'    },
  panchang: { bg: 'bg-violet-50',  border: 'border-violet-200',  text: 'text-violet-700',  dot: 'bg-violet-500',  badge: 'bg-violet-100 text-violet-700' },
  mixed:    { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700' },
};
const defaultStyle = TYPE_STYLES.festival;
function typeStyle(t) { return TYPE_STYLES[t] || defaultStyle; }

function buildCalendarDays(year, month) {
  const first  = new Date(year, month - 1, 1).getDay();
  const total  = new Date(year, month, 0).getDate();
  const blanks = first === 0 ? 6 : first - 1;
  return { blanks, total };
}

function SkeletonCard() {
  return <div className="skeleton h-24 rounded-2xl" />;
}

function FestivalCard({ festival, compact }) {
  const s   = typeStyle(festival.dataType);
  const dt  = new Date(festival.date);
  const day = dt.getUTCDate();
  const mon = MONTH_SHORT[dt.getUTCMonth()];
  const daysUntil = Math.ceil((dt - new Date()) / (1000 * 60 * 60 * 24));

  if (compact) {
    return (
      <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border ${s.border} ${s.bg} text-sm`}>
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
        <span className={`font-semibold flex-1 line-clamp-1 ${s.text} font-sans`}>{festival.name}</span>
        <span className="text-xs text-gray-400 shrink-0 font-sans">{mon} {day}</span>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border transition-all duration-300 overflow-hidden group hover:-translate-y-0.5 ${s.border}`} style={{ background: 'var(--t-card)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
      <div className="flex items-stretch">
        {/* Date sidebar */}
        <div className={`shrink-0 w-20 flex flex-col items-center justify-center py-4 ${s.bg}`}>
          <span className={`font-display text-3xl font-bold ${s.text}`} style={{ letterSpacing: '-0.02em' }}>{day}</span>
          <span className={`text-xs font-bold ${s.text} opacity-70 font-sans`}>{mon}</span>
        </div>

        {/* Content */}
        <div className="flex-1 px-4 py-3.5">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <h3 className={`font-display font-bold text-gray-800 leading-snug group-hover:${s.text} transition-colors text-lg`}
              style={{ letterSpacing: '-0.01em' }}>
              {festival.name}
            </h3>
            <div className="flex items-center gap-2 shrink-0">
              {daysUntil >= 0 && daysUntil <= 14 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-saffron-500 text-white font-sans">
                  {daysUntil === 0 ? 'Today!' : `${daysUntil}d`}
                </span>
              )}
              {festival.dataType && festival.dataType !== 'festival' && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${s.badge} font-sans`}>
                  {festival.dataType}
                </span>
              )}
            </div>
          </div>
          {festival.tithiDate && (
            <p className={`text-xs mt-1 ${s.text} opacity-80 font-sans`}>{festival.tithiDate}</p>
          )}
          {festival.panchang && (
            <p className="text-xs text-gray-400 mt-0.5 font-sans">{festival.panchang}</p>
          )}
          {festival.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-1 font-sans">{festival.description}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function CalDay({ day, festivals, today }) {
  const s       = festivals.length > 0 ? typeStyle(festivals[0]?.dataType) : null;
  const isToday = today.getDate() === day && today.getMonth() === today.getMonth();

  return (
    <div className="min-h-[72px] p-1.5 border-b border-r transition-colors" style={{ borderColor: 'var(--t-border)', background: isToday ? 'var(--t-nav-active-bg)' : 'var(--t-card)' }}>
      <span
        className="text-xs font-semibold inline-flex w-5 h-5 items-center justify-center rounded-full"
        style={isToday ? { background: 'var(--t-primary)', color: 'var(--t-text-inv)' } : { color: 'var(--t-muted)' }}
      >
        {day}
      </span>
      <div className="mt-1 space-y-0.5">
        {festivals.slice(0, 2).map((f) => (
          <div key={f._id} className={`text-[9px] font-semibold px-1.5 py-0.5 rounded truncate ${typeStyle(f.dataType).badge} font-sans`}>
            {f.name}
          </div>
        ))}
        {festivals.length > 2 && (
          <div className="text-[9px] text-gray-400 pl-1 font-sans">+{festivals.length - 2} more</div>
        )}
      </div>
    </div>
  );
}

export default function Festivals() {
  const today  = new Date();
  const [festivals, setFestivals] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [month,     setMonth]     = useState(today.getMonth() + 1);
  const [year,      setYear]      = useState(today.getFullYear());
  const [view,      setView]      = useState('timeline');

  useEffect(() => {
    setLoading(true);
    API.get(`/festivals?month=${month}&year=${year}`)
      .then(({ data }) => setFestivals(data.festivals || []))
      .catch(() => setFestivals([]))
      .finally(() => setLoading(false));
  }, [month, year]);

  const prevMonth = () => { if (month === 1) { setMonth(12); setYear((y) => y - 1); } else setMonth((m) => m - 1); };
  const nextMonth = () => { if (month === 12) { setMonth(1); setYear((y) => y + 1); } else setMonth((m) => m + 1); };

  const festivalsByDay = {};
  festivals.forEach((f) => {
    const d = new Date(f.date).getUTCDate();
    if (!festivalsByDay[d]) festivalsByDay[d] = [];
    festivalsByDay[d].push(f);
  });

  const { blanks, total } = buildCalendarDays(year, month);

  const years = [];
  for (let y = today.getFullYear() - 1; y <= today.getFullYear() + 2; y++) years.push(y);

  return (
    <div className="min-h-screen" style={{ background: 'var(--t-bg)' }}>

      {/* ── Premium Header ─────────────────────────────────── */}
      <div className="relative overflow-hidden border-b" style={{ background: 'var(--t-surface)', borderColor: 'var(--t-border)' }}>
        <div className="absolute inset-0 sacred-pattern pointer-events-none opacity-40" />
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-[80px] opacity-20 translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{ background: 'var(--t-primary)' }} />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 relative">
          <div className="text-center mb-7">
            <p className="section-eyebrow justify-center mb-3">Spiritual Calendar</p>
            <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', letterSpacing: '-0.03em', color: 'var(--t-text)', fontFamily: "'Cormorant Garamond', serif", fontWeight: 700 }}>
              Festival Calendar
            </h1>
            <p className="text-sm mt-2" style={{ color: 'var(--t-muted)' }}>Auspicious dates, tithis, and festivals for every month</p>
          </div>

          {/* Month / year navigation + view toggle */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <button
                onClick={prevMonth}
                className="w-9 h-9 rounded-xl border flex items-center justify-center transition-all"
                style={{ background: 'var(--t-card)', borderColor: 'var(--t-border)', color: 'var(--t-muted)' }}
              >
                <ChevronLeft size={16} />
              </button>
              <div className="flex items-center gap-2">
                <select value={month} onChange={(e) => setMonth(+e.target.value)} className="input w-auto py-2 pr-8 text-sm font-semibold">
                  {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
                <select value={year} onChange={(e) => setYear(+e.target.value)} className="input w-auto py-2 pr-8 text-sm font-semibold">
                  {years.map((y) => <option key={y}>{y}</option>)}
                </select>
              </div>
              <button
                onClick={nextMonth}
                className="w-9 h-9 rounded-xl border flex items-center justify-center transition-all"
                style={{ background: 'var(--t-card)', borderColor: 'var(--t-border)', color: 'var(--t-muted)' }}
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* View toggle */}
            <div className="flex gap-1 rounded-xl p-1" style={{ background: 'var(--t-card)', border: '1px solid var(--t-border)' }}>
              {[
                { id: 'timeline', label: 'Timeline', icon: List },
                { id: 'calendar', label: 'Calendar', icon: CalendarDays },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setView(id)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
                  style={{
                    background: view === id ? 'var(--t-primary)' : 'transparent',
                    color:      view === id ? 'var(--t-text-inv)' : 'var(--t-muted)',
                  }}
                >
                  <Icon size={14} /> {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* Month summary */}
        <div className="flex items-center gap-3 mb-6">
          <Sparkles size={15} style={{ color: 'var(--t-primary)' }} />
          <span className="font-bold text-lg" style={{ color: 'var(--t-text)', fontFamily: "'Cormorant Garamond', serif", letterSpacing: '-0.01em' }}>
            {MONTHS[month - 1]} {year}
          </span>
          {!loading && (
            <span className="text-xs font-bold px-3 py-0.5 rounded-full" style={{ background: 'var(--t-nav-active-bg)', color: 'var(--t-primary)' }}>
              {festivals.length} event{festivals.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* ── TIMELINE VIEW ─────────────────────────────────── */}
        {view === 'timeline' && (
          <div>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : festivals.length === 0 ? (
              <div className="text-center py-24">
                <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-5">
                  <Calendar size={32} className="text-gray-300" />
                </div>
                <p className="font-display font-bold text-gray-700 text-xl mb-2" style={{ letterSpacing: '-0.01em' }}>No Festivals Found</p>
                <p className="text-sm text-gray-400 max-w-xs mx-auto font-sans">
                  No events for {MONTHS[month - 1]} {year}. Try another month or ask admin to sync data.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {festivals.map((f, i) => {
                  const dt     = new Date(f.date);
                  const prevDt = i > 0 ? new Date(festivals[i - 1].date) : null;
                  const showSep = !prevDt || dt.getUTCDate() !== prevDt.getUTCDate();
                  return (
                    <React.Fragment key={f._id}>
                      {showSep && i > 0 && <div className="border-t border-gray-100 my-5" />}
                      <FestivalCard festival={f} />
                    </React.Fragment>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── CALENDAR VIEW ─────────────────────────────────── */}
        {view === 'calendar' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
            <div className="grid grid-cols-7 border-b border-gray-100">
              {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d) => (
                <div key={d} className="text-center text-xs font-bold text-gray-400 py-3 border-r border-gray-100 last:border-r-0 font-sans">{d}</div>
              ))}
            </div>

            {loading ? (
              <div className="grid grid-cols-7">
                {Array.from({ length: 35 }).map((_, i) => (
                  <div key={i} className="min-h-[72px] border-b border-r border-gray-100 bg-gray-50/30 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-7">
                {Array.from({ length: blanks }).map((_, i) => (
                  <div key={`b-${i}`} className="min-h-[72px] border-b border-r border-gray-100 bg-gray-50/20" />
                ))}
                {Array.from({ length: total }, (_, i) => i + 1).map((day) => (
                  <CalDay key={day} day={day} festivals={festivalsByDay[day] || []} today={today} />
                ))}
              </div>
            )}

            {!loading && festivals.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-5 flex-wrap">
                {Object.entries(TYPE_STYLES).slice(0, 3).map(([type, s]) => (
                  <div key={type} className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                    <span className="text-xs text-gray-400 capitalize font-sans">{type}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Quick overview sidebar (timeline only) */}
        {view === 'timeline' && !loading && festivals.length > 0 && (
          <div className="mt-10 bg-white rounded-2xl border border-gray-100 p-5 shadow-card">
            <h3 className="font-display font-bold text-gray-800 text-lg mb-4 flex items-center gap-2" style={{ letterSpacing: '-0.01em' }}>
              <CalendarDays size={16} className="text-saffron-500" />
              This Month at a Glance
            </h3>
            <div className="space-y-2">
              {festivals.slice(0, 8).map((f) => <FestivalCard key={f._id} festival={f} compact />)}
              {festivals.length > 8 && (
                <p className="text-xs text-gray-400 text-center pt-2 font-sans">+{festivals.length - 8} more events this month</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
