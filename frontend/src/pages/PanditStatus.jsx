import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Clock, AlertCircle, XCircle, Ban, Upload, RefreshCw } from 'lucide-react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

const STATUS_MAP = {
  pending: {
    label: 'Pending Review',
    icon: Clock,
    iconColor: 'text-yellow-500',
    cardColor: 'border-yellow-200 bg-yellow-50',
    description: 'Your application has been received and is waiting to be reviewed by our team.',
    steps: [
      { done: true,  label: 'Application submitted' },
      { done: false, label: 'Documents under review' },
      { done: false, label: 'Admin approval' },
      { done: false, label: 'Dashboard unlocked' },
    ],
  },
  under_review: {
    label: 'Under Review',
    icon: AlertCircle,
    iconColor: 'text-blue-500',
    cardColor: 'border-blue-200 bg-blue-50',
    description: 'Our team is actively verifying your documents. This usually takes a few hours.',
    steps: [
      { done: true,  label: 'Application submitted' },
      { done: true,  label: 'Documents under review' },
      { done: false, label: 'Admin approval' },
      { done: false, label: 'Dashboard unlocked' },
    ],
  },
  approved: {
    label: 'Approved',
    icon: CheckCircle,
    iconColor: 'text-green-500',
    cardColor: 'border-green-200 bg-green-50',
    description: 'Congratulations! Your profile is approved. You can now access the pandit dashboard.',
    steps: [
      { done: true, label: 'Application submitted' },
      { done: true, label: 'Documents reviewed' },
      { done: true, label: 'Admin approved' },
      { done: true, label: 'Dashboard unlocked' },
    ],
  },
  rejected: {
    label: 'Rejected',
    icon: XCircle,
    iconColor: 'text-red-500',
    cardColor: 'border-red-200 bg-red-50',
    description: 'Your application was not approved. Please review the admin note below and contact support.',
  },
  suspended: {
    label: 'Suspended',
    icon: Ban,
    iconColor: 'text-orange-500',
    cardColor: 'border-orange-200 bg-orange-50',
    description: 'Your account has been suspended. Please contact our support team to resolve this.',
  },
  reupload_required: {
    label: 'Re-upload Required',
    icon: Upload,
    iconColor: 'text-purple-500',
    cardColor: 'border-purple-200 bg-purple-50',
    description: 'Admin has requested you to re-submit your identification documents with clearer images.',
  },
};

export default function PanditStatus() {
  const { user } = useAuth();
  const [pandit, setPandit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState(new Date());

  const load = () => {
    setLoading(true);
    API.get('/pandits/me')
      .then(({ data }) => { setPandit(data.pandit); setLastChecked(new Date()); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="min-h-screen bg-spiritual-light flex items-center justify-center">
      <div className="animate-spin text-4xl">🪔</div>
    </div>
  );

  if (!pandit) return (
    <div className="min-h-screen bg-spiritual-light flex items-center justify-center text-center px-4">
      <div>
        <p className="text-xl text-gray-600 mb-4">No pandit application found.</p>
        <Link to="/register" className="btn-primary">Register as Pandit</Link>
      </div>
    </div>
  );

  const cfg = STATUS_MAP[pandit.status] || STATUS_MAP.pending;
  const StatusIcon = cfg.icon;

  return (
    <div className="min-h-screen bg-spiritual-light flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-5">
        {/* Logo */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <span className="text-3xl">🪔</span>
            <span className="font-serif text-3xl font-bold text-maroon-600">Zutsav</span>
          </Link>
          <h1 className="text-xl font-bold text-gray-800 mt-3">Application Status</h1>
        </div>

        {/* Status card */}
        <div className={`bg-white rounded-3xl shadow-xl p-7 border ${cfg.cardColor} space-y-5`}>
          {/* Status header */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0">
              <StatusIcon size={30} className={cfg.iconColor} />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Current Status</p>
              <p className="text-xl font-bold text-gray-800">{cfg.label}</p>
            </div>
          </div>

          <p className="text-gray-600 text-sm leading-relaxed">{cfg.description}</p>

          {/* Admin note */}
          {pandit.adminNote && (
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <p className="text-xs text-gray-500 font-semibold mb-1">Message from Admin:</p>
              <p className="text-sm text-gray-700">{pandit.adminNote}</p>
            </div>
          )}

          {/* Progress steps */}
          {cfg.steps && (
            <div className="space-y-2.5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Progress</p>
              {cfg.steps.map((s, i) => (
                <div key={i} className={`flex items-center gap-3 text-sm ${s.done ? 'text-green-700' : 'text-gray-400'}`}>
                  {s.done
                    ? <CheckCircle size={16} className="text-green-500 shrink-0" />
                    : <div className="w-4 h-4 rounded-full border-2 border-gray-300 shrink-0" />
                  }
                  {s.label}
                </div>
              ))}
            </div>
          )}

          {/* Pandit details */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              ['Name', pandit.name],
              ['Phone', pandit.phone],
              ['Email', pandit.email],
              ['Applied', new Date(pandit.createdAt).toLocaleDateString('en-IN')],
            ].map(([l, v]) => (
              <div key={l} className="bg-white rounded-xl p-3 border border-gray-100">
                <p className="text-xs text-gray-400">{l}</p>
                <p className="font-semibold text-gray-700 truncate">{v}</p>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 pt-1 border-t border-gray-100">
            {pandit.status === 'approved' ? (
              <Link to="/pandit/dashboard" className="btn-primary w-full py-2.5 text-center text-sm">
                Go to Dashboard 🪔
              </Link>
            ) : (
              <button onClick={load} className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 text-sm">
                <RefreshCw size={15} /> Refresh Status
              </button>
            )}
            <p className="text-center text-xs text-gray-400">
              Last checked: {lastChecked.toLocaleTimeString('en-IN')}
            </p>
            <Link to="/" className="text-center text-sm text-saffron-600 hover:underline">← Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
