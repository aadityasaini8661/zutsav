import React, { useEffect, useState, useCallback } from 'react';
import {
  Calendar, Clock, Plus, Trash2, AlertCircle, CheckCircle,
  ChevronLeft, ChevronRight, BookOpen, MapPin,
} from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../../api/axios';

// ─── Constants ────────────────────────────────────────────────
const DAYS = [
  { dayOfWeek: 1, label: 'Monday',    short: 'Mon' },
  { dayOfWeek: 2, label: 'Tuesday',   short: 'Tue' },
  { dayOfWeek: 3, label: 'Wednesday', short: 'Wed' },
  { dayOfWeek: 4, label: 'Thursday',  short: 'Thu' },
  { dayOfWeek: 5, label: 'Friday',    short: 'Fri' },
  { dayOfWeek: 6, label: 'Saturday',  short: 'Sat' },
  { dayOfWeek: 0, label: 'Sunday',    short: 'Sun' },
];

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const DEFAULT_SCHEDULE = DAYS.map(({ dayOfWeek }) => ({
  dayOfWeek,
  enabled: dayOfWeek >= 1 && dayOfWeek <= 5,
  slots: dayOfWeek >= 1 && dayOfWeek <= 5 ? [{ start: '09:00', end: '17:00' }] : [],
}));

const TIME_OPTIONS = (() => {
  const opts = [];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      const hh = String(h).padStart(2, '0');
      const mm = String(m).padStart(2, '0');
      opts.push(`${hh}:${mm}`);
    }
  }
  return opts;
})();

const fmt12 = (t) => {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hr = h % 12 || 12;
  return `${hr}:${String(m).padStart(2, '0')} ${ampm}`;
};

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const slotsOverlap = (slots) => {
  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      if (slots[i].start < slots[j].end && slots[j].start < slots[i].end) return true;
    }
  }
  return false;
};

// ─── Time Selector ─────────────────────────────────────────────
function TimeSelect({ value, onChange, label }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:border-saffron-400 focus:ring-1 focus:ring-saffron-200 appearance-none cursor-pointer"
      aria-label={label}
    >
      {TIME_OPTIONS.map((t) => (
        <option key={t} value={t}>{fmt12(t)}</option>
      ))}
    </select>
  );
}

// ─── Toggle Switch ─────────────────────────────────────────────
function Toggle({ checked, onChange, size = 'md' }) {
  const w = size === 'lg' ? 'w-14 h-7' : 'w-10 h-5';
  const dot = size === 'lg' ? 'w-5 h-5 translate-x-1 peer-checked:translate-x-8' : 'w-3.5 h-3.5 translate-x-0.5 peer-checked:translate-x-5';
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" className="sr-only peer" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <div className={`${w} bg-gray-200 peer-focus:ring-2 peer-focus:ring-saffron-200 rounded-full peer peer-checked:bg-saffron-500 transition-colors`} />
      <span className={`absolute top-0.5 left-0 ${dot} bg-white rounded-full shadow transition-transform duration-200`} />
    </label>
  );
}

