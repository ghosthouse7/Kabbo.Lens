import { useEffect, useState } from 'react';

export default function LandingPage({ onEnter }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--ink)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Grain overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: 'var(--grain)',
        animation: 'grain-shift 0.12s steps(1) infinite',
        opacity: 0.6,
      }} />

      {/* Ambient orbs */}
      {[
        { w: 480, h: 320, top: '10%', left: '5%', dur: '18s', color: 'rgba(212,168,75,0.06)' },
        { w: 360, h: 360, top: '55%', right: '8%', dur: '22s', color: 'rgba(180,120,40,0.04)' },
        { w: 280, h: 200, top: '30%', left: '60%', dur: '26s', color: 'rgba(212,168,75,0.03)' },
      ].map((orb, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: orb.w, height: orb.h,
          top: orb.top, left: orb.left, right: orb.right,
          borderRadius: '50%',
          background: orb.color,
          filter: 'blur(80px)',
          animation: `orb-drift ${orb.dur} ease-in-out infinite alternate`,
          animationDelay: `${i * 3}s`,
          pointerEvents: 'none', zIndex: 0,
        }} />
      ))}

      {/* Film perforations — left */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: '52px',
        background: '#0a0809',
        borderRight: '1px solid rgba(212,168,75,0.06)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: '0', paddingTop: '12px', zIndex: 1,
      }}>
        {Array.from({ length: 28 }).map((_, i) => (
          <div key={i} style={{
            width: '28px', height: '20px', flexShrink: 0, marginBottom: '8px',
            background: 'rgba(212,168,75,0.06)', borderRadius: '3px',
            border: '1px solid rgba(212,168,75,0.08)',
          }} />
        ))}
      </div>

      {/* Film perforations — right */}
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0, width: '52px',
        background: '#0a0809',
        borderLeft: '1px solid rgba(212,168,75,0.06)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: '0', paddingTop: '12px', zIndex: 1,
      }}>
        {Array.from({ length: 28 }).map((_, i) => (
          <div key={i} style={{
            width: '28px', height: '20px', flexShrink: 0, marginBottom: '8px',
            background: 'rgba(212,168,75,0.06)', borderRadius: '3px',
            border: '1px solid rgba(212,168,75,0.08)',
          }} />
        ))}
      </div>

      {/* Main content */}
      <div style={{
        position: 'relative', zIndex: 2,
        textAlign: 'center',
        padding: '0 80px',
        maxWidth: '780px',
        opacity: ready ? 1 : 0,
        transition: 'opacity 0.8s ease',
      }}>

        {/* Spinning reel */}
        <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'center' }}>
          <svg width="72" height="72" viewBox="0 0 72 72" style={{ animation: 'reel-spin 8s linear infinite' }}>
            <circle cx="36" cy="36" r="30" stroke="rgba(212,168,75,0.12)" strokeWidth="1.5" fill="none"/>
            <circle cx="36" cy="36" r="30" stroke="var(--gold)" strokeWidth="1.5" fill="none"
              strokeDasharray="22 167" strokeLinecap="round"/>
            <circle cx="36" cy="36" r="10" fill="rgba(212,168,75,0.08)" stroke="rgba(212,168,75,0.2)" strokeWidth="1"/>
            <circle cx="36" cy="36" r="4" fill="var(--gold)" opacity="0.6"/>
            {[0, 60, 120, 180, 240, 300].map((deg, i) => {
              const rad = (deg * Math.PI) / 180;
              const x = 36 + 22 * Math.cos(rad);
              const y = 36 + 22 * Math.sin(rad);
              return <circle key={i} cx={x} cy={y} r="3" fill="rgba(212,168,75,0.3)"/>;
            })}
          </svg>
        </div>

        {/* Label */}
        <div className="label" style={{
          fontSize: '8px', letterSpacing: '0.4em',
          marginBottom: '18px', color: 'var(--gold-dim)',
          animation: 'landing-reveal 0.8s ease 0.2s both',
        }}>
          Tradition Hacks 2026 · Cultural Memory Engine
        </div>

        {/* Title */}
        <h1 style={{
          fontFamily: 'var(--font-cinzel)',
          fontSize: 'clamp(52px, 8vw, 92px)',
          fontWeight: 400,
          letterSpacing: '0.06em',
          color: 'var(--cream)',
          lineHeight: 1.05,
          marginBottom: '10px',
          animation: 'landing-reveal 0.8s ease 0.35s both',
        }}>
          Kabbo
          <span style={{ color: 'var(--gold)', fontStyle: 'italic' }}>.Lens</span>
        </h1>

        {/* Tagline */}
        <p style={{
          fontFamily: 'var(--font-display)',
          fontStyle: 'italic',
          fontWeight: 300,
          fontSize: 'clamp(16px, 2.5vw, 22px)',
          color: 'var(--cream-faint)',
          marginBottom: '48px',
          lineHeight: 1.6,
          animation: 'landing-reveal 0.8s ease 0.5s both',
        }}>
          Upload a Kolkata photograph.<br/>
          Watch it become a poem, a script, a memory.
        </p>

        {/* Divider */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '16px',
          marginBottom: '48px',
          animation: 'landing-reveal 0.8s ease 0.6s both',
        }}>
          <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, var(--border-mid))' }} />
          <div style={{ display: 'flex', gap: '4px' }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{
                width: '6px', height: '10px', borderRadius: '1px',
                background: i % 2 === 0 ? 'rgba(212,168,75,0.2)' : 'transparent',
                border: '1px solid rgba(212,168,75,0.12)',
              }} />
            ))}
          </div>
          <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, var(--border-mid), transparent)' }} />
        </div>

        {/* CTA */}
        <button
          onClick={onEnter}
          style={{
            fontFamily: 'var(--font-cinzel)',
            fontSize: '12px',
            letterSpacing: '0.28em',
            fontWeight: 400,
            color: 'var(--gold)',
            background: 'var(--gold-faint)',
            border: '1px solid var(--border-mid)',
            borderRadius: 'var(--radius-sm)',
            padding: '16px 48px',
            cursor: 'pointer',
            transition: 'var(--transition)',
            animation: 'landing-reveal 0.8s ease 0.75s both',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(212,168,75,0.14)';
            e.currentTarget.style.borderColor = 'var(--border-hi)';
            e.currentTarget.style.boxShadow = '0 0 32px rgba(212,168,75,0.15)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'var(--gold-faint)';
            e.currentTarget.style.borderColor = 'var(--border-mid)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          Enter the Studio
        </button>

        {/* Feature labels */}
        <div style={{
          display: 'flex', justifyContent: 'center', gap: '32px',
          marginTop: '48px', flexWrap: 'wrap',
          animation: 'landing-reveal 0.8s ease 0.9s both',
        }}>
          {['AI Vision Analysis', 'Ambient Soundscapes', 'Heritage Map', 'Miro Export', 'PDF Zine'].map(f => (
            <div key={f} className="label" style={{ fontSize: '7px', color: 'var(--smoke)', letterSpacing: '0.2em' }}>
              {f}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}