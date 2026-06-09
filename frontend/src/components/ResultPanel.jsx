import { useState, useEffect, useRef } from 'react';
import SoundPlayer from './SoundPlayer';
import MiroWorkspace from './MiroWorkspace'; // <--- ADD THIS

// ─── Bengali Narrator ─────────────────────────────────────────────────────────
// getVoices() is empty on first call in all browsers — must wait for onvoiceschanged

function getVoicesAsync() {
  return new Promise((resolve) => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) { resolve(voices); return; }
    // Wait for voices to load (max 2s)
    const timeout = setTimeout(() => resolve(window.speechSynthesis.getVoices()), 2000);
    window.speechSynthesis.onvoiceschanged = () => {
      clearTimeout(timeout);
      resolve(window.speechSynthesis.getVoices());
    };
  });
}

async function pickBengaliVoice() {
  const voices = await getVoicesAsync();
  // Priority: Bengali → Hindi-IN → any Indian English → default
  const bn = voices.find(v => v.lang.startsWith('bn'));
  if (bn) return bn;
  const hi = voices.find(v => v.lang === 'hi-IN');
  if (hi) return hi;
  const en = voices.find(v => v.lang === 'en-IN');
  if (en) return en;
  return null; // browser default
}

// ─── Refined Icons ────────────────────────────────────────────────────────────
const CopyIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </svg>
);

const NarrateIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
  </svg>
);

const StopIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="6" width="12" height="12" rx="2"></rect>
  </svg>
);

const EmptyStateIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(212,168,75,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    <circle cx="8.5" cy="8.5" r="1.5"></circle>
    <polyline points="21 15 16 10 5 21"></polyline>
  </svg>
);

