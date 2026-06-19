import React, { useEffect, useState, useCallback } from 'react';
import {
  Mail, MessageSquare, Zap, FileText, AlertCircle, Send,
  RefreshCw, Plus, Trash2, Edit2, CheckCircle, XCircle,
  Clock, ChevronDown, ChevronRight, ToggleLeft, ToggleRight,
  Search, Filter, BarChart2, ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../../api/axios';

// ─── Sub-tab nav ──────────────────────────────────────────────
const TABS = [
  { id: 'overview',    label: 'Overview',          icon: BarChart2      },
  { id: 'email',       label: 'Email Templates',   icon: Mail           },
  { id: 'whatsapp',    label: 'WhatsApp',          icon: MessageSquare  },
  { id: 'triggers',    label: 'Trigger Rules',     icon: Zap            },
  { id: 'logs',        label: 'Logs',              icon: FileText       },
  { id: 'failed',      label: 'Failed Deliveries', icon: AlertCircle    },
  { id: 'test',        label: 'Test Send',         icon: Send           },
];

// ─── Status pill ─────────────────────────────────────────────
const STATUS_COLORS = {
  delivered:  'bg-green-100 text-green-700',
  failed:     'bg-red-100 text-red-700',
  processing: 'bg-blue-100 text-blue-700',
  queued:     'bg-yellow-100 text-yellow-700',
  retrying:   'bg-purple-100 text-purple-700',
  APPROVED:   'bg-green-100 text-green-700',
  PENDING:    'bg-yellow-100 text-yellow-700',
  REJECTED:   'bg-red-100 text-red-700',
  PAUSED:     'bg-gray-100 text-gray-600',
  DISABLED:   'bg-gray-100 text-gray-400',
};

function Pill({ label }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[label] || 'bg-gray-100 text-gray-600'}`}>
      {label}
    </span>
  );
}

function SectionTitle({ children }) {
  return <h2 className="text-lg font-bold text-gray-900 mb-5">{children}</h2>;
}

function EmptyState({ icon: Icon, text }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
      <Icon size={36} className="mb-3 opacity-40" />
      <p className="text-sm">{text}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// OVERVIEW
// ═══════════════════════════════════════════════════════════════
function OverviewTab() {
  const [data, setData] = useState(null);

  useEffect(() => {
    API.get('/comm/overview').then(({ data: d }) => setData(d));
  }, []);

  if (!data) return <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Loading…</div>;

  const statusMap   = Object.fromEntries((data.byStatus  || []).map((s) => [s._id, s.count]));
  const typeMap     = Object.fromEntries((data.byType    || []).map((t) => [t._id, t.count]));

  const statCards = [
    { label: 'Total Sent',    value: data.stats?.total    || 0, color: 'text-gray-800' },
    { label: 'Last 24 hours', value: data.stats?.last24h  || 0, color: 'text-blue-600' },
    { label: 'This Week',     value: data.stats?.lastWeek || 0, color: 'text-purple-600' },
    { label: 'Delivered',     value: statusMap.delivered  || 0, color: 'text-green-600' },
    { label: 'Failed',        value: statusMap.failed     || 0, color: 'text-red-600'   },
  ];

  return (
    <div className="space-y-6">
      <SectionTitle>Communication Overview</SectionTitle>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statCards.map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <p className={`text-2xl font-bold ${color}`}>{value.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* By Type */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-700 mb-4 text-sm">By Channel</h3>
          <div className="space-y-3">
            {['email', 'whatsapp', 'in-app', 'sms'].map((t) => (
              <div key={t} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 capitalize">{t}</span>
                <span className="font-bold text-gray-800">{(typeMap[t] || 0).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Failed */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-700 mb-4 text-sm">Recent Failed</h3>
          {data.recentFailed?.length === 0 && <p className="text-sm text-gray-400">No failures — all good!</p>}
          <div className="space-y-2">
            {(data.recentFailed || []).map((log) => (
              <div key={log._id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-gray-700 truncate max-w-[180px]">{log.recipientEmail || log.recipientPhone}</p>
                  <p className="text-xs text-gray-400">{log.event} · {log.type}</p>
                </div>
                <span className="text-red-500 text-xs truncate max-w-[120px]">{log.error || 'Unknown error'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// EMAIL TEMPLATES
// ═══════════════════════════════════════════════════════════════
const TEMPLATE_VARIABLES_REF = [
  'user.name', 'user.email', 'user.phone',
  'booking.id', 'booking.number', 'booking.date', 'booking.time', 'booking.amount',
  'pooja.name', 'pandit.name', 'pandit.phone',
  'order.id', 'order.total', 'order.items',
];

const BLANK_EMAIL_TEMPLATE = { name: '', slug: '', subject: '', htmlContent: '', variables: [], description: '' };

function EmailTemplatesTab() {
  const [templates, setTemplates] = useState([]);
  const [editing,   setEditing]   = useState(null);   // null | 'new' | template object
  const [form,      setForm]      = useState(BLANK_EMAIL_TEMPLATE);

  const load = useCallback(() => {
    API.get('/comm/email-templates').then(({ data }) => setTemplates(data.templates || []));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew = () => { setEditing('new'); setForm(BLANK_EMAIL_TEMPLATE); };
  const openEdit = (t) => { setEditing(t); setForm({ ...t, variables: t.variables || [] }); };
  const closeForm = () => setEditing(null);

  const handleSave = async () => {
    try {
      if (editing === 'new') {
        await API.post('/comm/email-templates', form);
        toast.success('Template created');
      } else {
        await API.put(`/comm/email-templates/${editing._id}`, form);
        toast.success('Template updated');
      }
      load();
      closeForm();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Save failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this template?')) return;
    await API.delete(`/comm/email-templates/${id}`);
    toast.success('Deleted');
    load();
  };

  const toggleActive = async (t) => {
    await API.put(`/comm/email-templates/${t._id}`, { ...t, isActive: !t.isActive });
    load();
  };

  const addVar = (v) => {
    if (!form.variables.includes(v)) setForm((f) => ({ ...f, variables: [...f.variables, v] }));
  };

  // ── Form ──
  if (editing !== null) {
    return (
      <div className="space-y-5 max-w-4xl">
        <div className="flex items-center gap-3">
          <button onClick={closeForm} className="text-gray-400 hover:text-gray-600 text-sm">← Back</button>
          <h2 className="text-lg font-bold text-gray-900">{editing === 'new' ? 'New Email Template' : 'Edit Template'}</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Template Name">
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Booking Confirmed" className="input-std" />
          </Field>
          <Field label="Slug (unique ID)">
            <input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))} placeholder="booking-confirmed" className="input-std" />
          </Field>
        </div>

        <Field label="Email Subject">
          <input value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} placeholder="Your booking {{booking.number}} is confirmed!" className="input-std" />
        </Field>

        <Field label="Description (optional)">
          <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Sent when a booking is confirmed after payment" className="input-std" />
        </Field>

        <Field label="HTML Content">
          <textarea
            value={form.htmlContent}
            onChange={(e) => setForm((f) => ({ ...f, htmlContent: e.target.value }))}
            rows={14}
            placeholder="<div>Hello {{user.name}}, your booking {{booking.number}} is confirmed...</div>"
            className="input-std font-mono text-xs resize-y"
          />
        </Field>

        {/* Variable picker */}
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">Available Variables (click to copy into subject/body)</p>
          <div className="flex flex-wrap gap-1.5">
            {TEMPLATE_VARIABLES_REF.map((v) => (
              <button key={v} onClick={() => addVar(v)}
                className="px-2 py-1 rounded-lg bg-gray-100 hover:bg-saffron-100 text-xs text-gray-600 hover:text-saffron-700 transition-colors font-mono">
                {`{{${v}}}`}
              </button>
            ))}
          </div>
          {form.variables.length > 0 && (
            <p className="text-xs text-gray-400 mt-2">Used: {form.variables.map((v) => `{{${v}}}`).join(', ')}</p>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={handleSave} className="btn-primary">Save Template</button>
          <button onClick={closeForm}  className="btn-ghost">Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <SectionTitle>Email Templates</SectionTitle>
        <button onClick={openNew} className="btn-primary flex items-center gap-2">
          <Plus size={15} /> New Template
        </button>
      </div>

      {templates.length === 0 && <EmptyState icon={Mail} text="No email templates yet. Create one to get started." />}
      <div className="space-y-3">
        {templates.map((t) => (
          <div key={t._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-gray-800">{t.name}</p>
                <Pill label={t.isActive ? 'Active' : 'Inactive'} />
              </div>
              <p className="text-sm text-gray-500 mt-0.5 truncate">{t.subject}</p>
              <p className="text-xs text-gray-400 font-mono mt-0.5">{t.slug}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => toggleActive(t)} className="text-gray-400 hover:text-saffron-600 transition-colors">
                {t.isActive ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
              </button>
              <button onClick={() => openEdit(t)} className="text-gray-400 hover:text-blue-600 transition-colors">
                <Edit2 size={16} />
              </button>
              <button onClick={() => handleDelete(t._id)} className="text-gray-400 hover:text-red-500 transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// WHATSAPP TEMPLATES
// ═══════════════════════════════════════════════════════════════
function WhatsAppTab() {
  const [templates, setTemplates] = useState([]);
  const [syncing,   setSyncing]   = useState(false);

  const load = useCallback(() => {
    API.get('/comm/wa-templates').then(({ data }) => setTemplates(data.templates || []));
  }, []);

  useEffect(() => { load(); }, [load]);

  const sync = async () => {
    setSyncing(true);
    try {
      const { data } = await API.post('/comm/wa-templates/sync');
      toast.success(data.message);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const updateTrigger = async (id, assignedTrigger) => {
    await API.patch(`/comm/wa-templates/${id}`, { assignedTrigger });
    load();
  };

  const toggleActive = async (t) => {
    await API.patch(`/comm/wa-templates/${t._id}`, { isActive: !t.isActive });
    load();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <SectionTitle>WhatsApp Templates</SectionTitle>
        <button onClick={sync} disabled={syncing} className="btn-primary flex items-center gap-2">
          <RefreshCw size={15} className={syncing ? 'animate-spin' : ''} />
          {syncing ? 'Syncing…' : 'Sync from Meta'}
        </button>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        Templates are managed in the <strong>Meta Business Manager</strong> and synced here.
        Configure <code className="text-xs">WHATSAPP_ACCESS_TOKEN</code> and <code className="text-xs">WHATSAPP_BUSINESS_ACCOUNT_ID</code> in your .env to enable sync.
      </div>

      {templates.length === 0 && <EmptyState icon={MessageSquare} text="No templates yet — sync from Meta to populate." />}
      <div className="space-y-3">
        {templates.map((t) => (
          <div key={t._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-gray-800">{t.name}</p>
                  <Pill label={t.status} />
                  <span className="text-xs text-gray-400 bg-gray-50 rounded px-2 py-0.5">{t.category}</span>
                  <span className="text-xs text-gray-400">{t.language}</span>
                </div>
                {t.syncedAt && (
                  <p className="text-xs text-gray-400 mt-1">Synced {new Date(t.syncedAt).toLocaleString('en-IN')}</p>
                )}
              </div>
              <button onClick={() => toggleActive(t)} className="text-gray-400 hover:text-saffron-600 transition-colors shrink-0">
                {t.isActive ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
              </button>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <label className="text-xs text-gray-500 font-medium whitespace-nowrap">Assign to event:</label>
              <input
                defaultValue={t.assignedTrigger}
                onBlur={(e) => updateTrigger(t._id, e.target.value)}
                placeholder="e.g. booking_confirmed"
                className="input-std text-sm flex-1"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TRIGGER RULES
// ═══════════════════════════════════════════════════════════════
const CHANNEL_TYPES = ['email', 'whatsapp', 'in-app'];
const RECIPIENTS    = ['user', 'pandit', 'admin', 'both'];

function TriggerRulesTab() {
  const [rules, setRules]     = useState([]);
  const [email, setEmail]     = useState([]);
  const [expanded, setExpanded] = useState(null);

  const load = useCallback(() => {
    API.get('/comm/trigger-rules').then(({ data }) => setRules(data.rules || []));
    API.get('/comm/email-templates').then(({ data }) => setEmail(data.templates || []));
  }, []);

  useEffect(() => { load(); }, [load]);

  const saveRule = async (rule) => {
    await API.put(`/comm/trigger-rules/${rule._id}`, {
      channels:    rule.channels,
      isActive:    rule.isActive,
      description: rule.description,
    });
    toast.success('Rule saved');
    load();
  };

  const toggleRule = async (rule) => {
    await API.put(`/comm/trigger-rules/${rule._id}`, { ...rule, isActive: !rule.isActive });
    load();
  };

  // Group by event category
  const grouped = rules.reduce((acc, r) => {
    const cat = r.label?.includes(' ') ? r.event.split('_')[0] : 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(r);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <SectionTitle>Trigger Rules</SectionTitle>
      <p className="text-sm text-gray-500">Map platform events to notification channels. Rules control which templates fire for each event.</p>

      {rules.length === 0 && <div className="text-sm text-gray-400">Loading rules…</div>}
      <div className="space-y-3">
        {rules.map((rule) => (
          <div key={rule._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 cursor-pointer" onClick={() => setExpanded(expanded === rule._id ? null : rule._id)}>
              <div className="flex items-center gap-3">
                <button onClick={(e) => { e.stopPropagation(); toggleRule(rule); }} className="text-gray-400 hover:text-saffron-600 transition-colors">
                  {rule.isActive ? <ToggleRight size={22} className="text-saffron-500" /> : <ToggleLeft size={22} />}
                </button>
                <div>
                  <p className="font-semibold text-gray-800">{rule.label}</p>
                  <p className="text-xs text-gray-400 font-mono">{rule.event}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">{rule.channels?.length || 0} channel(s)</span>
                {expanded === rule._id ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
              </div>
            </div>

            {expanded === rule._id && (
              <RuleEditor rule={rule} emailTemplates={email} onSave={saveRule} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function RuleEditor({ rule, emailTemplates, onSave }) {
  const [channels, setChannels] = useState(rule.channels || []);

  const addChannel = () => setChannels((c) => [...c, { type: 'email', recipient: 'user', emailTemplateId: '', whatsAppTemplateName: '', isActive: true }]);
  const removeChannel = (i) => setChannels((c) => c.filter((_, idx) => idx !== i));
  const setField = (i, field, val) => setChannels((c) => c.map((ch, idx) => idx === i ? { ...ch, [field]: val } : ch));

  return (
    <div className="border-t border-gray-100 px-5 py-4 space-y-4 bg-gray-50">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Channels</p>
      {channels.length === 0 && <p className="text-sm text-gray-400">No channels configured — add one below.</p>}

      <div className="space-y-3">
        {channels.map((ch, i) => (
          <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
              <Field label="Channel Type">
                <select value={ch.type} onChange={(e) => setField(i, 'type', e.target.value)} className="input-std">
                  {CHANNEL_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Recipient">
                <select value={ch.recipient} onChange={(e) => setField(i, 'recipient', e.target.value)} className="input-std">
                  {RECIPIENTS.map((r) => <option key={r}>{r}</option>)}
                </select>
              </Field>
              {ch.type === 'email' && (
                <Field label="Email Template">
                  <select value={ch.emailTemplateId || ''} onChange={(e) => setField(i, 'emailTemplateId', e.target.value)} className="input-std">
                    <option value="">— select —</option>
                    {emailTemplates.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
                  </select>
                </Field>
              )}
              {ch.type === 'whatsapp' && (
                <Field label="WA Template Name">
                  <input value={ch.whatsAppTemplateName} onChange={(e) => setField(i, 'whatsAppTemplateName', e.target.value)} placeholder="booking_confirmed" className="input-std" />
                </Field>
              )}
              <div className="flex items-end gap-2">
                <button onClick={() => setField(i, 'isActive', !ch.isActive)} className="text-gray-400 hover:text-saffron-600 transition-colors">
                  {ch.isActive ? <ToggleRight size={22} className="text-saffron-500" /> : <ToggleLeft size={22} />}
                </button>
                <button onClick={() => removeChannel(i)} className="text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button onClick={addChannel} className="flex items-center gap-2 text-sm text-saffron-600 hover:text-saffron-700 font-medium">
          <Plus size={15} /> Add Channel
        </button>
        <button onClick={() => onSave({ ...rule, channels })} className="btn-primary text-sm">Save Rule</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// LOGS
// ═══════════════════════════════════════════════════════════════
function LogsTab({ failedOnly = false }) {
  const [logs,   setLogs]   = useState([]);
  const [total,  setTotal]  = useState(0);
  const [page,   setPage]   = useState(1);
  const [filter, setFilter] = useState({ status: failedOnly ? 'failed' : '', type: '', event: '' });
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = { page, limit: 30, ...filter };
    Object.keys(params).forEach((k) => !params[k] && delete params[k]);
    const { data } = await API.get('/comm/logs', { params });
    setLogs(data.logs || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [page, filter]);

  useEffect(() => { load(); }, [load]);

  const retry = async (id) => {
    try {
      await API.post(`/comm/logs/${id}/retry`);
      toast.success('Retry queued');
      load();
    } catch (e) { toast.error(e.response?.data?.message || 'Retry failed'); }
  };

  const clearFailed = async () => {
    if (!window.confirm('Delete all failed logs?')) return;
    await API.delete('/comm/logs/failed/clear');
    toast.success('Failed logs cleared');
    load();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <SectionTitle>{failedOnly ? 'Failed Deliveries' : 'Notification Logs'}</SectionTitle>
        <div className="flex items-center gap-2 flex-wrap">
          {!failedOnly && (
            <>
              <select value={filter.type} onChange={(e) => setFilter((f) => ({ ...f, type: e.target.value }))} className="input-std text-sm w-32">
                <option value="">All types</option>
                {['email','whatsapp','in-app','sms'].map((t) => <option key={t}>{t}</option>)}
              </select>
              <select value={filter.status} onChange={(e) => setFilter((f) => ({ ...f, status: e.target.value }))} className="input-std text-sm w-36">
                <option value="">All status</option>
                {['queued','processing','delivered','failed','retrying'].map((s) => <option key={s}>{s}</option>)}
              </select>
            </>
          )}
          {failedOnly && (
            <button onClick={clearFailed} className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 font-medium border border-red-200 rounded-xl px-3 py-2">
              <Trash2 size={14} /> Clear All Failed
            </button>
          )}
          <button onClick={load} className="text-gray-400 hover:text-gray-600 transition-colors">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="text-xs text-gray-400">{total.toLocaleString()} total records</div>

      {logs.length === 0 && !loading && <EmptyState icon={FileText} text={failedOnly ? 'No failed deliveries.' : 'No logs found.'} />}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-left text-xs text-gray-500">
                <th className="px-4 py-3 font-medium">Recipient</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Event</th>
                <th className="px-4 py-3 font-medium">Template</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {logs.map((log) => (
                <tr key={log._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-700 max-w-[150px] truncate">
                    {log.recipientEmail || log.recipientPhone || log.recipientName || '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 capitalize">{log.type}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{log.event}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs max-w-[130px] truncate">{log.templateName || '—'}</td>
                  <td className="px-4 py-3"><Pill label={log.status} /></td>
                  <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{new Date(log.createdAt).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3">
                    {log.status === 'failed' && (
                      <button onClick={() => retry(log._id)} className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                        <RefreshCw size={12} /> Retry
                      </button>
                    )}
                    {log.error && (
                      <span className="text-xs text-red-400 block mt-0.5 max-w-[120px] truncate" title={log.error}>{log.error}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {total > 30 && (
        <div className="flex items-center justify-between text-sm">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost py-2 px-4 disabled:opacity-40">Previous</button>
          <span className="text-gray-500">Page {page} of {Math.ceil(total / 30)}</span>
          <button onClick={() => setPage((p) => p + 1)} disabled={page >= Math.ceil(total / 30)} className="btn-ghost py-2 px-4 disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TEST SEND
// ═══════════════════════════════════════════════════════════════
function TestSendTab() {
  const [type,     setType]    = useState('email');
  const [to,       setTo]      = useState('');
  const [slug,     setSlug]    = useState('');
  const [waName,   setWaName]  = useState('');
  const [message,  setMessage] = useState('');
  const [vars,     setVars]    = useState('{}');
  const [sending,  setSending] = useState(false);
  const [result,   setResult]  = useState(null);
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    API.get('/comm/email-templates').then(({ data }) => setTemplates(data.templates || []));
  }, []);

  const send = async () => {
    setSending(true);
    setResult(null);
    try {
      let variables = {};
      try { variables = JSON.parse(vars); } catch { toast.error('Variables must be valid JSON'); setSending(false); return; }
      const payload = { type, to, variables };
      if (type === 'email')     payload.templateSlug  = slug;
      if (type === 'whatsapp' && waName)  payload.templateName  = waName;
      if (type === 'whatsapp' && message) payload.message       = message;

      const { data } = await API.post('/comm/test', payload);
      setResult({ success: true, ...data });
      toast.success('Test notification dispatched');
    } catch (e) {
      setResult({ success: false, message: e.response?.data?.message || e.message });
      toast.error('Send failed');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-5 max-w-xl">
      <SectionTitle>Test Send</SectionTitle>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <Field label="Channel">
          <div className="flex gap-2">
            {['email', 'whatsapp'].map((t) => (
              <button key={t} onClick={() => setType(t)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors capitalize ${type === t ? 'bg-saffron-500 text-white border-saffron-500' : 'bg-white text-gray-600 border-gray-200 hover:border-saffron-300'}`}>
                {t}
              </button>
            ))}
          </div>
        </Field>

        <Field label={type === 'email' ? 'Recipient Email' : 'Phone (e.g. 9876543210)'}>
          <input value={to} onChange={(e) => setTo(e.target.value)} placeholder={type === 'email' ? 'admin@example.com' : '9876543210'} className="input-std" />
        </Field>

        {type === 'email' && (
          <Field label="Email Template">
            <select value={slug} onChange={(e) => setSlug(e.target.value)} className="input-std">
              <option value="">— select template —</option>
              {templates.map((t) => <option key={t._id} value={t.slug}>{t.name}</option>)}
            </select>
          </Field>
        )}

        {type === 'whatsapp' && (
          <>
            <Field label="Template Name (leave blank to send text)">
              <input value={waName} onChange={(e) => setWaName(e.target.value)} placeholder="booking_confirmed_v1" className="input-std" />
            </Field>
            <Field label="Freeform Message (if no template)">
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} placeholder="Hello! This is a test notification from Zutsav." className="input-std resize-none" />
            </Field>
          </>
        )}

        <Field label="Template Variables (JSON)">
          <textarea value={vars} onChange={(e) => setVars(e.target.value)} rows={3}
            placeholder='{"user.name":"Ramesh","booking.number":"ZT-00123"}' className="input-std font-mono text-xs resize-none" />
        </Field>

        <button onClick={send} disabled={sending || !to} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
          <Send size={16} className={sending ? 'animate-bounce' : ''} />
          {sending ? 'Sending…' : 'Send Test Notification'}
        </button>

        {result && (
          <div className={`rounded-xl p-4 text-sm ${result.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {result.success ? (
              <p><strong>Delivered</strong> — Log ID: <code className="text-xs">{result.logId}</code></p>
            ) : (
              <p><strong>Failed:</strong> {result.message}</p>
            )}
          </div>
        )}
      </div>

      {/* Variables Reference */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="font-semibold text-gray-700 mb-3 text-sm">Variable Reference</p>
        <div className="flex flex-wrap gap-1.5">
          {TEMPLATE_VARIABLES_REF.map((v) => (
            <button key={v} onClick={() => { navigator.clipboard?.writeText(`{{${v}}}`); toast.success('Copied'); }}
              className="px-2 py-1 rounded-lg bg-gray-100 hover:bg-saffron-100 text-xs text-gray-600 hover:text-saffron-700 transition-colors font-mono">
              {`{{${v}}}`}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Small helpers ───────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-gray-500">{label}</label>
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ROOT COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function CommunicationCenter() {
  const [tab, setTab] = useState('overview');

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Communication Center</h1>
        <p className="text-sm text-gray-500 mt-1">Manage email & WhatsApp templates, trigger rules, and delivery logs</p>
      </div>

      {/* Sub-tab bar */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide bg-gray-100 rounded-2xl p-1.5">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${tab === id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {tab === 'overview'  && <OverviewTab />}
        {tab === 'email'     && <EmailTemplatesTab />}
        {tab === 'whatsapp'  && <WhatsAppTab />}
        {tab === 'triggers'  && <TriggerRulesTab />}
        {tab === 'logs'      && <LogsTab />}
        {tab === 'failed'    && <LogsTab failedOnly />}
        {tab === 'test'      && <TestSendTab />}
      </div>
    </div>
  );
}
