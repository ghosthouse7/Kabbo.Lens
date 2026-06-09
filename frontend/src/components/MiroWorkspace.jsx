import { useState } from 'react';

const BACKEND = 'https://kabbolens-production.up.railway.app';
const STEPS = [
  'Authenticating with Miro…',
  'Drafting new canvas…',
  'Injecting creative assets…',
  'Pinning digital sticky notes…',
  'Finalising workspace…',
];

export default function MiroWorkspace({ result }) {
  const [status, setStatus] = useState('idle'); 
  const [step, setStep] = useState(0);
  const [boardUrl, setBoardUrl] = useState('');
  const [errMsg, setErrMsg] = useState('');

  const create = async () => {
    setStatus('loading');
    setStep(0);
    const stepInterval = setInterval(() => {
      setStep(prev => prev < STEPS.length - 1 ? prev + 1 : (clearInterval(stepInterval), prev));
    }, 900);

    try {
      const res = await fetch(`${BACKEND}/api/miro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ result }),
      });
      if (!res.ok) throw new Error('Failed to create Miro board');
      const data = await res.json();
      setBoardUrl(data.board_url);
      setStatus('done');
    } catch (err) {
      setErrMsg(err.message);
      setStatus('error');
    } finally {
      clearInterval(stepInterval);
    }
  };
  return (
    <div style={{ margin: '0', padding: '16px 24px', borderTop: '1px solid var(--border)', background: 'rgba(0,0,0,0.15)' }}>
      <div className="label" style={{ fontSize: '7px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
        Miro Workspace Integration
      </div>

      {status === 'idle' && (
        <button className="btn btn-primary" onClick={create} style={{ width: '100%', padding: '12px', justifyContent: 'center', fontSize: '9px', letterSpacing: '0.15em', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          Generate Brainstorm Board
        </button>
      )}

      {status === 'loading' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {STEPS.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', opacity: i <= step ? 1 : 0.2 }}>
              <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: `1px solid ${i <= step ? 'var(--gold)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {i === step && <div style={{ width: '6px', height: '6px', background: 'var(--gold)', borderRadius: '50%' }} />}
              </div>
              <span className="mono" style={{ fontSize: '9px', color: 'var(--cream-faint)' }}>{s}</span>
            </div>
          ))}
        </div>
      )}

      {status === 'done' && (
        <a href={boardUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: '9px', textDecoration: 'none', background: 'var(--gold)', color: '#000' }}>
          Open Miro Canvas ↗
        </a>
      )}
      
      {status === 'error' && <div className="mono" style={{ fontSize: '9px', color: 'var(--red)' }}>✕ {errMsg}</div>}
    </div>
  );
}