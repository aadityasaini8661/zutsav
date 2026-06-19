import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import API from '../api/axios';

export default function PoojaCategories() {
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    API.get('/poojas/categories')
      .then(({ data }) => setCategories(data.categories))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-spiritual-light py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-maroon-700 mb-2">Pooja Categories</h1>
          <p className="text-gray-500">Choose a category to explore available poojas</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {[1,2,3,4,5,6,7,8].map((i) => <div key={i} className="h-40 bg-white rounded-2xl animate-pulse" />)}
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <div className="text-5xl mb-4">🙏</div>
            <p>No categories available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {categories.map((cat) => (
              <Link key={cat._id} to={`/poojas/${cat.slug}`}
                className="card group p-6 flex flex-col items-center text-center hover:border-saffron-300 border-2 border-transparent">
                <div className="w-20 h-20 bg-saffron-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-saffron-200 transition-colors overflow-hidden">
                  {cat.image
                    ? <img src={`http://localhost:5000/${cat.image}`} alt={cat.name} className="w-full h-full object-cover rounded-full" />
                    : <span className="text-3xl">🙏</span>
                  }
                </div>
                <h3 className="font-bold text-gray-800 group-hover:text-saffron-700 mb-1">{cat.name}</h3>
                {cat.description && <p className="text-xs text-gray-500 line-clamp-2 mb-3">{cat.description}</p>}
                <span className="text-saffron-500 text-xs font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                  View Poojas <ArrowRight size={12} />
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
