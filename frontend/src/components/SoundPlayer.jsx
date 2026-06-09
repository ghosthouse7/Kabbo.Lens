import { useState, useRef } from 'react';

const BACKEND = 'https://kabbolens-production.up.railway.app';

// Web Audio synthesis fallback
function synthesizeSound(tag, ctx) {
  const master = ctx.createGain();
  master.gain.value = 0.28;
  master.connect(ctx.destination);
  const t = tag.toLowerCase();

  if (t.includes('tram') || t.includes('bell')) {
    [880, 1320, 660].forEach((freq, i) => {
      const osc = ctx.createOscillator(), g = ctx.createGain();
      osc.connect(g); g.connect(master); osc.type = 'sine'; osc.frequency.value = freq;
      g.gain.setValueAtTime(0.6 / (i + 1), ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.5 - i * 0.3);
      osc.start(); osc.stop(ctx.currentTime + 2.5);
    });
    return { stop: () => {} };
  }
  if (t.includes('rain') || t.includes('monsoon')) {
    const buf = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.8;
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 800; f.Q.value = 0.3;
    src.connect(f); f.connect(master); src.start();
    return { stop: () => { try { src.stop(); } catch (e) {} } };
  }
  if (t.includes('dhak') || t.includes('drum')) {
    const beat = (time, freq, decay) => {
      const osc = ctx.createOscillator(), g = ctx.createGain();
      osc.connect(g); g.connect(master);
      osc.frequency.value = freq;
      osc.frequency.exponentialRampToValueAtTime(freq * 0.4, time + decay);
      g.gain.setValueAtTime(1, time);
      g.gain.exponentialRampToValueAtTime(0.001, time + decay);
      osc.start(time); osc.stop(time + decay);
    };
    [0, 0.28, 0.56, 0.7, 0.98, 1.12].forEach(t => beat(ctx.currentTime + t, 100, 0.25));
    [0.14, 0.42, 0.84].forEach(t => beat(ctx.currentTime + t, 60, 0.18));
    return { stop: () => {} };
  }
  if (t.includes('crow') || t.includes('bird')) {
    [0, 0.6, 1.2].forEach(delay => {
      const osc = ctx.createOscillator(), g = ctx.createGain();
      osc.connect(g); g.connect(master); osc.type = 'sawtooth'; osc.frequency.value = 380;
      const T = ctx.currentTime + delay;
      g.gain.setValueAtTime(0, T);
      g.gain.linearRampToValueAtTime(0.5, T + 0.04);
      g.gain.setValueAtTime(0.5, T + 0.18);
      g.gain.exponentialRampToValueAtTime(0.001, T + 0.38);
      osc.start(T); osc.stop(T + 0.4);
    });
    return { stop: () => {} };
  }
  if (t.includes('adda') || t.includes('chatter') || t.includes('crowd')) {
    const handles = [];
    for (let i = 0; i < 6; i++) {
      const osc = ctx.createOscillator(), g = ctx.createGain(),
            lfo = ctx.createOscillator(), lfoG = ctx.createGain();
      lfo.frequency.value = 1.5 + Math.random() * 3; lfoG.gain.value = 40;
      lfo.connect(lfoG); lfoG.connect(osc.frequency);
      osc.connect(g); g.connect(master);
      osc.frequency.value = 120 + Math.random() * 220; g.gain.value = 0.03;
      lfo.start(); osc.start(); handles.push(lfo, osc);
    }
    return { stop: () => handles.forEach(h => { try { h.stop(); } catch (e) {} }) };
  }
  if (t.includes('river') || t.includes('hooghly') || t.includes('ghat')) {
    const buf = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 600;
    src.connect(f); f.connect(master); src.start();
    return { stop: () => { try { src.stop(); } catch (e) {} } };
  }
  // default street noise
  const buf = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.4;
  const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
  const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1000;
  src.connect(f); f.connect(master); src.start();
  return { stop: () => { try { src.stop(); } catch (e) {} } };
}

