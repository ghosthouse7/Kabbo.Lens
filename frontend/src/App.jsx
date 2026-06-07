import { useState, useRef, useCallback, useEffect } from 'react';

import './styles/globals.css';
import './styles/animations.css';

import FloatingOrbs   from './components/FloatingOrbs';
import Navbar         from './components/Navbar';
import Hero           from './components/Hero';
import UploadZone     from './components/UploadZone';
import ResultPanel    from './components/ResultPanel';
import HeritageMap    from './components/HeritageMap';
import ArchiveGrid    from './components/ArchiveGrid';

const BACKEND = '[https://kabbolens-production.up.railway.app](https://kabbolens-production.up.railway.app)';

const OUTPUT_TYPES = [
  { id: 'script',     icon: '🎬', label: 'Film Script',   desc: 'Cinematic indie screenplay' },
  { id: 'poem',       icon: '✒️',  label: 'Kavita',        desc: 'Jibanananda-inspired verse' },
  { id: 'storyboard', icon: '🎞️', label: 'Storyboard',    desc: "Director's shot breakdown" },
];

const LANGUAGES = [
  { id: 'bilingual', label: 'বাং + EN' },
  { id: 'bengali',   label: 'বাংলা' },
  { id: 'english',   label: 'English' },
];

export default function KabboLens() {
  const [tab,        setTab]    = useState('studio');
  const [image,      setImage]  = useState(null);
  const [outputType, setOT]     = useState('script');
  const [language,   setLang]   = useState('bilingual');
  const [era,        setEra]    = useState('none');
  const [result,     setResult] = useState(null);
  const [archive,    setArchive]= useState([]);
  const [mapPins,    setMapPins]= useState([]);
  const [loading,    setLoading]= useState(false);
  const [error,      setError]  = useState(null);

  // Load archive on mount
  useEffect(() => {
    fetch(`${BACKEND}/api/archive`)
      .then(r => r.json())
      .then(d => {
        if (d.entries) { setMapPins(d.entries); setArchive(d.entries); }
      })
      .catch(() => {});
  }, []);

  const handleFile = useCallback((fileObj) => {
    setImage(fileObj);
    setResult(null);
    setError(null);
  }, []);

  const generate = async () => {
    if (!image) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const fd = new FormData();
      fd.append('image', image.file);
      fd.append('output_type', outputType);
      fd.append('language', language);
      const resp = await fetch(`${BACKEND}/api/generate`, { method: 'POST', body: fd });
      if (!resp.ok) {
        const e = await resp.json().catch(() => ({ error: 'Server error' }));
        throw new Error(e.error || `HTTP ${resp.status}`);
      }
      const data = await resp.json();
      setResult(data.result);
      if (data.archive) {
        setMapPins(prev => [...prev, data.archive]);
        setArchive(prev => [data.archive, ...prev]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--cream-dim)', position: 'relative' }}>

      {/* Ambient background */}
      <FloatingOrbs />

      {/* Sticky nav */}
      <Navbar tab={tab} setTab={setTab} />

      {/* Main content */}
      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* ── STUDIO ── */}
        {tab === 'studio' && (
          <>
            {/* Hero — only when no result yet */}
            {!result && !loading && <Hero />}

            <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '40px 32px 80px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)',
                gap: '36px',
              }}
                className="studio-grid"
              >
                {/* ── LEFT: Controls ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

                  {/* Upload */}
                  <UploadZone
                    image={image}
                    onFile={handleFile}
                    era={era}
                    setEra={setEra}
                  />

                  {/* Output type */}
                  <div>
                    <div className="label" style={{ marginBottom: '12px' }}>02 — Creative Output</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {OUTPUT_TYPES.map(t => (
                        <div
                          key={t.id}
                          onClick={() => setOT(t.id)}
                          style={{
                            padding: '14px 16px',
                            border: `1px solid ${outputType === t.id ? 'var(--border-mid)' : 'var(--border)'}`,
                            borderRadius: 'var(--radius)',
                            background: outputType === t.id ? 'var(--gold-faint)' : 'var(--bg-1)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '14px',
                            cursor: 'pointer',
                            transition: 'var(--transition)',
                          }}
                          className="hover-lift"
                        >
                          <span style={{ fontSize: '20px' }}>{t.icon}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{
                              fontFamily: 'var(--font-display)',
                              fontSize: '15px',
                              fontStyle: outputType === t.id ? 'italic' : 'normal',
                              color: outputType === t.id ? 'var(--gold)' : 'var(--cream)',
                              fontWeight: 300,
                              marginBottom: '2px',
                            }}>
                              {t.label}
                            </div>
                            <div className="label" style={{ fontSize: '8px', opacity: 0.6 }}>{t.desc}</div>
                          </div>
                          {outputType === t.id && (
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--gold)', flexShrink: 0 }} />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Language */}
                  <div>
                    <div className="label" style={{ marginBottom: '12px' }}>03 — Language</div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {LANGUAGES.map(l => (
                        <button
                          key={l.id}
                          className="btn mono"
                          onClick={() => setLang(l.id)}
                          style={{
                            flex: 1,
                            padding: '10px',
                            border: `1px solid ${language === l.id ? 'var(--border-hi)' : 'var(--border)'}`,
                            borderRadius: 'var(--radius-sm)',
                            background: language === l.id ? 'var(--gold-faint)' : 'var(--bg-1)',
                            color: language === l.id ? 'var(--gold)' : 'var(--cream-faint)',
                            fontSize: '11px',
                            letterSpacing: '0.05em',
                            transition: 'var(--transition)',
                          }}
                        >
                          {l.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Generate button */}
                  <button
                    className={`btn btn-primary${image && !loading ? ' glow-pulse' : ''}`}
                    onClick={generate}
                    disabled={!image || loading}
                    style={{ width: '100%', padding: '16px', fontSize: '10px', letterSpacing: '0.28em' }}
                  >
                    {loading ? (
                      <>
                        <svg width="14" height="14" viewBox="0 0 14 14" style={{ animation: 'spin 1.2s linear infinite', flexShrink: 0 }}>
                          <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeDasharray="10 24" strokeLinecap="round" />
                        </svg>
                        Developing Frame…
                      </>
                    ) : '✦  Generate Creative Output'}
                  </button>

                  {/* Error */}
                  {error && (
                    <div className="mono" style={{
                      padding: '12px 16px',
                      border: '1px solid rgba(192,57,43,0.3)',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(192,57,43,0.05)',
                      color: '#e74c3c',
                      fontSize: '11px',
                    }}>
                      ✕ {error}
                    </div>
                  )}
                </div>

                {/* ── RIGHT: Result ── */}
                <div>
                  <ResultPanel
                    result={result}
                    loading={loading}
                    image={image}
                    era={era}
                    onTabChange={setTab}
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── MAP ── */}
        {tab === 'map' && (
          <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '40px 32px 80px' }}>
            <HeritageMap mapPins={mapPins} />
          </div>
        )}

        {/* ── ARCHIVE ── */}
        {tab === 'archive' && (
          <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '40px 32px 80px' }}>
            <ArchiveGrid archive={archive} />
          </div>
        )}
      </div>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '28px 32px',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{
          maxWidth: '1240px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '15px', color: 'var(--gold)', fontStyle: 'italic' }}>
              Kabbo.Lens
            </span>
            <span className="label" style={{ fontSize: '7px', borderLeft: '1px solid var(--border)', paddingLeft: '10px' }}>
              Cultural Memory Engine
            </span>
          </div>
          <div className="label" style={{ fontSize: '8px', opacity: 0.3 }}>
            Kolkata's stories, frame by frame · Tradition Hacks 2026
          </div>
          {/* Film strip decoration */}
          <div style={{ display: 'flex', gap: '3px' }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{
                width: '8px', height: '12px',
                borderRadius: '1px',
                background: i % 2 === 0 ? 'rgba(214,179,106,0.15)' : 'transparent',
                border: '1px solid rgba(214,179,106,0.1)',
              }} />
            ))}
          </div>
        </div>
      </footer>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 900px) {
          .studio-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 640px) {
          nav > div { padding: 0 16px !important; }
          nav .label { display: none; }
        }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: var(--gold);
          cursor: pointer;
        }
        input[type=range]::-moz-range-thumb {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: var(--gold);
          border: none;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}