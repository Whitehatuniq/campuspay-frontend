import { useState, useEffect, useRef } from 'react';
import './Transport.css';

const PU_LOCATION = { lat: 26.8467, lng: 75.8064 };

const BUSES = [
  {
    id: 'BUS001', route_name: 'Route 1 — City Center', driver: 'Ramesh Kumar',
    plate: 'RJ14-AB-1234', color: '#38bdf8', status: 'moving', eta: '8 min', capacity: 40, occupied: 28,
    waypoints: [
      { lat: 26.8467, lng: 75.8064 }, { lat: 26.8412, lng: 75.8156 }, { lat: 26.8520, lng: 75.8234 },
      { lat: 26.8601, lng: 75.8312 }, { lat: 26.8734, lng: 75.8423 }, { lat: 26.8890, lng: 75.8478 },
    ],
    stops: ['Poornima University', 'Sitapura', 'Tonk Road', 'Durgapura', 'SMS Hospital', 'City Center'],
    timings: ['7:00 AM', '8:00 AM', '9:00 AM', '5:00 PM', '6:00 PM', '7:00 PM'],
  },
  {
    id: 'BUS002', route_name: 'Route 2 — Mansarovar', driver: 'Suresh Yadav',
    plate: 'RJ14-CD-5678', color: '#a78bfa', status: 'at_stop', eta: '15 min', capacity: 40, occupied: 35,
    waypoints: [
      { lat: 26.8467, lng: 75.8064 }, { lat: 26.8534, lng: 75.7956 }, { lat: 26.8623, lng: 75.7845 },
      { lat: 26.8712, lng: 75.7723 }, { lat: 26.8801, lng: 75.7612 }, { lat: 26.8934, lng: 75.7534 },
    ],
    stops: ['Poornima University', 'Pratap Nagar', 'Sodala', 'Mansarovar', 'Vaishali Nagar', 'Ajmer Road'],
    timings: ['7:15 AM', '8:15 AM', '9:15 AM', '5:15 PM', '6:15 PM', '7:15 PM'],
  },
  {
    id: 'BUS003', route_name: 'Route 3 — Vidhyadhar Nagar', driver: 'Mahesh Singh',
    plate: 'RJ14-EF-9012', color: '#34d399', status: 'moving', eta: '22 min', capacity: 40, occupied: 18,
    waypoints: [
      { lat: 26.8467, lng: 75.8064 }, { lat: 26.8589, lng: 75.8178 }, { lat: 26.8712, lng: 75.8289 },
      { lat: 26.8845, lng: 75.8334 }, { lat: 26.8967, lng: 75.8289 }, { lat: 26.9089, lng: 75.8178 },
    ],
    stops: ['Poornima University', 'Kalwar Road', 'Vidhyadhar Nagar', 'Gandhi Nagar', 'Ambabari', 'Sindhi Camp'],
    timings: ['7:30 AM', '8:30 AM', '9:30 AM', '5:30 PM', '6:30 PM', '7:30 PM'],
  },
  {
    id: 'BUS004', route_name: 'Route 4 — Malviya Nagar', driver: 'Dinesh Sharma',
    plate: 'RJ14-GH-3456', color: '#fb923c', status: 'stopped', eta: '5 min', capacity: 40, occupied: 31,
    waypoints: [
      { lat: 26.8467, lng: 75.8064 }, { lat: 26.8389, lng: 75.8134 }, { lat: 26.8312, lng: 75.8212 },
      { lat: 26.8234, lng: 75.8290 }, { lat: 26.8156, lng: 75.8367 }, { lat: 26.8078, lng: 75.8445 },
    ],
    stops: ['Poornima University', 'Jagatpura', 'Malviya Nagar', 'Jawahar Circle', 'Lal Kothi', 'Statue Circle'],
    timings: ['7:45 AM', '8:45 AM', '9:45 AM', '5:45 PM', '6:45 PM', '7:45 PM'],
  },
];

