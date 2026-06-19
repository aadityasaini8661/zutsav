import React, { useEffect, useState } from 'react';
import { Tv } from 'lucide-react';
import API from '../api/axios';
import toast from 'react-hot-toast';

export default function LivestreamsPage() {
  const [streams, setStreams]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [active,  setActive]    = useState(null);

  useEffect(() => {
    API.get('/livestreams')
      .then(({ data }) => { setStreams(data.livestreams); if (data.livestreams.length) setActive(data.livestreams[0]); })
      .catch(() => toast.error('Could not load livestreams'))
      .finally(() => setLoading(false));
  }, []);

  const getEmbedUrl = (url) => {
    try {
      const u = new URL(url);
      const v = u.searchParams.get('v') || u.pathname.split('/').pop();
      return `https://www.youtube.com/embed/${v}?autoplay=1`;
    } catch { return url; }
  };

  if (loading) return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-gray-100 rounded w-48" />
      <div className="aspect-video bg-gray-100 rounded-2xl" />
    </div>
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-5">Temple Livestreams</h1>

      {streams.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <Tv size={48} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No livestreams are available right now. Check back soon.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {active && (
            <div>
              <div className="bg-black rounded-2xl overflow-hidden aspect-video">
                <iframe src={getEmbedUrl(active.youtubeUrl)} title={active.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen />
              </div>
              <div className="mt-3">
                <h2 className="font-bold text-gray-800">{active.title}</h2>
                <p className="text-sm text-gray-500">{active.templeId?.name} · {active.templeId?.city}, {active.templeId?.state}</p>
                {active.description && <p className="text-sm text-gray-600 mt-1">{active.description}</p>}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {streams.map((s) => (
              <button key={s._id} onClick={() => setActive(s)}
                className={`text-left p-4 rounded-2xl border transition-all ${active?._id === s._id ? 'border-saffron-400 bg-saffron-50' : 'bg-white border-gray-100 hover:border-saffron-200 hover:shadow-sm'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-saffron-100 rounded-xl flex items-center justify-center shrink-0">
                    <Tv size={18} className="text-saffron-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800 text-sm truncate">{s.title}</p>
                    <p className="text-xs text-gray-500 truncate">{s.templeId?.name}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
