import { useEffect, useRef, useState } from 'react';

const BACKEND = 'https://kabbolens-production.up.railway.app';

const HERITAGE_PINS = [
  { name: 'College Street',    lat: 22.5796, lng: 88.3630, type: 'heritage' },
  { name: 'Howrah Bridge',     lat: 22.5851, lng: 88.3468, type: 'heritage' },
  { name: 'Kumartuli',         lat: 22.5958, lng: 88.3610, type: 'heritage' },
  { name: 'Maidan Tram Depot', lat: 22.5553, lng: 88.3424, type: 'heritage' },
  { name: 'Park Street',       lat: 22.5533, lng: 88.3521, type: 'heritage' },
  { name: 'Rabindra Sarani',   lat: 22.5726, lng: 88.3639, type: 'heritage' },
  { name: 'Jorasanko',         lat: 22.5867, lng: 88.3604, type: 'heritage' },
  { name: 'Shyambazar',        lat: 22.5990, lng: 88.3720, type: 'heritage' },
  { name: 'Esplanade',         lat: 22.5657, lng: 88.3511, type: 'heritage' },
];

export default function HeritageMap({ mapPins = [] }) {
  const mapRef          = useRef(null);
  const leafletRef      = useRef(null);
  const searchMarkerRef = useRef(null); 
  
  const [selected,     setSelected]     = useState(null);
  const [guide,        setGuide]        = useState('');
  const [guideHistory, setGuideHistory] = useState([]);
  const [question,     setQuestion]     = useState('');
  const [loadingGuide, setLoadingGuide] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [mapLoaded,    setMapLoaded]    = useState(false);

  // Load Leaflet CSS
  useEffect(() => {
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id   = 'leaflet-css';
      link.rel  = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
  }, []);

  // Init map
  useEffect(() => {
    if (leafletRef.current || !mapRef.current) return;

    const initMap = (L) => {
      if (!mapRef.current || leafletRef.current) return;

      const map = L.map(mapRef.current, {
        center: [22.5726, 88.3639],
        zoom: 13,
        zoomControl: false,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap © CARTO',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      const heritageIcon = () => L.divIcon({
        html: `<div style="
          width:10px;height:10px;border-radius:50%;
          background:rgba(212,168,75,0.9);
          border:2px solid rgba(212,168,75,0.4);
          box-shadow:0 0 12px rgba(212,168,75,0.6);
          cursor:pointer;
        "></div>`,
        className: '',
        iconSize: [10, 10],
        iconAnchor: [5, 5],
      });

      const storyIcon = L.divIcon({
        html: `<div style="
          width:10px;height:10px;border-radius:50%;
          background:rgba(100,180,120,0.9);
          border:2px solid rgba(100,180,120,0.4);
          box-shadow:0 0 12px rgba(100,180,120,0.5);
        "></div>`,
        className: '',
        iconSize: [10, 10],
        iconAnchor: [5, 5],
      });

      HERITAGE_PINS.forEach(pin => {
        const marker = L.marker([pin.lat, pin.lng], { icon: heritageIcon() }).addTo(map);
        marker.on('click', () => {
          setSelected(pin);
          setGuide('');
          setGuideHistory([]);
          setQuestion('');
          
          if (searchMarkerRef.current && window.L) {
            map.removeLayer(searchMarkerRef.current);
            searchMarkerRef.current = null;
          }
        });
      });

      mapPins.forEach(pin => {
        if (pin.lat && pin.lng) {
          const marker = L.marker([pin.lat, pin.lng], { icon: storyIcon }).addTo(map);
          marker.bindTooltip(
            `<div style="font-family:monospace;font-size:10px;background:#0f0e10;color:#d4a84b;border:1px solid rgba(212,168,75,0.2);padding:4px 8px;border-radius:3px;">${pin.title || 'Story'}</div>`,
            { permanent: false, className: '', direction: 'top' }
          );
          marker.on('click', () => {
            setSelected({ ...pin, type: 'story' });
            setGuide('');
            setGuideHistory([]);
            setQuestion('');
          });
        }
      });

      leafletRef.current = map;
      setMapLoaded(true);
    };

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => initMap(window.L);
    document.head.appendChild(script);
  }, []);

  const fetchGuide = async (locationName, userQuestion) => {
    setLoadingGuide(true);
    const q = userQuestion || 'Tell me the hidden secrets and stories of this place.';
    try {
      const res = await fetch(`${BACKEND}/api/guide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location: locationName, question: q }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const answer = data.guide || 'Dadu has no stories right now.';
      setGuide(answer);
      setGuideHistory(h => [...h, { q, a: answer }]);
      setQuestion('');
    } catch (err) {
      console.error('Guide error:', err);
      setGuide('Dadu is unavailable right now. Make sure the backend is running.');
    } finally {
      setLoadingGuide(false);
    }
  };

  const handleReverseSearch = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoadingSearch(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch(`${BACKEND}/api/identify`, {
        method: 'POST',
        body: formData
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      
      if (data.location && leafletRef.current && window.L) {
        const pin = HERITAGE_PINS.find(p => p.name === data.location);
        const lat = pin ? pin.lat : data.lat;
        const lng = pin ? pin.lng : data.lng;

        leafletRef.current.flyTo([lat, lng], 15);
        if (pin) setSelected(pin);
        
        if (searchMarkerRef.current) {
          leafletRef.current.removeLayer(searchMarkerRef.current);
        }

        // ─── THE NEW, PREMIUM FLOATING MARKER ───
        const premiumIcon = window.L.divIcon({
          html: `
            <div style="display:flex; flex-direction:column; align-items:center; margin-top: -65px; margin-left: -75px; width: 150px; animation: floatMarker 2.5s ease-in-out infinite;">
              <div style="background: rgba(15, 14, 16, 0.95); backdrop-filter: blur(8px); border: 1px solid rgba(212,168,75,0.4); padding: 8px 14px; border-radius: 4px; text-align: center; box-shadow: 0 8px 24px rgba(0,0,0,0.8);">
                <div style="font-family: var(--font-body), sans-serif; font-size: 6px; letter-spacing: 0.15em; color: var(--ash); text-transform: uppercase; margin-bottom: 4px;">
                  Location Identified
                </div>
                <div style="font-family: var(--font-display), serif; font-size: 15px; color: var(--gold); font-style: italic; line-height: 1.1;">
                  ${data.location}
                </div>
              </div>
              <div style="width: 1px; height: 18px; background: linear-gradient(to bottom, rgba(212,168,75,0.4), transparent);"></div>
              <div style="width: 6px; height: 6px; background: var(--gold); border-radius: 50%; box-shadow: 0 0 12px var(--gold);"></div>
            </div>
            <style>@keyframes floatMarker { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }</style>
          `,
          className: '',
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        });

        searchMarkerRef.current = window.L.marker([lat, lng], { icon: premiumIcon }).addTo(leafletRef.current);

        setGuide('');
        setGuideHistory([]);
        setQuestion('');
        
        const daduPrompt = `I just found this place (${data.location}) using my camera. Share a personal memory you have about this exact spot, and tell me 2 or 3 nearest cultural spots I should walk to from here.`;
        fetchGuide(data.location, daduPrompt);
        
      } else {
        alert('Could not pinpoint the Kolkata location from this image.');
      }
    } catch (err) {
      console.error(err);
      alert('Reverse Image search failed to connect to backend.');
    } finally {
      setLoadingSearch(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <div className="label" style={{ marginBottom: '8px', fontSize: '8px' }}>
          Heritage Map · Kolkata Cultural Memory
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(212,168,75,0.9)', boxShadow: '0 0 8px rgba(212,168,75,0.5)' }} />
            <span className="mono" style={{ fontSize: '8px', color: 'var(--ash)' }}>Heritage sites</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(100,180,120,0.9)', boxShadow: '0 0 8px rgba(100,180,120,0.5)' }} />
            <span className="mono" style={{ fontSize: '8px', color: 'var(--ash)' }}>Generated stories</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 340px' : '1fr', gap: '16px' }}>

        {/* Map with relative positioning for the floating button */}
        <div style={{ position: 'relative' }}>
          <div
            ref={mapRef}
            style={{
              height: '520px', borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)', overflow: 'hidden',
              background: '#1a1a2e',
            }}
          />
          
          {/* Floating Reverse Image Search Upload Button */}
          <label style={{
            position: 'absolute', top: '15px', right: '15px', zIndex: 1000,
            background: 'rgba(15, 14, 16, 0.85)', backdropFilter: 'blur(4px)',
            color: 'var(--gold)', border: '1px solid var(--border)',
            padding: '8px 12px', borderRadius: 'var(--radius)', fontSize: '10px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px',
            fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.05em',
            transition: 'all 0.2s ease'
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            {loadingSearch ? 'Scanning...' : 'Reverse Search'}
            <input type="file" accept="image/*" onChange={handleReverseSearch} style={{ display: 'none' }} disabled={loadingSearch} />
          </label>
        </div>

        {/* Side panel */}
        {selected && (
          <div className="card anim-fade-up" style={{ padding: '20px', overflow: 'auto', maxHeight: '520px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 300, fontSize: '20px', color: 'var(--gold)', marginBottom: '4px' }}>
                  {selected.name}
                </h3>
                {selected.type === 'story' && (
                  <div className="label" style={{ fontSize: '6px', color: 'var(--green)' }}>Generated story</div>
                )}
                {selected.type === 'heritage' && (
                  <div className="label" style={{ fontSize: '6px', opacity: 0.5 }}>Heritage site · Local Guide</div>
                )}
              </div>
              <button
                onClick={() => { setSelected(null); setGuide(''); setGuideHistory([]); }}
                style={{ background: 'none', border: 'none', color: 'var(--ash)', cursor: 'pointer', fontSize: '18px', lineHeight: 1, padding: '0 0 0 8px' }}
              >×</button>
            </div>

            {/* Story excerpt */}
            {selected.type === 'story' && selected.content && (
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 300, fontSize: '12px', lineHeight: 1.9, color: 'var(--cream-faint)', whiteSpace: 'pre-wrap' }}>
                {selected.content.slice(0, 300)}…
              </div>
            )}

            {/* Dadu guide section */}
            {selected.type === 'heritage' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                {/* Conversation history */}
                {guideHistory.map((item, i) => (
                  <div key={i} style={{ borderLeft: '2px solid rgba(212,168,75,0.2)', paddingLeft: '12px' }}>
                    <div className="mono" style={{ fontSize: '7px', color: 'var(--gold)', opacity: 0.6, marginBottom: '4px' }}>
                      {item.q}
                    </div>
                    <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '12px', lineHeight: 1.8, color: 'var(--cream-faint)', whiteSpace: 'pre-wrap' }}>
                      {item.a}
                    </div>
                  </div>
                ))}

                {/* Loading */}
                {loadingGuide && (
                  <div className="label" style={{ fontSize: '7px', animation: 'shimmer 1.5s infinite', color: 'var(--gold)' }}>
                    Recalling memories…
                  </div>
                )}

                {/* Initial CTA — no history yet */}
                {!guideHistory.length && !loadingGuide && (
                  <button
                    className="btn btn-primary"
                    onClick={() => fetchGuide(selected.name, '')}
                    style={{ width: '100%', justifyContent: 'center', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
                    </svg>
                    Consult Heritage Guide
                  </button>
                )}

                {/* Follow-up input — shown after first answer */}
                {guideHistory.length > 0 && !loadingGuide && (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      type="text"
                      placeholder="Ask another question…"
                      value={question}
                      onChange={e => setQuestion(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && question.trim() && fetchGuide(selected.name, question.trim())}
                      style={{
                        flex: 1,
                        background: 'var(--bg-2)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)',
                        color: 'var(--cream)',
                        padding: '6px 10px',
                        fontSize: '11px',
                        fontFamily: 'var(--font-body)',
                        outline: 'none',
                      }}
                    />
                    <button
                      className="btn"
                      onClick={() => question.trim() && fetchGuide(selected.name, question.trim())}
                      style={{ fontSize: '8px', padding: '6px 10px' }}
                      disabled={!question.trim()}
                    >Ask</button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}