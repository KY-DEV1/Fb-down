'use client';
import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import Toast, { showToast } from '../components/Toast';
import ProgressSteps from '../components/ProgressSteps';
import QualityGrid from '../components/QualityGrid';
import HistoryPanel, { useDownloadHistory } from '../components/HistoryPanel';

// ── Progress phases ────────────────────────────────────────────────────────────
const PHASES = [
  { step: 'validate', pct: 15, text: 'Validating URL format...' },
  { step: 'connect',  pct: 32, text: 'Connecting to Facebook servers...' },
  { step: 'fetch',    pct: 55, text: 'Fetching video metadata...' },
  { step: 'extract',  pct: 78, text: 'Extracting media streams...' },
  { step: 'parse',    pct: 95, text: 'Parsing quality options...' },
];

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ─── Inline styles (no Tailwind needed) ───────────────────────────────────────
const s = {
  page: {
    minHeight: '100vh',
    position: 'relative',
    overflow: 'hidden',
  },
  bgGrid: {
    position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
    backgroundImage:
      'linear-gradient(rgba(91,114,248,.035) 1px, transparent 1px), linear-gradient(90deg,rgba(91,114,248,.035) 1px, transparent 1px)',
    backgroundSize: '52px 52px',
  },
  bgOrb: (color, size, top, left, right, bottom) => ({
    position: 'fixed', borderRadius: '50%', filter: 'blur(110px)',
    pointerEvents: 'none', zIndex: 0,
    width: size, height: size, background: color,
    top, left, right, bottom,
  }),
  wrapper: {
    position: 'relative', zIndex: 1,
    maxWidth: 880, margin: '0 auto', padding: '0 24px 100px',
  },

  /* NAV */
  nav: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '28px 0 20px', borderBottom: '1px solid var(--border)',
    marginBottom: 64, animation: 'fadeUp .5s both',
  },
  logoWrap: { display: 'flex', alignItems: 'center', gap: 10 },
  logoIcon: {
    width: 34, height: 34, borderRadius: 10,
    background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '1rem', boxShadow: '0 0 20px var(--glow)',
  },
  logoText: { fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-.03em' },

  /* HERO */
  hero: {
    textAlign: 'center', marginBottom: 52,
    animation: 'fadeUp .6s .1s both',
  },
  heroTag: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    fontFamily: 'JetBrains Mono, monospace', fontSize: '.68rem',
    letterSpacing: '.1em', textTransform: 'uppercase',
    color: 'var(--accent3)', border: '1px solid rgba(6,214,160,.25)',
    borderRadius: 99, padding: '5px 14px', marginBottom: 22,
    background: 'rgba(6,214,160,.06)',
  },
  heroTagDot: {
    width: 6, height: 6, borderRadius: '50%', background: 'var(--accent3)',
    animation: 'progressPulse 2s infinite',
  },
  h1: {
    fontSize: 'clamp(2rem, 5.5vw, 3.6rem)',
    fontWeight: 800, lineHeight: 1.08, letterSpacing: '-.04em',
    background: 'linear-gradient(135deg, var(--text) 40%, var(--text-2))',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
    backgroundClip: 'text', marginBottom: 16,
  },
  h1Accent: {
    fontStyle: 'normal',
    background: 'linear-gradient(90deg, var(--accent), var(--accent2))',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  heroSub: { color: 'var(--text-2)', fontSize: '.95rem', lineHeight: 1.7, maxWidth: 460, margin: '0 auto' },

  /* CARD */
  card: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--r-xl)', padding: '28px 28px 24px',
    marginBottom: 20, position: 'relative', overflow: 'hidden',
    animation: 'fadeUp .6s .2s both',
  },
  cardGlow: {
    position: 'absolute', inset: 0,
    background: 'linear-gradient(135deg, rgba(91,114,248,.04), transparent 60%)',
    pointerEvents: 'none',
  },
};

