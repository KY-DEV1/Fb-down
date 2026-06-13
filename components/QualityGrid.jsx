'use client';
import { useState } from 'react';

const DL_ICON = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 16l-6-6h4V4h4v6h4l-6 6zm-8 4h16v-2H4v2z"/>
  </svg>
);

export default function QualityGrid({ formats, videoUrl, videoTitle, onDownload }) {
  const [downloading, setDownloading] = useState(null);

  const handleDownload = async (format) => {
    setDownloading(format.formatId);
    onDownload?.('video', format);

    const params = new URLSearchParams({
      url:      videoUrl,
      formatId: format.formatId,
      filename: videoTitle?.replace(/[^a-z0-9]/gi, '_').slice(0, 80) || 'video',
      type:     'video',
    });

    const link = document.createElement('a');
    link.href = `/api/download?${params}`;
    link.download = `${videoTitle || 'video'}_${format.quality}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => setDownloading(null), 2000);
  };

  if (!formats?.length) return null;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(195px, 1fr))',
      gap: 10,
    }}>
      {formats.map((fmt) => (
        <div key={fmt.formatId} style={{
          background: 'var(--surface2)',
          border: `1.5px solid ${fmt.recommended ? 'var(--accent3)' : 'var(--border)'}`,
          borderRadius: 'var(--r-md)',
          padding: '15px 15px 13px',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all .2s',
          cursor: 'default',
        }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.borderColor = fmt.recommended ? 'var(--accent3)' : 'var(--accent)';
            e.currentTarget.style.background = 'var(--surface3)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = '';
            e.currentTarget.style.borderColor = fmt.recommended ? 'var(--accent3)' : 'var(--border)';
            e.currentTarget.style.background = 'var(--surface2)';
          }}
        >
          {fmt.recommended && (
            <div style={{
              position: 'absolute', top: 8, right: 8,
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '.52rem', fontWeight: 700, letterSpacing: '.06em',
              background: 'var(--accent3)', color: '#000',
              padding: '2px 7px', borderRadius: 99,
            }}>BEST</div>
          )}

          <div style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 5 }}>
            {fmt.quality}
          </div>

          <div style={{
            fontFamily: 'JetBrains Mono, monospace', fontSize: '.65rem',
            color: 'var(--text-3)', display: 'flex', gap: 6, alignItems: 'center',
            flexWrap: 'wrap', marginBottom: 13,
          }}>
            <span>{fmt.fps}fps</span>
            <span style={{ color: 'var(--text-4)' }}>·</span>
            <span>{fmt.ext?.toUpperCase()}</span>
            <span style={{ color: 'var(--text-4)' }}>·</span>
            <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
              {fmt.filesizeHuman || '—'}
            </span>
          </div>

          {fmt.tbr && (
            <div style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: '.58rem',
              color: 'var(--text-3)', marginBottom: 12,
            }}>
              {fmt.tbr.toFixed(0)} kbps · {fmt.vcodec}
            </div>
          )}

          <button
            onClick={() => handleDownload(fmt)}
            disabled={downloading === fmt.formatId}
            style={{
              width: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              background: downloading === fmt.formatId
                ? 'var(--surface3)'
                : 'linear-gradient(135deg, var(--accent3), #059669)',
              border: 'none',
              color: downloading === fmt.formatId ? 'var(--text-3)' : '#000',
              fontFamily: 'Syne, sans-serif',
              fontSize: '.78rem', fontWeight: 700,
              padding: '9px 0', borderRadius: 'var(--r-sm)',
              cursor: downloading === fmt.formatId ? 'not-allowed' : 'pointer',
              transition: 'all .2s',
              boxShadow: downloading === fmt.formatId ? 'none' : '0 4px 14px var(--glow3)',
            }}
            onMouseEnter={e => {
              if (downloading !== fmt.formatId) {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 20px var(--glow3)';
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = '';
              e.currentTarget.style.boxShadow = downloading === fmt.formatId ? 'none' : '0 4px 14px var(--glow3)';
            }}
          >
            {downloading === fmt.formatId
              ? <><span style={{ width:12,height:12,border:'2px solid var(--text-3)',borderTopColor:'var(--text-2)',borderRadius:'50%',animation:'spin .7s linear infinite',display:'inline-block'}}></span> Starting…</>
              : <>{DL_ICON} Download {fmt.quality}</>
            }
          </button>
        </div>
      ))}
    </div>
  );
}
