export default function Hero() {
  return (
    <div style={{
      textAlign: 'center',
      padding: '56px 32px 32px',
      position: 'relative', zIndex: 1,
    }}>
      <div className="label" style={{ marginBottom: '14px', fontSize: '7px', letterSpacing: '0.4em' }}>
        Kolkata · 1947 – Present · Cultural Memory Engine
      </div>
      <h1 style={{
        fontFamily: 'var(--font-display)',
        fontStyle: 'italic',
        fontWeight: 300,
        fontSize: 'clamp(28px, 4vw, 48px)',
        color: 'var(--cream)',
        lineHeight: 1.2,
        letterSpacing: '-0.01em',
        marginBottom: '10px',
      }}>
        Every photograph holds a story<br />
        <span style={{ color: 'var(--gold)' }}>waiting to be told.</span>
      </h1>
      <p className="mono" style={{ fontSize: '10px', color: 'var(--ash)', letterSpacing: '0.08em' }}>
        Upload an image · Choose your form · Watch Kolkata speak
      </p>

      {/* Decorative rule */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        maxWidth: '320px', margin: '22px auto 0',
      }}>
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, var(--border))' }} />
        <div style={{ display: 'flex', gap: '3px' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{
              width: '6px', height: '8px', borderRadius: '1px',
              background: i % 2 === 0 ? 'rgba(212,168,75,0.15)' : 'transparent',
              border: '1px solid rgba(212,168,75,0.08)',
            }} />
          ))}
        </div>
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, var(--border), transparent)' }} />
      </div>
    </div>
  );
}