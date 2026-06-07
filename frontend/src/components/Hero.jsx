export default function Hero() {
  const features = [
    'Vision AI', 'Film Grain', 'Heritage Map',
    'Miro Boards', 'PDF Zine', 'Sound Layer',
  ];

  return (
    <div style={{
      padding: '80px 32px 64px',
      textAlign: 'center',
      borderBottom: '1px solid var(--border)',
      background: 'radial-gradient(ellipse 70% 60% at 50% -10%, rgba(214,179,106,0.05) 0%, transparent 70%)',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Decorative horizontal rule top */}
      <div style={{
        position: 'absolute',
        top: '28px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        opacity: 0.35,
      }}>
        <div style={{ width: '40px', height: '1px', background: 'var(--gold)' }} />
        <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--gold)' }} />
        <div style={{ width: '40px', height: '1px', background: 'var(--gold)' }} />
      </div>

      {/* Eyebrow */}
      <div className="label anim-fade-up" style={{ marginBottom: '22px' }}>
        Generative AI · Cultural Preservation · Kolkata
      </div>

      {/* Headline */}
      <h1 className="anim-fade-up delay-1" style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 300,
        fontSize: 'clamp(44px, 6.5vw, 82px)',
        letterSpacing: '-0.04em',
        lineHeight: 1.03,
        marginBottom: '20px',
        color: 'var(--cream)',
      }}>
        Every Photograph<br />
        <span style={{ fontStyle: 'italic', color: 'var(--gold)' }}>
          Contains a Forgotten Story.
        </span>
      </h1>

      {/* Subheading */}
      <p className="mono anim-fade-up delay-2" style={{
        fontSize: '12px',
        color: 'var(--cream-faint)',
        letterSpacing: '0.04em',
        lineHeight: 1.9,
        maxWidth: '500px',
        margin: '0 auto 36px',
      }}>
        Upload a Kolkata photograph. AI decodes its visual DNA and generates<br />
        film scripts, Bengali poetry, soundscapes — rooted in the city's soul.
      </p>

      {/* Feature pills */}
      <div className="anim-fade-up delay-3" style={{
        display: 'flex',
        gap: '8px',
        justifyContent: 'center',
        flexWrap: 'wrap',
      }}>
        {features.map((f, i) => (
          <span key={i} className="tag" style={{ animationDelay: `${0.3 + i * 0.05}s` }}>{f}</span>
        ))}
      </div>

      {/* Decorative bottom film strip */}
      <div style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        height: '3px',
        background: 'repeating-linear-gradient(90deg, transparent 0px 10px, rgba(214,179,106,0.2) 10px 20px)',
      }} />
    </div>
  );
}