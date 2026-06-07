import { useRef, useState, useCallback } from 'react';

const FILM_ERAS = [
  { id: 'none',   label: 'Original',    filter: 'none' },
  { id: '1960s',  label: 'Ray Era',     filter: 'sepia(0.75) contrast(1.15) brightness(0.88) saturate(0.5)' },
  { id: '1970s',  label: 'Eastmancolor',filter: 'sepia(0.25) hue-rotate(12deg) saturate(1.4) contrast(1.1) brightness(0.92)' },
  { id: '1990s',  label: 'VHS Grain',   filter: 'contrast(1.35) saturate(0.65) brightness(0.93) hue-rotate(-8deg)' },
  { id: 'modern', label: 'Modern',      filter: 'contrast(1.06) saturate(1.15) brightness(1.02)' },
];

export default function UploadZone({ image, onFile, era, setEra }) {
  const fileRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback((file) => {
    if (!file?.type.startsWith('image/')) return;
    onFile({ file, url: URL.createObjectURL(file) });
  }, [onFile]);

  const filmFilter = FILM_ERAS.find(e => e.id === era)?.filter || 'none';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

      {/* Section label */}
      <div className="label">01 — Upload Frame</div>

      {/* Drop zone */}
      <div
        onClick={() => !image && fileRef.current?.click()}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        style={{
          border: `1px dashed ${dragging ? 'var(--gold)' : image ? 'var(--border-mid)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          minHeight: image ? 0 : '200px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: image ? 'default' : 'pointer',
          background: dragging ? 'rgba(214,179,106,0.03)' : 'var(--bg-1)',
          transition: 'all 0.3s ease',
          position: 'relative',
        }}
      >
        {image ? (
          /* Film frame wrapper */
          <div className="film-frame" style={{ width: '100%', position: 'relative' }}>
            <img
              src={image.url}
              alt="Uploaded frame"
              className="anim-film-reveal"
              style={{
                width: '100%',
                maxHeight: '300px',
                objectFit: 'cover',
                display: 'block',
                filter: filmFilter,
                transition: 'filter 0.7s ease',
                marginLeft: '18px',
                marginRight: '18px',
                width: 'calc(100% - 36px)',
              }}
            />
            {/* Bottom vignette */}
            <div style={{
              position: 'absolute',
              bottom: 0, left: 0, right: 0,
              height: '80px',
              background: 'linear-gradient(to top, rgba(9,8,10,0.9), transparent)',
              pointerEvents: 'none',
              zIndex: 3,
            }} />
            {/* Change button */}
            <button
              className="btn btn-ghost"
              onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}
              style={{
                position: 'absolute',
                top: '10px',
                right: '28px',
                zIndex: 4,
                background: 'rgba(9,8,10,0.85)',
                fontSize: '8px',
                letterSpacing: '0.2em',
              }}
            >
              ↻ Change
            </button>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '52px 32px' }}>
            {/* Film reel icon */}
            <div style={{ marginBottom: '16px', opacity: 0.18 }}>
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="1.5"/>
                <circle cx="24" cy="24" r="8" stroke="currentColor" strokeWidth="1.5"/>
                <circle cx="24" cy="10" r="3" fill="currentColor" opacity="0.6"/>
                <circle cx="24" cy="38" r="3" fill="currentColor" opacity="0.6"/>
                <circle cx="10" cy="24" r="3" fill="currentColor" opacity="0.6"/>
                <circle cx="38" cy="24" r="3" fill="currentColor" opacity="0.6"/>
                <circle cx="24" cy="24" r="2.5" fill="currentColor"/>
              </svg>
            </div>
            <div className="mono" style={{ fontSize: '12px', color: 'var(--cream-faint)', marginBottom: '6px' }}>
              Drop a Kolkata photograph
            </div>
            <div className="label" style={{ fontSize: '8px', opacity: 0.5 }}>JPG · PNG · WEBP</div>
          </div>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={e => handleFile(e.target.files?.[0])}
      />

      {/* Film Era Filter */}
      {image && (
        <div>
          <div className="label" style={{ marginBottom: '10px' }}>Film Era Filter</div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {FILM_ERAS.map(f => (
              <button
                key={f.id}
                className="btn mono"
                onClick={() => setEra(f.id)}
                style={{
                  padding: '6px 14px',
                  border: `1px solid ${era === f.id ? 'var(--border-hi)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-sm)',
                  background: era === f.id ? 'var(--gold-faint)' : 'transparent',
                  color: era === f.id ? 'var(--gold)' : 'var(--cream-faint)',
                  fontSize: '10px',
                  letterSpacing: '0.05em',
                  transition: 'var(--transition)',
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