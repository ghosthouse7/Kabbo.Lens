import { useState, useCallback, useEffect } from 'react';
import './styles/globals.css';

import FloatingOrbs   from './components/FloatingOrbs';
import LandingPage    from './components/LandingPage';
import Navbar         from './components/Navbar';
import Hero           from './components/Hero';
import UploadZone     from './components/UploadZone';
import ResultPanel    from './components/ResultPanel';
import HeritageMap    from './components/HeritageMap';
import ArchiveGrid    from './components/ArchiveGrid';

const BACKEND = 'https://kabbolens-production.up.railway.app';

// ─── Refined SVG Icons for Output Types ────────────────────────────────────────
const ScriptIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
    <line x1="7" y1="2" x2="7" y2="22"></line>
    <line x1="17" y1="2" x2="17" y2="22"></line>
    <line x1="2" y1="12" x2="22" y2="12"></line>
    <line x1="2" y1="7" x2="7" y2="7"></line>
    <line x1="2" y1="17" x2="7" y2="17"></line>
    <line x1="17" y1="17" x2="22" y2="17"></line>
    <line x1="17" y1="7" x2="22" y2="7"></line>
  </svg>
);

const PoemIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
    <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
    <path d="M2 2l7.586 7.586"></path>
    <circle cx="11" cy="11" r="2"></circle>
  </svg>
);

const StoryboardIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    <circle cx="8.5" cy="8.5" r="1.5"></circle>
    <polyline points="21 15 16 10 5 21"></polyline>
  </svg>
);

const OUTPUT_TYPES = [
  { id: 'script',     icon: <ScriptIcon />,     label: 'Film Script',  desc: 'Cinematic indie screenplay' },
  { id: 'poem',       icon: <PoemIcon />,       label: 'Kavita',       desc: 'Jibanananda-inspired verse' },
  { id: 'storyboard', icon: <StoryboardIcon />, label: 'Storyboard',   desc: "Director's shot breakdown" },
];

const LANGUAGES = [
  { id: 'bilingual', label: 'বাং + EN' },
  { id: 'bengali',   label: 'বাংলা' },
  { id: 'english',   label: 'English' },
];

