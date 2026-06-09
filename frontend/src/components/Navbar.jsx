export default function Navbar({ tab, setTab }) {
  const tabs = [
    { id: 'studio',  label: 'Studio' },
    { id: 'map',     label: 'Heritage Map' },
    { id: 'archive', label: 'Archive' },
  ];

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      borderBottom: '1px solid var(--border)',
      background: 'rgba(9,8,10,0.88)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
    }}>
      <div style={{
        maxWidth: '1240px', margin: '0 auto',
        padding: '0 32px',
        display: 'flex', alignItems: 'center',
        height: '60px', gap: '40px',
      }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          {/* Mini reel */}
          <svg width="22" height="22" viewBox="0 0 22 22" style={{ flexShrink: 0 }}>
            <circle cx="11" cy="11" r="9" stroke="rgba(212,168,75,0.3)" strokeWidth="1" fill="rgba(212,168,75,0.05)"/>
            <circle cx="11" cy="11" r="9" stroke="var(--gold)" strokeWidth="1" fill="none"
              strokeDasharray="8 49" strokeLinecap="round"/>
            <circle cx="11" cy="11" r="3" fill="rgba(212,168,75,0.2)"/>
            <circle cx="11" cy="11" r="1.5" fill="var(--gold)"/>
          </svg>
          <span style={{
            fontFamily: 'var(--font-cinzel)',
            fontSize: '16px',
            fontWeight: 400,
            letterSpacing: '0.08em',
            color: 'var(--cream)',
          }}>
            Kabbo<span style={{ color: 'var(--gold)', fontStyle: 'italic' }}>.Lens</span>
          </span>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '2px', flex: 1 }}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="btn"
              style={{
                fontSize: '8px',
                letterSpacing: '0.2em',
                padding: '7px 16px',
                borderColor: tab === t.id ? 'var(--border-mid)' : 'transparent',
                color: tab === t.id ? 'var(--gold)' : 'var(--ash)',
                background: tab === t.id ? 'var(--gold-faint)' : 'transparent',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Status pill */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '5px 10px',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--bg-1)',
        }}>
          <div style={{
            width: '5px', height: '5px', borderRadius: '50%',
            background: 'var(--green)',
            boxShadow: '0 0 6px rgba(74,140,106,0.5)',
          }} />
          <span className="mono" style={{ fontSize: '8px', color: 'var(--ash)', letterSpacing: '0.1em' }}>
            Live
          </span>
        </div>
      </div>
    </nav>
  );
}