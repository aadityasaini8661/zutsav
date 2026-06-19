import React, { useEffect, useState } from 'react';
import { MapPin, Search, Tv, X, ChevronRight, Play } from 'lucide-react';
import API from '../api/axios';
import toast from 'react-hot-toast';

function TempleCard({ temple, onWatch }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group rounded-2xl overflow-hidden transition-all duration-500"
      style={{
        background: 'var(--t-card)',
        border: '1px solid var(--t-border)',
        boxShadow: hovered
          ? '0 16px 48px rgba(0,0,0,0.12), 0 0 0 1px rgba(212,175,55,0.1)'
          : '0 2px 20px rgba(0,0,0,0.06)',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
      }}>
      {/* Image */}
      <div className="relative overflow-hidden h-44">
        {temple.images?.length > 0 ? (
          <img
            src={`http://localhost:5000/${temple.images[0]}`}
            alt={temple.name}
            className="w-full h-full object-cover transition-transform duration-700"
            style={{ transform: hovered ? 'scale(1.06)' : 'scale(1)' }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg, #1B1F3B 0%, #2d3160 100%)' }}>
            <span className="text-6xl">🛕</span>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 flex items-center justify-center transition-opacity duration-300"
             style={{
               background: 'rgba(27,31,59,0.72)',
               opacity: hovered ? 1 : 0,
               pointerEvents: hovered ? 'auto' : 'none',
             }}>
          <button
            onClick={() => onWatch(temple)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-transform duration-200 hover:scale-105"
            style={{ background: 'var(--t-secondary)', color: 'var(--t-text-inv, #1B1F3B)' }}>
            <Play size={14} /> Watch Livestream
          </button>
        </div>

        {/* State chip */}
        <div className="absolute top-3 right-3 pointer-events-none">
          <span className="bg-white/90 backdrop-blur-sm text-gray-700 text-[10px] font-bold px-2.5 py-1 rounded-full">
            {temple.state}
          </span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-bold leading-tight mb-1.5"
            style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: '1.15rem', color: 'var(--t-text)' }}>
          {temple.name}
        </h3>
        <div className="flex items-center gap-1 text-sm mb-2" style={{ color: 'var(--t-muted)' }}>
          <MapPin size={12} style={{ color: 'var(--t-primary)' }} className="shrink-0" />
          <span>{temple.city}, {temple.state}</span>
        </div>
        {temple.description && (
          <p className="text-sm line-clamp-2 mb-3" style={{ color: 'var(--t-muted)' }}>{temple.description}</p>
        )}
        <button
          onClick={() => onWatch(temple)}
          className="flex items-center gap-1.5 text-sm font-semibold transition-colors"
          style={{ color: 'var(--t-primary)' }}
          onMouseOver={(e) => e.currentTarget.style.color = 'var(--t-secondary)'}
          onMouseOut={(e) => e.currentTarget.style.color = 'var(--t-primary)'}>
          <Tv size={13} /> Live Darshan <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}

function LivestreamModal({ temple, onClose }) {
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active,  setActive]  = useState(null);

  useEffect(() => {
    API.get(`/livestreams?templeId=${temple._id}`)
      .then(({ data }) => {
        setStreams(data.livestreams);
        if (data.livestreams.length) setActive(data.livestreams[0]);
      })
      .catch(() => toast.error('Could not load streams'))
      .finally(() => setLoading(false));
  }, [temple._id]);

  const getEmbedUrl = (url) => {
    try {
      const u = new URL(url);
      const v = u.searchParams.get('v') || u.pathname.split('/').pop();
      return `https://www.youtube.com/embed/${v}?autoplay=1`;
    } catch { return url; }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
           style={{ background: 'var(--t-card)' }}
           onClick={(e) => e.stopPropagation()}>
        {/* Modal header */}
        <div className="rounded-t-3xl p-5 flex items-center justify-between"
             style={{ background: 'var(--t-primary)' }}>
          <div>
            <h2 className="font-bold text-white"
                style={{ fontFamily: '"Cormorant Garamond"', fontSize: '1.35rem' }}>
              {temple.name}
            </h2>
            <p className="text-white/40 text-sm mt-0.5">{temple.city}, {temple.state}</p>
          </div>
          <button onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white/60 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.08)' }}>
            <X size={18} />
          </button>
        </div>

        <div className="p-5">
          {loading ? (
            <div className="space-y-3">
              <div className="skeleton h-48 rounded-2xl" />
              <div className="skeleton h-4 w-32 rounded" />
            </div>
          ) : streams.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                   style={{ background: 'var(--t-surface)' }}>
                <Tv size={28} style={{ color: 'var(--t-muted)' }} />
              </div>
              <p className="font-semibold mb-1" style={{ color: 'var(--t-text)' }}>No Livestreams Available</p>
              <p className="text-sm" style={{ color: 'var(--t-muted)' }}>Check back during aarti timings</p>
            </div>
          ) : (
            <div className="space-y-4">
              {active && (
                <div className="rounded-2xl overflow-hidden bg-black aspect-video">
                  <iframe
                    src={getEmbedUrl(active.youtubeUrl)}
                    title={active.title}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}
              {streams.length > 1 && (
                <div className="flex gap-2 flex-wrap">
                  {streams.map((s) => (
                    <button
                      key={s._id}
                      onClick={() => setActive(s)}
                      className={`text-xs px-3 py-1.5 rounded-full font-semibold border transition-colors ${
                        active?._id === s._id
                          ? 'border-transparent'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                      }`}
                      style={active?._id === s._id ? { background: 'var(--t-secondary)', color: 'var(--t-text-inv, #1B1F3B)', border: 'none' } : { borderColor: 'var(--t-border)', color: 'var(--t-muted)', background: 'var(--t-card)' }}>
                      {s.title}
                    </button>
                  ))}
                </div>
              )}
              {active?.description && (
                <p className="text-sm text-gray-600">{active.description}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TempleDirectory() {
  const [temples,     setTemples]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [selected,    setSelected]    = useState(null);

  const load = (s = '', st = '') => {
    setLoading(true);
    API.get(`/temples?search=${s}&state=${st}&limit=50`)
      .then(({ data }) => setTemples(data.temples))
      .catch(() => toast.error('Could not load temples'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="min-h-screen" style={{ background: 'var(--t-bg)' }}>
      {/* Header */}
      <div className="relative overflow-hidden sacred-pattern" style={{ background: 'var(--t-primary)' }}>
        <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.35)' }} />
        <div className="relative max-w-7xl mx-auto px-4 py-12 md:py-16">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="w-5 h-px" style={{ background: 'rgba(212,175,55,0.5)' }} />
            <span className="text-xs font-bold tracking-widest uppercase" style={{ color: '#D4AF37' }}>Sacred Places</span>
            <span className="w-5 h-px" style={{ background: 'rgba(212,175,55,0.5)' }} />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2"
              style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', letterSpacing: '-0.02em' }}>
            Temple Directory
          </h1>
          <p className="text-white/40 text-sm font-sans">Discover sacred temples and watch live aartis &amp; darshan</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search bar */}
        <div className="flex gap-3 mb-8 flex-wrap">
          <div className="flex-1 min-w-56 flex items-center gap-2 rounded-xl px-4 py-3 shadow-sm transition-colors"
               style={{ background: 'var(--t-card)', border: '1px solid var(--t-border)' }}>
            <Search size={15} className="text-gray-400 shrink-0" />
            <input
              className="flex-1 outline-none text-sm placeholder-gray-400 bg-transparent"
            style={{ color: 'var(--t-text)' }}
              placeholder="Search temple by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && load(search, stateFilter)}
            />
          </div>
          <input
            className="input w-44 text-sm"
            placeholder="Filter by state..."
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
          />
          <button
            onClick={() => load(search, stateFilter)}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
            style={{ background: 'var(--t-primary)' }}>
            Search
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden"
                   style={{ background: 'var(--t-card)', border: '1px solid var(--t-border)', boxShadow: '0 2px 20px rgba(0,0,0,0.06)' }}>
                <div className="skeleton h-44 rounded-none" style={{ borderRadius: 0 }} />
                <div className="p-4 space-y-2.5">
                  <div className="skeleton h-5 w-40 rounded" />
                  <div className="skeleton h-3 w-28 rounded" />
                  <div className="skeleton h-3 w-full rounded" />
                  <div className="skeleton h-3 w-3/4 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : temples.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5"
                 style={{ background: 'var(--t-surface)' }}>
              <span className="text-4xl">🛕</span>
            </div>
            <h3 className="text-2xl font-bold mb-2"
                style={{ fontFamily: '"Cormorant Garamond"', color: 'var(--t-text)' }}>
              No Temples Found
            </h3>
            <p className="text-sm" style={{ color: 'var(--t-muted)' }}>Try a different search term or state</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {temples.map((t) => <TempleCard key={t._id} temple={t} onWatch={setSelected} />)}
          </div>
        )}
      </div>

      {selected && <LivestreamModal temple={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
