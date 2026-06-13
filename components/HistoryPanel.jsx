'use client';
import { useState, useEffect } from 'react';

const STORAGE_KEY = 'fbdrop_history';

export function useDownloadHistory() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    try {
      setItems(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'));
    } catch {}
  }, []);

  const add = (entry) => {
    const item = {
      id: Date.now(),
      title: entry.title,
      thumb: entry.thumbnail,
      quality: entry.quality,
      url: entry.url,
      time: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
    };
    const next = [item, ...items].slice(0, 12);
    setItems(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  };

  const clear = () => {
    setItems([]);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  };

  return { items, add, clear };
}

export default function HistoryPanel({ items, onClear, onReuse }) {
  if (!items) return null;

  return (
    <section style={{ animation: 'fadeUp .6s .4s both' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h2 style={{ fontSize: '.95rem', fontWeight: 700 }}>Recent Downloads</h2>
        {items.length > 0 && (
          <button onClick={onClear} style={{
            fontFamily: 'JetBrains Mono, monospace', fontSize: '.65rem',
            color: 'var(--text-3)', background: 'none', border: 'none',
            cursor: 'pointer', padding: '4px 8px', borderRadius: 4,
            transition: 'color .2s',
          }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
          >
            clear all
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '32px 20px',
          fontFamily: 'JetBrains Mono, monospace', fontSize: '.72rem', color: 'var(--text-4)',
        }}>
          No downloads yet_
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map(item => (
            <div key={item.id}
              onClick={() => onReuse?.(item)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: 'var(--surface2)', border: '1px solid var(--border)',
                borderRadius: 'var(--r-md)', padding: '11px 14px',
                cursor: 'pointer', transition: 'all .2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--accent)';
                e.currentTarget.style.background = 'var(--accent-dim)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.background = 'var(--surface2)';
              }}
            >
              <div style={{
                width: 56, height: 36, borderRadius: 5, overflow: 'hidden',
                background: 'var(--surface)', flexShrink: 0, border: '1px solid var(--border)',
              }}>
                {item.thumb && (
                  <img src={item.thumb} alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => e.target.style.display='none'}
                  />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '.8rem', fontWeight: 600,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>{item.title}</div>
                <div style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: '.62rem',
                  color: 'var(--text-3)', marginTop: 2,
                }}>{item.time}</div>
              </div>
              <div style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: '.6rem',
                padding: '3px 9px', borderRadius: 99,
                background: 'var(--surface)', border: '1px solid var(--border)',
                color: 'var(--text-3)', flexShrink: 0,
              }}>{item.quality}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
