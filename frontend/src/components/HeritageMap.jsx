import { useEffect, useRef, useState } from 'react';

const BACKEND = '[https://kabbolens-production.up.railway.app](https://kabbolens-production.up.railway.app)';

const KOLKATA_PINS = [
  { name: 'College Street', lat: 22.5796, lng: 88.3630, icon: '📚' },
  { name: 'Howrah Bridge', lat: 22.5851, lng: 88.3468, icon: '🌉' },
  { name: 'Kumartuli', lat: 22.5958, lng: 88.3610, icon: '🏺' },
  { name: 'Maidan Tram Depot', lat: 22.5553, lng: 88.3424, icon: '🚃' },
  { name: 'Rabindra Sarani', lat: 22.5726, lng: 88.3639, icon: '🎭' },
  { name: 'Park Street', lat: 22.5533, lng: 88.3521, icon: '🎷' },
  { name: 'Jorasanko', lat: 22.5867, lng: 88.3604, icon: '🪔' },
  { name: 'Shyambazar', lat: 22.5990, lng: 88.3720, icon: '⚡' },
  { name: 'Esplanade', lat: 22.5657, lng: 88.3511, icon: '🕰️' },
];

export default function HeritageMap({ archiveEntries = [] }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [guideText, setGuideText] = useState('');
  const [guideLoading, setGuideLoading] = useState(false);
  const [question, setQuestion] = useState('');
  const [guideTab, setGuideTab] = useState('guide'); // 'guide' | 'chat'
  const [chatHistory, setChatHistory] = useState([]);

  useEffect(() => {
    if (mapInstance.current) return;

    // Load Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
      document.head.appendChild(link);
    }

    // Load Leaflet JS
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
    script.onload = initMap;
    document.head.appendChild(script);

    return () => {};
  }, []);

  function initMap() {
    const L = window.L;
    const map = L.map(mapRef.current, {
      center: [22.5726, 88.3639],
      zoom: 13,
      zoomControl: true,
    });

    // Carto Dark Matter tiles — premium look
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap © CARTO',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    mapInstance.current = map;

    // Add heritage pins
    KOLKATA_PINS.forEach(pin => {
      const icon = L.divIcon({
        className: '',
        html: `<div style="
          width:36px; height:36px; border-radius:50%;
          background: rgba(212,175,55,0.15);
          border: 2px solid rgba(212,175,55,0.7);
          display:flex; align-items:center; justify-content:center;
          font-size:16px; cursor:pointer;
          box-shadow: 0 0 12px rgba(212,175,55,0.3);
          transition: all 0.2s;
        ">${pin.icon}</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const marker = L.marker([pin.lat, pin.lng], { icon })
        .addTo(map)
        .on('click', () => openGuide(pin.name));

      markersRef.current.push({ marker, name: pin.name });
    });
  }

  // Add archive story pins dynamically
  useEffect(() => {
    const L = window.L;
    if (!mapInstance.current || !L) return;

    archiveEntries.forEach(entry => {
      const icon = L.divIcon({
        className: '',
        html: `<div style="
          width:28px; height:28px; border-radius:6px;
          background: rgba(255,100,100,0.15);
          border: 2px solid rgba(255,100,100,0.6);
          display:flex; align-items:center; justify-content:center;
          font-size:12px; cursor:pointer;
          box-shadow: 0 0 8px rgba(255,100,100,0.2);
        ">✦</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      L.marker([entry.lat, entry.lng], { icon })
        .addTo(mapInstance.current)
        .bindPopup(`
          <div style="font-family:monospace; font-size:12px; max-width:220px; color:#fff;">
            <strong style="color:#d4af37">${entry.title}</strong><br/>
            <span style="opacity:0.7">${entry.location} · ${entry.era}</span><br/>
            <span style="opacity:0.5; font-size:11px">${entry.mood}</span>
          </div>
        `, {
          className: 'kabbo-popup',
        });
    });
  }, [archiveEntries]);

  async function openGuide(locationName) {
    setSelectedLocation(locationName);
    setGuideText('');
    setChatHistory([]);
    setGuideTab('guide');
    setGuideLoading(true);

    try {
      const res = await fetch(`${BACKEND}/api/guide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location: locationName }),
      });
      const data = await res.json();
      setGuideText(data.guide || 'Dadu is taking a nap. Try again!');
    } catch (_) {
      setGuideText('Could not reach Dadu. Check your backend is running.');
    } finally {
      setGuideLoading(false);
    }
  }

  async function askQuestion() {
    if (!question.trim()) return;
    const q = question;
    setQuestion('');
    setChatHistory(prev => [...prev, { role: 'user', text: q }]);

    try {
      const res = await fetch(`${BACKEND}/api/guide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location: selectedLocation, question: q }),
      });
      const data = await res.json();
      setChatHistory(prev => [...prev, { role: 'dadu', text: data.guide }]);
    } catch (_) {
      setChatHistory(prev => [...prev, { role: 'dadu', text: 'Arre, connection gelo! Try again.' }]);
    }
  }

  const pinInfo = KOLKATA_PINS.find(p => p.name === selectedLocation);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '500px', borderRadius: '12px', overflow: 'hidden' }}>
      {/* Leaflet Map */}
      <div ref={mapRef} style={{ width: '100%', height: '100%', minHeight: '500px' }} />

      {/* Legend */}
      <div style={{
        position: 'absolute', bottom: '16px', left: '16px', zIndex: 1000,
        background: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(8px)',
        border: '1px solid rgba(212,175,55,0.2)',
        borderRadius: '8px', padding: '10px 14px',
        fontSize: '11px', color: 'rgba(255,255,255,0.6)',
        fontFamily: 'monospace',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '50%', border: '2px solid rgba(212,175,55,0.7)', display: 'inline-block' }} />
          Heritage locations
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '3px', border: '2px solid rgba(255,100,100,0.6)', display: 'inline-block' }} />
          Generated stories
        </div>
      </div>

      {/* Guide Instruction */}
      <div style={{
        position: 'absolute', top: '16px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000,
        background: 'rgba(10,10,10,0.75)', backdropFilter: 'blur(8px)',
        border: '1px solid rgba(212,175,55,0.2)', borderRadius: '20px',
        padding: '6px 16px', fontSize: '11px', color: 'rgba(255,255,255,0.5)',
        fontFamily: 'monospace', pointerEvents: 'none', whiteSpace: 'nowrap',
      }}>
        Click any pin to meet Dadu, your heritage guide
      </div>

      {/* Guide Panel */}
      {selectedLocation && (
        <div style={{
          position: 'absolute', top: '16px', right: '16px', zIndex: 1000,
          width: '300px', maxHeight: '420px',
          background: 'rgba(8,8,8,0.95)', backdropFilter: 'blur(16px)',
          border: '1px solid rgba(212,175,55,0.3)',
          borderRadius: '12px', overflow: 'hidden',
          boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Header */}
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid rgba(212,175,55,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <span style={{ fontSize: '16px', marginRight: '8px' }}>{pinInfo?.icon || '📍'}</span>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#d4af37', fontFamily: 'serif' }}>
                {selectedLocation}
              </span>
            </div>
            <button
              onClick={() => setSelectedLocation(null)}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '16px', padding: '0' }}
            >
              ×
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            {['guide', 'chat'].map(tab => (
              <button
                key={tab}
                onClick={() => setGuideTab(tab)}
                style={{
                  flex: 1, padding: '8px', background: 'none',
                  border: 'none', cursor: 'pointer',
                  fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase',
                  fontFamily: 'monospace',
                  color: guideTab === tab ? '#d4af37' : 'rgba(255,255,255,0.35)',
                  borderBottom: guideTab === tab ? '2px solid #d4af37' : '2px solid transparent',
                  transition: 'all 0.2s',
                }}
              >
                {tab === 'guide' ? '🧓 Dadu Says' : '💬 Ask Dadu'}
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
            {guideTab === 'guide' ? (
              guideLoading ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ fontSize: '24px', animation: 'pulse 1.5s ease-in-out infinite' }}>🧓</div>
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '8px', fontFamily: 'monospace' }}>
                    Dadu is remembering...
                  </p>
                </div>
              ) : (
                <p style={{
                  fontSize: '13px', lineHeight: '1.65',
                  color: 'rgba(255,255,255,0.8)',
                  fontFamily: 'Georgia, serif',
                  margin: 0,
                }}>
                  {guideText}
                </p>
              )
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {chatHistory.length === 0 && (
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', textAlign: 'center', padding: '8px 0' }}>
                    Ask Dadu anything about {selectedLocation}
                  </p>
                )}
                {chatHistory.map((msg, i) => (
                  <div key={i} style={{
                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    background: msg.role === 'user'
                      ? 'rgba(212,175,55,0.15)'
                      : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${msg.role === 'user' ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: '8px',
                    padding: '8px 10px',
                    fontSize: '12px',
                    lineHeight: '1.5',
                    color: msg.role === 'user' ? '#d4af37' : 'rgba(255,255,255,0.8)',
                    fontFamily: msg.role === 'user' ? 'monospace' : 'Georgia, serif',
                  }}>
                    {msg.role === 'dadu' && <span style={{ fontSize: '10px', opacity: 0.5, display: 'block', marginBottom: '4px' }}>🧓 Dadu</span>}
                    {msg.text}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chat Input */}
          {guideTab === 'chat' && (
            <div style={{
              padding: '10px 12px',
              borderTop: '1px solid rgba(255,255,255,0.05)',
              display: 'flex', gap: '8px',
            }}>
              <input
                value={question}
                onChange={e => setQuestion(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && askQuestion()}
                placeholder="Ask about hidden secrets..."
                style={{
                  flex: 1, background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px',
                  padding: '7px 10px', color: '#fff', fontSize: '12px',
                  fontFamily: 'monospace', outline: 'none',
                }}
              />
              <button
                onClick={askQuestion}
                style={{
                  padding: '7px 12px',
                  background: 'rgba(212,175,55,0.2)',
                  border: '1px solid rgba(212,175,55,0.4)',
                  borderRadius: '6px', color: '#d4af37',
                  cursor: 'pointer', fontSize: '13px',
                }}
              >
                →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Popup styles */}
      <style>{`
        .kabbo-popup .leaflet-popup-content-wrapper {
          background: rgba(10,10,10,0.95) !important;
          border: 1px solid rgba(212,175,55,0.3) !important;
          border-radius: 8px !important;
          color: #fff !important;
        }
        .kabbo-popup .leaflet-popup-tip { background: rgba(10,10,10,0.95) !important; }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
      `}</style>
    </div>
  );
}