const SOUND_META = {
  'tram bells':   { label: 'Tram Bell',    desc: 'Maidan tram depot'   },
  'monsoon rain': { label: 'Monsoon Rain', desc: 'Kolkata downpour'    },
  'dhak drums':   { label: 'Dhak Drums',   desc: 'Durga Puja rhythm'   },
  'adda chatter': { label: 'Adda Chatter', desc: 'College St. chai'    },
  'crow calls':   { label: 'Crow Calls',   desc: 'Rooftop at dawn'     },
  'street noise': { label: 'Street Noise', desc: 'North Kolkata lane'  },
  'river sounds': { label: 'River Ghat',   desc: 'Hooghly ferry'       },
};

function normalizeTag(tag) {
  const t = tag.toLowerCase();
  if (t.includes('tram') || t.includes('bell'))     return 'tram bells';
  if (t.includes('rain') || t.includes('monsoon'))  return 'monsoon rain';
  if (t.includes('dhak') || t.includes('drum'))     return 'dhak drums';
  if (t.includes('adda') || t.includes('chatter'))  return 'adda chatter';
  if (t.includes('crow') || t.includes('bird'))     return 'crow calls';
  if (t.includes('river') || t.includes('hooghly')) return 'river sounds';
  return 'street noise';
}

const Icons = {
  play:  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  pause: <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>,
  vol:   <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>,
};

