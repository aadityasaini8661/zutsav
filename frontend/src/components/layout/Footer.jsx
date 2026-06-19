import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Instagram, Facebook, Youtube, ArrowUpRight } from 'lucide-react';

const SERVICES = [
  { label: 'Book a Pooja',          to: '/poojas'      },
  { label: 'Festival Calendar',     to: '/festivals'   },
  { label: 'Spiritual Marketplace', to: '/marketplace' },
  { label: 'Temple Directory',      to: '/temples'     },
  { label: 'Daily Panchang',        to: '/panchang'    },
  { label: 'AI Spiritual Guide',    to: '/ai-assistant'},
];

const COMPANY = [
  { label: 'Home',             to: '/'                },
  { label: 'Browse Poojas',    to: '/poojas'          },
  { label: 'Register as Pandit', to: '/register'      },
  { label: 'Privacy Policy',   to: '#'                },
  { label: 'Terms of Service', to: '#'                },
];

export default function Footer() {
  return (
    <footer className="bg-charcoal text-white">
      {/* Main footer grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand column */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-5">
              <span className="text-2xl">🪔</span>
              <span className="font-serif text-2xl font-bold text-gold-400">Zutsav</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              India's most trusted spiritual platform — connecting devotees with verified pandits,
              authentic samagri, and sacred wisdom.
            </p>
            <div className="flex gap-3">
              {[
                { icon: Instagram, href: '#' },
                { icon: Facebook,  href: '#' },
                { icon: Youtube,   href: '#' },
              ].map(({ icon: Icon, href }) => (
                <a key={href} href={href}
                  className="w-9 h-9 bg-white/8 border border-white/10 rounded-xl flex items-center justify-center text-gray-400 hover:bg-saffron-500 hover:text-white hover:border-saffron-500 transition-all duration-200">
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold text-white text-sm mb-5 tracking-wide">Services</h4>
            <ul className="space-y-3">
              {SERVICES.map(({ label, to }) => (
                <li key={label}>
                  <Link to={to}
                    className="text-gray-400 text-sm hover:text-saffron-400 transition-colors flex items-center gap-1.5 group">
                    {label}
                    <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-white text-sm mb-5 tracking-wide">Company</h4>
            <ul className="space-y-3">
              {COMPANY.map(({ label, to }) => (
                <li key={label}>
                  <Link to={to}
                    className="text-gray-400 text-sm hover:text-saffron-400 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-white text-sm mb-5 tracking-wide">Contact</h4>
            <ul className="space-y-4">
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/8 rounded-lg flex items-center justify-center shrink-0">
                  <Phone size={13} className="text-saffron-400" />
                </div>
                <span className="text-gray-400 text-sm">+91 98765 43210</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/8 rounded-lg flex items-center justify-center shrink-0">
                  <Mail size={13} className="text-saffron-400" />
                </div>
                <span className="text-gray-400 text-sm">support@zutsav.com</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 bg-white/8 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin size={13} className="text-saffron-400" />
                </div>
                <span className="text-gray-400 text-sm">New Delhi, India</span>
              </li>
            </ul>

            {/* Trust badge */}
            <div className="mt-6 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-gold-400 text-sm">★★★★★</span>
              </div>
              <p className="text-xs text-gray-400">Trusted by 10,000+ devotees across India</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} Zutsav. Made with 🙏 in India.
          </p>
          <p className="text-xs text-gray-600">
            Proudly serving devotees since 2024
          </p>
        </div>
      </div>
    </footer>
  );
}
