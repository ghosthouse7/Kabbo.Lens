import { useState } from 'react';
import SoundPlayer from './SoundPlayer';
import MiroWorkspace from './MiroWorkspace';

export default function ResultPanel({ result, loading, image, era, onTabChange }) {
  const [copied, setCopied] = useState(false);
  const [showMiro, setShowMiro] = useState(false);

  const copy = () => {
    if (!result) return;
    navigator.clipboard.writeText(`${result.title}\n${result.mood}\n\n${result.content}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const exportPDF = async () => {
    if (!result) return;
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    document.head.appendChild(script);
    await new Promise(r => (script.onload = r));
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = 210, H = 297;
    doc.setFillColor(9, 8, 10); doc.rect(0, 0, W, H, 'F');
    doc.setFillColor(20, 16, 12);
    doc.rect(0, 0, 14, H, 'F'); doc.rect(W - 14, 0, 14, H, 'F');
    for (let y = 8; y < H; y += 18) {
      doc.setFillColor(180, 140, 70, 70);
      doc.roundedRect(2, y, 10, 11, 1, 1, 'F');
      doc.roundedRect(W - 12, y, 10, 11, 1, 1, 'F');
    }
    doc.setTextColor(214, 179, 106); doc.setFontSize(28); doc.setFont('helvetica', 'italic');
    doc.text('Kabbo.Lens', W / 2, 28, { align: 'center' });
    doc.setFontSize(7); doc.setFont('courier', 'normal'); doc.setTextColor(150, 120, 60);
    doc.text('GENERATIVE CULTURAL MEMORY ENGINE · KOLKATA', W / 2, 36, { align: 'center' });
    doc.setDrawColor(214, 179, 106, 40); doc.line(18, 40, W - 18, 40);
    if (image?.url) {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image(); img.src = image.url;
        await new Promise(r => { img.onload = r; });
        canvas.width = img.width; canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        doc.addImage(canvas.toDataURL('image/jpeg', 0.85), 'JPEG', 18, 44, 174, 78);
      } catch (_) {}
    }
    doc.setDrawColor(214, 179, 106, 30); doc.line(18, 126, W - 18, 126);
    doc.setTextColor(214, 179, 106); doc.setFontSize(22); doc.setFont('helvetica', 'bolditalic');
    doc.text(result.title || 'Untitled', W / 2, 138, { align: 'center' });
    if (result.mood) {
      doc.setFontSize(8); doc.setFont('courier', 'normal'); doc.setTextColor(200, 180, 140);
      doc.text(result.mood.toUpperCase(), W / 2, 147, { align: 'center' });
    }
    doc.setDrawColor(214, 179, 106, 20); doc.line(18, 152, W - 18, 152);
    doc.setTextColor(220, 205, 180); doc.setFontSize(10); doc.setFont('times', 'normal');
    const lines = doc.splitTextToSize(result.content || '', 170);
    doc.text(lines.slice(0, 22), 20, 162);
    doc.setFontSize(7); doc.setFont('courier', 'normal'); doc.setTextColor(120, 100, 60);
    doc.text(`${result.location || 'Kolkata'} · ${result.era || ''} · Kabbo.Lens`, W / 2, H - 8, { align: 'center' });
    doc.save(`kabbolens-${(result.title || 'output').replace(/\s+/g, '-').toLowerCase()}.pdf`);
  };

  // ── Loading state ──
  if (loading) {
    return (
      <div style={{
        height: '480px',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '22px',
        background: 'var(--bg-1)',
      }}>
        {/* Spinning reel */}
        <svg width="52" height="52" viewBox="0 0 52 52" style={{ animation: 'spin 1.8s linear infinite' }}>
          <circle cx="26" cy="26" r="22" stroke="rgba(214,179,106,0.1)" strokeWidth="2" fill="none"/>
          <circle cx="26" cy="26" r="22" stroke="var(--gold)" strokeWidth="2" fill="none"
            strokeDasharray="28 110" strokeLinecap="round"/>
          <circle cx="26" cy="26" r="6" fill="rgba(214,179,106,0.12)"/>
          <circle cx="26" cy="26" r="3" fill="var(--gold)"/>
          <circle cx="26" cy="11" r="2.5" fill="rgba(214,179,106,0.4)"/>
          <circle cx="26" cy="41" r="2.5" fill="rgba(214,179,106,0.4)"/>
          <circle cx="11" cy="26" r="2.5" fill="rgba(214,179,106,0.4)"/>
          <circle cx="41" cy="26" r="2.5" fill="rgba(214,179,106,0.4)"/>
        </svg>
        <div className="label" style={{ animation: 'shimmer 2s ease infinite', letterSpacing: '0.35em' }}>
          Decoding visual DNA…
        </div>
        <div className="mono" style={{ fontSize: '10px', color: 'var(--cream-faint)', opacity: 0.5 }}>
          Analysing composition · Mapping heritage · Generating narrative
        </div>
      </div>
    );
  }

  // ── Empty state ──
  if (!result) {
    return (
      <div style={{
        height: '480px',
        border: '1px dashed var(--border)',
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '14px',
        background: 'rgba(214,179,106,0.01)',
      }}>
        <div style={{ fontSize: '36px', opacity: 0.1 }}>🎞️</div>
        <div className="label" style={{ opacity: 0.35 }}>Output appears here</div>
      </div>
    );
  }

  // ── Result ──
  return (
    <div className="card anim-fade-up" style={{ overflow: 'hidden', borderRadius: 'var(--radius-lg)' }}>

      {/* ── Header ── */}
      <div style={{
        padding: '22px 24px 18px',
        borderBottom: '1px solid var(--border)',
        background: 'linear-gradient(135deg, rgba(214,179,106,0.04) 0%, transparent 60%)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              fontWeight: 300,
              fontSize: '24px',
              color: 'var(--gold)',
              lineHeight: 1.2,
              marginBottom: '5px',
              letterSpacing: '-0.02em',
            }}>
              {result.title || 'Untitled'}
            </h2>
            {result.mood && (
              <div className="label" style={{ fontSize: '8px', marginBottom: '6px' }}>
                {result.mood}
              </div>
            )}
            {(result.location || result.era) && (
              <div className="mono" style={{ fontSize: '10px', color: 'var(--gold-dim)', letterSpacing: '0.05em' }}>
                📍 {result.location} {result.era && `· ${result.era}`}
              </div>
            )}
          </div>

          {/* Tags */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'flex-end', maxWidth: '180px' }}>
            {result.tags?.slice(0, 4).map((tag, i) => (
              <span key={i} className="tag">{tag}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div
        className="scroll-area fraunces"
        style={{
          padding: '20px 24px',
          whiteSpace: 'pre-wrap',
          lineHeight: 2.1,
          fontSize: '13.5px',
          color: 'rgba(244,239,228,0.7)',
          maxHeight: '280px',
          fontFamily: 'var(--font-display)',
          fontWeight: 300,
          letterSpacing: '0.01em',
          background: 'linear-gradient(to bottom, transparent, rgba(214,179,106,0.01))',
        }}
      >
        {result.content}
      </div>

      {/* ── Sound Player ── */}
      {result.sound_tags?.length > 0 && (
        <SoundPlayer soundTags={result.sound_tags} />
      )}

      {/* ── Actions ── */}
      <div style={{
        padding: '14px 20px 18px',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
        alignItems: 'center',
      }}>
        <button className="btn btn-ghost" onClick={copy}>
          {copied ? '✓ Copied' : 'Copy Text'}
        </button>
        <button className="btn btn-ghost" onClick={exportPDF}>
          ↓ PDF Zine
        </button>
        <button
          className="btn btn-ghost"
          onClick={() => setShowMiro(v => !v)}
          style={{ borderColor: showMiro ? 'var(--border-mid)' : 'var(--border)', color: showMiro ? 'var(--gold)' : undefined }}
        >
          ⊕ Miro Board
        </button>
        <button className="btn btn-ghost" onClick={() => onTabChange('map')}>
          📍 View on Map
        </button>
      </div>

      {/* ── Miro workspace ── */}
      {showMiro && <MiroWorkspace result={result} />}
    </div>
  );
}