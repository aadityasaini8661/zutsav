import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import API from '../api/axios';

export const THEMES = {
  'divine-spiritual': {
    name: 'Divine Spiritual',
    description: 'Sacred saffron & temple gold',
    emoji: '🪔',
    previewColor: '#D4602A',
    dark: false,
    vars: {
      '--t-primary':        '#D4602A',
      '--t-primary-dark':   '#B54E1A',
      '--t-primary-light':  '#E8845A',
      '--t-secondary':      '#C9A84C',
      '--t-accent':         '#8B1A1A',
      '--t-bg':             '#FFFBF0',
      '--t-card':           '#FFFFFF',
      '--t-sidebar':        '#FFF8E8',
      '--t-sidebar-border': '#E8D5B0',
      '--t-text':           '#1A1207',
      '--t-text-inv':       '#FFFFFF',
      '--t-muted':          '#8B7355',
      '--t-border':         '#E8D5B0',
      '--t-surface':        '#FEF3E2',
      '--t-glow':           'rgba(212,96,42,0.12)',
      '--t-ring':           'rgba(212,96,42,0.30)',
      '--t-input-bg':       '#FFFFFF',
      '--t-scrollbar':      '#C9A84C',
      '--t-nav-active-bg':  'rgba(212,96,42,0.10)',
      '--t-overlay':        'rgba(26,18,7,0.45)',
    },
  },
  'modern-enterprise': {
    name: 'Modern Enterprise',
    description: 'Emerald analytics & SaaS',
    emoji: '💼',
    previewColor: '#059669',
    dark: false,
    vars: {
      '--t-primary':        '#059669',
      '--t-primary-dark':   '#047857',
      '--t-primary-light':  '#34D399',
      '--t-secondary':      '#0D9488',
      '--t-accent':         '#8B5CF6',
      '--t-bg':             '#F8FAFC',
      '--t-card':           '#FFFFFF',
      '--t-sidebar':        '#F1F5F9',
      '--t-sidebar-border': '#E2E8F0',
      '--t-text':           '#0F172A',
      '--t-text-inv':       '#FFFFFF',
      '--t-muted':          '#64748B',
      '--t-border':         '#E2E8F0',
      '--t-surface':        '#F8FAFC',
      '--t-glow':           'rgba(5,150,105,0.10)',
      '--t-ring':           'rgba(5,150,105,0.30)',
      '--t-input-bg':       '#FFFFFF',
      '--t-scrollbar':      '#059669',
      '--t-nav-active-bg':  'rgba(5,150,105,0.08)',
      '--t-overlay':        'rgba(15,23,42,0.45)',
    },
  },
  'dark-temple': {
    name: 'Dark Temple',
    description: 'Gold on charcoal – royal & mystical',
    emoji: '🌑',
    previewColor: '#D4AF37',
    dark: true,
    vars: {
      '--t-primary':        '#D4AF37',
      '--t-primary-dark':   '#B8960B',
      '--t-primary-light':  '#F0D060',
      '--t-secondary':      '#C2410C',
      '--t-accent':         '#DC2626',
      '--t-bg':             '#080808',
      '--t-card':           '#141414',
      '--t-sidebar':        '#0D0D0D',
      '--t-sidebar-border': '#2A2A2A',
      '--t-text':           '#F5F5F5',
      '--t-text-inv':       '#080808',
      '--t-muted':          '#9CA3AF',
      '--t-border':         '#2A2A2A',
      '--t-surface':        '#1A1A1A',
      '--t-glow':           'rgba(212,175,55,0.20)',
      '--t-ring':           'rgba(212,175,55,0.40)',
      '--t-input-bg':       '#141414',
      '--t-scrollbar':      '#D4AF37',
      '--t-nav-active-bg':  'rgba(212,175,55,0.12)',
      '--t-overlay':        'rgba(0,0,0,0.70)',
    },
  },
  'minimal-light': {
    name: 'Minimal Light',
    description: 'Navy & sky – Apple × Notion',
    emoji: '☁️',
    previewColor: '#1E3A5F',
    dark: false,
    vars: {
      '--t-primary':        '#1E3A5F',
      '--t-primary-dark':   '#152C4A',
      '--t-primary-light':  '#2D5A9E',
      '--t-secondary':      '#0EA5E9',
      '--t-accent':         '#6366F1',
      '--t-bg':             '#FFFFFF',
      '--t-card':           '#F8F9FA',
      '--t-sidebar':        '#F9FAFB',
      '--t-sidebar-border': '#E5E7EB',
      '--t-text':           '#111827',
      '--t-text-inv':       '#FFFFFF',
      '--t-muted':          '#6B7280',
      '--t-border':         '#E5E7EB',
      '--t-surface':        '#F3F4F6',
      '--t-glow':           'rgba(30,58,95,0.08)',
      '--t-ring':           'rgba(30,58,95,0.25)',
      '--t-input-bg':       '#FFFFFF',
      '--t-scrollbar':      '#1E3A5F',
      '--t-nav-active-bg':  'rgba(30,58,95,0.08)',
      '--t-overlay':        'rgba(17,24,39,0.45)',
    },
  },
  'midnight-black': {
    name: 'Midnight Black',
    description: 'Purple on black – developer luxury',
    emoji: '🔮',
    previewColor: '#A855F7',
    dark: true,
    vars: {
      '--t-primary':        '#A855F7',
      '--t-primary-dark':   '#7C3AED',
      '--t-primary-light':  '#C084FC',
      '--t-secondary':      '#EC4899',
      '--t-accent':         '#F59E0B',
      '--t-bg':             '#000000',
      '--t-card':           '#0A0A0A',
      '--t-sidebar':        '#050505',
      '--t-sidebar-border': '#1F1F1F',
      '--t-text':           '#FFFFFF',
      '--t-text-inv':       '#000000',
      '--t-muted':          '#6B7280',
      '--t-border':         '#1F1F1F',
      '--t-surface':        '#111111',
      '--t-glow':           'rgba(168,85,247,0.20)',
      '--t-ring':           'rgba(168,85,247,0.40)',
      '--t-input-bg':       '#0A0A0A',
      '--t-scrollbar':      '#A855F7',
      '--t-nav-active-bg':  'rgba(168,85,247,0.12)',
      '--t-overlay':        'rgba(0,0,0,0.75)',
    },
  },
};

const DEFAULT_THEME = 'divine-spiritual';
const STORAGE_KEY   = 'zutsav_theme';

const ThemeContext = createContext(null);

function applyTheme(key) {
  const theme = THEMES[key] || THEMES[DEFAULT_THEME];
  const root  = document.documentElement;
  Object.entries(theme.vars).forEach(([k, v]) => root.style.setProperty(k, v));
  root.setAttribute('data-theme', key);
  root.setAttribute('data-dark',  theme.dark ? '1' : '0');
}

export function ThemeProvider({ children, user }) {
  const [theme, setThemeKey] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_THEME;
  });

  useEffect(() => { applyTheme(theme); }, [theme]);

  const setTheme = useCallback(async (key) => {
    if (!THEMES[key]) return;
    setThemeKey(key);
    localStorage.setItem(STORAGE_KEY, key);
    applyTheme(key);
    if (user) {
      try { await API.patch('/users/preferences', { theme: key }); }
      catch {}
    }
  }, [user]);

  return (
    <ThemeContext.Provider value={{
      theme,
      setTheme,
      themes: THEMES,
      currentTheme: THEMES[theme],
      isDark: THEMES[theme]?.dark ?? false,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be inside ThemeProvider');
  return ctx;
}
