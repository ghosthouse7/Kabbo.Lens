import { useRef, useState, useCallback } from 'react';

const BACKEND = 'http://localhost:8080';

// Web Audio fallback — generates synthetic sound when ElevenLabs is unavailable
function createFallbackEngine() {
  let ctx = null;
  let masterGain = null;
  let activeNodes = [];

  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    return ctx;
  }

  function stop() {
    activeNodes.forEach(n => { try { n.stop(); } catch (_) {} });
    activeNodes = [];
    if (masterGain) { masterGain.disconnect(); masterGain = null; }
  }

  function play(tag, volume = 0.6) {
    stop();
    const ac = getCtx();
    masterGain = ac.createGain();
    masterGain.gain.setValueAtTime(volume, ac.currentTime);
    masterGain.connect(ac.destination);
    const t = tag.toLowerCase();

    if (t.includes('tram') || t.includes('bell')) {
      // Tram bell: metallic ding sequence
      [0, 0.4, 0.8].forEach(delay => {
        const osc = ac.createOscillator();
        const g = ac.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ac.currentTime + delay);
        osc.frequency.exponentialRampToValueAtTime(440, ac.currentTime + delay + 1.2);
        g.gain.setValueAtTime(0.8, ac.currentTime + delay);
        g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + delay + 1.5);
        osc.connect(g); g.connect(masterGain);
        osc.start(ac.currentTime + delay);
        osc.stop(ac.currentTime + delay + 1.5);
        activeNodes.push(osc);
      });
    } else if (t.includes('rain') || t.includes('monsoon')) {
      // Rain: filtered noise
      const buf = ac.createBuffer(1, ac.sampleRate * 4, ac.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const src = ac.createBufferSource();
      src.buffer = buf; src.loop = true;
      const filter = ac.createBiquadFilter();
      filter.type = 'bandpass'; filter.frequency.value = 1200; filter.Q.value = 0.3;
      src.connect(filter); filter.connect(masterGain);
      src.start();
      activeNodes.push(src);
    } else if (t.includes('dhak') || t.includes('drum')) {
      // Dhak: kick + snare pattern
      const pattern = [0, 0.25, 0.4, 0.75, 1.0, 1.25, 1.5, 1.75];
      pattern.forEach(delay => {
        const osc = ac.createOscillator();
        const g = ac.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(120, ac.currentTime + delay);
        osc.frequency.exponentialRampToValueAtTime(40, ac.currentTime + delay + 0.15);
        g.gain.setValueAtTime(1.0, ac.currentTime + delay);
        g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + delay + 0.2);
        osc.connect(g); g.connect(masterGain);
        osc.start(ac.currentTime + delay);
        osc.stop(ac.currentTime + delay + 0.2);
        activeNodes.push(osc);
      });
    } else if (t.includes('crow') || t.includes('bird')) {
      // Crow: descending caw
      [0, 1.2, 2.5].forEach(delay => {
        const osc = ac.createOscillator();
        const g = ac.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(600, ac.currentTime + delay);
        osc.frequency.exponentialRampToValueAtTime(200, ac.currentTime + delay + 0.3);
        g.gain.setValueAtTime(0.4, ac.currentTime + delay);
        g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + delay + 0.4);
        osc.connect(g); g.connect(masterGain);
        osc.start(ac.currentTime + delay);
        osc.stop(ac.currentTime + delay + 0.4);
        activeNodes.push(osc);
      });
    } else {
      // Street noise / adda / default: layered filtered noise
      const buf = ac.createBuffer(1, ac.sampleRate * 4, ac.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const src = ac.createBufferSource();
      src.buffer = buf; src.loop = true;
      const filter = ac.createBiquadFilter();
      filter.type = 'lowpass'; filter.frequency.value = 800;
      src.connect(filter); filter.connect(masterGain);
      src.start();
      activeNodes.push(src);
    }
  }

  return { play, stop };
}

const SOUND_ICONS = {
  'tram bells': '🚃',
  'monsoon rain': '🌧️',
  'adda chatter': '☕',
  'dhak drums': '🥁',
  'street noise': '🏙️',
  'crow calls': '🐦',
};

const SOUND_LABELS = {
  'tram bells': 'Tram Bells',
  'monsoon rain': 'Monsoon Rain',
  'adda chatter': 'Adda Chatter',
  'dhak drums': 'Dhak Drums',
  'street noise': 'Street Noise',
  'crow calls': 'Crow Calls',
};

