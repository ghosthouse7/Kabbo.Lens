import { useEffect, useState, useRef } from 'react';

function useMouseParallax() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const handler = (e) => {
      setPos({
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      });
    };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);
  return pos;
}

function FloatingOrb({ x, y, size, color, blur, depth, delay }) {
  return (
    <div style={{
      position: 'absolute',
      width: size, height: size,
      left: `${x}%`, top: `${y}%`,
      borderRadius: '50%',
      background: color,
      filter: `blur(${blur}px)`,
      transform: `translate(-50%, -50%)`,
      animation: `orbFloat ${6 + depth}s ease-in-out ${delay}s infinite alternate`,
      pointerEvents: 'none',
      zIndex: 0,
    }} />
  );
}

function GlyphGrid() {
  const glyphs = ['✦', '◈', '⟐', '✧', '◇', '⬡', '◈', '✦', '⟐', '✧', '◇', '⬡'];
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none',
    }}>
      {glyphs.map((g, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${8 + (i % 4) * 28}%`,
          top: `${10 + Math.floor(i / 4) * 38}%`,
          fontSize: `${10 + (i % 3) * 4}px`,
          color: 'rgba(212,168,75,0.05)',
          animation: `glyphDrift ${8 + i * 1.3}s ease-in-out ${i * 0.4}s infinite alternate`,
          fontFamily: 'sans-serif',
          userSelect: 'none',
        }}>{g}</div>
      ))}
    </div>
  );
}

function ScanlineOverlay() {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
      background: `repeating-linear-gradient(
        0deg,
        transparent 0px,
        transparent 2px,
        rgba(0,0,0,0.03) 2px,
        rgba(0,0,0,0.03) 4px
      )`,
    }} />
  );
}

function StatPill({ value, label, delay }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 1200 + delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
      opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(12px)',
      transition: 'all 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
    }}>
      <span style={{
        fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 300, letterSpacing: '-0.02em',
        fontFamily: "'DM Mono', monospace", color: '#d4a84b',
        textShadow: '0 0 30px rgba(212,168,75,0.3)',
      }}>{value}</span>
      <span style={{
        fontSize: 9, letterSpacing: '0.25em', textTransform: 'uppercase',
        fontFamily: "'DM Mono', monospace", color: 'rgba(244,239,228,0.3)',
      }}>{label}</span>
    </div>
  );
}

function FeatureCard({ icon, title, desc, delay }) {
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 1600 + delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '28px 24px', borderRadius: 12,
        border: `1px solid ${hovered ? 'rgba(212,168,75,0.3)' : 'rgba(212,168,75,0.08)'}`,
        background: hovered
          ? 'linear-gradient(135deg, rgba(212,168,75,0.08), rgba(28,48,36,0.6))'
          : 'rgba(15,12,10,0.4)',
        backdropFilter: 'blur(20px)',
        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        cursor: 'default',
        transform: visible ? (hovered ? 'translateY(-6px)' : 'translateY(0)') : 'translateY(20px)',
        opacity: visible ? 1 : 0,
        boxShadow: hovered ? '0 24px 60px rgba(0,0,0,0.5), 0 0 40px rgba(212,168,75,0.06)' : '0 4px 20px rgba(0,0,0,0.3)',
      }}
    >
      <div style={{
        fontSize: 22, marginBottom: 14,
        filter: hovered ? 'none' : 'grayscale(0.3)',
        transition: 'all 0.3s ease',
      }}>{icon}</div>
      <div style={{
        fontSize: 13, fontWeight: 600, letterSpacing: '0.05em',
        fontFamily: "'Cinzel', serif", color: hovered ? '#d4a84b' : '#f4efe4',
        marginBottom: 10, transition: 'color 0.3s ease',
      }}>{title}</div>
      <div style={{
        fontSize: 13, lineHeight: 1.7, color: 'rgba(244,239,228,0.45)',
        fontFamily: "'Cormorant Garamond', serif",
      }}>{desc}</div>
    </div>
  );
}

export default function LandingPage({ onEnter }) {
  const [phase, setPhase] = useState(0); // 0=loading, 1=reveal
  const mouse = useMouseParallax();

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 200);
    return () => clearTimeout(t1);
  }, []);

  const parallaxStyle = (depth) => ({
    transform: `translate(${mouse.x * depth}px, ${mouse.y * depth}px)`,
    transition: 'transform 0.1s ease-out',
  });

  return (
    <div style={{
      minHeight: '100vh', position: 'relative', overflow: 'hidden',
      background: '#08060a',
      display: 'flex', flexDirection: 'column',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Mono:wght@300;400&family=Cinzel:wght@400;600&display=swap');

        @keyframes orbFloat {
          from { transform: translate(-50%, -50%) scale(0.97); }
          to   { transform: translate(-50%, -48%) scale(1.03); }
        }
        @keyframes glyphDrift {
          from { opacity: 0.03; transform: translateY(0px) rotate(0deg); }
          to   { opacity: 0.07; transform: translateY(-12px) rotate(8deg); }
        }
        @keyframes heroReveal {
          from { opacity: 0; transform: translateY(30px) scale(0.97); filter: blur(4px); }
          to   { opacity: 1; transform: translateY(0) scale(1);    filter: blur(0); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes lineDraw {
          from { scaleX: 0; }
          to   { scaleX: 1; }
        }
        @keyframes borderGlow {
          0%, 100% { border-color: rgba(212,168,75,0.2); box-shadow: 0 0 0 rgba(212,168,75,0); }
          50%       { border-color: rgba(212,168,75,0.5); box-shadow: 0 0 30px rgba(212,168,75,0.08); }
        }
        @keyframes scrollIndicator {
          0%   { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(8px); opacity: 0; }
        }
        @keyframes reelSpin {
          to { transform: rotate(360deg); }
        }
        @keyframes logoGlow {
          0%, 100% { text-shadow: 0 0 40px rgba(212,168,75,0.2), 0 2px 60px rgba(0,0,0,0.9); }
          50%       { text-shadow: 0 0 80px rgba(212,168,75,0.35), 0 2px 60px rgba(0,0,0,0.9); }
        }
        @keyframes ctaShimmer {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        @keyframes navFade {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .cta-btn-inner {
          background: linear-gradient(90deg, rgba(212,168,75,0.12) 0%, rgba(212,168,75,0.22) 40%, rgba(212,168,75,0.12) 100%);
          background-size: 200%;
          transition: all 0.4s ease;
        }
        .cta-btn-inner:hover {
          background-position: right;
          animation: ctaShimmer 2s linear infinite;
          border-color: rgba(212,168,75,0.6) !important;
          box-shadow: 0 0 60px rgba(212,168,75,0.2), 0 20px 40px rgba(0,0,0,0.5) !important;
          transform: translateY(-2px) !important;
        }
        .secondary-btn:hover {
          color: #f4efe4 !important;
          border-color: rgba(244,239,228,0.3) !important;
        }
        .nav-link:hover { color: #d4a84b !important; }
      `}</style>

      {/* Deep background gradient layers */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, ...parallaxStyle(-4) }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: `
            radial-gradient(ellipse 80% 60% at 20% 50%, rgba(212,168,75,0.04) 0%, transparent 60%),
            radial-gradient(ellipse 60% 80% at 80% 30%, rgba(40,80,55,0.08) 0%, transparent 60%),
            radial-gradient(ellipse 100% 50% at 50% 100%, rgba(60,15,15,0.15) 0%, transparent 60%)
          `,
        }} />
      </div>

      {/* Ambient orbs */}
      <div style={{ ...parallaxStyle(-8) }}>
        <FloatingOrb x={15} y={25} size={600} color="rgba(212,168,75,0.03)" blur={120} depth={3} delay={0} />
        <FloatingOrb x={85} y={60} size={500} color="rgba(40,80,55,0.05)" blur={100} depth={5} delay={2} />
        <FloatingOrb x={50} y={85} size={400} color="rgba(100,30,30,0.04)" blur={80} depth={4} delay={1} />
        <FloatingOrb x={70} y={10} size={300} color="rgba(212,168,75,0.025)" blur={80} depth={2} delay={3} />
      </div>

      <GlyphGrid />
      <ScanlineOverlay />

      {/* Vignette */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)',
      }} />

      {/* NAV */}
      <nav style={{
        position: 'relative', zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '24px 48px',
        borderBottom: '1px solid rgba(212,168,75,0.06)',
        animation: 'navFade 0.8s ease 0.1s both',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Mini reel logo mark */}
          <svg width="24" height="24" viewBox="0 0 24 24" style={{ animation: 'reelSpin 12s linear infinite' }}>
            <circle cx="12" cy="12" r="10" stroke="rgba(212,168,75,0.5)" strokeWidth="1" fill="none" strokeDasharray="6 4" />
            <circle cx="12" cy="12" r="3" fill="rgba(212,168,75,0.6)" />
          </svg>
          <span style={{
            fontFamily: "'Cinzel', serif", fontSize: 15, letterSpacing: '0.1em',
            color: '#f4efe4', fontWeight: 400,
          }}>Kabbo<span style={{ color: '#d4a84b', fontStyle: 'italic' }}>.Lens</span></span>
        </div>
        <div style={{ display: 'flex', gap: 36, alignItems: 'center' }}>
          {['Features', 'Gallery', 'About'].map(l => (
            <span key={l} className="nav-link" style={{
              fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.2em',
              textTransform: 'uppercase', color: 'rgba(244,239,228,0.4)', cursor: 'pointer',
              transition: 'color 0.2s ease',
            }}>{l}</span>
          ))}
        </div>
        <div style={{
          fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: '0.2em',
          textTransform: 'uppercase', color: 'rgba(212,168,75,0.5)',
          padding: '8px 16px', border: '1px solid rgba(212,168,75,0.2)',
          borderRadius: 4, cursor: 'pointer',
          animation: 'borderGlow 4s ease-in-out infinite',
        }}>TraditionHacks 2026</div>
      </nav>

      {/* HERO */}
      <main style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '80px 48px 60px', position: 'relative', zIndex: 5, textAlign: 'center',
      }}>

        {/* Eyebrow badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          padding: '8px 20px', borderRadius: 100,
          border: '1px solid rgba(212,168,75,0.2)',
          background: 'rgba(212,168,75,0.04)',
          marginBottom: 48,
          animation: 'fadeSlideUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.3s both',
          backdropFilter: 'blur(12px)',
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%', background: '#d4a84b',
            boxShadow: '0 0 8px rgba(212,168,75,0.8)',
            animation: 'scrollIndicator 1s ease infinite alternate',
          }} />
          <span style={{
            fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: '0.3em',
            textTransform: 'uppercase', color: 'rgba(212,168,75,0.7)',
          }}>Cultural Memory Engine · Kolkata 2026</span>
        </div>

        {/* Main headline — BIG */}
        <h1 style={{
          fontFamily: "'Cinzel', serif", fontWeight: 400,
          fontSize: 'clamp(56px, 10vw, 120px)',
          letterSpacing: '-0.01em', lineHeight: 0.95,
          color: '#f4efe4',
          marginBottom: 8,
          animation: 'heroReveal 1s cubic-bezier(0.16,1,0.3,1) 0.5s both',
          animation: 'logoGlow 4s ease-in-out 1.5s infinite',
          textShadow: '0 0 40px rgba(212,168,75,0.2), 0 2px 60px rgba(0,0,0,0.9)',
        }}>
          Kabbo
        </h1>
        <h1 style={{
          fontFamily: "'Cormorant Garamond', serif", fontWeight: 300,
          fontSize: 'clamp(56px, 10vw, 120px)',
          letterSpacing: '0.05em', lineHeight: 0.95,
          fontStyle: 'italic',
          color: '#d4a84b',
          marginBottom: 48,
          animation: 'heroReveal 1s cubic-bezier(0.16,1,0.3,1) 0.65s both',
          textShadow: '0 0 60px rgba(212,168,75,0.25), 0 2px 80px rgba(0,0,0,0.9)',
        }}>
          .Lens
        </h1>

        {/* Sub */}
        <p style={{
          fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontWeight: 300,
          fontSize: 'clamp(18px, 2.5vw, 26px)', color: 'rgba(244,239,228,0.5)',
          maxWidth: 520, lineHeight: 1.65, marginBottom: 60,
          animation: 'fadeSlideUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.85s both',
        }}>
          Drop a photograph from Kolkata's streets.<br />
          Receive a poem, a film script, a living memory.
        </p>

        {/* CTA group */}
        <div style={{
          display: 'flex', gap: 16, alignItems: 'center',
          animation: 'fadeSlideUp 0.8s cubic-bezier(0.16,1,0.3,1) 1s both',
        }}>
          <button
            onClick={onEnter}
            className="cta-btn-inner"
            style={{
              fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: '0.25em', fontWeight: 400,
              color: '#d4a84b', padding: '18px 52px', cursor: 'pointer',
              border: '1px solid rgba(212,168,75,0.35)', borderRadius: 6,
              transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >Open the Studio</button>
          <button
            className="secondary-btn"
            style={{
              fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: '0.2em',
              textTransform: 'uppercase', color: 'rgba(244,239,228,0.35)',
              padding: '18px 32px', cursor: 'pointer',
              border: '1px solid rgba(244,239,228,0.1)', borderRadius: 6,
              background: 'transparent', transition: 'all 0.3s ease',
            }}
          >Watch Demo ↗</button>
        </div>

        {/* Divider */}
        <div style={{
          width: '100%', maxWidth: 640, margin: '80px auto 0',
          display: 'flex', alignItems: 'center', gap: 24,
          animation: 'fadeSlideUp 0.8s ease 1.2s both',
        }}>
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, rgba(212,168,75,0.15))' }} />
          <span style={{
            fontFamily: "'DM Mono', monospace", fontSize: 8, letterSpacing: '0.3em',
            color: 'rgba(212,168,75,0.25)', textTransform: 'uppercase',
          }}>Est. 2026</span>
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(212,168,75,0.15), transparent)' }} />
        </div>

        {/* Stats row */}
        <div style={{
          display: 'flex', gap: 'clamp(32px, 6vw, 80px)', marginTop: 48, justifyContent: 'center',
        }}>
          <StatPill value="∞" label="Photographs" delay={0} />
          <div style={{ width: 1, background: 'rgba(244,239,228,0.08)', alignSelf: 'stretch' }} />
          <StatPill value="7" label="AI Lenses" delay={100} />
          <div style={{ width: 1, background: 'rgba(244,239,228,0.08)', alignSelf: 'stretch' }} />
          <StatPill value="9min" label="Avg. Generation" delay={200} />
          <div style={{ width: 1, background: 'rgba(244,239,228,0.08)', alignSelf: 'stretch' }} />
          <StatPill value="PDF" label="Zine Export" delay={300} />
        </div>
      </main>

      {/* FEATURE CARDS */}
      <section style={{
        position: 'relative', zIndex: 5,
        padding: 'clamp(40px, 6vw, 80px) clamp(24px, 6vw, 80px)',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16, maxWidth: 1100, margin: '0 auto', width: '100%',
      }}>
        {[
          { icon: '🔭', title: 'Vision Analysis', desc: 'Claude reads light, texture, and mood from every pixel of your Kolkata frame.', delay: 0 },
          { icon: '🎞️', title: 'Film Script', desc: 'Transform a still into a full scene breakdown with era, dialogue direction, and atmosphere.', delay: 80 },
          { icon: '📖', title: 'Memory Poem', desc: 'Receive a verse in Bengali and English that honors the weight of what your lens captured.', delay: 160 },
          { icon: '🗺️', title: 'Heritage Map', desc: "Pin your photograph to Kolkata's living cartography — colonial, partition, present.", delay: 240 },
          { icon: '🎵', title: 'Soundscape', desc: 'Ambient audio generated from visual cues: tram bells, monsoon, bazaar.', delay: 320 },
        ].map(f => <FeatureCard key={f.title} {...f} />)}
      </section>

      {/* FOOTER strip */}
      <footer style={{
        position: 'relative', zIndex: 5,
        borderTop: '1px solid rgba(212,168,75,0.06)',
        padding: '24px 48px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{
          fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: '0.2em',
          textTransform: 'uppercase', color: 'rgba(244,239,228,0.15)',
        }}>Tradition Hacks 2026 · Cultural Memory Engine</span>
        {/* Scroll cue */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{
            width: 20, height: 32, border: '1px solid rgba(244,239,228,0.1)',
            borderRadius: 10, display: 'flex', justifyContent: 'center', paddingTop: 6,
          }}>
            <div style={{
              width: 2, height: 8, borderRadius: 1, background: 'rgba(212,168,75,0.5)',
              animation: 'scrollIndicator 1.4s ease-in-out infinite',
            }} />
          </div>
        </div>
        <span style={{
          fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: '0.2em',
          color: 'rgba(244,239,228,0.15)',
        }}>Kolkata · 22°N 88°E</span>
      </footer>
    </div>
  );
}