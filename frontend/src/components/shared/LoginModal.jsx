import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X, ArrowRight } from 'lucide-react';

export default function LoginModal({ isOpen, onClose, message }) {
  const navigate  = useNavigate();
  const location  = useLocation();

  if (!isOpen) return null;

  const goToLogin = () => {
    onClose();
    navigate('/login', { state: { from: { pathname: location.pathname } } });
  };

  const goToRegister = () => {
    onClose();
    navigate('/register');
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 animate-scale-in relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-gray-300 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <X size={18} />
        </button>

        <div className="text-center">
          <div className="w-16 h-16 bg-saffron-50 border border-saffron-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <span className="text-3xl">🪔</span>
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-2">Login to Continue</h3>
          <p className="text-gray-500 text-sm leading-relaxed mb-7">
            {message || 'Please login to access this feature and enjoy the full Zutsav experience.'}
          </p>

          <div className="space-y-3">
            <button
              onClick={goToLogin}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3"
            >
              Sign In <ArrowRight size={16} />
            </button>
            <button onClick={goToRegister} className="btn-outline w-full py-3">
              Create Account
            </button>
          </div>

          <p className="text-xs text-gray-400 mt-5">
            Join 10,000+ devotees on Zutsav
          </p>
        </div>
      </div>
    </div>
  );
}
