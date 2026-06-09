import { useState } from 'react';

const TYPE_ICONS = { script: '🎬', poem: '✒️', storyboard: '🎞️' };

export default function ArchiveGrid({ archive = [] }) {
  const [expanded, setExpanded] = useState(null);

  if (!archive.length) return (
    <div style={{ textAlign: 'center', padding: '80px 20px' }}>
      <div style={{ fontSize: '32px', opacity: 0.08, marginBottom: '14px' }}>🎞️</div>
      <div className="label" style={{ opacity: 0.25 }}>No archive entries yet</div>
      <div className="mono" style={{ fontSize: '9px', color: 'var(--smoke)', marginTop: '8px' }}>
        Generate outputs to build your Kolkata memory archive
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div>
          <div className="label" style={{ fontSize: '8px', marginBottom: '4px' }}>Archive · Cultural Memory</div>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontStyle: 'italic',
            fontWeight: 300, fontSize: '28px', color: 'var(--cream)',
          }}>
            {archive.length} {archive.length === 1 ? 'Frame' : 'Frames'} Developed
          </h2>
        </div>
        <div className="mono" style={{ fontSize: '9px', color: 'var(--smoke)' }}>
          Kolkata · 1947–Present
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '14px',
      }}>
        {archive.map((entry, i) => (
          <div
            key={entry.id || i}
            onClick={() => setExpanded(expanded === i ? null : i)}
            className="card hover-lift"
            style={{
              padding: '0',
              overflow: 'hidden',
              cursor: 'pointer',
              borderColor: expanded === i ? 'var(--border-mid)' : 'var(--border)',
              background: expanded === i ? 'rgba(212,168,75,0.03)' : 'var(--bg-1)',
            }}
          >
            {/* Card top */}
            <div style={{
              padding: '16px 18px 12px',
              borderBottom: expanded === i ? '1px solid var(--border)' : 'none',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <span style={{ fontSize: '18px' }}>{TYPE_ICONS[entry.output_type] || '📄'}</span>
                <div className="label" style={{ fontSize: '6px' }}>{entry.output_type}</div>
              </div>

              <h3 style={{
                fontFamily: 'var(--font-display)', fontStyle: 'italic',
                fontWeight: 300, fontSize: '17px', color: 'var(--gold)',
                lineHeight: 1.3, marginBottom: '5px',
              }}>
                {entry.title || 'Untitled'}
              </h3>

              {entry.mood && (
                <div className="label" style={{ fontSize: '6px', marginBottom: '6px' }}>{entry.mood}</div>
              )}

              {entry.location && (
                <div className="mono" style={{ fontSize: '9px', color: 'var(--gold-dim)' }}>
                  📍 {entry.location}{entry.era ? ` · ${entry.era}` : ''}
                </div>
              )}
            </div>

            {/* Expanded content */}
            {expanded === i && (
              <div style={{ padding: '14px 18px 16px' }}>
                <div style={{
                  fontFamily: 'var(--font-display)', fontWeight: 300,
                  fontSize: '12px', lineHeight: 1.9,
                  color: 'rgba(244,239,228,0.6)',
                  whiteSpace: 'pre-wrap',
                  maxHeight: '200px', overflow: 'auto',
                }}>
                  {entry.content}
                </div>

                {entry.tags?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '12px' }}>
                    {entry.tags.map((t, j) => <span key={j} className="tag">{t}</span>)}
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            <div style={{
              padding: '8px 18px',
              borderTop: '1px solid var(--border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div style={{ display: 'flex', gap: '3px' }}>
                {Array.from({ length: 5 }).map((_, k) => (
                  <div key={k} style={{
                    width: '5px', height: '8px', borderRadius: '0.5px',
                    background: k % 2 === 0 ? 'rgba(212,168,75,0.12)' : 'transparent',
                    border: '1px solid rgba(212,168,75,0.06)',
                  }} />
                ))}
              </div>
              <span className="mono" style={{ fontSize: '7px', color: 'var(--smoke)' }}>
                {expanded === i ? 'click to collapse' : 'click to expand'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}