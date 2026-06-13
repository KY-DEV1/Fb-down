'use client';
import { useEffect, useState } from 'react';

// ── Global toast event system ─────────────────────────────────────────────────
const listeners = new Set();

export function showToast(message, type = 'info', icon = null) {
  const defaultIcons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
  listeners.forEach(fn => fn({ message, type, icon: icon ?? defaultIcons[type] }));
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function Toast() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handler = (toast) => {
      const id = Date.now() + Math.random();
      setToasts(prev => [...prev.slice(-4), { ...toast, id }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
    };
    listeners.add(handler);
    return () => listeners.delete(handler);
  }, []);

  return (
    <div style={{
      position: 'fixed', bottom: 28, right: 28, zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none',
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: 'var(--surface2)',
          border: `1px solid ${
            t.type === 'success' ? 'var(--accent3)' :
            t.type === 'error'   ? 'var(--danger)'  :
            t.type === 'warning' ? 'var(--warning)'  :
            'var(--border2)'
          }`,
          borderRadius: 12,
          padding: '12px 16px',
          display: 'flex', alignItems: 'center', gap: 10,
          fontSize: '.82rem', fontWeight: 600,
          color: t.type === 'success' ? 'var(--accent3)' :
                 t.type === 'error'   ? 'var(--danger)'  :
                 t.type === 'warning' ? 'var(--warning)'  :
                 'var(--accent)',
          boxShadow: '0 16px 48px rgba(0,0,0,.5)',
          animation: 'slideDown .35s var(--ease-spring) both',
          maxWidth: 320,
          backdropFilter: 'blur(10px)',
        }}>
          <span style={{ fontSize: '1rem', flexShrink: 0 }}>{t.icon}</span>
          <span style={{ color: 'var(--text)', fontWeight: 500 }}>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
