import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, Check } from 'lucide-react';
import { useTheme, THEMES } from '../../context/ThemeContext';

/* ─── Compact row of swatches (used inside Sidebar) ─── */
export function ThemeSwatchRow() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {Object.entries(THEMES).map(([key, t]) => (
        <button
          key={key}
          onClick={() => setTheme(key)}
          title={t.name}
          className="relative w-5 h-5 rounded-full transition-transform duration-200 hover:scale-110 active:scale-95 flex-shrink-0"
          style={{ background: t.previewColor }}
        >
          {theme === key && (
            <motion.span
              layoutId="theme-swatch-active"
              className="absolute inset-0 rounded-full"
              style={{ boxShadow: `0 0 0 2px var(--t-card), 0 0 0 4px ${t.previewColor}` }}
            />
          )}
        </button>
      ))}
    </div>
  );
}

/* ─── Full theme picker panel (used in Settings page) ─── */
export function ThemePickerPanel() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="grid grid-cols-1 gap-3">
      {Object.entries(THEMES).map(([key, t]) => {
        const active = theme === key;
        return (
          <motion.button
            key={key}
            onClick={() => setTheme(key)}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-200"
            style={{
              borderColor: active ? t.previewColor : 'var(--t-border)',
              background: active ? `${t.previewColor}10` : 'var(--t-card)',
            }}
          >
            {/* Color circle */}
            <div
              className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center shadow-md"
              style={{ background: t.previewColor }}
            >
              {active && <Check size={16} strokeWidth={3} className="text-white" />}
            </div>
            {/* Label */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold" style={{ color: 'var(--t-text)' }}>
                  {t.emoji} {t.name}
                </span>
                {active && (
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ background: `${t.previewColor}20`, color: t.previewColor }}
                  >
                    Active
                  </span>
                )}
              </div>
              <p className="text-xs mt-0.5" style={{ color: 'var(--t-muted)' }}>
                {t.description}
              </p>
            </div>
            {/* Preview swatches */}
            <div className="flex gap-1 flex-shrink-0">
              {[t.vars['--t-primary'], t.vars['--t-secondary'], t.vars['--t-bg']].map((c, i) => (
                <div
                  key={i}
                  className="w-4 h-4 rounded-full border border-white/20"
                  style={{ background: c }}
                />
              ))}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}

/* ─── Floating theme toggle dropdown (used in Navbar) ─── */
export default function ThemeToggle() {
  const { theme, setTheme, currentTheme } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="p-2 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
        style={{ background: 'var(--t-nav-active-bg)' }}
        title="Change theme"
      >
        <Palette size={18} style={{ color: 'var(--t-primary)' }} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -8 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="absolute right-0 top-11 z-50 w-64 rounded-2xl shadow-float overflow-hidden"
              style={{ background: 'var(--t-card)', border: '1px solid var(--t-border)' }}
            >
              <div className="p-3 border-b" style={{ borderColor: 'var(--t-border)' }}>
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--t-muted)' }}>
                  Appearance
                </p>
              </div>
              <div className="p-2">
                {Object.entries(THEMES).map(([key, t]) => {
                  const active = theme === key;
                  return (
                    <button
                      key={key}
                      onClick={() => { setTheme(key); setOpen(false); }}
                      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left transition-all duration-150"
                      style={{
                        background: active ? 'var(--t-nav-active-bg)' : 'transparent',
                      }}
                    >
                      <div
                        className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center"
                        style={{ background: t.previewColor }}
                      >
                        {active && <Check size={12} strokeWidth={3} className="text-white" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium" style={{ color: active ? 'var(--t-primary)' : 'var(--t-text)' }}>
                          {t.emoji} {t.name}
                        </div>
                        <div className="text-xs" style={{ color: 'var(--t-muted)' }}>
                          {t.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
