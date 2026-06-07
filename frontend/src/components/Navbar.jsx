export default function Navbar({ tab, setTab }) {
  const tabs = [
    { id: 'studio',  label: 'Studio' },
    { id: 'map',     label: 'Heritage Map' },
    { id: 'archive', label: 'Archive' },
  ];

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      borderBottom: '1px solid var(--border)',
      background: 'rgba(9,8,10,0.92)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
    }}>
      <div style={{
        maxWidth: '1240px',
        margin: '0 auto',
        padding: '0 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '58px',
      }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Film perforations */}
          <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
            {[0,1,2,3,4].map(i => (
              <div key={i} style={{
                width: '5px',
                height: '8px',
                borderRadius: '1px',
                background: i % 2 === 0 ? 'rgba(214,179,106,0.5)' : 'rgba(214,179,106,0.2)',
                border: '1px solid rgba(214,179,106,0.3)',
              }} />
            ))}
          </div>

          <span style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 300, letterSpacing: '-0.02em', lineHeight: 1 }}>
            <span style={{ color: 'var(--gold)', fontStyle: 'italic' }}>Kabbo</span>
            <span style={{ color: 'rgba(244,239,228,0.2)' }}>.</span>
            <span style={{ color: 'var(--cream)' }}>Lens</span>
          </span>

          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '8px',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: 'rgba(214,179,106,0.3)',
            borderLeft: '1px solid var(--border)',
            paddingLeft: '14px',
            marginLeft: '2px',
          }}>
            Cultural Memory Engine
          </span>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '2px' }}>
          {tabs.map(t => (
            <button
              key={t.id}
              className={`btn btn-tab mono${tab === t.id ? ' active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Right — hackathon badge */}
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '8px',
          letterSpacing: '0.25em',
          textTransform: 'uppercase',
          color: 'rgba(214,179,106,0.25)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          padding: '4px 10px',
        }}>
          Tradition Hacks 2026
        </div>
      </div>
    </nav>
  );
}