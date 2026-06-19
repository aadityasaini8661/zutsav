import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight, Shield, Clock, Star, Users, CheckCircle,
  ChevronDown, MapPin, ShoppingBag, Search,
} from 'lucide-react';
import API from '../api/axios';

// ─── Static data ──────────────────────────────────────────────────────────────

const stats = [
  { value: '10,000+', label: 'Sacred Rituals', icon: '🙏' },
  { value: '500+',    label: 'Verified Pandits', icon: '📿' },
  { value: '50+',     label: 'Cities Covered',   icon: '🛕' },
  { value: '4.9★',   label: 'Average Rating',   icon: '⭐' },
];

const CAT_GRADIENTS = [
  'from-amber-50 to-orange-50 border-orange-100 hover:border-orange-200',
  'from-rose-50 to-pink-50 border-rose-100 hover:border-rose-200',
  'from-violet-50 to-purple-50 border-violet-100 hover:border-violet-200',
  'from-emerald-50 to-teal-50 border-emerald-100 hover:border-emerald-200',
  'from-sky-50 to-blue-50 border-sky-100 hover:border-sky-200',
  'from-yellow-50 to-amber-50 border-yellow-100 hover:border-yellow-200',
];
const CAT_ICON_BG = [
  'bg-orange-100 text-orange-600',
  'bg-rose-100 text-rose-600',
  'bg-violet-100 text-violet-600',
  'bg-emerald-100 text-emerald-600',
  'bg-sky-100 text-sky-600',
  'bg-yellow-100 text-yellow-600',
];

const features = [
  { icon: Shield, title: 'KYC-Verified Pandits',  desc: 'Every pandit undergoes government ID check and background verification before listing.' },
  { icon: Clock,  title: 'On-Time, Every Time',   desc: 'Punctual, professional service delivery for every ceremony and sacred occasion.' },
  { icon: Star,   title: 'Premium Experience',    desc: 'Seamless booking with modern convenience and authentic sacred tradition.' },
  { icon: Users,  title: 'Pan-India Network',     desc: 'Experienced, trusted pandits across 50+ cities throughout India.' },
];

const steps = [
  { num: '01', title: 'Choose Your Pooja',  desc: 'Browse our curated list of poojas and havans for every occasion.', icon: '🙏' },
  { num: '02', title: 'Select Date & Time', desc: 'Pick a slot that works for you — we work around your schedule.', icon: '📅' },
  { num: '03', title: 'Pandit Arrives',     desc: 'A verified pandit arrives at your home with all required samagri.', icon: '🪔' },
];

const testimonials = [
  {
    name: 'Priya Sharma', city: 'New Delhi', rating: 5, initials: 'PS',
    text: 'Satyanarayan Pooja at my new home was absolutely flawless. The pandit was knowledgeable and arrived right on time. Zutsav made the entire experience incredibly smooth.',
  },
  {
    name: 'Rajesh Kumar', city: 'Mumbai', rating: 5, initials: 'RK',
    text: "I've booked three different poojas through Zutsav and each experience was exceptional. The platform is intuitive and the pandits are genuinely learned.",
  },
  {
    name: 'Anita Patel', city: 'Ahmedabad', rating: 5, initials: 'AP',
    text: 'The marketplace saved me so much time before Navratri. Authentic samagri delivered fresh, and prices are very fair. Will definitely reorder every season.',
  },
];

const faqs = [
  { q: 'How does Zutsav work?',            a: 'Select a pooja, enter your details, make payment, and we assign a verified pandit to your home for the ceremony.' },
  { q: 'Are the pandits verified?',         a: 'Yes. Every pandit undergoes KYC verification including government ID check and background screening before joining.' },
  { q: 'Can I book for a specific date?',   a: 'Absolutely. You choose the exact date and time during the booking flow and we accommodate your schedule.' },
  { q: 'What is the payment process?',      a: 'We use PhonePe for secure UPI, card, and net-banking payments. All transactions are fully encrypted.' },
  { q: 'How do I get pandit contact info?', a: 'Once admin assigns a pandit, you receive their name and contact via WhatsApp notification immediately.' },
];

// ─── Scroll reveal hook ────────────────────────────────────────────────────────
function useInView(options = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setInView(true); observer.disconnect(); }
    }, { threshold: 0.12, ...options });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, inView];
}

