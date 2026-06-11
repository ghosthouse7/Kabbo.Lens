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

const DaduAvatar = () => (
  <div style={{
    width: '32px', height: '32px', borderRadius: '50%',
    background: 'rgba(212,168,75,0.1)', border: '1px solid rgba(212,168,75,0.3)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    boxShadow: '0 0 10px rgba(212,168,75,0.1)'
  }}>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="7" r="4"></circle>
      <path d="M5.5 21v-2a4 4 0 0 1 4-4h5a4 4 0 0 1 4 4v2"></path>
      <circle cx="9" cy="7" r="1.5"></circle>
      <circle cx="15" cy="7" r="1.5"></circle>
      <path d="M10.5 7h3"></path>
    </svg>
  </div>
);

export default function HeritageMap({ mapPins = [] }) {
  const mapRef          = useRef(null);
  const leafletRef      = useRef(null);
  const searchMarkerRef = useRef(null); 
  const chatEndRef      = useRef(null); 
  
  const [selected,     setSelected]     = useState(null);
  const [guideHistory, setGuideHistory] = useState([]);
  const [question,     setQuestion]     = useState('');
  const [loadingGuide, setLoadingGuide] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [mapLoaded,    setMapLoaded]    = useState(false);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [guideHistory, loadingGuide]);

  useEffect(() => {
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id   = 'leaflet-css';
      link.rel  = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
  }, []);

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
        html: `<div style="width:10px;height:10px;border-radius:50%;background:rgba(212,168,75,0.9);border:2px solid rgba(212,168,75,0.4);box-shadow:0 0 12px rgba(212,168,75,0.6);cursor:pointer;"></div>`,
        className: '', iconSize: [10, 10], iconAnchor: [5, 5],
      });

      HERITAGE_PINS.forEach(pin => {
        const marker = L.marker([pin.lat, pin.lng], { icon: heritageIcon() }).addTo(map);
        marker.on('click', () => {
          setSelected(pin);
          setGuideHistory([]);
          setQuestion('');
          if (searchMarkerRef.current && window.L) {
            map.removeLayer(searchMarkerRef.current);
            searchMarkerRef.current = null;
          }
        });
      });

      leafletRef.current = map;
      setMapLoaded(true);
    };

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => initMap(window.L);
    document.head.appendChild(script);
  }, []);

  const fetchGuide = async (locationKey, userQuestion) => {
    setLoadingGuide(true);
    const q = userQuestion || 'Tell me the hidden secrets and stories of this place.';
    
    setGuideHistory(h => [...h, { type: 'user', text: q }]);
    setQuestion('');

    try {
      const res = await fetch(`${BACKEND}/api/guide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location: locationKey, question: q }),
      });
      
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      const answer = data.guide || 'Dadu has no stories right now.';
      
      setGuideHistory(h => [...h, { type: 'dadu', text: answer }]);
      
    } catch (err) {
      console.error('Guide error:', err);
      setGuideHistory(h => [...h, { 
        type: 'dadu', 
        text: "Arre bhai, my memory is a bit foggy right now (API Server limit reached). Let me rest for a minute, then ask me again!" 
      }]);
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
      const res = await fetch(`${BACKEND}/api/identify`, { method: 'POST', body: formData });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      
      if (data.exact_item && leafletRef.current && window.L) {
        const lat = data.lat; const lng = data.lng;
        leafletRef.current.flyTo([lat, lng], 16);
        
        setSelected({
            name: data.exact_item,
            type: 'heritage',
            significance: data.significance,
            realLocation: data.real_location,
            nearestKey: data.nearest_heritage || data.location,
            isSearchRes: true
        });
        
        if (searchMarkerRef.current) leafletRef.current.removeLayer(searchMarkerRef.current);

        const premiumIcon = window.L.divIcon({
          html: `
            <div style="display:flex; flex-direction:column; align-items:center; margin-top: -85px; margin-left: -90px; width: 180px; animation: floatMarker 2.5s ease-in-out infinite;">
              <div style="background: rgba(15, 14, 16, 0.95); backdrop-filter: blur(8px); border: 1px solid rgba(212,168,75,0.4); padding: 10px 14px; border-radius: 6px; text-align: center; box-shadow: 0 8px 24px rgba(0,0,0,0.8);">
                <div style="font-family: var(--font-body), sans-serif; font-size: 6px; letter-spacing: 0.15em; color: var(--ash); text-transform: uppercase; margin-bottom: 4px;">
                  Identified · ${Math.round((data.confidence || 0.9) * 100)}% Match
                </div>
                <div style="font-family: var(--font-display), serif; font-size: 14px; color: var(--gold); font-style: italic; line-height: 1.1; margin-bottom: 4px;">
                  ${data.exact_item}
                </div>
                <div style="font-size: 7px; color: var(--cream-faint); font-family: var(--font-body); white-space: normal; line-height: 1.3;">
                  ${data.real_location}
                </div>
              </div>
              <div style="width: 1px; height: 24px; background: linear-gradient(to bottom, rgba(212,168,75,0.5), transparent);"></div>
              <div style="width: 8px; height: 8px; background: var(--gold); border-radius: 50%; box-shadow: 0 0 16px var(--gold);"></div>
            </div>
            <style>@keyframes floatMarker { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }</style>
          `,
          className: '', iconSize: [0, 0], iconAnchor: [0, 0],
        });

        searchMarkerRef.current = window.L.marker([lat, lng], { icon: premiumIcon }).addTo(leafletRef.current);
        setGuideHistory([]);
        setQuestion('');
        
        // BOOM! The auto-trigger is gone! Dadu won't spam the API anymore.
        
      } else {
        alert('Could not pinpoint the Kolkata location from this image.');
      }
    } catch (err) {
      console.error(err);
      alert('Reverse Image search failed. Please try again.');
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
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap: '16px' }}>

        {/* Map */}
        <div style={{ position: 'relative' }}>
          <div ref={mapRef} style={{ height: '560px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden', background: '#1a1a2e' }} />
          
          <label style={{
            position: 'absolute', top: '15px', right: '15px', zIndex: 1000,
            background: 'rgba(15, 14, 16, 0.85)', backdropFilter: 'blur(4px)', color: 'var(--gold)', border: '1px solid rgba(212,168,75,0.4)',
            padding: '10px 14px', borderRadius: 'var(--radius)', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
            fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.05em', transition: 'all 0.2s ease', boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            {loadingSearch ? 'Scanning...' : 'Reverse Search Location'}
            <input type="file" accept="image/*" onChange={handleReverseSearch} style={{ display: 'none' }} disabled={loadingSearch} />
          </label>
        </div>

        {/* Side panel */}
        {selected && (
          <div className="card anim-fade-up" style={{ padding: '0', overflow: 'hidden', height: '560px', display: 'flex', flexDirection: 'column' }}>

            {/* Static Header */}
            <div style={{ padding: '20px 20px 15px', borderBottom: '1px solid var(--border)', background: 'var(--bg-1)', flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 300, fontSize: '20px', color: 'var(--gold)', marginBottom: '4px', lineHeight: 1.2 }}>
                    {selected.name}
                  </h3>
                  {selected.realLocation && (
                     <div className="mono" style={{ fontSize: '7px', color: 'var(--ash)', marginBottom: '4px' }}>{selected.realLocation}</div>
                  )}
                </div>
                <button
                  onClick={() => { setSelected(null); setGuideHistory([]); }}
                  style={{ background: 'none', border: 'none', color: 'var(--ash)', cursor: 'pointer', fontSize: '20px', lineHeight: 1, padding: '0' }}
                >×</button>
              </div>

              {selected.isSearchRes && selected.significance && (
                <div style={{ background: 'rgba(212,168,75,0.05)', border: '1px dashed rgba(212,168,75,0.2)', padding: '12px', borderRadius: '6px', marginTop: '12px' }}>
                  <div className="label" style={{ fontSize: '6px', color: 'var(--gold)', marginBottom: '6px', letterSpacing: '0.1em' }}>AI VISION SCAN</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--cream-faint)', lineHeight: 1.6, fontFamily: 'var(--font-display)', fontWeight: 300 }}>
                    {selected.significance}
                  </div>
                </div>
              )}
            </div>

            {/* Scrollable Chat Area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'rgba(15,14,16,0.3)' }}>
              
              {/* Initial CTA button if no chat history */}
              {!guideHistory.length && !loadingGuide && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                  <button className="btn btn-primary" onClick={() => fetchGuide(selected.nearestKey || selected.name, '')} style={{ fontSize: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>
                    Wake Up Dadu (Heritage Guide)
                  </button>
                </div>
              )}

              {/* Chat Bubbles */}
              {guideHistory.map((item, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  
                  {item.type === 'user' ? (
                    <div style={{ alignSelf: 'flex-end', background: 'var(--bg-2)', border: '1px solid var(--border)', padding: '10px 14px', borderRadius: '12px 12px 0 12px', maxWidth: '85%' }}>
                      <div style={{ fontSize: '11px', color: 'var(--cream)', lineHeight: 1.4, fontFamily: 'var(--font-body)' }}>{item.text}</div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <DaduAvatar />
                      <div style={{ background: 'rgba(212,168,75,0.08)', border: '1px solid rgba(212,168,75,0.2)', padding: '12px 16px', borderRadius: '0 12px 12px 12px', maxWidth: '85%' }}>
                        <div className="label" style={{ fontSize: '6px', color: 'var(--gold)', marginBottom: '6px', letterSpacing: '0.1em' }}>DADU SAYS...</div>
                        <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '13px', lineHeight: 1.7, color: 'var(--cream-faint)', whiteSpace: 'pre-wrap' }}>
                          {item.text}
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              ))}

              {/* Loading Indicator */}
              {loadingGuide && (
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <DaduAvatar />
                  <div style={{ background: 'rgba(212,168,75,0.04)', border: '1px solid rgba(212,168,75,0.1)', padding: '10px 16px', borderRadius: '0 12px 12px 12px' }}>
                    <div className="label" style={{ fontSize: '7px', animation: 'shimmer 1.5s infinite', color: 'var(--gold)' }}>
                      Dadu is typing...
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={chatEndRef} />
            </div>

            {/* Sticky Input Area at Bottom */}
            <div style={{ padding: '15px 20px', background: 'var(--bg-1)', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Ask Dadu about this place..."
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !loadingGuide && question.trim() && fetchGuide(selected.nearestKey || selected.name, question.trim())}
                  disabled={loadingGuide}
                  style={{
                    flex: 1, background: 'var(--bg-2)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)', color: 'var(--cream)', padding: '10px 14px',
                    fontSize: '11px', fontFamily: 'var(--font-body)', outline: 'none',
                    opacity: loadingGuide ? 0.5 : 1
                  }}
                />
                <button
                  className="btn"
                  onClick={() => question.trim() && fetchGuide(selected.nearestKey || selected.name, question.trim())}
                  style={{ fontSize: '10px', padding: '0 18px', background: 'var(--gold)', color: '#000', fontWeight: 'bold' }}
                  disabled={!question.trim() || loadingGuide}
                >Send</button>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}