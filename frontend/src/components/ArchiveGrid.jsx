import { useState } from 'react';

const TYPE_ICONS = {
  script:     '🎬',
  poem:       '✒️',
  storyboard: '🎞️',
};

export default function ArchiveGrid({ archive }) {
  const [expanded, setExpanded] = useState(null);
  const [hovered, setHovered] = useState(null);

  if (!archive?.length) {
    return (
      <div className="page-enter">
        <div style={{ marginBottom: '28px' }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontWeight: 300,
            fontSize: '32px',
            color: 'var(--gold)',
            marginBottom: '6px',
            letterSpacing: '-0.02em',
          }}>
            Kolkata Memory Archive
          </h2>
          <div className="label">0 stories this session</div>
        </div>
        <div style={{
          textAlign: 'center',
          padding: '100px 0',
          border: '1px dashed var(--border)',
          borderRadius: 'var(--radius-lg)',
        }}>
          <div style={{ fontSize: '44px', opacity: 0.08, marginBottom: '18px' }}>📜</div>
          <div className="label" style={{ opacity: 0.3 }}>No stories yet — generate in Studio</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter">
      {/* Header */}
      <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontWeight: 300,
            fontSize: '32px',
            color: 'var(--gold)',
            marginBottom: '6px',
            letterSpacing: '-0.02em',
          }}>
            Kolkata Memory Archive
          </h2>
          <div className="label">{archive.length} {archive.length === 1 ? 'story' : 'stories'} this session</div>
        </div>

        {/* Filter row (decorative for now) */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {['All', 'Scripts', 'Poems', 'Boards'].map((f, i) => (
            <button key={i} className={`btn btn-tab mono${i === 0 ? ' active' : ''}`} style={{ fontSize: '9px' }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '16px',
      }}>
        {archive.map((entry, i) => (
          <div
            key={i}
            className="anim-fade-up"
            style={{
              animationDelay: `${i * 0.06}s`,
              border: `1px solid ${expanded === i ? 'var(--border-mid)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-lg)',
              background: hovered === i ? 'rgba(214,179,106,0.025)' : 'var(--bg-1)',
              cursor: 'pointer',
              overflow: 'hidden',
              transition: 'all 0.22s ease',
              transform: hovered === i ? 'translateY(-3px)' : 'translateY(0)',
              boxShadow: hovered === i ? '0 12px 40px rgba(0,0,0,0.5)' : 'none',
            }}
            onClick={() => setExpanded(expanded === i ? null : i)}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            {/* Card header */}
            <div style={{
              padding: '18px 18px 14px',
              borderBottom: expanded === i ? '1px solid var(--border)' : 'none',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '14px' }}>{TYPE_ICONS[entry.output_type] || '📝'}</span>
                    <span style={{
                      fontFamily: 'var(--font-display)',
                      fontStyle: 'italic',
                      fontSize: '17px',
                      color: 'var(--gold)',
                      fontWeight: 300,
                      letterSpacing: '-0.01em',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {entry.title || 'Untitled'}
                    </span>
                  </div>
                  <div className="label" style={{ fontSize: '8px' }}>
                    {entry.output_type} · {entry.location || 'Kolkata'}
                  </div>
                </div>
                <span className="tag" style={{ flexShrink: 0, marginLeft: '8px' }}>
                  {entry.era || '—'}
                </span>
              </div>

              {/* Mood */}
              {entry.mood && (
                <div className="mono" style={{
                  fontSize: '9px',
                  color: 'var(--cream-faint)',
                  fontStyle: 'italic',
                  letterSpacing: '0.05em',
                  marginBottom: '10px',
                  lineHeight: 1.5,
                }}>
                  "{entry.mood}"
                </div>
              )}

              {/* Tags */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {entry.tags?.slice(0, 3).map((t, j) => (
                  <span key={j} className="tag">{t}</span>
                ))}
              </div>

              {/* Expand indicator */}
              <div style={{
                marginTop: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                <span className="label" style={{ fontSize: '7px', opacity: 0.4 }}>
                  {expanded === i ? '▲ collapse' : '▼ read'}
                </span>
              </div>
            </div>

            {/* Expanded content */}
            {expanded === i && (
              <div
                className="scroll-area anim-fade-up"
                style={{
                  padding: '16px 18px',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 300,
                  fontSize: '13px',
                  color: 'rgba(244,239,228,0.6)',
                  lineHeight: 2,
                  whiteSpace: 'pre-wrap',
                  maxHeight: '240px',
                  letterSpacing: '0.01em',
                  background: 'linear-gradient(to bottom, rgba(214,179,106,0.02), transparent)',
                }}
              >
                {entry.content}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}