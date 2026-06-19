import React, { useEffect, useState } from 'react';
import { ShoppingCart, Plus, Minus, X, Search, Package, ArrowRight, Flame } from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import PincodeInput from '../components/shared/PincodeInput';
import LoginModal from '../components/shared/LoginModal';

const CATEGORIES = ['all', 'samagri', 'rudraksha', 'yantra', 'incense', 'idol', 'other'];
const CAT_LABELS = {
  all: 'All', samagri: 'Samagri', rudraksha: 'Rudraksha',
  yantra: 'Yantra', incense: 'Incense', idol: 'Idols', other: 'Other',
};
const CAT_ICONS = {
  all: 'âœ¨', samagri: 'ðŸª”', rudraksha: 'ðŸ“¿', yantra: 'ðŸ”¯', incense: 'ðŸŒ¿', idol: 'ðŸ›•', other: 'ðŸŽ',
};

const CART_KEY = 'zutsav_cart';

function loadCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch { return []; }
}
function saveCart(cart) {
  try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch { /* ignore */ }
}

export default function Marketplace() {
  const { isAuthenticated } = useAuth();

  const [products,     setProducts]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [category,     setCategory]     = useState('all');
  const [search,       setSearch]       = useState('');
  const [cart,         setCart]         = useState(() => isAuthenticated ? loadCart() : []);
  const [showCart,     setShowCart]     = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [paying,       setPaying]       = useState(false);
  const [showLogin,    setShowLogin]    = useState(false);
  const [loginMsg,     setLoginMsg]     = useState('');

  const [address, setAddress] = useState({ name:'', phone:'', address:'', pincode:'', state:'', city:'', district:'' });
  const setAddr = (f) => (e) => setAddress((prev) => ({ ...prev, [f]: e.target.value }));

  useEffect(() => {
    const params = new URLSearchParams();
    if (category !== 'all') params.set('category', category);
    if (search)             params.set('search', search);
    setError(null);
    setLoading(true);
    API.get(`/marketplace/products?${params}`)
      .then(({ data }) => setProducts(data.products ?? []))
      .catch((err)     => setError(err.message))
      .finally(()      => setLoading(false));
  }, [category, search]);

  // â”€â”€ Cart helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const requireAuth = (message) => { setLoginMsg(message); setShowLogin(true); return false; };

  const updateAndPersistCart = (updaterFn) => {
    setCart((prev) => {
      const next = updaterFn(prev);
      if (isAuthenticated) saveCart(next);
      return next;
    });
  };

  const addToCart = (product) => {
    if (!isAuthenticated) { requireAuth('Please login to add items to your cart.'); return; }
    updateAndPersistCart((prev) => {
      const existing = prev.find((i) => i.productId === product._id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast.error(`Only ${product.stock} item${product.stock !== 1 ? 's' : ''} available`);
          return prev;
        }
        return prev.map((i) => i.productId === product._id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { productId: product._id, name: product.name, price: product.salePrice || product.price, quantity: 1, image: product.images?.[0], stock: product.stock }];
    });
    toast.success(`${product.name} added to cart`);
  };

  const openCart = () => {
    if (!isAuthenticated) { requireAuth('Please login to view your cart.'); return; }
    setShowCart(true);
  };

  const updateQty = (productId, delta) => {
    updateAndPersistCart((prev) => prev.map((i) => {
      if (i.productId !== productId) return i;
      const newQty = i.quantity + delta;
      if (newQty < 1) return i;
      if (i.stock && newQty > i.stock) {
        toast.error(`Only ${i.stock} item${i.stock !== 1 ? 's' : ''} available`);
        return i;
      }
      return { ...i, quantity: newQty };
    }));
  };

  const removeFromCart = (productId) => updateAndPersistCart((prev) => prev.filter((i) => i.productId !== productId));
  const cartItemCount  = cart.reduce((s, i) => s + i.quantity, 0);
  const cartTotal      = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  // â”€â”€ PhonePe checkout â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const handleCheckout = async () => {
    if (!isAuthenticated) { requireAuth('Please login to place your order.'); return; }
    if (!address.name || !address.phone || !address.address || !address.pincode) {
      toast.error('Please fill all address fields'); return;
    }
    setPaying(true);
    try {
      const { data } = await API.post('/marketplace/orders/create', {
        items: cart.map(({ productId, quantity }) => ({ productId, quantity })),
        shippingAddress: address,
      });
      // Clear cart before redirect â€” payment is being processed
      localStorage.removeItem(CART_KEY);
      setCart([]);
      // Redirect to PhonePe payment page
      window.location.href = data.redirectUrl;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Checkout failed');
      setPaying(false);
    }
  };

  // â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  return (
    <div className="min-h-screen" style={{ background: 'var(--t-bg)' }}>
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} message={loginMsg} />

      {/* â”€â”€ Hero header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div
        className="relative overflow-hidden border-b"
        style={{ background: 'var(--t-surface)', borderColor: 'var(--t-border)' }}
      >
        <div className="absolute inset-0 sacred-pattern pointer-events-none opacity-40" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative">
          <div className="flex items-center justify-between gap-6 flex-wrap">
            <div>
              <p className="section-eyebrow">Sacred Marketplace</p>
              <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', letterSpacing: '-0.025em', color: 'var(--t-text)', fontFamily: "'Cormorant Garamond', serif", fontWeight: 700 }}>
                Spiritual Products
              </h1>
              <p className="text-sm mt-1.5" style={{ color: 'var(--t-muted)' }}>Authentic samagri, rudraksha &amp; sacred items</p>
            </div>

            {/* Cart button */}
            <button
              onClick={openCart}
              className="relative flex items-center gap-2.5 font-semibold px-5 py-3 rounded-2xl transition-all duration-200 border"
              style={{ background: 'var(--t-card)', borderColor: 'var(--t-border)', color: 'var(--t-text)' }}
            >
              <ShoppingCart size={18} style={{ color: 'var(--t-primary)' }} />
              <span>Cart</span>
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-sm" style={{ background: 'var(--t-primary)' }}>
                  {cartItemCount}
                </span>
              )}
            </button>
          </div>

          {/* Search + category filter */}
          <div className="mt-7 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                className="input pl-11 py-2.5 text-sm font-sans"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold capitalize transition-all duration-200"
                  style={{
                    background: category === c ? 'var(--t-primary)' : 'var(--t-card)',
                    color:      category === c ? 'var(--t-text-inv)' : 'var(--t-muted)',
                    border:     `1px solid ${category === c ? 'var(--t-primary)' : 'var(--t-border)'}`,
                  }}
                >
                  <span>{CAT_ICONS[c]}</span>
                  {CAT_LABELS[c] || c}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* â”€â”€ Products grid â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Guest notice */}
        {!isAuthenticated && (
          <div className="mb-8 rounded-2xl px-5 py-4 flex items-center justify-between gap-4 flex-wrap border" style={{ background: 'var(--t-card)', borderColor: 'var(--t-border)' }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--t-nav-active-bg)' }}>
                <ShoppingCart size={16} style={{ color: 'var(--t-primary)' }} />
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--t-text)' }}>
                Login to add items to your cart and place orders
              </p>
            </div>
            <button onClick={() => requireAuth('Login to start shopping.')} className="btn-primary text-sm py-2 px-5 shrink-0">
              Login to Shop <ArrowRight size={14} />
            </button>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-80 skeleton rounded-2xl" />)}
          </div>
        ) : error ? (
          <div className="text-center py-28">
            <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-5">
              <Package size={36} className="text-gray-300" />
            </div>
            <p className="font-display text-xl font-bold text-gray-700 mb-1" style={{ letterSpacing: '-0.01em' }}>Unable to Load Products</p>
            <p className="text-sm text-gray-400 font-sans">{error}</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-28">
            <div className="w-20 h-20 bg-saffron-50 rounded-3xl flex items-center justify-center mx-auto mb-5">
              <Package size={36} className="text-saffron-300" />
            </div>
            <p className="font-display text-xl font-bold text-gray-700 mb-1" style={{ letterSpacing: '-0.01em' }}>No Products Found</p>
            <p className="text-sm text-gray-400 font-sans mt-1">Try a different category or search term</p>
            <button onClick={() => { setCategory('all'); setSearch(''); }} className="btn-outline text-sm mt-5 font-sans">
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {products.map((p) => (
              <div key={p._id} className="group rounded-3xl overflow-hidden transition-all duration-300 border" style={{ background: 'var(--t-card)', borderColor: 'var(--t-border)' }}>
                {/* Product image â€” 4:5 ratio */}
                <div className="relative overflow-hidden bg-saffron-50" style={{ paddingTop: '125%' }}>
                  <div className="absolute inset-0">
                    {p.images?.[0]
                      ? <img src={`https://zutsav-production.up.railway.app/${p.images[0]}`} alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-106 transition-transform duration-700" style={{ '--tw-scale-x': '1.06', '--tw-scale-y': '1.06' }} />
                      : <div className="w-full h-full flex items-center justify-center text-6xl bg-gradient-to-br from-saffron-50 to-orange-50">ðŸª”</div>
                    }
                    {/* Hover overlay with gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400" />
                  </div>

                  {/* Badges */}
                  {p.salePrice && p.salePrice < p.price && (
                    <div className="absolute top-3 left-3 flex items-center gap-1 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm font-sans">
                      <Flame size={9} />
                      {Math.round((1 - p.salePrice / p.price) * 100)}% OFF
                    </div>
                  )}
                  {p.stock === 0 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="bg-white text-gray-700 text-xs font-bold px-3 py-1.5 rounded-full font-sans">Out of Stock</span>
                    </div>
                  )}

                  {/* Floating add to cart (visible on hover, desktop) */}
                  {p.stock > 0 && (
                    <button
                      onClick={() => addToCart(p)}
                      className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-sm text-saffron-700 font-semibold text-sm py-2.5 rounded-xl opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-lg font-sans"
                    >
                      + Add to Cart
                    </button>
                  )}
                </div>

                {/* Product info */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 text-sm line-clamp-2 leading-snug mb-2.5 font-sans">{p.name}</h3>

                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="font-display text-lg font-bold text-saffron-600">
                        â‚¹{(p.salePrice || p.price).toLocaleString('en-IN')}
                      </span>
                      {p.salePrice && p.salePrice < p.price && (
                        <span className="text-xs text-gray-400 line-through ml-1.5 font-sans">â‚¹{p.price.toLocaleString('en-IN')}</span>
                      )}
                    </div>
                    <button
                      onClick={() => addToCart(p)}
                      disabled={p.stock === 0}
                      className={`text-xs px-3.5 py-2 rounded-xl font-semibold transition-all duration-200 shrink-0 font-sans ${
                        p.stock === 0
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-saffron-50 text-saffron-700 border border-saffron-200 hover:bg-saffron-500 hover:text-white hover:border-saffron-500'
                      }`}
                    >
                      {p.stock === 0 ? 'Sold Out' : 'Add'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* â”€â”€ Cart Drawer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={() => setShowCart(false)} />
          <div className="w-full max-w-sm h-full overflow-y-auto shadow-2xl flex flex-col" style={{ background: 'var(--t-card)', borderLeft: '1px solid var(--t-border)' }}>

            <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="font-display font-bold text-gray-900 text-xl" style={{ letterSpacing: '-0.01em' }}>Your Cart</h2>
                {cart.length > 0 && <p className="text-xs text-gray-400 font-sans">{cartItemCount} item{cartItemCount !== 1 ? 's' : ''}</p>}
              </div>
              <button onClick={() => setShowCart(false)}
                className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                <X size={18} />
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="w-20 h-20 bg-saffron-50 rounded-3xl flex items-center justify-center mb-5">
                  <ShoppingCart size={32} className="text-saffron-300" />
                </div>
                <p className="font-display font-bold text-gray-700 text-xl mb-1" style={{ letterSpacing: '-0.01em' }}>Cart is Empty</p>
                <p className="text-sm text-gray-400 mb-6 font-sans">Add some spiritual items to get started</p>
                <button onClick={() => setShowCart(false)} className="btn-outline text-sm font-sans">Browse Products</button>
              </div>
            ) : (
              <>
                <div className="flex-1 p-5 space-y-4">
                  {cart.map((item) => (
                    <div key={item.productId} className="flex gap-3 items-start bg-gray-50 rounded-2xl p-3">
                      <div className="w-14 h-14 bg-saffron-50 rounded-xl overflow-hidden shrink-0">
                        {item.image
                          ? <img src={`https://zutsav-production.up.railway.app/${item.image}`} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-xl">ðŸª”</div>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 line-clamp-1 font-sans">{item.name}</p>
                        <p className="font-display font-bold text-saffron-600 text-sm mt-0.5">
                          â‚¹{(item.price * item.quantity).toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => updateQty(item.productId, -1)}
                          className="w-7 h-7 rounded-lg bg-white border border-gray-200 hover:border-saffron-300 hover:bg-saffron-50 flex items-center justify-center transition-colors">
                          <Minus size={11} />
                        </button>
                        <span className="w-7 text-center text-sm font-semibold font-sans">{item.quantity}</span>
                        <button onClick={() => updateQty(item.productId, +1)}
                          className="w-7 h-7 rounded-lg bg-white border border-gray-200 hover:border-saffron-300 hover:bg-saffron-50 flex items-center justify-center transition-colors">
                          <Plus size={11} />
                        </button>
                        <button onClick={() => removeFromCart(item.productId)}
                          className="w-7 h-7 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 flex items-center justify-center ml-0.5 transition-colors">
                          <X size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="sticky bottom-0 bg-white border-t border-gray-100 p-5 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 font-sans">Subtotal ({cartItemCount} items)</span>
                    <span className="font-display font-bold text-gray-900 text-xl" style={{ letterSpacing: '-0.01em' }}>
                      â‚¹{cartTotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <button
                    onClick={() => { setShowCart(false); setShowCheckout(true); }}
                    className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 font-sans">
                    Proceed to Checkout <ArrowRight size={16} />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* â”€â”€ Checkout Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm">
          <div className="rounded-3xl shadow-premium w-full max-w-md max-h-[90vh] overflow-y-auto" style={{ background: 'var(--t-card)', border: '1px solid var(--t-border)' }}>
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-5 flex items-center justify-between rounded-t-3xl z-10">
              <div>
                <h2 className="font-display font-bold text-gray-900 text-2xl" style={{ letterSpacing: '-0.02em' }}>Shipping Details</h2>
                <p className="text-xs text-gray-400 mt-0.5 font-sans">Where should we deliver?</p>
              </div>
              <button onClick={() => setShowCheckout(false)}
                className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Full Name</label>
                  <input className="input font-sans" placeholder="Your name" value={address.name} onChange={setAddr('name')} />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input className="input font-sans" placeholder="10-digit number" value={address.phone} onChange={setAddr('phone')} />
                </div>
              </div>
              <div>
                <label className="label">Delivery Address</label>
                <textarea rows={2} className="input resize-none font-sans" placeholder="House/flat no., street, area" value={address.address} onChange={setAddr('address')} />
              </div>
              <div>
                <label className="label">Pincode</label>
                <PincodeInput
                  value={address.pincode}
                  onChange={(v) => setAddress((p) => ({ ...p, pincode: v }))}
                  onFill={({ state, city, district }) => setAddress((p) => ({ ...p, state, city, district }))}
                />
              </div>
              {address.state && (
                <div className="grid grid-cols-3 gap-2">
                  {[['state','State'],['city','City'],['district','District']].map(([f, l]) => (
                    <div key={f}>
                      <label className="label text-xs">{l}</label>
                      <input className="input text-sm bg-gray-50 font-sans" value={address[f]} onChange={setAddr(f)} />
                    </div>
                  ))}
                </div>
              )}

              {/* Order total */}
              <div className="rounded-2xl p-4 flex justify-between items-center border border-saffron-100"
                style={{ background: 'linear-gradient(135deg, #fff8f0, #FAF6EE)' }}>
                <div>
                  <span className="font-semibold text-gray-700 font-sans">Order Total</span>
                  <p className="text-xs text-gray-400 font-sans mt-0.5">{cartItemCount} item{cartItemCount !== 1 ? 's' : ''}</p>
                </div>
                <span className="font-display text-2xl font-bold text-saffron-600" style={{ letterSpacing: '-0.02em' }}>
                  â‚¹{cartTotal.toLocaleString('en-IN')}
                </span>
              </div>

              <button onClick={handleCheckout} disabled={paying}
                className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2 font-sans">
                {paying ? (
                  <>Processing <span className="animate-pulse-soft">...</span></>
                ) : (
                  <>Pay â‚¹{cartTotal.toLocaleString('en-IN')} <span>ðŸ™</span></>
                )}
              </button>

              <p className="text-xs text-center text-gray-400 font-sans">
                ðŸ”’ Secured by PhonePe Â· UPI, Cards, Net Banking accepted
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

