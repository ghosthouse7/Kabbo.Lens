import { useCallback, useState } from 'react';

const FILM_ERAS = [
  { id: 'none',  label: 'Original',  filter: 'none' },
  { id: '1960s', label: 'Ray Era',   filter: 'sepia(0.75) contrast(1.15) brightness(0.88) saturate(0.7)' },
  { id: '1970s', label: '70s Grain', filter: 'sepia(0.4) contrast(1.2) brightness(0.82) saturate(0.5) hue-rotate(5deg)' },
  { id: '1990s', label: '90s Fade',  filter: 'sepia(0.2) contrast(0.95) brightness(1.05) saturate(0.75)' },
  { id: 'bw',    label: 'B&W',       filter: 'grayscale(1) contrast(1.1) brightness(0.9)' },
];

export default function UploadZone({ image, onFile, era, setEra }) {
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    onFile({ file, url, name: file.name });
  }, [onFile]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  }, [handleFile]);

  const currentFilter = FILM_ERAS.find(f => f.id === era)?.filter || 'none';

  return (
    <div>
      <div className="label" style={{ marginBottom: '12px' }}>01 — Source Image</div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !image && document.getElementById('kl-file-input').click()}
        style={{
          position: 'relative',
          border: `1px ${dragging ? 'solid' : 'dashed'} ${dragging ? 'var(--border-hi)' : image ? 'var(--border-mid)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-lg)',
          background: dragging ? 'rgba(212,168,75,0.06)' : image ? 'transparent' : 'rgba(212,168,75,0.01)',
          overflow: 'hidden',
          transition: 'var(--transition)',
          cursor: image ? 'default' : 'pointer',
          minHeight: image ? 'auto' : '200px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {image ? (
          <>
            {/* Film reel strips */}
            <div style={{
              position: 'absolute', left: 0, top: 0, bottom: 0, width: '22px',
              background: 'rgba(0,0,0,0.7)',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: '4px', paddingTop: '6px', zIndex: 2,
            }}>
              {Array.from({ length: 14 }).map((_, i) => (
                <div key={i} style={{
                  width: '12px', height: '10px', flexShrink: 0,
                  background: 'rgba(212,168,75,0.12)',
                  borderRadius: '1px',
                  border: '1px solid rgba(212,168,75,0.1)',
                }} />
              ))}
            </div>
            <div style={{
              position: 'absolute', right: 0, top: 0, bottom: 0, width: '22px',
              background: 'rgba(0,0,0,0.7)',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: '4px', paddingTop: '6px', zIndex: 2,
            }}>
              {Array.from({ length: 14 }).map((_, i) => (
                <div key={i} style={{
                  width: '12px', height: '10px', flexShrink: 0,
                  background: 'rgba(212,168,75,0.12)',
                  borderRadius: '1px',
                  border: '1px solid rgba(212,168,75,0.1)',
                }} />
              ))}
            </div>

            {/* Image */}
            <img
              src={image.url}
              alt="Uploaded"
              style={{
                width: '100%', maxHeight: '280px',
                objectFit: 'cover',
                display: 'block',
                filter: currentFilter,
                transition: 'filter 0.4s ease',
              }}
            />

            {/* Change button overlay */}
            <button
              onClick={(e) => { e.stopPropagation(); document.getElementById('kl-file-input').click(); }}
              className="btn"
              style={{
                position: 'absolute', bottom: '12px', right: '30px', zIndex: 3,
                background: 'rgba(9,8,10,0.8)',
                backdropFilter: 'blur(8px)',
                fontSize: '7px', letterSpacing: '0.18em',
              }}
            >
              Change
            </button>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <svg width="40" height="40" viewBox="0 0 40 40" style={{ marginBottom: '14px', opacity: 0.3 }}>
              <rect x="4" y="8" width="32" height="24" rx="2" stroke="var(--gold)" strokeWidth="1.5" fill="none"/>
              <circle cx="14" cy="16" r="3" stroke="var(--gold)" strokeWidth="1.5" fill="none"/>
              <path d="M4 26l8-7 6 5 5-4 13 9" stroke="var(--gold)" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
              {/* Perforations */}
              <rect x="1" y="12" width="3" height="5" rx="0.5" fill="var(--gold)" opacity="0.4"/>
              <rect x="1" y="20" width="3" height="5" rx="0.5" fill="var(--gold)" opacity="0.4"/>
              <rect x="36" y="12" width="3" height="5" rx="0.5" fill="var(--gold)" opacity="0.4"/>
              <rect x="36" y="20" width="3" height="5" rx="0.5" fill="var(--gold)" opacity="0.4"/>
            </svg>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              fontWeight: 300,
              fontSize: '16px',
              color: 'var(--cream-faint)',
              marginBottom: '6px',
            }}>
              Drop a Kolkata photograph
            </div>
            <div className="label" style={{ fontSize: '7px' }}>
              or click to browse · jpg, png, webp
            </div>
          </div>
        )}
      </div>

      <input
        id="kl-file-input" type="file" accept="image/*"
        style={{ display: 'none' }}
        onChange={e => handleFile(e.target.files[0])}
      />

      {/* Film era filter */}
      {image && (
        <div style={{ marginTop: '14px' }}>
          <div className="label" style={{ marginBottom: '10px', fontSize: '7px' }}>Film Era Filter</div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {FILM_ERAS.map(f => (
              <button
                key={f.id}
                className="btn"
                onClick={() => setEra(f.id)}
                style={{
                  fontSize: '7px',
                  padding: '5px 10px',
                  letterSpacing: '0.12em',
                  borderColor: era === f.id ? 'var(--border-mid)' : 'var(--border)',
                  color: era === f.id ? 'var(--gold)' : 'var(--ash)',
                  background: era === f.id ? 'var(--gold-faint)' : 'transparent',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}