export default function SoundPlayer({ soundTags = [] }) {
  const [playing, setPlaying] = useState(null);
  const [loading, setLoading] = useState(null);
  const [volume, setVolume] = useState(0.7);
  const [usingFallback, setUsingFallback] = useState(false);
  const audioRef = useRef(null);
  const fallback = useRef(null);

  const normalizeTags = useCallback((tags) => {
    return tags.map(tag => {
      const t = tag.toLowerCase();
      if (t.includes('tram') || t.includes('bell')) return 'tram bells';
      if (t.includes('rain') || t.includes('monsoon') || t.includes('water')) return 'monsoon rain';
      if (t.includes('adda') || t.includes('chat') || t.includes('crowd') || t.includes('voice')) return 'adda chatter';
      if (t.includes('dhak') || t.includes('drum') || t.includes('puja') || t.includes('festival')) return 'dhak drums';
      if (t.includes('crow') || t.includes('bird')) return 'crow calls';
      return 'street noise';
    });
  }, []);

  const stopAll = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    if (fallback.current) {
      fallback.current.stop();
    }
    setPlaying(null);
  }, []);

  const playSound = useCallback(async (rawTag) => {
    const tag = normalizeTags([rawTag])[0];
    if (playing === tag) { stopAll(); return; }
    stopAll();
    setLoading(tag);

    try {
      const resp = await fetch(`${BACKEND}/api/sound`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: tag }),
      });
      if (!resp.ok) throw new Error('ElevenLabs not available');
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.volume = volume;
      audio.loop = true;
      audioRef.current = audio;
      await audio.play();
      setUsingFallback(false);
      setPlaying(tag);
    } catch (_) {
      // Fallback to Web Audio synthesis
      if (!fallback.current) fallback.current = createFallbackEngine();
      fallback.current.play(tag, volume);
      setUsingFallback(true);
      setPlaying(tag);
    } finally {
      setLoading(null);
    }
  }, [playing, volume, stopAll, normalizeTags]);

  const normalizedTags = normalizeTags(soundTags);
  const uniqueTags = [...new Set(normalizedTags)];

  if (uniqueTags.length === 0) return null;

  return (
    <div style={{
      marginTop: '20px',
      padding: '16px 20px',
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(212,175,55,0.15)',
      borderRadius: '12px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <span style={{ fontSize: '11px', letterSpacing: '0.15em', color: 'rgba(212,175,55,0.7)', textTransform: 'uppercase', fontFamily: 'monospace' }}>
          Soundscape Layer
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>vol</span>
          <input
            type="range" min="0" max="1" step="0.05"
            value={volume}
            onChange={e => {
              const v = parseFloat(e.target.value);
              setVolume(v);
              if (audioRef.current) audioRef.current.volume = v;
            }}
            style={{ width: '72px', accentColor: '#d4af37', cursor: 'pointer' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {uniqueTags.map(tag => {
          const isPlaying = playing === tag;
          const isLoading = loading === tag;
          return (
            <button
              key={tag}
              onClick={() => playSound(tag)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '7px 14px',
                background: isPlaying
                  ? 'rgba(212,175,55,0.2)'
                  : 'rgba(255,255,255,0.05)',
                border: `1px solid ${isPlaying ? 'rgba(212,175,55,0.6)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '20px',
                color: isPlaying ? '#d4af37' : 'rgba(255,255,255,0.65)',
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: 'inherit',
              }}
            >
              {isLoading ? (
                <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span>
              ) : isPlaying ? (
                <WaveformBars />
              ) : (
                <span>{SOUND_ICONS[tag] || '🔊'}</span>
              )}
              <span>{SOUND_LABELS[tag] || tag}</span>
              {isPlaying && (
                <span style={{ fontSize: '10px', opacity: 0.7 }}>■</span>
              )}
            </button>
          );
        })}
      </div>

      {usingFallback && playing && (
        <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', marginTop: '10px', margin: '10px 0 0' }}>
          ∿ Synthetic audio (add ELEVENLABS_API_KEY for cinematic quality)
        </p>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes bar { 0%,100% { transform: scaleY(0.4); } 50% { transform: scaleY(1); } }
      `}</style>
    </div>
  );
}

function WaveformBars() {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: '2px', height: '14px' }}>
      {[0, 0.15, 0.3, 0.45].map((delay, i) => (
        <span key={i} style={{
          width: '2px', height: '100%', background: '#d4af37', borderRadius: '1px',
          animation: `bar 0.7s ease-in-out ${delay}s infinite`,
          display: 'inline-block',
        }} />
      ))}
    </span>
  );
}