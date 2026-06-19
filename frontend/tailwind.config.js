/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        /* ── V5 Theme-aware colors (CSS custom properties) ──────── */
        'tp':           'var(--t-primary)',
        'tp-dark':      'var(--t-primary-dark)',
        'tp-light':     'var(--t-primary-light)',
        'ts':           'var(--t-secondary)',
        'ta':           'var(--t-accent)',
        'tbg':          'var(--t-bg)',
        'tcard':        'var(--t-card)',
        'tsidebar':     'var(--t-sidebar)',
        'ttext':        'var(--t-text)',
        'ttextinv':     'var(--t-text-inv)',
        'tmuted':       'var(--t-muted)',
        'tborder':      'var(--t-border)',
        'tsurface':     'var(--t-surface)',
        'tinput':       'var(--t-input-bg)',

        /* ── V4 brand palette (kept for existing components) ─────── */
        indigo: {
          50:  '#eef0f8',
          100: '#d1d7ef',
          200: '#a4aedf',
          300: '#7685cf',
          400: '#495dbf',
          500: '#2a3aad',
          600: '#1B1F3B',
          700: '#141729',
          800: '#0d1019',
          900: '#060809',
        },
        gold: {
          50:  '#fdf9ec',
          100: '#faf0c5',
          200: '#f4da7a',
          300: '#ecc53e',
          400: '#D4AF37',
          500: '#b89330',
          600: '#9b7520',
          700: '#7c5c19',
        },
        saffron: {
          50:  '#fff8f0',
          100: '#fff0d9',
          200: '#ffd59e',
          300: '#ffb85a',
          400: '#ff9020',
          500: '#E67E22',
          600: '#d06219',
          700: '#b04e10',
          800: '#8f3800',
          900: '#6b2b00',
        },
        temple: {
          50:  '#fdf8ed',
          100: '#f9efc9',
          200: '#f0d98e',
          300: '#e8c45a',
          400: '#dba830',
          500: '#C9A84C',
          600: '#a07a2e',
          700: '#7a5d1e',
        },
        maroon: {
          50:  '#fdf2f4',
          100: '#fce7ea',
          400: '#c0404a',
          500: '#800000',
          600: '#6b0000',
          700: '#500000',
          800: '#380000',
        },
        spiritual: {
          light:     '#FFF8F0',
          cream:     '#FEFAF0',
          warm:      '#F5E6CC',
          ivory:     '#FFFBF5',
          parchment: '#FAF7F2',
        },
        parchment: '#FAF7F2',
        ivory:     '#FFFBF5',
        sand:      '#F0E6D3',
        charcoal:  '#1C1C1E',
      },

      fontFamily: {
        sans:    ['Inter', 'sans-serif'],
        serif:   ['"Playfair Display"', 'serif'],
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
      },

      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },

      boxShadow: {
        /* Theme-aware glow */
        'glow-tp':      '0 0 40px -10px var(--t-glow)',
        'ring-tp':      '0 0 0 3px var(--t-ring)',
        /* Legacy */
        'glow-saffron': '0 0 40px -10px rgba(230,126,34,0.3)',
        'glow-gold':    '0 0 40px -10px rgba(212,175,55,0.35)',
        'glow-indigo':  '0 0 40px -10px rgba(27,31,59,0.25)',
        'glow-temple':  '0 0 60px -15px rgba(201,168,76,0.45)',
        /* Structural */
        'card':         '0 1px 3px rgba(0,0,0,0.05), 0 4px 20px rgba(0,0,0,0.04)',
        'card-hover':   '0 8px 40px rgba(0,0,0,0.10)',
        'card-lift':    '0 20px 60px rgba(0,0,0,0.08)',
        'luxury':       '0 24px 80px rgba(0,0,0,0.07)',
        'premium':      '0 32px 80px rgba(0,0,0,0.09), inset 0 1px 0 rgba(255,255,255,0.5)',
        'sacred':       '0 8px 32px rgba(212,175,55,0.15), 0 2px 8px rgba(0,0,0,0.05)',
        'sidebar':      '4px 0 24px rgba(0,0,0,0.05)',
        'float':        '0 8px 30px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)',
        'glass':        '0 8px 32px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.6)',
      },

      backgroundImage: {
        /* Theme-aware */
        'tp-gradient':   'linear-gradient(135deg, var(--t-primary) 0%, var(--t-primary-light) 100%)',
        'tp-glow':       'radial-gradient(ellipse at center, var(--t-glow) 0%, transparent 70%)',
        /* Legacy */
        'saffron-gradient':   'linear-gradient(135deg, #E67E22 0%, #D4AF37 100%)',
        'indigo-gradient':    'linear-gradient(135deg, #1B1F3B 0%, #2d3160 100%)',
        'gold-gradient':      'linear-gradient(135deg, #C9A84C 0%, #E8C85A 50%, #D4AF37 100%)',
        'gold-shimmer':       'linear-gradient(90deg, #D4AF37 0%, #f5e09a 50%, #D4AF37 100%)',
        'spiritual-gradient': 'linear-gradient(180deg, #FFFBF5 0%, #FFF0D9 100%)',
        'hero-gradient':      'linear-gradient(160deg, #FAF7F2 0%, #FFF8F0 50%, #FAF7F2 100%)',
        'sacred-dark':        'linear-gradient(145deg, #1B1F3B 0%, #2d3160 50%, #1B1F3B 100%)',
        'cta-gradient':       'linear-gradient(135deg, #1B1F3B 0%, #2d3160 60%, #3a4080 100%)',
        'ivory-gradient':     'linear-gradient(180deg, #FAF7F2 0%, #FFFFFF 100%)',
        'mesh-radial':        'radial-gradient(circle at 20% 50%, var(--t-glow) 0%, transparent 50%), radial-gradient(circle at 80% 20%, var(--t-glow) 0%, transparent 50%)',
      },

      animation: {
        'float':         'float 4s ease-in-out infinite',
        'float-slow':    'float 6s ease-in-out infinite',
        'shimmer':       'shimmer 2s linear infinite',
        'fade-in':       'fadeIn 0.35s ease-out',
        'slide-up':      'slideUp 0.45s ease-out',
        'slide-in-left': 'slideInLeft 0.4s cubic-bezier(0.16,1,0.3,1)',
        'scale-in':      'scaleIn 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        'fade-up':       'fadeUp 0.6s ease-out both',
        'pulse-soft':    'pulseSoft 3s ease-in-out infinite',
        'reveal':        'reveal 0.9s cubic-bezier(0.16,1,0.3,1) both',
        'spin-slow':     'spin 20s linear infinite',
        'glow-pulse':    'glowPulse 3s ease-in-out infinite',
        'gold-shimmer':  'goldShimmer 2.5s linear infinite',
        'bounce-soft':   'bounceSoft 2s ease-in-out infinite',
        'draw':          'draw 1s ease-out forwards',
      },

      keyframes: {
        float:       { '0%,100%': { transform: 'translateY(0)' },            '50%': { transform: 'translateY(-10px)' } },
        shimmer:     { '0%': { backgroundPosition: '-200% 0' },              '100%': { backgroundPosition: '200% 0' } },
        fadeIn:      { from: { opacity: '0' },                                to: { opacity: '1' } },
        slideUp:     { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideInLeft: { from: { opacity: '0', transform: 'translateX(-20px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        scaleIn:     { from: { opacity: '0', transform: 'scale(0.92)' },      to: { opacity: '1', transform: 'scale(1)' } },
        fadeUp:      { from: { opacity: '0', transform: 'translateY(32px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        pulseSoft:   { '0%,100%': { opacity: '1' },                          '50%': { opacity: '0.6' } },
        reveal:      { from: { opacity: '0', transform: 'translateY(48px) scale(0.97)' }, to: { opacity: '1', transform: 'translateY(0) scale(1)' } },
        glowPulse:   { '0%,100%': { boxShadow: '0 0 20px var(--t-glow)' },  '50%': { boxShadow: '0 0 50px var(--t-glow)' } },
        goldShimmer: { '0%': { backgroundPosition: '-300% 0' },              '100%': { backgroundPosition: '300% 0' } },
        bounceSoft:  { '0%,100%': { transform: 'translateY(0)' },            '50%': { transform: 'translateY(-6px)' } },
        draw:        { from: { strokeDashoffset: '1000' },                    to: { strokeDashoffset: '0' } },
      },

      opacity: {
        '3': '0.03', '4': '0.04', '6': '0.06', '8': '0.08',
        '12': '0.12', '15': '0.15', '18': '0.18',
      },

      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'smooth': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'snappy': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      },

      spacing: {
        '18': '4.5rem',
        '72': '18rem',
        '76': '19rem',
        '80': '20rem',
      },
    },
  },
  plugins: [],
};