// ─── Section tag ───────────────────────────────────────────────────────────────
function EyebrowTag({ children, light }) {
  if (light) {
    return (
      <div className="inline-flex items-center gap-2 text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-6"
        style={{ background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.35)', color: '#C9A84C' }}>
        {children}
      </div>
    );
  }
  return <div className="tag-sacred mb-6">{children}</div>;
}

function StarRating({ rating }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={13} className={i < rating ? 'text-gold-500 fill-gold-500' : 'text-gray-200 fill-gray-200'} />
      ))}
    </div>
  );
}

function FaqItem({ faq, index, open, toggle }) {
  return (
    <div className={`border rounded-2xl overflow-hidden transition-all duration-300 ${open ? 'border-saffron-200 shadow-sacred' : 'border-gray-100 bg-white'}`}>
      <button
        onClick={() => toggle(index)}
        className={`w-full flex items-center justify-between px-6 py-5 text-left font-semibold text-gray-800 transition-colors ${open ? 'bg-saffron-50/40' : 'bg-white hover:bg-gray-50/60'}`}
      >
        <span className="pr-4 font-sans">{faq.q}</span>
        <ChevronDown size={18} className={`text-saffron-500 transition-transform duration-300 shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-6 pb-5 text-gray-500 text-sm leading-relaxed border-t border-saffron-100/60 pt-4 animate-slide-up font-sans bg-saffron-50/20">
          {faq.a}
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const [categories,     setCategories]     = useState([]);
  const [featuredPoojas, setFeaturedPoojas] = useState([]);
  const [festivals,      setFestivals]      = useState([]);
  const [faqOpen,        setFaqOpen]        = useState(null);
  const [catLoading,     setCatLoading]     = useState(true);
  const [poojaLoading,   setPoojaLoading]   = useState(true);
  const [heroSearch,     setHeroSearch]     = useState('');

  const navigate = useNavigate();

  const [heroRef,       heroInView]       = useInView();
  const [statsRef,      statsInView]      = useInView();
  const [catRef,        catInView]        = useInView();
  const [poojaRef,      poojaInView]      = useInView();
  const [stepsRef,      stepsInView]      = useInView();
  const [festivalRef,   festivalInView]   = useInView();
  const [featuresRef,   featuresInView]   = useInView();
  const [testRef,       testInView]       = useInView();

  useEffect(() => {
    API.get('/poojas/categories').then(({ data }) => setCategories(data.categories)).catch(() => {}).finally(() => setCatLoading(false));
    API.get('/poojas?featured=true&limit=6').then(({ data }) => setFeaturedPoojas(data.poojas)).catch(() => {}).finally(() => setPoojaLoading(false));
    API.get('/festivals').then(({ data }) => setFestivals((data.festivals || []).slice(0, 4))).catch(() => {});
  }, []);

  const toggleFaq = (i) => setFaqOpen(faqOpen === i ? null : i);
  const handleHeroSearch = (e) => {
    if (e.key === 'Enter' || e.type === 'click') navigate('/poojas');
  };

  return (
    <div className="overflow-hidden">

      {/* ═══════════════════════════════════════════════════════
          HERO — V3
      ═══════════════════════════════════════════════════════ */}
      <section
        className="relative min-h-[96vh] flex flex-col items-center justify-center overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #FAF6EE 0%, #FFF8F0 50%, #FAF6EE 100%)' }}
      >
        {/* Sacred dot pattern overlay */}
        <div className="absolute inset-0 sacred-pattern pointer-events-none" />

        {/* Concentric mandala rings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none">
          {[720, 560, 400, 240].map((size, i) => (
            <div
              key={size}
              className="absolute rounded-full border border-saffron-300"
              style={{
                width: size, height: size,
                top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                opacity: 0.14 - i * 0.03,
              }}
            />
          ))}
        </div>

        {/* Ambient glow */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-saffron-100 rounded-full blur-[160px] opacity-45 -translate-y-1/3 pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-temple-100 rounded-full blur-[140px] opacity-35 translate-y-1/3 pointer-events-none" />

        {/* Floating sacred particles */}
        {['🪔', '🌸', '✨', '🌺', '🙏', '🌿', '⭐', '🪷'].map((e, i) => (
          <span
            key={i}
            className="absolute pointer-events-none select-none animate-float"
            style={{
              left: `${5 + i * 12}%`,
              top: `${10 + (i % 4) * 20}%`,
              fontSize: `${1.1 + (i % 3) * 0.35}rem`,
              animationDelay: `${i * 0.6}s`,
              animationDuration: `${4 + (i % 3) * 1.5}s`,
              opacity: 0.1 + (i % 2) * 0.04,
            }}
          >
            {e}
          </span>
        ))}

        {/* Hero content */}
        <div ref={heroRef} className="relative max-w-5xl mx-auto px-4 text-center z-10">

          {/* Eyebrow pill */}
          <div className={`flex justify-center mb-8 transition-all duration-700 ${heroInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
            <div className="inline-flex items-center gap-2.5 bg-white/80 border border-saffron-200/70 rounded-full px-5 py-2 shadow-sacred">
              <span className="w-1.5 h-1.5 bg-saffron-500 rounded-full animate-pulse-soft" />
              <span className="text-saffron-700 text-xs font-bold tracking-widest uppercase font-sans">India's Most Trusted Spiritual Platform</span>
            </div>
          </div>

          {/* Display headline — Cormorant Garamond */}
          <h1
            className={`font-display font-bold text-gray-900 leading-[0.92] mb-7 transition-all duration-700 delay-100 ${heroInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            style={{ fontSize: 'clamp(3.5rem, 10vw, 7rem)', letterSpacing: '-0.03em' }}
          >
            Sacred Rituals,{' '}
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-saffron-600 via-saffron-500 to-temple-500">
              Modern Reverence
            </span>
          </h1>

          {/* Subtitle */}
          <p className={`font-sans text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed transition-all duration-700 delay-150 ${heroInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            Connect with verified pandits, celebrate every festival, and discover authentic spiritual products — all in one sacred space.
          </p>

          {/* Search bar */}
          <div className={`max-w-lg mx-auto mb-9 transition-all duration-700 delay-200 ${heroInView ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-6 scale-95'}`}>
            <div className="relative">
              <Search size={17} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                value={heroSearch}
                onChange={(e) => setHeroSearch(e.target.value)}
                onKeyDown={handleHeroSearch}
                placeholder="Search poojas, temples, festivals..."
                className="w-full bg-white border border-saffron-100 rounded-2xl pl-12 pr-32 py-4 text-gray-700 placeholder-gray-400 shadow-sacred focus:outline-none focus:ring-2 focus:ring-saffron-200 focus:border-saffron-300 transition-all duration-300 font-sans text-base"
              />
              <button
                onClick={handleHeroSearch}
                className="absolute right-2 top-2 btn-primary px-5 py-2 text-sm rounded-xl"
              >
                Search
              </button>
            </div>
          </div>

          {/* Quick-action chips */}
          <div className={`flex flex-wrap items-center justify-center gap-2.5 mb-12 transition-all duration-700 delay-[350ms] ${heroInView ? 'opacity-100' : 'opacity-0'}`}>
            {[
              { label: 'Book a Pooja',   to: '/poojas',      icon: '🙏' },
              { label: 'Find a Temple',  to: '/temples',     icon: '🛕' },
              { label: 'Shop Samagri',   to: '/marketplace', icon: '🪔' },
              { label: 'Panchang',       to: '/panchang',    icon: '📅' },
            ].map(({ label, to, icon }) => (
              <Link
                key={label}
                to={to}
                className="flex items-center gap-1.5 bg-white/80 border border-gray-200/80 hover:border-saffron-300 hover:bg-saffron-50 text-gray-700 hover:text-saffron-700 text-sm font-medium px-4 py-2.5 rounded-full transition-all duration-200 shadow-sm hover:shadow-card font-sans"
              >
                <span>{icon}</span>
                {label}
              </Link>
            ))}
          </div>

          {/* Trust badges */}
          <div className={`flex flex-wrap items-center justify-center gap-3 text-sm transition-all duration-700 delay-500 ${heroInView ? 'opacity-100' : 'opacity-0'}`}>
            {[
              { icon: CheckCircle, text: 'KYC Verified Pandits' },
              { icon: Shield,      text: 'Secure Payments' },
              { icon: Star,        text: '4.9★ Rated Service' },
            ].map(({ icon: Icon, text }) => (
              <span key={text} className="flex items-center gap-1.5 bg-white/80 border border-white/90 px-3.5 py-1.5 rounded-full shadow-sm text-gray-500 font-sans text-xs">
                <Icon size={12} className="text-saffron-500" /> {text}
              </span>
            ))}
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 opacity-30">
          <span className="text-[10px] font-medium tracking-widest uppercase text-gray-500 font-sans">Scroll</span>
          <ChevronDown size={14} className="text-gray-400 animate-bounce" />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          STATS BAR — dark charcoal with gold accents
      ═══════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(145deg, #1C1C1E 0%, #2a1500 50%, #1C1C1E 100%)' }}>
        <div className="absolute inset-0 sacred-pattern opacity-10 pointer-events-none" />
        <div ref={statsRef} className="max-w-5xl mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-white/8">
            {stats.map(({ value, label, icon }, i) => (
              <div
                key={label}
                className={`text-center py-6 px-6 transition-all duration-500 ${statsInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                style={{ transitionDelay: `${i * 90}ms` }}
              >
                <div className="text-2xl mb-2">{icon}</div>
                <div className="font-display text-3xl md:text-4xl font-bold text-white" style={{ letterSpacing: '-0.02em' }}>
                  {value}
                </div>
                <div className="text-xs text-gray-400 mt-1.5 tracking-widest uppercase font-sans">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          POOJA CATEGORIES
      ═══════════════════════════════════════════════════════ */}
      <section className="section-pad sacred-pattern" style={{ background: '#FAF6EE' }}>
        <div ref={catRef} className="container-pad">
          <div className="text-center mb-14">
            <EyebrowTag>Our Services</EyebrowTag>
            <h2 className="section-title">Browse by Category</h2>
            <p className="section-subtitle mx-auto text-center">
              From Gruhapravesh to Satyanarayan — find the right pooja for every occasion
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {catLoading
              ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-32 skeleton" />)
              : categories.map((cat, i) => (
                  <Link
                    key={cat._id}
                    to={`/poojas/${cat.slug}`}
                    className={`group flex flex-col items-center p-5 rounded-2xl bg-gradient-to-br ${CAT_GRADIENTS[i % CAT_GRADIENTS.length]} border transition-all duration-300 text-center hover:shadow-card hover:-translate-y-1 ${catInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
                    style={{ transitionDelay: `${i * 60}ms` }}
                  >
                    <div className={`w-14 h-14 ${CAT_ICON_BG[i % CAT_ICON_BG.length]} rounded-2xl flex items-center justify-center mb-3 overflow-hidden transition-transform duration-300 group-hover:scale-110`}>
                      {cat.image
                        ? <img src={`http://localhost:5000/${cat.image}`} alt={cat.name} className="w-full h-full object-cover" />
                        : <span className="text-2xl">🙏</span>
                      }
                    </div>
                    <span className="text-xs font-semibold text-gray-700 group-hover:text-saffron-700 transition-colors leading-tight font-sans">{cat.name}</span>
                  </Link>
                ))
            }
          </div>

          <div className="text-center mt-12">
            <Link to="/poojas" className="btn-outline inline-flex items-center gap-2">
              View All Categories <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          FEATURED POOJAS
      ═══════════════════════════════════════════════════════ */}
      {(poojaLoading || featuredPoojas.length > 0) && (
        <section className="section-pad bg-white">
          <div ref={poojaRef} className="container-pad">
            <div className="flex items-end justify-between mb-14 flex-wrap gap-4">
              <div>
                <EyebrowTag>Most Booked</EyebrowTag>
                <h2 className="section-title">Popular Poojas</h2>
              </div>
              <Link to="/poojas" className="text-saffron-600 font-semibold text-sm flex items-center gap-1 hover:gap-2 transition-all font-sans">
                View All <ArrowRight size={14} />
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {poojaLoading
                ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-80 skeleton rounded-2xl" />)
                : featuredPoojas.map((p, i) => (
                    <div
                      key={p._id}
                      className={`card-premium group cursor-pointer ${poojaInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                      style={{ transitionDelay: `${i * 80}ms` }}
                    >
                      <div className="relative h-52 bg-saffron-50 overflow-hidden">
                        {p.image
                          ? <img src={`http://localhost:5000/${p.image}`} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                          : <div className="w-full h-full flex items-center justify-center text-6xl bg-gradient-to-br from-saffron-50 to-orange-50">🪔</div>
                        }
                        {p.isFeatured && (
                          <span className="absolute top-3 left-3 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide shadow-sm font-sans"
                            style={{ background: 'linear-gradient(135deg, #C9A84C, #E8C85A)' }}>
                            Featured
                          </span>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400" />
                      </div>
                      <div className="p-5">
                        <h3 className="font-display font-bold text-gray-900 text-xl leading-snug mb-1.5" style={{ letterSpacing: '-0.01em' }}>{p.name}</h3>
                        <p className="text-sm text-gray-400 line-clamp-2 mb-4 font-sans leading-relaxed">{p.shortDesc}</p>
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-display text-2xl font-bold text-saffron-600">₹{p.price.toLocaleString('en-IN')}</span>
                            {p.duration && <span className="text-xs text-gray-400 ml-2 font-sans">· {p.duration}</span>}
                          </div>
                          <Link to={`/book/${p.slug}`} onClick={(e) => e.stopPropagation()} className="btn-primary text-sm px-5 py-2 rounded-xl">
                            Book Now
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))
              }
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════
          HOW IT WORKS
      ═══════════════════════════════════════════════════════ */}
      <section className="section-pad sacred-pattern" style={{ background: '#FAF6EE' }}>
        <div ref={stepsRef} className="container-pad">
          <div className="text-center mb-16">
            <EyebrowTag>Simple &amp; Seamless</EyebrowTag>
            <h2 className="section-title">How Zutsav Works</h2>
            <p className="section-subtitle mx-auto text-center">
              Book a verified pandit in minutes — from anywhere in India
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting dashed line */}
            <div className="hidden md:block absolute top-[2.75rem] left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-px border-t-2 border-dashed border-saffron-200 z-0" />

            {steps.map(({ num, title, desc, icon }, i) => (
              <div
                key={num}
                className={`relative text-center z-10 transition-all duration-700 ${stepsInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{ transitionDelay: `${i * 150}ms` }}
              >
                <div className="relative w-24 h-24 mx-auto mb-6">
                  <div className="w-24 h-24 rounded-full flex items-center justify-center shadow-glow-saffron"
                    style={{ background: 'linear-gradient(135deg, #FF6B00, #ff9020)' }}>
                    <span className="text-3xl">{icon}</span>
                  </div>
                  <div className="absolute -top-1 -right-1 w-8 h-8 bg-charcoal text-white rounded-full flex items-center justify-center text-xs font-bold shadow-sm font-sans">
                    {i + 1}
                  </div>
                </div>
                <h3 className="font-display font-bold text-gray-900 text-xl mb-3" style={{ letterSpacing: '-0.01em' }}>{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed font-sans">{desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-14">
            <Link to="/poojas" className="btn-primary inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-base shadow-glow-saffron">
              Book Your Pooja <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          UPCOMING FESTIVALS — dark sacred
      ═══════════════════════════════════════════════════════ */}
      {festivals.length > 0 && (
        <section
          ref={festivalRef}
          className="section-pad text-white overflow-hidden relative"
          style={{ background: 'linear-gradient(145deg, #1C1C1E 0%, #2a1500 55%, #1C1C1E 100%)' }}
        >
          <div className="absolute inset-0 sacred-pattern opacity-10 pointer-events-none" />

          <div className="container-pad relative">
            <div className="flex items-end justify-between mb-14 flex-wrap gap-4">
              <div>
                <EyebrowTag light>Celebrate Together</EyebrowTag>
                <h2 className="font-display text-4xl md:text-5xl font-bold text-white leading-tight" style={{ letterSpacing: '-0.03em' }}>
                  Upcoming Festivals
                </h2>
              </div>
              <Link to="/festivals" className="flex items-center gap-2 font-semibold text-sm hover:gap-3 transition-all font-sans" style={{ color: '#C9A84C' }}>
                Full Calendar <ArrowRight size={14} />
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {festivals.map((f, i) => {
                const daysUntil = Math.ceil((new Date(f.date) - new Date()) / (1000 * 60 * 60 * 24));
                return (
                  <div
                    key={f._id}
                    className={`glass-dark rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 hover:-translate-y-1 ${festivalInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                    style={{ transitionDelay: `${i * 100}ms` }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-3xl">🎉</span>
                      {daysUntil >= 0 && daysUntil <= 30 && (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full font-sans"
                          style={{ background: 'rgba(255,107,0,0.2)', color: '#ffb85a' }}>
                          {daysUntil === 0 ? 'Today!' : `${daysUntil}d away`}
                        </span>
                      )}
                    </div>
                    <h3 className="font-display font-bold text-lg leading-snug mb-2" style={{ color: '#C9A84C', letterSpacing: '-0.01em' }}>{f.name}</h3>
                    <p className="text-xs text-gray-400 font-sans">
                      {new Date(f.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    {f.tithiDate && <p className="text-xs text-gray-500 mt-1 font-sans">{f.tithiDate}</p>}
                    <div className="mt-5 pt-4 border-t border-white/8">
                      <Link to="/poojas" className="text-xs font-semibold flex items-center gap-1 hover:gap-2 transition-all font-sans" style={{ color: '#FF6B00' }}>
                        Book a Pooja <ArrowRight size={11} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════
          WHY ZUTSAV
      ═══════════════════════════════════════════════════════ */}
      <section className="section-pad bg-white">
        <div ref={featuresRef} className="container-pad">
          <div className="text-center mb-16">
            <EyebrowTag>Why Zutsav</EyebrowTag>
            <h2 className="section-title">The Zutsav Difference</h2>
            <p className="section-subtitle mx-auto text-center">
              Premium spiritual services with transparency and trust at every step
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(({ icon: Icon, title, desc }, i) => (
              <div
                key={title}
                className={`group p-7 rounded-2xl border border-gray-100 hover:border-saffron-200 hover:shadow-sacred transition-all duration-300 hover:-translate-y-1 ${featuresInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className="w-14 h-14 bg-gradient-to-br from-saffron-50 to-orange-50 group-hover:from-saffron-100 group-hover:to-orange-100 rounded-2xl flex items-center justify-center mb-5 transition-all duration-300">
                  <Icon size={24} className="text-saffron-600" />
                </div>
                <h3 className="font-display font-bold text-gray-900 text-xl mb-2" style={{ letterSpacing: '-0.01em' }}>{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed font-sans">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          TESTIMONIALS
      ═══════════════════════════════════════════════════════ */}
      <section className="section-pad sacred-pattern" style={{ background: '#FAF6EE' }}>
        <div ref={testRef} className="container-pad">
          <div className="text-center mb-14">
            <EyebrowTag>Devotee Stories</EyebrowTag>
            <h2 className="section-title">Stories of Faith</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div
                key={t.name}
                className={`bg-white rounded-2xl p-7 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 relative overflow-hidden ${testInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                {/* Decorative quote mark */}
                <div
                  className="absolute top-2 right-5 font-display text-saffron-100 select-none pointer-events-none"
                  style={{ fontSize: '8rem', lineHeight: 1, fontWeight: 700 }}
                >
                  "
                </div>
                <StarRating rating={t.rating} />
                <p className="text-gray-600 text-sm leading-relaxed mt-4 mb-6 relative z-10 font-sans">{t.text}</p>
                <div className="flex items-center gap-3 border-t border-gray-100 pt-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-saffron-400 to-saffron-600 flex items-center justify-center shrink-0 shadow-sm">
                    <span className="text-white text-xs font-bold font-sans">{t.initials}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm font-sans">{t.name}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1 font-sans"><MapPin size={10} /> {t.city}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          FAQ
      ═══════════════════════════════════════════════════════ */}
      <section className="section-pad bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-14">
            <EyebrowTag>Help &amp; Support</EyebrowTag>
            <h2 className="section-title">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <FaqItem key={i} faq={faq} index={i} open={faqOpen === i} toggle={toggleFaq} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          CTA BANNER — deep sacred gradient
      ═══════════════════════════════════════════════════════ */}
      <section
        className="section-pad-sm text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #5A0000 0%, #8f3800 40%, #FF6B00 100%)' }}
      >
        <div className="absolute inset-0 sacred-pattern opacity-10 pointer-events-none" />
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-saffron-400 rounded-full blur-[80px] opacity-20 pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-gold-400 rounded-full blur-[80px] opacity-15 pointer-events-none" />

        <div className="container-pad relative text-center">
          <div className="text-5xl mb-5">🙏</div>
          <h2 className="font-display font-bold mb-4 leading-tight" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', letterSpacing: '-0.03em' }}>
            Connect with<br />the Divine Today
          </h2>
          <p className="text-saffron-100 mb-10 text-lg max-w-xl mx-auto font-sans leading-relaxed">
            Book your first pooja and experience authentic spiritual service delivered to your door.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/poojas"
              className="inline-flex items-center justify-center gap-2 bg-white text-saffron-700 font-bold px-9 py-4 rounded-2xl hover:bg-saffron-50 transition-all duration-200 shadow-luxury hover:-translate-y-0.5 font-sans"
            >
              Book a Pooja <ArrowRight size={18} />
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 border-2 border-white/40 text-white font-semibold px-9 py-4 rounded-2xl hover:bg-white/10 hover:border-white/60 transition-all duration-200 font-sans"
            >
              Create Free Account
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