// ─── Formatting helpers ───────────────────────────────────────────────────────
function formatContent(content, outputType) {
  if (!content) return null;
  if (outputType === 'storyboard') {
    return content.split('\n').map((line, i) => {
      const shotMatch = line.match(/^(SHOT\s+\d+\s*[—-]\s*[A-Z/]+):(.*)/);
      if (shotMatch) {
        return (
          <div key={i} style={{ marginBottom: '18px' }}>
            <div className="label" style={{ fontSize: '7px', color: 'var(--gold)', marginBottom: '5px', letterSpacing: '0.12em' }}>
              {shotMatch[1]}
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 300, fontSize: '13px', lineHeight: 1.9, color: 'var(--cream-faint)' }}>
              {shotMatch[2].trim()}
            </div>
          </div>
        );
      }
      if (!line.trim()) return <div key={i} style={{ height: '8px' }} />;
      return (
        <div key={i} style={{ fontFamily: 'var(--font-display)', fontWeight: 300, fontSize: '13px', lineHeight: 1.9, color: 'var(--cream-faint)', marginBottom: '4px' }}>
          {line}
        </div>
      );
    });
  }
  if (outputType === 'script') {
    return content.split('\n').map((line, i) => {
      const sceneMatch = line.match(/^(SCENE\s+\d+.*?):(.*)/i);
      if (sceneMatch) {
        return (
          <div key={i} style={{ marginBottom: '20px', marginTop: i > 0 ? '20px' : 0 }}>
            <div className="label" style={{ fontSize: '7px', color: 'var(--gold)', marginBottom: '8px', letterSpacing: '0.12em' }}>
              {sceneMatch[1].toUpperCase()}
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 300, fontSize: '13px', lineHeight: 1.9, color: 'var(--cream-faint)' }}>
              {sceneMatch[2].trim()}
            </div>
          </div>
        );
      }
      // Dialogue detection: lines starting with caps name followed by colon
      const dialogueMatch = line.match(/^([A-Z][A-Z\s]+):\s*(.*)/);
      if (dialogueMatch && dialogueMatch[1].length < 25) {
        return (
          <div key={i} style={{ margin: '10px 0 10px 20px' }}>
            <div className="mono" style={{ fontSize: '8px', color: 'var(--gold)', opacity: 0.7, marginBottom: '2px' }}>{dialogueMatch[1]}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 300, fontSize: '13px', lineHeight: 1.8, color: 'var(--cream)' }}>
              "{dialogueMatch[2]}"
            </div>
          </div>
        );
      }
      if (!line.trim()) return <div key={i} style={{ height: '6px' }} />;
      return (
        <div key={i} style={{ fontFamily: 'var(--font-display)', fontWeight: 300, fontSize: '13px', lineHeight: 1.9, color: 'var(--cream-faint)', marginBottom: '2px' }}>
          {line}
        </div>
      );
    });
  }
  // Poem
  return (
    <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 300, fontSize: '14px', lineHeight: 2.1, color: 'var(--cream-faint)', whiteSpace: 'pre-wrap' }}>
      {content}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ResultPanel({ result, loading, image, era }) {
  const [copied,     setCopied]     = useState(false);
  const [narrating,  setNarrating]  = useState(false);
  const utteranceRef = useRef(null);

  // Stop narration if result changes
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
      setNarrating(false);
    };
  }, [result]);

  const handleCopy = () => {
    if (!result?.content) return;
    navigator.clipboard.writeText(result.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNarrate = async () => {
    if (!result?.content) return;

    if (narrating) {
      window.speechSynthesis.cancel();
      setNarrating(false);
      return;
    }

    // Cancel any ongoing speech first
    window.speechSynthesis.cancel();

    const voice = await pickBengaliVoice();
    const utt = new SpeechSynthesisUtterance(result.content);

    if (voice) {
      utt.voice = voice;
      utt.lang  = voice.lang;
    } else {
      utt.lang = 'bn-IN';
    }

    utt.rate   = 0.88;
    utt.pitch  = 0.95;
    utt.volume = 1.0;

    utt.onstart = () => setNarrating(true);
    utt.onend   = () => setNarrating(false);
    utt.onerror = (e) => {
      console.error('Speech error:', e);
      setNarrating(false);
    };

    utteranceRef.current = utt;
    window.speechSynthesis.speak(utt);
    setNarrating(true);
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="card anim-fade-in" style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', justifyContent: 'center', minHeight: '320px' }}>
        <div style={{ position: 'relative', width: '48px', height: '48px' }}>
          <div style={{ position: 'absolute', inset: 0, border: '1px solid rgba(212,168,75,0.15)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 1.2s linear infinite' }} />
          <div style={{ position: 'absolute', inset: '8px', border: '1px solid rgba(212,168,75,0.08)', borderBottomColor: 'rgba(212,168,75,0.4)', borderRadius: '50%', animation: 'spin 1.8s linear infinite reverse' }} />
        </div>
        <div className="label" style={{ fontSize: '7px', animation: 'shimmer 2s infinite' }}>
          Developing the negative…
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  // ── Empty state ────────────────────────────────────────────────────────────
  if (!result) {
    return (
      <div className="card" style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'center', justifyContent: 'center', minHeight: '320px', textAlign: 'center', border: '1px dashed rgba(212,168,75,0.2)' }}>
        <EmptyStateIcon />
        <div className="label" style={{ fontSize: '8px', opacity: 0.6, letterSpacing: '0.05em' }}>
          Upload a Kolkata photograph to extract its memory
        </div>
      </div>
    );
  }

  // ── Result ─────────────────────────────────────────────────────────────────
  const outputLabel = { script: 'Film Script', poem: 'Poem', storyboard: 'Storyboard' }[result.output_type] || result.output_type;
  const eraLabel = result.era || era || '';

  return (
    <div className="card anim-fade-in" style={{ overflow: 'hidden' }}>

      {/* ── Header ── */}
      <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <span className="tag" style={{ background: 'rgba(212,168,75,0.08)', borderColor: 'rgba(212,168,75,0.2)', color: 'var(--gold)', fontSize: '6px' }}>
                {outputLabel}
              </span>
              {eraLabel && (
                <span className="tag" style={{ fontSize: '6px' }}>{eraLabel}</span>
              )}
              {result.location && (
                <span className="tag" style={{ fontSize: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  {result.location}
                </span>
              )}
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 300, fontSize: '22px', color: 'var(--gold)', lineHeight: 1.25, letterSpacing: '-0.01em' }}>
              {result.title || 'Untitled'}
            </h2>
            {result.mood && (
              <div className="mono" style={{ fontSize: '8px', color: 'var(--ash)', marginTop: '6px', opacity: 0.7 }}>
                {result.mood}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
            <button
              onClick={handleNarrate}
              title={narrating ? 'Stop narration' : 'Narrate aloud'}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '6px 10px',
                background: narrating ? 'rgba(212,168,75,0.1)' : 'var(--bg-1)',
                border: `1px solid ${narrating ? 'var(--border-hi)' : 'var(--border)'}`,
                borderRadius: 'var(--radius)',
                color: narrating ? 'var(--gold)' : 'var(--ash)',
                cursor: 'pointer', transition: 'var(--transition)',
                fontSize: '8px',
              }}
            >
              {narrating ? <StopIcon /> : <NarrateIcon />}
              <span className="label" style={{ fontSize: '6px' }}>
                {narrating ? 'Stop' : 'Narrate'}
              </span>
            </button>

            <button
              onClick={handleCopy}
              title="Copy to clipboard"
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '6px 10px',
                background: copied ? 'rgba(212,168,75,0.08)' : 'var(--bg-1)',
                border: `1px solid ${copied ? 'rgba(212,168,75,0.3)' : 'var(--border)'}`,
                borderRadius: 'var(--radius)',
                color: copied ? 'var(--gold)' : 'var(--ash)',
                cursor: 'pointer', transition: 'var(--transition)',
              }}
            >
              <CopyIcon />
              <span className="label" style={{ fontSize: '6px' }}>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Tags */}
        {result.tags?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '12px' }}>
            {result.tags.map((tag, i) => (
              <span key={i} className="tag" style={{ fontSize: '6px' }}>{tag}</span>
            ))}
          </div>
        )}
      </div>

      {/* ── Content ── */}
      <div style={{ padding: '24px', maxHeight: '480px', overflowY: 'auto' }}>
        {formatContent(result.content, result.output_type)}
      </div>

      {/* ── Sound Player ── */}
      {result.sound_tags?.length > 0 && (
        <SoundPlayer soundTags={result.sound_tags} />
      )}

      {/* ── Miro Workspace Integration ── */}
      <MiroWorkspace result={result} />
    </div>
  );
}