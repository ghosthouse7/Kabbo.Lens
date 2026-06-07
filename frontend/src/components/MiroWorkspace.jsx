import { useState } from 'react';

const STEPS = [
  'Creating board…',
  'Adding title card…',
  'Mapping scenes…',
  'Layering soundscape…',
  'Finalising layout…',
];

export default function MiroWorkspace({ result }) {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [miroUrl, setMiroUrl] = useState(null);
  const [error, setError] = useState(null);

  const build = async () => {
    if (!token.trim()) return;
    setLoading(true); setError(null); setStep(0);

    const tick = (i) => setTimeout(() => setStep(i), i * 700);
    STEPS.forEach((_, i) => tick(i));

    try {
      // 1. Create board
      const boardResp = await fetch('https://api.miro.com/v2/boards', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Kabbo.Lens — ${result.title || 'Untitled'}`,
          description: result.mood || '',
        }),
      });
      const board = await boardResp.json();
      if (!board.id) throw new Error(board.message || 'Board creation failed');
      const bid = board.id;

      const postSticky = (content, fillColor, x, y, width = 340) =>
        fetch(`https://api.miro.com/v2/boards/${bid}/sticky_notes`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: { content, shape: 'rectangle' },
            style: { fillColor },
            geometry: { width },
            position: { x, y },
          }),
        });

      // 2. Title
      await postSticky(
        `<p><strong>${result.title || 'Kabbo.Lens'}</strong></p><p>${result.mood || ''}</p>`,
        'yellow', 0, -320, 420
      );

      // 3. Tags
      if (result.tags?.length) {
        await postSticky(
          `<p><strong>Tags</strong></p><p>${result.tags.join(' · ')}</p>`,
          'light_blue', 480, -320, 300
        );
      }

      // 4. Content cards
      const lines = (result.content || '').split('\n').filter(l => l.trim());
      const colors = ['light_green', 'light_pink', 'light_yellow'];
      for (let i = 0; i < Math.min(lines.length, 12); i++) {
        const col = i % 3; const row = Math.floor(i / 3);
        await postSticky(lines[i], colors[col], col * 400, row * 260);
      }

      // 5. Soundscape card
      if (result.sound_tags?.length) {
        await postSticky(
          `<p><strong>🎵 Soundscape</strong></p><p>${result.sound_tags.join(', ')}</p>`,
          'orange', 900, -320, 320
        );
      }

      setMiroUrl(board.viewLink || `https://miro.com/app/board/${bid}/`);
    } catch (err) {
      setError('Miro error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      margin: '0 20px 20px',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      background: 'var(--bg-2)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 18px',
        borderBottom: '1px solid var(--border)',
        background: 'rgba(214,179,106,0.03)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}>
        <span style={{ fontSize: '16px' }}>◫</span>
        <div>
          <div className="mono" style={{ fontSize: '11px', color: 'var(--cream-dim)', letterSpacing: '0.05em' }}>
            Creative Workspace
          </div>
          <div className="label" style={{ fontSize: '8px', marginTop: '1px' }}>
            Storyboard · Scene Breakdown · Collaboration
          </div>
        </div>
      </div>

      <div style={{ padding: '16px 18px' }}>
        {!miroUrl ? (
          <>
            {!loading ? (
              <>
                <div className="label" style={{ marginBottom: '8px' }}>Miro Access Token</div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                  <input
                    type="password"
                    placeholder="ey…"
                    value={token}
                    onChange={e => setToken(e.target.value)}
                    className="input-gold mono"
                    style={{ flex: 1, fontSize: '11px' }}
                  />
                  <button
                    className="btn btn-primary"
                    onClick={build}
                    disabled={!token.trim()}
                    style={{ padding: '9px 18px', fontSize: '9px', flexShrink: 0 }}
                  >
                    Build Board
                  </button>
                </div>
                <div className="mono" style={{ fontSize: '9px', color: 'var(--cream-faint)', lineHeight: 1.6 }}>
                  Get your token at{' '}
                  <a href="https://miro.com/app/settings/user-profile/apps" target="_blank" rel="noopener noreferrer"
                    style={{ color: 'var(--gold-dim)', textDecoration: 'none' }}>
                    miro.com → Profile → Apps
                  </a>
                </div>
              </>
            ) : (
              /* Loading steps */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '4px 0' }}>
                {STEPS.map((s, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    opacity: i <= step ? 1 : 0.25,
                    transition: 'opacity 0.4s ease',
                  }}>
                    <div style={{
                      width: '14px', height: '14px',
                      borderRadius: '50%',
                      border: `1px solid ${i < step ? 'var(--gold)' : i === step ? 'var(--gold-dim)' : 'var(--border)'}`,
                      background: i < step ? 'var(--gold-faint)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                      fontSize: '8px',
                      color: 'var(--gold)',
                    }}>
                      {i < step ? '✓' : ''}
                    </div>
                    <span className="mono" style={{
                      fontSize: '10px',
                      color: i === step ? 'var(--gold)' : i < step ? 'var(--cream-faint)' : 'transparent',
                      letterSpacing: '0.05em',
                      animation: i === step ? 'shimmer 1.5s ease infinite' : 'none',
                    }}>
                      {s}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {error && (
              <div className="mono" style={{
                marginTop: '10px',
                padding: '10px 12px',
                border: '1px solid rgba(192,57,43,0.3)',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(192,57,43,0.05)',
                color: '#e74c3c',
                fontSize: '10px',
              }}>
                {error}
              </div>
            )}
          </>
        ) : (
          /* Success */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              border: '1px solid rgba(214,179,106,0.3)',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(214,179,106,0.05)',
            }}>
              <span style={{ fontSize: '16px' }}>✓</span>
              <span className="mono" style={{ fontSize: '10px', color: 'var(--gold)', letterSpacing: '0.05em' }}>
                Miro board created successfully
              </span>
            </div>
            <a
              href={miroUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
              style={{ textDecoration: 'none', justifyContent: 'center' }}
            >
              🔗 Open Miro Board →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}