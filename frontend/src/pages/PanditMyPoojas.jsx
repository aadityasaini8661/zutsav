import React, { useEffect, useState } from 'react';
import { Plus, Edit3, Trash2, Eye, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../api/axios';

const STATUS_BADGE = {
  pending:  'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  inactive: 'bg-gray-100 text-gray-500',
};
const STATUS_ICON = {
  pending:  <Clock size={13} className="text-yellow-500" />,
  approved: <CheckCircle size={13} className="text-green-500" />,
  rejected: <XCircle size={13} className="text-red-500" />,
  inactive: <AlertCircle size={13} className="text-gray-400" />,
};

function PoojaForm({ categories, initial, onSave, onCancel, loading }) {
  const [form, setForm] = useState(initial || {
    name: '', categoryId: '', description: '', shortDesc: '',
    price: '', duration: '', requirements: '', benefits: '', languages: '',
  });
  const [image, setImage] = useState(null);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.categoryId || !form.price) {
      toast.error('Name, category and price are required');
      return;
    }
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
    if (image) fd.append('image', image);
    onSave(fd);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Pooja Name *</label>
          <input className="input" placeholder="e.g. Ganesh Puja" value={form.name} onChange={set('name')} />
        </div>
        <div>
          <label className="label">Category *</label>
          <select className="input" value={form.categoryId} onChange={set('categoryId')}>
            <option value="">Select category</option>
            {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="label">Short Description</label>
        <input className="input" placeholder="One-line summary" value={form.shortDesc} onChange={set('shortDesc')} />
      </div>

      <div>
        <label className="label">Full Description</label>
        <textarea className="input min-h-[80px] resize-none text-sm" value={form.description} onChange={set('description')} placeholder="Detailed pooja description..." />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Price (₹) *</label>
          <input type="number" min="0" className="input" value={form.price} onChange={set('price')} placeholder="e.g. 1100" />
        </div>
        <div>
          <label className="label">Duration</label>
          <input className="input" placeholder="e.g. 2 hours" value={form.duration} onChange={set('duration')} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="label">Requirements <span className="text-gray-400 text-xs">(comma-separated)</span></label>
          <input className="input text-sm" placeholder="Flowers, Ghee, ..." value={form.requirements} onChange={set('requirements')} />
        </div>
        <div>
          <label className="label">Benefits <span className="text-gray-400 text-xs">(comma-separated)</span></label>
          <input className="input text-sm" placeholder="Peace, Prosperity, ..." value={form.benefits} onChange={set('benefits')} />
        </div>
        <div>
          <label className="label">Languages <span className="text-gray-400 text-xs">(comma-separated)</span></label>
          <input className="input text-sm" placeholder="Hindi, Sanskrit, ..." value={form.languages} onChange={set('languages')} />
        </div>
      </div>

      <div>
        <label className="label">Pooja Image</label>
        <input type="file" accept="image/*" className="block w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-saffron-50 file:text-saffron-700"
          onChange={(e) => setImage(e.target.files[0])} />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading} className="btn-primary flex-1 py-2.5">
          {loading ? 'Saving...' : initial ? 'Update Pooja' : 'Submit for Approval'}
        </button>
        <button type="button" onClick={onCancel} className="btn-outline flex-1 py-2.5">Cancel</button>
      </div>

      {!initial && (
        <p className="text-xs text-amber-600 bg-amber-50 rounded-xl p-3 border border-amber-100">
          Your pooja will be submitted for admin approval. It will not be visible to users until approved.
        </p>
      )}
    </form>
  );
}

