'use client';

const STEPS = [
  { id: 'validate', label: 'Validate URL' },
  { id: 'connect',  label: 'Connect' },
  { id: 'fetch',    label: 'Fetch Meta' },
  { id: 'extract',  label: 'Extract Streams' },
  { id: 'parse',    label: 'Parse Quality' },
];

export default function ProgressSteps({ activeStep, pct, statusText }) {
  const activeIdx = STEPS.findIndex(s => s.id === activeStep);

  return (
    <div style={{ marginTop: 24 }}>
      {/* Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: '.8rem', color: 'var(--text-2)', fontWeight: 600 }}>
          {statusText}
        </span>
        <span style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: '.75rem',
          color: 'var(--accent)', fontWeight: 700,
        }}>{pct}%</span>
      </div>

      <div style={{
        height: 5, background: 'var(--surface3)', borderRadius: 99,
        overflow: 'hidden', border: '1px solid var(--border)',
        marginBottom: 14,
      }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: 'linear-gradient(90deg, var(--accent), var(--accent2))',
          borderRadius: 99, transition: 'width .4s var(--ease-out)',
          boxShadow: '0 0 12px var(--glow)',
          position: 'relative',
        }}>
          {pct > 0 && pct < 100 && (
            <div style={{
              position: 'absolute', right: -1, top: '50%', transform: 'translateY(-50%)',
              width: 11, height: 11, borderRadius: '50%',
              background: '#fff', boxShadow: '0 0 8px var(--glow)',
            }} />
          )}
        </div>
      </div>

      {/* Step chips */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {STEPS.map((step, i) => {
          const done   = i < activeIdx;
          const active = i === activeIdx;
          return (
            <span key={step.id} style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '.62rem', letterSpacing: '.05em',
              padding: '3px 10px', borderRadius: 99,
              border: `1px solid ${done ? 'var(--accent3)' : active ? 'var(--accent)' : 'var(--border)'}`,
              color: done ? 'var(--accent3)' : active ? 'var(--accent)' : 'var(--text-4)',
              background: done ? 'var(--accent3-dim)' : active ? 'var(--accent-dim)' : 'transparent',
              animation: active ? 'progressPulse 1.4s infinite' : 'none',
              transition: 'all .3s',
            }}>
              {done ? '✓ ' : ''}{step.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
