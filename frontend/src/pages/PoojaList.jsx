import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Search, Clock, Star } from 'lucide-react';
import API from '../api/axios';

export default function PoojaList() {
  const { categorySlug } = useParams();
  const [poojas,   setPoojas]   = useState([]);
  const [category, setCategory] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');

  useEffect(() => {
    // Get category info
    API.get('/poojas/categories').then(({ data }) => {
      const cat = data.categories.find((c) => c.slug === categorySlug);
      setCategory(cat);
    });
  }, [categorySlug]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (category?._id) params.set('categoryId', category._id);
    if (search)         params.set('search', search);
    params.set('limit', '20');

    setLoading(true);
    API.get(`/poojas?${params}`)
      .then(({ data }) => setPoojas(data.poojas))
      .finally(() => setLoading(false));
  }, [category, search]);

  return (
    <div className="min-h-screen bg-spiritual-light py-12">
      <div className="max-w-7xl mx-auto px-4">

        {/* Header */}
        <div className="mb-8">
          <nav className="text-sm text-gray-500 mb-3">
            <Link to="/poojas" className="hover:text-saffron-600">Poojas</Link>
            {category && <> / <span className="text-gray-800 font-medium">{category.name}</span></>}
          </nav>
          <h1 className="text-3xl font-bold text-maroon-700">{category?.name || 'All Poojas'}</h1>
          {category?.description && <p className="text-gray-500 mt-2">{category.description}</p>}
        </div>

        {/* Search */}
        <div className="relative max-w-md mb-8">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Search poojas..." value={search}
            onChange={(e) => setSearch(e.target.value)} />
        </div>

        {/* List */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map((i) => <div key={i} className="h-72 bg-white rounded-2xl animate-pulse" />)}
          </div>
        ) : poojas.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <div className="text-5xl mb-4">🙏</div>
            <p>No poojas found.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {poojas.map((p) => (
              <div key={p._id} className="card group">
                <div className="h-48 bg-saffron-100 overflow-hidden relative">
                  {p.image
                    ? <img src={`https://zutsav-production.up.railway.app/${p.image}`} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    : <div className="w-full h-full flex items-center justify-center text-5xl">🪔</div>
                  }
                  {p.isFeatured && (
                    <span className="absolute top-3 left-3 bg-gold-500 text-white text-xs font-bold px-2 py-1 rounded-full">Featured</span>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold text-gray-800 text-lg leading-tight">{p.name}</h3>
                    {p.rating > 0 && (
                      <span className="flex items-center gap-1 text-xs text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full shrink-0">
                        <Star size={10} fill="currentColor" /> {p.rating}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3">{p.shortDesc}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
                    {p.duration && <span className="flex items-center gap-1"><Clock size={12} /> {p.duration}</span>}
                    <span>{p.totalBookings} bookings</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-saffron-600">₹{p.price.toLocaleString('en-IN')}</span>
                    <Link to={`/book/${p.slug}`} className="btn-primary text-sm px-4 py-2">Book Now</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