export default function PanditMyPoojas() {
  const [poojas,     setPoojas]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [view,       setView]       = useState('list'); // 'list' | 'create' | 'edit'
  const [editing,    setEditing]    = useState(null);

  const loadPoojas = () => {
    API.get('/pandit/my-poojas').then(({ data }) => setPoojas(data.poojas)).catch(() => toast.error('Failed to load poojas')).finally(() => setLoading(false));
  };

  useEffect(() => {
    API.get('/poojas/categories').then(({ data }) => setCategories(data.categories));
    loadPoojas();
  }, []);

  const handleCreate = async (fd) => {
    // convert comma-separated strings to JSON arrays
    ['requirements', 'benefits', 'languages'].forEach((k) => {
      const val = fd.get(k);
      if (val) fd.set(k, JSON.stringify(val.split(',').map((s) => s.trim()).filter(Boolean)));
    });
    setSaving(true);
    try {
      await API.post('/pandit/my-poojas', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Pooja submitted for approval');
      setView('list');
      loadPoojas();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create pooja');
    } finally { setSaving(false); }
  };

  const handleUpdate = async (fd) => {
    ['requirements', 'benefits', 'languages'].forEach((k) => {
      const val = fd.get(k);
      if (val) fd.set(k, JSON.stringify(val.split(',').map((s) => s.trim()).filter(Boolean)));
    });
    setSaving(true);
    try {
      await API.patch(`/pandit/my-poojas/${editing._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Pooja updated — pending re-approval');
      setView('list');
      setEditing(null);
      loadPoojas();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this pooja?')) return;
    try {
      await API.delete(`/pandit/my-poojas/${id}`);
      toast.success('Pooja removed');
      loadPoojas();
    } catch { toast.error('Failed'); }
  };

  const startEdit = (pooja) => {
    setEditing({
      ...pooja,
      categoryId:   pooja.categoryId?._id || pooja.categoryId || '',
      requirements: pooja.requirements?.join(', ') || '',
      benefits:     pooja.benefits?.join(', ') || '',
      languages:    pooja.languages?.join(', ') || '',
    });
    setView('edit');
  };

  if (view === 'create') return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setView('list')} className="text-sm text-saffron-600 hover:underline">← Back</button>
        <h1 className="text-xl font-bold text-gray-800">Add New Pooja</h1>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <PoojaForm categories={categories} onSave={handleCreate} onCancel={() => setView('list')} loading={saving} />
      </div>
    </div>
  );

  if (view === 'edit') return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => { setView('list'); setEditing(null); }} className="text-sm text-saffron-600 hover:underline">← Back</button>
        <h1 className="text-xl font-bold text-gray-800">Edit Pooja</h1>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <PoojaForm categories={categories} initial={editing} onSave={handleUpdate} onCancel={() => { setView('list'); setEditing(null); }} loading={saving} />
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Poojas</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your pooja listings. Approved poojas appear in the public catalog.</p>
        </div>
        <button onClick={() => setView('create')} className="btn-primary flex items-center gap-2 text-sm px-4 py-2.5">
          <Plus size={16} /> Add Pooja
        </button>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5 text-sm text-amber-800">
        <strong>Approval required:</strong> New and edited poojas must be reviewed by admin before they appear in search results or booking flows.
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map((i) => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse border border-gray-100" />)}
        </div>
      ) : poojas.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <span className="text-5xl block mb-3">🪔</span>
          <p className="text-gray-500">No poojas yet. Add your first pooja to get started.</p>
          <button onClick={() => setView('create')} className="btn-primary mt-4 px-6 py-2 text-sm">
            Add First Pooja
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {poojas.map((p) => (
            <div key={p._id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 shadow-sm">
              {p.image
                ? <img src={`https://zutsav-production.up.railway.app/${p.image}`} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0" />
                : <div className="w-16 h-16 rounded-xl bg-saffron-50 flex items-center justify-center shrink-0 text-2xl">🪔</div>
              }
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-gray-800">{p.name}</h3>
                  <span className={`flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium ${STATUS_BADGE[p.approvalStatus]}`}>
                    {STATUS_ICON[p.approvalStatus]}
                    {p.approvalStatus.charAt(0).toUpperCase() + p.approvalStatus.slice(1)}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{p.categoryId?.name} · ₹{p.price?.toLocaleString()}</p>
                {p.adminNote && (
                  <p className="text-xs text-red-600 mt-1">Admin note: {p.adminNote}</p>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => startEdit(p)} className="p-2 text-gray-400 hover:text-saffron-600 hover:bg-saffron-50 rounded-lg transition-colors">
                  <Edit3 size={16} />
                </button>
                <button onClick={() => handleDelete(p._id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