export default function SoundPlayer({ soundTags = [] }) {
  const [playing,  setPlaying]  = useState(null);
  const [loading,  setLoading]  = useState(null);
  const [volume,   setVolume]   = useState(0.7);
  const [progress, setProgress] = useState({});
  const [synth,    setSynth]    = useState({});
  const [error,    setError]    = useState({});
  const audioRef    = useRef(null);
  const audioCtxRef = useRef(null);
  const fallbackRef = useRef(null);
  const cacheRef    = useRef({});   // keyed by canonical tag

  const stopAll = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.ontimeupdate = null;
      audioRef.current = null;
    }
    if (fallbackRef.current?.stop) {
      fallbackRef.current.stop();
      fallbackRef.current = null;
    }
  };

  const playTag = async (rawTag) => {
    // Toggle off
    if (playing === rawTag) {
      stopAll();
      setPlaying(null);
      return;
    }
    stopAll();
    setLoading(rawTag);
    setError(e => ({ ...e, [rawTag]: null }));

    const canonical = normalizeTag(rawTag);

    // ── Try real audio from backend ──────────────────────────────────────────
    try {
      let url = cacheRef.current[canonical];

      if (!url) {
        const res = await fetch(`${BACKEND}/api/sound`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: canonical }),
        });

        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(`Backend ${res.status}: ${text.slice(0, 80)}`);
        }

        // Check content-type — if JSON it's an error object, not audio
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          const json = await res.json();
          throw new Error(json.error || 'Sound API returned JSON instead of audio');
        }

        const blob = await res.blob();
        if (blob.size < 1000) throw new Error('Audio blob too small — likely empty response');

        url = URL.createObjectURL(blob);
        cacheRef.current[canonical] = url;
      }

      const audio = new Audio(url);
      audio.volume = volume;
      audio.loop   = true;
      audio.ontimeupdate = () => {
        if (audio.duration > 0)
          setProgress(p => ({ ...p, [rawTag]: audio.currentTime / audio.duration }));
      };
      audio.onerror = () => {
        console.warn('Audio element error — falling back to synth');
        delete cacheRef.current[canonical];
      };
      await audio.play();
      audioRef.current = audio;
      setSynth(s => ({ ...s, [rawTag]: false }));
      setPlaying(rawTag);

    } catch (err) {
      console.warn(`[SoundPlayer] Backend audio failed (${err.message}) — using synth fallback`);

      // ── Synthesizer fallback ───────────────────────────────────────────────
      try {
        if (!audioCtxRef.current || audioCtxRef.current.state === 'closed')
          audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') await ctx.resume();

        fallbackRef.current = synthesizeSound(canonical, ctx);
        setSynth(s => ({ ...s, [rawTag]: true }));
        setPlaying(rawTag);
      } catch (synthErr) {
        console.error('[SoundPlayer] Synth fallback also failed:', synthErr);
        setError(e => ({ ...e, [rawTag]: 'Could not play audio' }));
      }
    } finally {
      setLoading(null);
    }
  };

  const handleVolume = (v) => {
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  };

  const uniqueTags = [...new Set(soundTags.filter(Boolean))];
  if (!uniqueTags.length) return null;

  return (
    <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', background: 'rgba(0,0,0,0.18)' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div className="label" style={{ fontSize: '7px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2">
            <path d="M9 18V5l12-2v13"/>
            <circle cx="6" cy="18" r="3"/>
            <circle cx="18" cy="16" r="3"/>
          </svg>
          Ambient Soundscape
        </div>
        {playing && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {Icons.vol}
            <input
              type="range" min="0" max="1" step="0.05" value={volume}
              onChange={e => handleVolume(parseFloat(e.target.value))}
              style={{
                appearance: 'none', width: '70px', height: '2px', outline: 'none', cursor: 'pointer', border: 'none',
                background: `linear-gradient(90deg,var(--gold) ${volume * 100}%,rgba(212,168,75,0.15) ${volume * 100}%)`,
              }}
            />
            <span className="mono" style={{ fontSize: '8px', color: 'var(--ash)', minWidth: '28px' }}>
              {Math.round(volume * 100)}%
            </span>
          </div>
        )}
      </div>

      {/* Tracks */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: '8px' }}>
        {uniqueTags.map(rawTag => {
          const canonical = normalizeTag(rawTag);
          const meta      = SOUND_META[canonical] || { label: rawTag, desc: '' };
          const isPlaying = playing === rawTag;
          const isLoading = loading === rawTag;
          const isSynth   = synth[rawTag];
          const hasError  = error[rawTag];
          const prog      = progress[rawTag] || 0;

          return (
            <button
              key={rawTag}
              onClick={() => playTag(rawTag)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 12px',
                border: `1px solid ${isPlaying ? 'var(--border-hi)' : hasError ? 'rgba(200,80,80,0.3)' : 'var(--border)'}`,
                borderRadius: 'var(--radius)',
                background: isPlaying ? 'rgba(212,168,75,0.07)' : 'var(--bg-1)',
                cursor: 'pointer', transition: 'var(--transition)',
                textAlign: 'left', position: 'relative', overflow: 'hidden',
              }}
            >
              {/* Progress bar */}
              {isPlaying && !isSynth && (
                <div style={{ position: 'absolute', bottom: 0, left: 0, height: '2px', width: `${prog * 100}%`, background: 'var(--gold)', transition: 'width 0.5s linear' }} />
              )}

              {/* Play/Pause circle */}
              <div style={{
                width: '28px', height: '28px', flexShrink: 0, borderRadius: '50%',
                border: `1px solid ${isPlaying ? 'var(--border-hi)' : 'var(--border-mid)'}`,
                background: isPlaying ? 'rgba(212,168,75,0.14)' : 'var(--bg-2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: isPlaying ? 'var(--gold)' : 'var(--ash)',
              }}>
                {isLoading ? (
                  <div style={{ width: '10px', height: '10px', border: '1.5px solid rgba(212,168,75,0.3)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                ) : isPlaying ? Icons.pause : Icons.play}
              </div>

              {/* Label */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: 'var(--font-display)', fontStyle: isPlaying ? 'italic' : 'normal',
                  fontSize: '13px', fontWeight: 300,
                  color: hasError ? 'rgba(200,80,80,0.8)' : isPlaying ? 'var(--gold)' : 'var(--cream-faint)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {meta.label}
                </div>
                <div className="label" style={{ fontSize: '6px', marginTop: '1px', opacity: 0.6 }}>
                  {hasError ? 'unavailable' : isPlaying ? (isSynth ? 'synthesized' : 'streaming') : meta.desc}
                </div>
              </div>

              {/* EQ bars when playing */}
              {isPlaying && (
                <div style={{ display: 'flex', gap: '2px', alignItems: 'flex-end', height: '14px', flexShrink: 0 }}>
                  {[0, 1, 2, 3].map(i => (
                    <div key={i} style={{
                      width: '2px', background: 'var(--gold)', borderRadius: '1px',
                      height: `${5 + i * 2.5}px`,
                      animation: `eq ${0.35 + i * 0.09}s ease-in-out infinite alternate`,
                      transformOrigin: 'bottom',
                    }} />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes eq { from { transform: scaleY(0.3) } to { transform: scaleY(1) } }
        input[type=range]::-webkit-slider-thumb { appearance: none; width: 10px; height: 10px; border-radius: 50%; background: var(--gold); cursor: pointer; }
      `}</style>
    </div>
  );
}