// ─── WEEKLY SCHEDULE TAB ──────────────────────────────────────
function WeeklyScheduleTab({ pandit, onSave }) {
  const [schedule, setSchedule] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (pandit.weeklySchedule?.length > 0) {
      // Merge saved data with DAYS ordering
      const saved = pandit.weeklySchedule;
      setSchedule(
        DAYS.map(({ dayOfWeek }) => {
          const found = saved.find((d) => d.dayOfWeek === dayOfWeek);
          return found
            ? { dayOfWeek, enabled: found.enabled, slots: found.slots || [] }
            : { dayOfWeek, enabled: false, slots: [] };
        })
      );
    } else {
      setSchedule(DEFAULT_SCHEDULE);
    }
  }, [pandit.weeklySchedule]);

  const updateDay = (idx, patch) => {
    setSchedule((prev) => prev.map((d, i) => i === idx ? { ...d, ...patch } : d));
  };

  const addSlot = (idx) => {
    const day = schedule[idx];
    const lastEnd = day.slots[day.slots.length - 1]?.end || '09:00';
    const [h, m] = lastEnd.split(':').map(Number);
    const newStart = `${String(h + 1 > 23 ? 23 : h + 1).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
    const newEnd   = `${String(h + 3 > 23 ? 23 : h + 3).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
    updateDay(idx, { slots: [...day.slots, { start: newStart, end: newEnd }] });
  };

  const removeSlot = (dayIdx, slotIdx) => {
    setSchedule((prev) => prev.map((d, i) =>
      i === dayIdx ? { ...d, slots: d.slots.filter((_, j) => j !== slotIdx) } : d
    ));
  };

  const updateSlot = (dayIdx, slotIdx, field, val) => {
    setSchedule((prev) => prev.map((d, i) =>
      i === dayIdx
        ? { ...d, slots: d.slots.map((s, j) => j === slotIdx ? { ...s, [field]: val } : s) }
        : d
    ));
  };

  const handleSave = async () => {
    // Validate
    for (const day of schedule) {
      if (!day.enabled) continue;
      if (day.slots.length === 0) {
        toast.error(`${DAYS.find(d => d.dayOfWeek === day.dayOfWeek)?.label}: add at least one slot or mark as unavailable`);
        return;
      }
      for (const s of day.slots) {
        if (s.start >= s.end) {
          toast.error(`${DAYS.find(d => d.dayOfWeek === day.dayOfWeek)?.label}: start time must be before end time`);
          return;
        }
      }
      if (slotsOverlap(day.slots)) {
        toast.error(`${DAYS.find(d => d.dayOfWeek === day.dayOfWeek)?.label}: time slots overlap`);
        return;
      }
    }

    setSaving(true);
    try {
      await API.put('/pandits/me/weekly-schedule', { weeklySchedule: schedule });
      toast.success('Weekly schedule saved!');
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-gray-800">Weekly Schedule</h3>
          <p className="text-sm text-gray-500 mt-0.5">Set your recurring weekly availability</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="btn-primary px-5 py-2 text-sm flex items-center gap-2">
          <CheckCircle size={15} />
          {saving ? 'Saving...' : 'Save Schedule'}
        </button>
      </div>

      <div className="space-y-2">
        {schedule.map((day, idx) => {
          const info = DAYS.find((d) => d.dayOfWeek === day.dayOfWeek);
          return (
            <div key={day.dayOfWeek}
              className={`rounded-2xl border transition-colors ${day.enabled ? 'bg-white border-gray-100' : 'bg-gray-50 border-gray-100'}`}>
              <div className="flex items-center gap-4 px-4 py-3">
                {/* Toggle + day name */}
                <Toggle checked={day.enabled} onChange={(v) => {
                  updateDay(idx, { enabled: v, slots: v && day.slots.length === 0 ? [{ start: '09:00', end: '17:00' }] : day.slots });
                }} />
                <span className={`w-24 text-sm font-semibold ${day.enabled ? 'text-gray-800' : 'text-gray-400'}`}>
                  {info?.label}
                </span>

                {!day.enabled ? (
                  <span className="text-xs text-gray-400 italic">Unavailable</span>
                ) : (
                  <div className="flex-1 space-y-2">
                    {day.slots.map((slot, si) => (
                      <div key={si} className="flex items-center gap-2 flex-wrap">
                        <TimeSelect value={slot.start} onChange={(v) => updateSlot(idx, si, 'start', v)} label="Start time" />
                        <span className="text-gray-400 text-sm">–</span>
                        <TimeSelect value={slot.end} onChange={(v) => updateSlot(idx, si, 'end', v)} label="End time" />
                        {slot.start >= slot.end && (
                          <span className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle size={12} /> Invalid range
                          </span>
                        )}
                        <button onClick={() => removeSlot(idx, si)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    <button onClick={() => addSlot(idx)}
                      className="flex items-center gap-1 text-xs text-saffron-600 font-medium hover:text-saffron-700 mt-1">
                      <Plus size={13} /> Add slot
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-400 text-center pt-2">
        This schedule repeats every week. Use Special Dates to override specific days.
      </p>
    </div>
  );
}

// ─── SPECIAL DATES TAB ───────────────────────────────────────
function SpecialDatesTab({ pandit, onSave }) {
  const [form, setForm] = useState({ date: '', type: 'unavailable', slots: [{ start: '09:00', end: '17:00' }] });
  const [saving, setSaving] = useState(false);

  const addFormSlot = () => {
    const last = form.slots[form.slots.length - 1];
    const [h] = last.end.split(':').map(Number);
    const ns = `${String(h + 1 > 23 ? 23 : h + 1).padStart(2,'0')}:00`;
    const ne = `${String(h + 3 > 23 ? 23 : h + 3).padStart(2,'0')}:00`;
    setForm({ ...form, slots: [...form.slots, { start: ns, end: ne }] });
  };

  const updateFormSlot = (i, field, val) => {
    setForm({ ...form, slots: form.slots.map((s, j) => j === i ? { ...s, [field]: val } : s) });
  };

  const removeFormSlot = (i) => setForm({ ...form, slots: form.slots.filter((_, j) => j !== i) });

  const handleAdd = async () => {
    if (!form.date) { toast.error('Select a date'); return; }
    if (form.type === 'custom') {
      if (form.slots.length === 0) { toast.error('Add at least one time slot'); return; }
      for (const s of form.slots) {
        if (s.start >= s.end) { toast.error('Start time must be before end time'); return; }
      }
      if (slotsOverlap(form.slots)) { toast.error('Slots overlap'); return; }
    }
    setSaving(true);
    try {
      await API.post('/pandits/me/special-dates', {
        date: form.date,
        type: form.type,
        slots: form.type === 'custom' ? form.slots : [],
      });
      toast.success('Special date saved');
      setForm({ date: '', type: 'unavailable', slots: [{ start: '09:00', end: '17:00' }] });
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/pandits/me/special-dates/${id}`);
      toast.success('Removed');
      onSave();
    } catch { toast.error('Failed'); }
  };

  const sorted = [...(pandit.specialDates || [])].sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div className="space-y-5">
      {/* Form */}
      <div className="bg-saffron-50 border border-saffron-100 rounded-2xl p-5">
        <h3 className="font-bold text-gray-800 mb-1">Add Special Date</h3>
        <p className="text-sm text-gray-500 mb-4">Override your weekly schedule for a specific date</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div>
            <label className="label">Date *</label>
            <input type="date" className="input" value={form.date}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div>
            <label className="label">Type *</label>
            <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="unavailable">Unavailable</option>
              <option value="custom">Custom Hours</option>
            </select>
          </div>
          <button onClick={handleAdd} disabled={saving}
            className="btn-primary py-2.5 text-sm flex items-center justify-center gap-2">
            <Plus size={15} /> {saving ? 'Saving...' : 'Add Date'}
          </button>
        </div>

        {form.type === 'custom' && (
          <div className="mt-4 space-y-2">
            <label className="label">Time Slots</label>
            {form.slots.map((s, i) => (
              <div key={i} className="flex items-center gap-2 flex-wrap">
                <TimeSelect value={s.start} onChange={(v) => updateFormSlot(i, 'start', v)} label="Start" />
                <span className="text-gray-400">–</span>
                <TimeSelect value={s.end} onChange={(v) => updateFormSlot(i, 'end', v)} label="End" />
                {s.start >= s.end && <span className="text-xs text-red-500">Invalid range</span>}
                {form.slots.length > 1 && (
                  <button onClick={() => removeFormSlot(i)} className="p-1.5 text-gray-400 hover:text-red-500">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
            <button onClick={addFormSlot} className="flex items-center gap-1 text-xs text-saffron-600 font-medium mt-1">
              <Plus size={13} /> Add slot
            </button>
          </div>
        )}
      </div>

      {/* List */}
      <div>
        <h3 className="font-bold text-gray-800 mb-3">Special Dates ({sorted.length})</h3>
        {sorted.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl border border-gray-100 text-gray-400">
            <Calendar size={32} className="mx-auto mb-2 opacity-40" />
            No special dates configured
          </div>
        ) : (
          <div className="space-y-2">
            {sorted.map((sd) => (
              <div key={sd._id} className={`flex items-center justify-between p-4 rounded-2xl border ${sd.type === 'unavailable' ? 'bg-red-50 border-red-100' : 'bg-yellow-50 border-yellow-100'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${sd.type === 'unavailable' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-700'}`}>
                    {new Date(sd.date).getDate()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{fmtDate(sd.date)}</p>
                    <p className={`text-xs font-medium ${sd.type === 'unavailable' ? 'text-red-600' : 'text-yellow-700'}`}>
                      {sd.type === 'unavailable' ? 'Unavailable' : 'Custom: ' + sd.slots.map((s) => `${fmt12(s.start)}–${fmt12(s.end)}`).join(', ')}
                    </p>
                  </div>
                </div>
                <button onClick={() => handleDelete(sd._id)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── LEAVES & VACATIONS TAB ──────────────────────────────────
function LeavesTab({ pandit, onSave }) {
  const [form, setForm] = useState({ title: '', startDate: '', endDate: '', reason: '' });
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleAdd = async () => {
    if (!form.title || !form.startDate || !form.endDate) {
      toast.error('Title, start date and end date are required');
      return;
    }
    if (new Date(form.startDate) > new Date(form.endDate)) {
      toast.error('End date must be after start date');
      return;
    }
    setSaving(true);
    try {
      await API.post('/pandits/me/block', {
        title:     form.title,
        startDate: form.startDate,
        endDate:   form.endDate,
        reason:    form.reason,
      });
      toast.success('Leave added');
      setForm({ title: '', startDate: '', endDate: '', reason: '' });
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/pandits/me/block/${id}`);
      toast.success('Leave removed');
      onSave();
    } catch { toast.error('Failed'); }
  };

  const sorted = [...(pandit.blockedPeriods || [])].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

  return (
    <div className="space-y-5">
      {/* Form */}
      <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5">
        <h3 className="font-bold text-gray-800 mb-1">Add Leave / Vacation</h3>
        <p className="text-sm text-gray-500 mb-4">Block all bookings during this period</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Leave Title *</label>
            <input className="input" placeholder="e.g. Personal Leave, Festival Travel..." value={form.title} onChange={set('title')} />
          </div>
          <div>
            <label className="label">Reason / Notes</label>
            <input className="input" placeholder="Optional notes" value={form.reason} onChange={set('reason')} />
          </div>
          <div>
            <label className="label">Start Date *</label>
            <input type="date" className="input" value={form.startDate} onChange={set('startDate')} />
          </div>
          <div>
            <label className="label">End Date *</label>
            <input type="date" className="input" value={form.endDate}
              min={form.startDate || undefined} onChange={set('endDate')} />
          </div>
        </div>

        <button onClick={handleAdd} disabled={saving}
          className="mt-4 btn-primary text-sm px-5 py-2.5 flex items-center gap-2">
          <Plus size={15} /> {saving ? 'Saving...' : 'Add Leave'}
        </button>
      </div>

      {/* List */}
      <div>
        <h3 className="font-bold text-gray-800 mb-3">Scheduled Leaves ({sorted.length})</h3>
        {sorted.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl border border-gray-100 text-gray-400">
            <Clock size={32} className="mx-auto mb-2 opacity-40" />
            No leaves scheduled
          </div>
        ) : (
          <div className="space-y-2">
            {sorted.map((lv) => {
              const start = new Date(lv.startDate);
              const end   = new Date(lv.endDate);
              const days  = Math.round((end - start) / 86400000) + 1;
              return (
                <div key={lv._id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-orange-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600 shrink-0">
                      <Clock size={18} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{lv.title || 'Leave'}</p>
                      <p className="text-xs text-gray-500">
                        {fmtDate(lv.startDate)} – {fmtDate(lv.endDate)}
                        <span className="ml-1 text-orange-600 font-medium">({days} day{days > 1 ? 's' : ''})</span>
                      </p>
                      {lv.reason && <p className="text-xs text-gray-400 mt-0.5">{lv.reason}</p>}
                    </div>
                  </div>
                  <button onClick={() => handleDelete(lv._id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MINI CALENDAR ────────────────────────────────────────────
function MiniCalendar({ pandit, bookings }) {
  const today = new Date();
  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay    = new Date(year, month, 1).getDay();

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const getDayStatus = useCallback((day) => {
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();
    const dayStart = new Date(year, month, day, 0, 0, 0);
    const dayEnd   = new Date(year, month, day, 23, 59, 59);

    // Check leave (blocked period)
    const onLeave = pandit.blockedPeriods?.some(
      (b) => date >= new Date(b.startDate) && date <= new Date(b.endDate)
    );
    if (onLeave) return 'leave';

    // Check special date
    const special = pandit.specialDates?.find(
      (s) => new Date(s.date) >= dayStart && new Date(s.date) <= dayEnd
    );
    if (special) return special.type === 'unavailable' ? 'unavailable' : 'special';

    // Check weekly schedule
    if (pandit.weeklySchedule?.length > 0) {
      const sched = pandit.weeklySchedule.find((d) => d.dayOfWeek === dayOfWeek);
      if (!sched?.enabled) return 'off';

      // Check if partially available (has limited slots)
      if (sched.slots.length === 1) {
        const [sh, sm] = sched.slots[0].start.split(':').map(Number);
        const [eh, em] = sched.slots[0].end.split(':').map(Number);
        const totalMins = (eh * 60 + em) - (sh * 60 + sm);
        if (totalMins < 240) return 'limited'; // less than 4 hours = limited
      }
      return 'available';
    }

    // Legacy: check availabilitySlots
    const hasSlot = pandit.availabilitySlots?.some((slot) => {
      if (!slot.isActive) return false;
      const inRange = date >= new Date(slot.startDate) && date <= new Date(slot.endDate);
      if (!inRange) return false;
      return slot.daysOfWeek.length === 0 || slot.daysOfWeek.includes(dayOfWeek);
    });
    if (hasSlot) return 'available';

    return 'none';
  }, [pandit, year, month]);

  const hasBooking = useCallback((day) => {
    const date = new Date(year, month, day);
    return bookings.some((b) => {
      const bd = new Date(b.scheduledDate);
      return bd.getFullYear() === date.getFullYear() && bd.getMonth() === date.getMonth() && bd.getDate() === date.getDate();
    });
  }, [bookings, year, month]);

  const STATUS_STYLE = {
    available:   'bg-green-100 text-green-700 hover:bg-green-200',
    limited:     'bg-yellow-100 text-yellow-700 hover:bg-yellow-200',
    unavailable: 'bg-red-100 text-red-600',
    leave:       'bg-red-100 text-red-600',
    special:     'bg-yellow-100 text-yellow-700',
    off:         'text-gray-300',
    none:        'text-gray-300',
  };

  const isToday = (d) =>
    d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-800">{MONTH_NAMES[month]} {year}</h3>
        <div className="flex gap-1">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600"><ChevronLeft size={16} /></button>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600"><ChevronRight size={16} /></button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
          <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {Array(firstDay).fill(null).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
          const status = getDayStatus(d);
          const booked = hasBooking(d);
          return (
            <div key={d} className={`relative aspect-square flex items-center justify-center rounded-lg text-xs font-medium transition-colors ${STATUS_STYLE[status] || 'text-gray-300'} ${isToday(d) ? 'ring-2 ring-saffron-400 ring-offset-1' : ''}`}>
              {d}
              {booked && (
                <span className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-blue-500" />
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-gray-100">
        {[
          ['bg-green-200',  'Available'],
          ['bg-yellow-200', 'Limited / Special'],
          ['bg-red-200',    'Unavailable / Leave'],
          ['bg-blue-500 w-2 h-2 rounded-full', 'Has Booking'],
        ].map(([cls, label]) => (
          <div key={label} className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className={`w-3 h-3 rounded-sm ${cls}`} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── UPCOMING BOOKINGS ────────────────────────────────────────
function UpcomingBookings({ bookings: allBookings, loading }) {
  const bookings = (allBookings || [])
    .filter((b) => ['paid', 'pandit_assigned'].includes(b.status) && new Date(b.scheduledDate) >= new Date())
    .sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));

  const STATUS_COLOR = {
    paid:            'bg-blue-100 text-blue-700',
    pandit_assigned: 'bg-purple-100 text-purple-700',
    completed:       'bg-green-100 text-green-700',
    cancelled:       'bg-red-100 text-red-700',
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
        <BookOpen size={18} className="text-saffron-500" />
        Upcoming Bookings
      </h3>

      {loading ? (
        <div className="space-y-3">
          {[1,2].map((i) => <div key={i} className="h-16 bg-gray-50 rounded-xl animate-pulse" />)}
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <BookOpen size={28} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm">No upcoming bookings</p>
        </div>
      ) : (
        <div className="space-y-2">
          {bookings.map((b) => (
            <div key={b._id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
              <div className="w-10 h-10 bg-saffron-50 rounded-xl flex items-center justify-center shrink-0">
                <span className="text-lg">🪔</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 text-sm truncate">{b.poojaId?.name || 'Pooja'}</p>
                <p className="text-xs text-gray-500">
                  {b.userDetails?.name} · {new Date(b.scheduledDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} at {b.scheduledTime}
                </p>
                {b.userDetails?.address && (
                  <p className="text-xs text-gray-400 truncate flex items-center gap-1">
                    <MapPin size={10} /> {b.userDetails.address}
                  </p>
                )}
              </div>
              <div className="text-right shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[b.status] || 'bg-gray-100 text-gray-600'}`}>
                  {b.status.replace(/_/g,' ')}
                </span>
                <p className="text-xs text-gray-400 mt-0.5">#{b.bookingNumber}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────
export default function AvailabilityManager({ pandit, onReload }) {
  const [tab,             setTab]             = useState('weekly');
  const [toggling,        setToggling]        = useState(false);
  const [bookings,        setBookings]        = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);

  useEffect(() => {
    API.get('/bookings/my?limit=50')
      .then(({ data }) => setBookings(data.bookings || []))
      .catch(() => {})
      .finally(() => setBookingsLoading(false));
  }, []);

  const handleToggle = async (val) => {
    setToggling(true);
    try {
      await API.patch('/pandits/me/toggle-availability', { isAvailableForBookings: val });
      toast.success(val ? 'You are now available for bookings' : 'You are now unavailable for bookings');
      onReload();
    } catch { toast.error('Failed'); }
    finally { setToggling(false); }
  };

  const TABS = [
    { id: 'weekly',   label: 'Weekly Schedule', icon: Calendar },
    { id: 'special',  label: 'Special Dates',   icon: Clock },
    { id: 'leaves',   label: 'Leaves & Vacations', icon: AlertCircle },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header + Global Toggle */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Availability Settings</h2>
          <p className="text-sm text-gray-500 mt-0.5">Manage when you're available for bookings</p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-2xl">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${tab === id ? 'bg-white shadow-sm text-saffron-600' : 'text-gray-500 hover:text-gray-700'}`}>
            <Icon size={15} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        {tab === 'weekly'  && <WeeklyScheduleTab pandit={pandit} onSave={onReload} />}
        {tab === 'special' && <SpecialDatesTab   pandit={pandit} onSave={onReload} />}
        {tab === 'leaves'  && <LeavesTab         pandit={pandit} onSave={onReload} />}
      </div>

      {/* Two-column: calendar + upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <MiniCalendar pandit={pandit} bookings={bookings} />
        <UpcomingBookings bookings={bookings} loading={bookingsLoading} />
      </div>
    </div>
  );
}