// ─── Main Page Component ───────────────────────────────────────────────────────
export default function Home() {
  const [url, setUrl]               = useState('');
  const [loading, setLoading]       = useState(false);
  const [phase, setPhase]           = useState(null);   // progress phase
  const [pct, setPct]               = useState(0);
  const [statusText, setStatusText] = useState('');
  const [videoData, setVideoData]   = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [optHd, setOptHd]           = useState(true);
  const [optAudio, setOptAudio]     = useState(false);
  const [optAuto, setOptAuto]       = useState(false);

  const inputRef = useRef(null);
  const { items: history, add: addHistory, clear: clearHistory } = useDownloadHistory();

  // ── Paste ──────────────────────────────────────────────
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
      showToast('Pasted from clipboard!', 'info', '📋');
    } catch {
      showToast('Clipboard access denied — paste manually', 'error');
    }
  };

  // ── Simulate progress then call API ───────────────────
  const fetchVideo = useCallback(async () => {
    const trimmed = url.trim();
    if (!trimmed) { showToast('Please enter a URL', 'error'); return; }

    setLoading(true);
    setVideoData(null);

    // Animate progress phases
    for (const p of PHASES) {
      setPhase(p.step);
      setPct(p.pct);
      setStatusText(p.text);
      await sleep(380 + Math.random() * 280);
    }

    // ── Real API call ──────────────────────────────────
    try {
      const res = await fetch('/api/fetch-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      });

      const json = await res.json();

      if (!res.ok) {
        showToast(json.error || 'Failed to fetch video', 'error', '✕');
        setPhase(null);
        setLoading(false);
        return;
      }

      setPct(100);
      setStatusText('All streams ready!');
      await sleep(400);
      setVideoData(json.data);
      showToast('Video analyzed!', 'success', '✓');

      if (json.demo) {
        showToast('Demo mode active — install yt-dlp for real downloads', 'warning', '⚠');
      }

      // Auto-download best quality if option set
      if (optAuto && json.data.formats?.length > 0) {
        triggerDownload(json.data, json.data.formats[0], 'video');
      }

    } catch (err) {
      showToast('Network error — check your connection', 'error', '✕');
    } finally {
      setPhase(null);
      setLoading(false);
    }
  }, [url, optAuto]);

  // ── Trigger browser download ───────────────────────────
  const triggerDownload = (data, format, type) => {
    const params = new URLSearchParams({
      url:      data.webpage_url,
      formatId: format?.formatId || 'best',
      filename: data.title?.replace(/[^a-z0-9]/gi, '_').slice(0, 80) || 'video',
      type,
    });
    const a = document.createElement('a');
    a.href = `/api/download?${params}`;
    a.download = '';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    addHistory({
      title: data.title,
      thumbnail: data.thumbnail,
      quality: type === 'audio' ? 'MP3' : format?.quality || '?',
      url: data.webpage_url,
    });

    showToast(
      type === 'audio' ? 'MP3 download started!' : `${format?.quality} download started!`,
      'success', '⬇'
    );
  };

  const handleDownloadAudio = () => {
    if (!videoData) return;
    triggerDownload(videoData, videoData.audioFormats?.[0], 'audio');
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(videoData?.webpage_url || url);
    showToast('URL copied!', 'info', '⎘');
  };

  // ── Pill toggle ────────────────────────────────────────
  const Pill = ({ label, active, onClick }) => (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 7,
      background: active ? 'var(--accent-dim)' : 'var(--surface2)',
      border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
      color: active ? 'var(--accent)' : 'var(--text-2)',
      borderRadius: 8, padding: '7px 13px',
      fontFamily: 'Syne, sans-serif', fontSize: '.77rem', fontWeight: 600,
      cursor: 'pointer', transition: 'all .2s', userSelect: 'none',
    }}>
      <span style={{
        width: 7, height: 7, borderRadius: '50%',
        background: active ? 'var(--accent)' : 'var(--text-4)',
        boxShadow: active ? '0 0 8px var(--accent)' : 'none',
        transition: 'all .2s', flexShrink: 0,
      }} />
      {label}
    </button>
  );

  // ─────────────────────────────────────────────────────
  return (
    <>
      {/* Background */}
      <div style={s.bgGrid} />
      <div style={s.bgOrb('rgba(91,114,248,.07)', 550, '-200px', undefined, '-150px', undefined)} />
      <div style={s.bgOrb('rgba(168,85,247,.055)', 480, undefined, '-100px', undefined, '-180px')} />
      <div style={s.bgOrb('rgba(6,214,160,.04)', 280, '45%', '48%', undefined, undefined)} />

      <div style={s.wrapper}>

        {/* ── NAV ── */}
        <nav style={s.nav}>
          <div style={s.logoWrap}>
            <div style={s.logoIcon}>▶</div>
            <span style={s.logoText}>
              FB<span style={{ color: 'var(--accent)' }}>Drop</span>
            </span>
          </div>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace', fontSize: '.62rem',
            padding: '4px 12px', background: 'var(--surface2)',
            border: '1px solid var(--border)', borderRadius: 99,
            color: 'var(--text-3)', letterSpacing: '.08em',
          }}>
            v2.7.0 · NEXT.JS
          </div>
        </nav>

        {/* ── HERO ── */}
        <section style={s.hero}>
          <div style={s.heroTag}>
            <div style={s.heroTagDot} />
            FREE · NO LOGIN · NO WATERMARK
          </div>
          <h1 style={s.h1}>
            Download <em style={s.h1Accent}>Facebook</em><br />
            Videos &amp; Reels
          </h1>
          <p style={s.heroSub}>
            Paste any public Facebook video or Reels URL and grab it in HD, SD, or audio-only — instant, free, and private.
          </p>
        </section>

        {/* ── MAIN CARD ── */}
        <div style={s.card}>
          <div style={s.cardGlow} />
          <div className="label" style={{ marginBottom: 12 }}>// paste video url</div>

          {/* Input row */}
          <div style={{
            display: 'flex', gap: 8, alignItems: 'stretch',
            background: 'var(--bg)', border: '1.5px solid var(--border)',
            borderRadius: 'var(--r-md)', padding: '5px 5px 5px 14px',
            transition: 'border-color .2s, box-shadow .2s',
          }}
            onFocusCapture={e => {
              e.currentTarget.style.borderColor = 'var(--accent)';
              e.currentTarget.style.boxShadow = '0 0 0 4px rgba(91,114,248,.12)';
            }}
            onBlurCapture={e => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !loading && fetchVideo()}
              placeholder="https://www.facebook.com/watch?v=... or reel URL"
              spellCheck={false}
              autoComplete="off"
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                color: 'var(--text)', fontFamily: 'JetBrains Mono, monospace',
                fontSize: '.82rem', minWidth: 0, caretColor: 'var(--accent)',
              }}
            />
            <button onClick={handlePaste} style={{
              background: 'var(--surface2)', border: '1px solid var(--border)',
              color: 'var(--text-2)', fontFamily: 'Syne, sans-serif',
              fontSize: '.75rem', fontWeight: 600, padding: '8px 13px',
              borderRadius: 8, cursor: 'pointer', whiteSpace: 'nowrap',
              transition: 'all .2s', flexShrink: 0,
            }}>
              ⌘ Paste
            </button>
            <button
              onClick={fetchVideo}
              disabled={loading}
              style={{
                background: loading ? 'var(--surface3)' : 'linear-gradient(135deg, var(--accent), var(--accent2))',
                border: 'none', color: '#fff',
                fontFamily: 'Syne, sans-serif', fontSize: '.88rem', fontWeight: 700,
                padding: '10px 22px', borderRadius: 9, cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 4px 18px var(--glow)',
                transition: 'all .2s', whiteSpace: 'nowrap', flexShrink: 0,
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              {loading
                ? <><span style={{ width:14,height:14,border:'2px solid rgba(255,255,255,.25)',borderTopColor:'white',borderRadius:'50%',animation:'spin .7s linear infinite',display:'inline-block'}}></span> Analyzing</>
                : 'Analyze →'
              }
            </button>
          </div>

          {/* Options pills */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
            <Pill label="HD Priority"    active={optHd}    onClick={() => setOptHd(v => !v)} />
            <Pill label="Audio Only"     active={optAudio} onClick={() => setOptAudio(v => !v)} />
            <Pill label="Auto Download"  active={optAuto}  onClick={() => setOptAuto(v => !v)} />
            <Pill label="Reels Support"  active={true}     onClick={() => {}} />
          </div>

          {/* Progress */}
          {loading && (
            <ProgressSteps activeStep={phase} pct={pct} statusText={statusText} />
          )}

          {/* ── RESULT PANEL ── */}
          {videoData && !loading && (
            <div style={{ marginTop: 24, animation: 'slideDown .4s var(--ease-spring) both' }}>
              {/* Video preview */}
              <div style={{
                display: 'flex', gap: 18, alignItems: 'flex-start',
                background: 'var(--bg)', border: '1px solid var(--border)',
                borderRadius: 'var(--r-md)', padding: 16, marginBottom: 20,
              }}>
                {/* Thumbnail */}
                <div
                  onClick={() => setPreviewOpen(true)}
                  style={{
                    position: 'relative', flexShrink: 0,
                    width: 160, height: 90, borderRadius: 8,
                    overflow: 'hidden', background: 'var(--surface2)',
                    cursor: 'pointer',
                  }}
                >
                  {videoData.thumbnail && (
                    <img src={videoData.thumbnail} alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  )}
                  <div style={{
                    position: 'absolute', inset: 0, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(0,0,0,.45)',
                  }}>
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="white" opacity=".9">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                  {videoData.isReel && (
                    <div style={{
                      position: 'absolute', top: 6, left: 6,
                      background: 'linear-gradient(135deg,var(--accent),var(--accent2))',
                      color: '#fff', fontFamily: 'JetBrains Mono,monospace',
                      fontSize: '.5rem', fontWeight: 700, padding: '2px 6px',
                      borderRadius: 99, letterSpacing: '.05em',
                    }}>REEL</div>
                  )}
                </div>

                {/* Meta */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '.92rem', fontWeight: 700, lineHeight: 1.4, marginBottom: 8 }}>
                    {videoData.title}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                    {[
                      `⏱ ${videoData.durationStr}`,
                      videoData.viewCount ? `👁 ${(videoData.viewCount/1000).toFixed(0)}K views` : null,
                      videoData.uploader,
                      'MP4 · H.264',
                      'AAC Audio',
                    ].filter(Boolean).map(tag => (
                      <span key={tag} style={{
                        fontFamily: 'JetBrains Mono,monospace', fontSize: '.6rem',
                        padding: '3px 9px', borderRadius: 99,
                        border: '1px solid var(--border)', color: 'var(--text-3)',
                      }}>{tag}</span>
                    ))}
                  </div>
                  <button onClick={copyUrl} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: 'transparent', border: '1.5px solid var(--border)',
                    color: 'var(--text-2)', fontFamily: 'Syne,sans-serif',
                    fontSize: '.75rem', fontWeight: 600, padding: '7px 13px',
                    borderRadius: 7, cursor: 'pointer', transition: 'all .2s',
                  }}>
                    ⎘ Copy Link
                  </button>
                </div>
              </div>

              {/* Quality grid */}
              <div className="label" style={{ marginBottom: 12 }}>SELECT QUALITY</div>
              <QualityGrid
                formats={videoData.formats}
                videoUrl={videoData.webpage_url}
                videoTitle={videoData.title}
                onDownload={(type, fmt) => {
                  addHistory({ title: videoData.title, thumbnail: videoData.thumbnail, quality: fmt?.quality || type, url: videoData.webpage_url });
                }}
              />

              {/* Audio section */}
              <div style={{ marginTop: 20 }}>
                <div className="label" style={{ marginBottom: 10 }}>AUDIO ONLY</div>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: 'var(--surface2)', border: '1px solid var(--border)',
                  borderRadius: 'var(--r-md)', padding: '13px 16px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 8,
                      background: 'linear-gradient(135deg,rgba(168,85,247,.2),rgba(91,114,248,.2))',
                      border: '1px solid rgba(168,85,247,.3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem',
                    }}>🎵</div>
                    <div>
                      <div style={{ fontSize: '.82rem', fontWeight: 700 }}>MP3 Audio Extract</div>
                      <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '.62rem', color: 'var(--text-3)', marginTop: 2 }}>
                        128kbps · {videoData.audioFormats?.[0]?.filesizeHuman || '~4–8 MB'} · No video track
                      </div>
                    </div>
                  </div>
                  <button onClick={handleDownloadAudio} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 7,
                    background: 'linear-gradient(135deg,var(--accent2),#7c3aed)',
                    border: 'none', color: '#fff',
                    fontFamily: 'Syne,sans-serif', fontSize: '.78rem', fontWeight: 700,
                    padding: '9px 16px', borderRadius: 8, cursor: 'pointer',
                    boxShadow: '0 4px 16px var(--glow2)', transition: 'all .2s',
                  }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 16l-6-6h4V4h4v6h4l-6 6zm-8 4h16v-2H4v2z"/></svg>
                    MP3
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── STATS BAR ── */}
        <div style={{
          display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap',
          padding: '18px 0', borderTop: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)', marginBottom: 48,
          animation: 'fadeUp .6s .3s both',
        }}>
          {[
            { num: history.length, label: 'DOWNLOADS' },
            { num: 'HD', label: 'MAX QUALITY' },
            { num: '4+', label: 'RESOLUTIONS' },
            { num: '100%', label: 'FREE FOREVER' },
          ].map(stat => (
            <div key={stat.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent)' }}>{stat.num}</div>
              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '.6rem', color: 'var(--text-3)', letterSpacing: '.1em', marginTop: 2 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* ── HISTORY ── */}
        <div style={{ marginBottom: 48 }}>
          <HistoryPanel
            items={history}
            onClear={clearHistory}
            onReuse={item => { setUrl(item.url); showToast('URL loaded — click Analyze', 'info', '↩'); }}
          />
        </div>

        {/* ── TIPS ── */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 12, marginBottom: 60, animation: 'fadeUp .6s .5s both',
        }}>
          {[
            { icon: '🎬', title: 'Videos & Reels', body: 'Supports public videos, Reels, Watch pages, and group posts. Private content requires the owner\'s cookies.' },
            { icon: '⚡', title: 'Direct Streaming', body: 'No re-encoding. We pipe the original stream from Facebook\'s CDN directly to your browser.' },
            { icon: '🔒', title: 'Your Privacy', body: 'URLs are never stored. All processing is ephemeral server-side — nothing is logged or retained.' },
          ].map(tip => (
            <div key={tip.title} style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--r-lg)', padding: '18px 20px',
            }}>
              <div style={{ fontSize: '1.4rem', marginBottom: 10 }}>{tip.icon}</div>
              <div style={{ fontSize: '.85rem', fontWeight: 700, marginBottom: 6 }}>{tip.title}</div>
              <div style={{ fontSize: '.78rem', color: 'var(--text-2)', lineHeight: 1.65 }}>{tip.body}</div>
            </div>
          ))}
        </div>

        {/* ── FOOTER ── */}
        <footer style={{
          textAlign: 'center', borderTop: '1px solid var(--border)',
          paddingTop: 28, fontFamily: 'JetBrains Mono,monospace',
          fontSize: '.65rem', color: 'var(--text-4)', lineHeight: 1.9,
          animation: 'fadeUp .6s .6s both',
        }}>
          <p><span style={{ color: 'var(--text-3)' }}>FBDrop</span> — For personal & backup use only. Respect copyright laws.</p>
          <p>Not affiliated with Meta Platforms, Inc. · Built with Next.js 14 + yt-dlp</p>
        </footer>
      </div>

      {/* ── VIDEO PREVIEW MODAL ── */}
      {previewOpen && videoData && (
        <div
          onClick={() => setPreviewOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 999,
            background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20, animation: 'fadeIn .2s both',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 20, maxWidth: 600, width: '100%', padding: 28,
              position: 'relative', animation: 'slideDown .3s var(--ease-spring) both',
            }}
          >
            <button
              onClick={() => setPreviewOpen(false)}
              style={{
                position: 'absolute', top: 14, right: 14,
                background: 'var(--surface2)', border: '1px solid var(--border)',
                color: 'var(--text-3)', width: 28, height: 28,
                borderRadius: 6, cursor: 'pointer', fontSize: '1rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all .2s',
              }}
            >✕</button>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 16 }}>📽 Preview</h3>
            <div style={{
              background: '#000', borderRadius: 10, overflow: 'hidden',
              aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <img src={videoData.thumbnail} alt="preview"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <p style={{ marginTop: 14, fontSize: '.8rem', color: 'var(--text-2)', lineHeight: 1.5 }}>
              {videoData.title}
            </p>
          </div>
        </div>
      )}

      <Toast />
    </>
  );
}