export default function KabboLens() {
  const [entered,    setEntered]  = useState(false);
  const [tab,        setTab]      = useState('studio');
  const [image,      setImage]    = useState(null);
  const [outputType, setOT]       = useState('script');
  const [language,   setLang]     = useState('bilingual');
  const [era,        setEra]      = useState('none');
  const [result,     setResult]   = useState(null);
  const [archive,    setArchive]  = useState([]);
  const [mapPins,    setMapPins]  = useState([]);
  const [loading,    setLoading]  = useState(false);
  const [error,      setError]    = useState(null);

  // Load archive on mount
  useEffect(() => {
    fetch(`${BACKEND}/api/archive`)
      .then(r => r.json())
      .then(d => { if (d.entries) { setMapPins(d.entries); setArchive(d.entries); } })
      .catch(() => {});
  }, []);

  const handleFile = useCallback((fileObj) => {
    setImage(fileObj); setResult(null); setError(null);
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

  // ── Landing page ──
  if (!entered) return <LandingPage onEnter={() => setEntered(true)} />;

  // ── Main app ──
  return (
    <div style={{ minHeight: '100vh', background: 'var(--ink)', color: 'var(--cream)', position: 'relative' }}>
      <FloatingOrbs />
      <Navbar tab={tab} setTab={setTab} />

      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* ── STUDIO ── */}
        {tab === 'studio' && (
          <>
            {!result && !loading && <Hero />}
            <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '32px 32px 80px' }}>
              <div
                className="studio-grid"
                style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: '32px' }}
              >
                {/* LEFT COLUMN */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                  {/* Upload */}
                  <UploadZone image={image} onFile={handleFile} era={era} setEra={setEra} />

                  {/* Output type */}
                  <div>
                    <div className="label" style={{ marginBottom: '10px' }}>02 — Creative Output</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {OUTPUT_TYPES.map(t => (
                        <div
                          key={t.id}
                          onClick={() => setOT(t.id)}
                          className="hover-lift"
                          style={{
                            padding: '12px 14px',
                            border: `1px solid ${outputType === t.id ? 'var(--border-mid)' : 'var(--border)'}`,
                            borderRadius: 'var(--radius)',
                            background: outputType === t.id ? 'var(--gold-faint)' : 'var(--bg-1)',
                            display: 'flex', alignItems: 'center', gap: '12px',
                            cursor: 'pointer', transition: 'var(--transition)',
                          }}
                        >
                          <span style={{ flexShrink: 0, color: outputType === t.id ? 'var(--gold)' : 'var(--ash)' }}>
                            {t.icon}
                          </span>
                          <div style={{ flex: 1 }}>
                            <div style={{
                              fontFamily: 'var(--font-display)',
                              fontStyle: outputType === t.id ? 'italic' : 'normal',
                              fontSize: '14px', fontWeight: 300,
                              color: outputType === t.id ? 'var(--gold)' : 'var(--cream)',
                              marginBottom: '1px',
                            }}>
                              {t.label}
                            </div>
                            <div className="label" style={{ fontSize: '7px', opacity: 0.5 }}>{t.desc}</div>
                          </div>
                          {outputType === t.id && (
                            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--gold)', flexShrink: 0 }} />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Language */}
                  <div>
                    <div className="label" style={{ marginBottom: '10px' }}>03 — Language</div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {LANGUAGES.map(l => (
                        <button
                          key={l.id}
                          className="btn"
                          onClick={() => setLang(l.id)}
                          style={{
                            flex: 1, padding: '9px 6px', justifyContent: 'center',
                            fontSize: '10px', letterSpacing: '0.04em',
                            borderColor: language === l.id ? 'var(--border-hi)' : 'var(--border)',
                            color: language === l.id ? 'var(--gold)' : 'var(--ash)',
                            background: language === l.id ? 'var(--gold-faint)' : 'transparent',
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
                    style={{ width: '100%', padding: '15px', fontSize: '9px', letterSpacing: '0.28em', justifyContent: 'center' }}
                  >
                    {loading ? (
                      <>
                        <svg width="12" height="12" viewBox="0 0 14 14" style={{ animation: 'spin 1.2s linear infinite', flexShrink: 0 }}>
                          <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5"
                            fill="none" strokeDasharray="10 24" strokeLinecap="round"/>
                        </svg>
                        Developing Frame…
                      </>
                    ) : '✦  Generate Creative Output'}
                  </button>

                  {/* Error */}
                  {error && (
                    <div className="mono" style={{
                      padding: '10px 14px',
                      border: '1px solid rgba(201,64,64,0.3)',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(201,64,64,0.05)',
                      color: 'var(--red)', fontSize: '10px',
                    }}>
                      ✕ {error}
                    </div>
                  )}
                </div>

                {/* RIGHT COLUMN */}
                <div>
                  <ResultPanel result={result} loading={loading} image={image} era={era} onTabChange={setTab} />
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── MAP ── */}
        {tab === 'map' && (
          <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '32px 32px 80px' }}>
            <HeritageMap mapPins={mapPins} />
          </div>
        )}

        {/* ── ARCHIVE ── */}
        {tab === 'archive' && (
          <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '32px 32px 80px' }}>
            <ArchiveGrid archive={archive} />
          </div>
        )}
      </div>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border)', padding: '24px 32px',
        position: 'relative', zIndex: 1,
      }}>
        <div style={{
          maxWidth: '1240px', margin: '0 auto',
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', flexWrap: 'wrap', gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: '14px', color: 'var(--gold)', letterSpacing: '0.06em' }}>
              Kabbo<span style={{ fontStyle: 'italic' }}>.Lens</span>
            </span>
            <span className="label" style={{ fontSize: '6px', borderLeft: '1px solid var(--border)', paddingLeft: '10px' }}>
              Cultural Memory Engine
            </span>
          </div>
          <div className="label" style={{ fontSize: '7px', opacity: 0.25 }}>
            Kolkata's stories, frame by frame · Tradition Hacks 2026
          </div>
          <div style={{ display: 'flex', gap: '3px' }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{
                width: '7px', height: '11px', borderRadius: '1px',
                background: i % 2 === 0 ? 'rgba(212,168,75,0.1)' : 'transparent',
                border: '1px solid rgba(212,168,75,0.07)',
              }} />
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