const STATUS_CONFIG = {
  moving:  { label: 'Moving',  color: '#22c55e', emoji: '🟢' },
  at_stop: { label: 'At Stop', color: '#f59e0b', emoji: '🟡' },
  stopped: { label: 'Stopped', color: '#ef4444', emoji: '🔴' },
};

function useGoogleMaps(apiKey) {
  const [loaded, setLoaded] = useState(!!window.google?.maps);
  useEffect(() => {
    if (window.google?.maps) { setLoaded(true); return; }
    if (document.getElementById('gmap-script')) return;
    const script = document.createElement('script');
    script.id = 'gmap-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.onload = () => setLoaded(true);
    document.head.appendChild(script);
  }, [apiKey]);
  return loaded;
}

export default function Transport() {
  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_KEY;
  const mapsLoaded = useGoogleMaps(apiKey || '');
  const mapRef = useRef(null);
  const googleMapRef = useRef(null);
  const markersRef = useRef({});
  const timerRef = useRef({});

  const [activeTab, setActiveTab] = useState('live');
  const [busStates, setBusStates] = useState(
    BUSES.map(b => ({ id: b.id, waypointIdx: 0, progress: 0, currentPos: b.waypoints[0] }))
  );
  const [selectedBus, setSelectedBus] = useState(null);
  const [myBus, setMyBus] = useState('BUS001');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [expandedRoute, setExpandedRoute] = useState(null);

  // Init map
  useEffect(() => {
    if (!mapsLoaded || !mapRef.current || googleMapRef.current) return;

    const map = new window.google.maps.Map(mapRef.current, {
      center: PU_LOCATION,
      zoom: 13,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      styles: [
        { elementType: 'geometry', stylers: [{ color: '#0d1b2a' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#0d1b2a' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
        { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#253348' }] },
        { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#2d4a6e' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0a1628' }] },
        { featureType: 'poi', stylers: [{ visibility: 'off' }] },
        { featureType: 'transit', stylers: [{ visibility: 'off' }] },
      ],
    });
    googleMapRef.current = map;

    // PU marker
    new window.google.maps.Marker({
      position: PU_LOCATION, map,
      title: 'Poornima University',
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 14, fillColor: '#38bdf8', fillOpacity: 1,
        strokeColor: '#fff', strokeWeight: 3,
      },
      label: { text: 'PU', color: '#fff', fontWeight: 'bold', fontSize: '11px' },
      zIndex: 100,
    });

    // Routes + stop markers
    BUSES.forEach(bus => {
      new window.google.maps.Polyline({
        path: bus.waypoints, geodesic: true, map,
        strokeColor: bus.color, strokeOpacity: 0.5, strokeWeight: 3,
      });
      bus.waypoints.slice(1).forEach(wp => {
        new window.google.maps.Marker({
          position: wp, map,
          icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 5, fillColor: bus.color, fillOpacity: 0.8, strokeColor: bus.color, strokeWeight: 1 },
        });
      });

      // Bus marker
      const busMarker = new window.google.maps.Marker({
        position: bus.waypoints[0], map, title: bus.id, zIndex: 50,
        icon: {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 42 42"><circle cx="21" cy="21" r="19" fill="${bus.color}" fill-opacity="0.25" stroke="${bus.color}" stroke-width="2.5"/><text x="21" y="28" text-anchor="middle" font-size="20">🚌</text></svg>`
          )}`,
          scaledSize: new window.google.maps.Size(42, 42),
          anchor: new window.google.maps.Point(21, 21),
        },
      });
      busMarker.addListener('click', () => setSelectedBus(prev => prev?.id === bus.id ? null : bus));
      markersRef.current[bus.id] = busMarker;
    });

  }, [mapsLoaded]);

  // Animate buses
  useEffect(() => {
    if (!mapsLoaded) return;
    const SPEED = 0.0025;

    function step(busId) {
      setBusStates(prev => prev.map(s => {
        if (s.id !== busId) return s;
        const bus = BUSES.find(b => b.id === busId);
        if (bus.status === 'stopped') return s;

        let { waypointIdx, progress } = s;
        progress += SPEED;
        if (progress >= 1) { progress = 0; waypointIdx = (waypointIdx + 1) % (bus.waypoints.length - 1); }

        const from = bus.waypoints[waypointIdx];
        const to = bus.waypoints[waypointIdx + 1];
        const currentPos = {
          lat: from.lat + (to.lat - from.lat) * progress,
          lng: from.lng + (to.lng - from.lng) * progress,
        };

        if (markersRef.current[busId]) markersRef.current[busId].setPosition(currentPos);
        return { ...s, waypointIdx, progress, currentPos };
      }));
      timerRef.current[busId] = setTimeout(() => step(busId), 120);
    }

    BUSES.forEach(bus => { if (bus.status !== 'stopped') step(bus.id); });
    const interval = setInterval(() => setLastUpdated(new Date()), 5000);

    return () => {
      Object.values(timerRef.current).forEach(clearTimeout);
      clearInterval(interval);
    };
  }, [mapsLoaded]);

  // Pan to selected bus
  useEffect(() => {
    if (!selectedBus || !googleMapRef.current) return;
    const state = busStates.find(s => s.id === selectedBus.id);
    if (state?.currentPos) { googleMapRef.current.panTo(state.currentPos); googleMapRef.current.setZoom(15); }
  }, [selectedBus]);

  const occ = b => Math.round((b.occupied / b.capacity) * 100);
  const occColor = p => p > 85 ? '#ef4444' : p > 60 ? '#f59e0b' : '#22c55e';
  const myBusData = BUSES.find(b => b.id === myBus);

  return (
    <div className="transport-page">
      <div className="transport-header">
        <div className="transport-title">
          <span className="transport-icon">🚌</span>
          <div><h1>University Transport</h1><p>Poornima University — Jaipur Live Tracking</p></div>
        </div>
        <div className="last-updated">
          <span className="pulse-dot" />
          Live · {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
      </div>

      {myBusData && (
        <div className="my-bus-banner">
          <div className="my-bus-left">
            <span className="my-bus-badge">MY BUS</span>
            <div><div className="my-bus-name">{myBusData.route_name}</div><div className="my-bus-info">Driver: {myBusData.driver} · {myBusData.plate}</div></div>
          </div>
          <div className="my-bus-right">
            <div className="my-bus-eta"><span className="eta-label">ETA to next stop</span><span className="eta-value">{myBusData.eta}</span></div>
            <span className={`bus-status-badge status-${myBusData.status}`}>{STATUS_CONFIG[myBusData.status].emoji} {STATUS_CONFIG[myBusData.status].label}</span>
          </div>
        </div>
      )}

      <div className="transport-tabs">
        {[{ id: 'live', label: '📍 Live Map' }, { id: 'routes', label: '🗺️ Routes' }, { id: 'timing', label: '🕐 Timings' }, { id: 'track', label: '🎯 My Bus' }].map(t => (
          <button key={t.id} className={`transport-tab ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {activeTab === 'live' && (
        <div className="live-map-section">
          {!apiKey ? (
            <div className="map-error">⚠️ Add <code>REACT_APP_GOOGLE_MAPS_KEY</code> to your .env and redeploy.</div>
          ) : !mapsLoaded ? (
            <div className="map-loading"><div className="spinner" /><p>Loading Jaipur map...</p></div>
          ) : (
            <>
              <div className="gmap-wrapper">
                <div ref={mapRef} className="gmap" />
                {selectedBus && (
                  <div className="bus-popup">
                    <button className="popup-close" onClick={() => { setSelectedBus(null); googleMapRef.current?.setZoom(13); googleMapRef.current?.panTo(PU_LOCATION); }}>✕</button>
                    <div className="popup-header">
                      <span className="popup-bus-id" style={{ color: selectedBus.color }}>{selectedBus.id}</span>
                      <span className={`bus-status-badge status-${selectedBus.status}`}>{STATUS_CONFIG[selectedBus.status].emoji} {STATUS_CONFIG[selectedBus.status].label}</span>
                    </div>
                    <div className="popup-route">{selectedBus.route_name}</div>
                    <div className="popup-grid">
                      <div className="popup-stat"><span className="popup-stat-label">Driver</span><span className="popup-stat-value">{selectedBus.driver}</span></div>
                      <div className="popup-stat"><span className="popup-stat-label">ETA</span><span className="popup-stat-value eta-highlight">{selectedBus.eta}</span></div>
                      <div className="popup-stat"><span className="popup-stat-label">Plate</span><span className="popup-stat-value">{selectedBus.plate}</span></div>
                      <div className="popup-stat"><span className="popup-stat-label">Seats</span><span className="popup-stat-value">{selectedBus.occupied}/{selectedBus.capacity}</span></div>
                    </div>
                    <div className="occupancy-bar-wrap">
                      <div className="occupancy-bar"><div className="occupancy-fill" style={{ width: `${occ(selectedBus)}%`, background: occColor(occ(selectedBus)) }} /></div>
                      <span className="occupancy-label">{occ(selectedBus)}% full</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="bus-cards-grid">
                {BUSES.map(bus => (
                  <div key={bus.id} className={`bus-card ${selectedBus?.id === bus.id ? 'selected' : ''}`}
                    style={selectedBus?.id === bus.id ? { borderColor: bus.color } : {}}
                    onClick={() => setSelectedBus(selectedBus?.id === bus.id ? null : bus)}>
                    <div className="bus-card-top"><span className="bus-card-id" style={{ color: bus.color }}>{bus.id}</span><span className={`bus-status-badge status-${bus.status}`}>{STATUS_CONFIG[bus.status].emoji} {STATUS_CONFIG[bus.status].label}</span></div>
                    <div className="bus-card-route">{bus.route_name}</div>
                    <div className="bus-card-bottom"><span>⏱ {bus.eta}</span><span>👤 {bus.occupied}/{bus.capacity}</span></div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'routes' && (
        <div className="routes-section">
          <div className="routes-info"><span>🗺️</span> Click any route to see all stops</div>
          {BUSES.map(bus => (
            <div key={bus.id} className="route-card">
              <div className="route-card-header" onClick={() => setExpandedRoute(expandedRoute === bus.id ? null : bus.id)}>
                <div className="route-card-left">
                  <span className="route-bus-icon" style={{ color: bus.color }}>🚌</span>
                  <div><div className="route-name">{bus.route_name}</div><div className="route-meta">{bus.stops.length} stops · {bus.plate}</div></div>
                </div>
                <div className="route-card-right">
                  <span className={`bus-status-badge status-${bus.status}`}>{STATUS_CONFIG[bus.status].emoji} {STATUS_CONFIG[bus.status].label}</span>
                  <span className="expand-arrow">{expandedRoute === bus.id ? '▲' : '▼'}</span>
                </div>
              </div>
              {expandedRoute === bus.id && (
                <div className="route-stops">
                  {bus.stops.map((stop, i) => (
                    <div key={i} className="stop-item">
                      <div className="stop-dot-wrap">
                        <div className="stop-dot" style={{ background: i === 0 ? '#22c55e' : i === bus.stops.length - 1 ? '#ef4444' : bus.color, borderColor: bus.color }} />
                        {i < bus.stops.length - 1 && <div className="stop-line" style={{ background: bus.color + '44' }} />}
                      </div>
                      <div className="stop-info">
                        <span className="stop-name">{stop}</span>
                        {i === 0 && <span className="stop-tag origin">Origin</span>}
                        {i === bus.stops.length - 1 && <span className="stop-tag destination">Destination</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'timing' && (
        <div className="timings-section">
          <div className="timings-notice"><span>ℹ️</span> All buses depart from Poornima University Gate</div>
          <div className="timings-grid">
            {BUSES.map(bus => (
              <div key={bus.id} className="timing-card" style={{ borderColor: bus.color + '44' }}>
                <div className="timing-card-header">
                  <div className="timing-bus-name" style={{ color: bus.color }}>{bus.route_name}</div>
                  <span className="timing-driver">🧑‍✈️ {bus.driver}</span>
                </div>
                <div className="timing-slots">
                  <div className="timing-group"><div className="timing-group-label">🌅 Morning</div><div className="timing-pills">{bus.timings.slice(0, 3).map((t, i) => <span key={i} className="timing-pill morning">{t}</span>)}</div></div>
                  <div className="timing-group"><div className="timing-group-label">🌆 Evening (Return)</div><div className="timing-pills">{bus.timings.slice(3).map((t, i) => <span key={i} className="timing-pill evening">{t}</span>)}</div></div>
                </div>
                <div className="timing-stops-preview">{bus.stops.map((s, i) => <span key={i} className="stop-chip">{s}</span>)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'track' && (
        <div className="track-section">
          <div className="track-header"><h2>Select Your Bus</h2><p>Choose the bus assigned to your area</p></div>
          <div className="track-bus-list">
            {BUSES.map(bus => (
              <div key={bus.id} className={`track-bus-card ${myBus === bus.id ? 'selected' : ''}`}
                style={myBus === bus.id ? { borderColor: bus.color } : {}} onClick={() => setMyBus(bus.id)}>
                <div className="track-bus-radio"><div className="radio-circle" style={myBus === bus.id ? { borderColor: bus.color, background: bus.color, boxShadow: `0 0 8px ${bus.color}66` } : {}} /></div>
                <div className="track-bus-info"><div className="track-bus-name">{bus.route_name}</div><div className="track-bus-stops">{bus.stops.slice(1, 4).join(' → ')}{bus.stops.length > 4 ? ' ...' : ''}</div></div>
                <span className={`bus-status-badge status-${bus.status}`}>{STATUS_CONFIG[bus.status].emoji}</span>
              </div>
            ))}
          </div>
          {myBusData && (
            <div className="track-detail-card" style={{ borderColor: myBusData.color + '44' }}>
              <h3 style={{ color: myBusData.color }}>🎯 Your Bus — {myBusData.id}</h3>
              <div className="track-detail-grid">
                <div className="track-detail-item"><span className="detail-label">Route</span><span className="detail-value">{myBusData.route_name}</span></div>
                <div className="track-detail-item"><span className="detail-label">Driver</span><span className="detail-value">{myBusData.driver}</span></div>
                <div className="track-detail-item"><span className="detail-label">Bus Number</span><span className="detail-value">{myBusData.plate}</span></div>
                <div className="track-detail-item"><span className="detail-label">Status</span><span className="detail-value">{STATUS_CONFIG[myBusData.status].emoji} {STATUS_CONFIG[myBusData.status].label}</span></div>
                <div className="track-detail-item"><span className="detail-label">ETA Next Stop</span><span className="detail-value eta-highlight">{myBusData.eta}</span></div>
                <div className="track-detail-item"><span className="detail-label">Seats Free</span><span className="detail-value">{myBusData.capacity - myBusData.occupied}</span></div>
              </div>
              <div className="track-stops-timeline">
                <div className="track-stops-title">Route Stops</div>
                {myBusData.stops.map((stop, i) => (
                  <div key={i} className="track-stop">
                    <div className="track-stop-dot-wrap">
                      <div className="track-stop-dot" style={i === 0 ? { background: myBusData.color, boxShadow: `0 0 6px ${myBusData.color}` } : {}} />
                      {i < myBusData.stops.length - 1 && <div className="track-stop-line" />}
                    </div>
                    <span className="track-stop-name" style={i === 0 ? { color: myBusData.color, fontWeight: 600 } : {}}>{stop}</span>
                  </div>
                ))}
              </div>
              <div className="occupancy-section">
                <div className="occupancy-header"><span>Bus Occupancy</span><span style={{ color: occColor(occ(myBusData)) }}>{myBusData.occupied}/{myBusData.capacity} passengers</span></div>
                <div className="occupancy-bar"><div className="occupancy-fill" style={{ width: `${occ(myBusData)}%`, background: occColor(occ(myBusData)) }} /></div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
