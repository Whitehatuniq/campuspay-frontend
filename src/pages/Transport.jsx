import { useState, useEffect, useRef } from 'react';
import API from '../api/axios';
import './Transport.css';

const DUMMY_BUSES = [
  {
    id: 'BUS001',
    route_name: 'Route 1 - City Center',
    driver: 'Ramesh Kumar',
    plate: 'RJ14-AB-1234',
    stops: ['Poornima University', 'Sitapura', 'Tonk Road', 'Durgapura', 'SMS Hospital', 'City Center'],
    timings: ['7:00 AM', '8:00 AM', '9:00 AM', '5:00 PM', '6:00 PM', '7:00 PM'],
    lat: 26.8467,
    lng: 75.8064,
    status: 'moving',
    eta: '8 min',
    capacity: 40,
    occupied: 28,
  },
  {
    id: 'BUS002',
    route_name: 'Route 2 - Mansarovar',
    driver: 'Suresh Yadav',
    plate: 'RJ14-CD-5678',
    stops: ['Poornima University', 'Pratap Nagar', 'Sodala', 'Mansarovar', 'Vaishali Nagar', 'Ajmer Road'],
    timings: ['7:15 AM', '8:15 AM', '9:15 AM', '5:15 PM', '6:15 PM', '7:15 PM'],
    lat: 26.8712,
    lng: 75.7890,
    status: 'at_stop',
    eta: '15 min',
    capacity: 40,
    occupied: 35,
  },
  {
    id: 'BUS003',
    route_name: 'Route 3 - Vidhyadhar Nagar',
    driver: 'Mahesh Singh',
    plate: 'RJ14-EF-9012',
    stops: ['Poornima University', 'Kalwar Road', 'Vidhyadhar Nagar', 'Gandhi Nagar', 'Ambabari', 'Sindhi Camp'],
    timings: ['7:30 AM', '8:30 AM', '9:30 AM', '5:30 PM', '6:30 PM', '7:30 PM'],
    lat: 26.9124,
    lng: 75.8234,
    status: 'moving',
    eta: '22 min',
    capacity: 40,
    occupied: 18,
  },
  {
    id: 'BUS004',
    route_name: 'Route 4 - Malviya Nagar',
    driver: 'Dinesh Sharma',
    plate: 'RJ14-GH-3456',
    stops: ['Poornima University', 'Jagatpura', 'Malviya Nagar', 'Jawahar Circle', 'Lal Kothi', 'Statue Circle'],
    timings: ['7:45 AM', '8:45 AM', '9:45 AM', '5:45 PM', '6:45 PM', '7:45 PM'],
    lat: 26.8290,
    lng: 75.8150,
    status: 'stopped',
    eta: '5 min',
    capacity: 40,
    occupied: 31,
  },
];

const STATUS_CONFIG = {
  moving:   { label: 'Moving',   color: '#22c55e', emoji: '🟢' },
  at_stop:  { label: 'At Stop',  color: '#f59e0b', emoji: '🟡' },
  stopped:  { label: 'Stopped',  color: '#ef4444', emoji: '🔴' },
};

export default function Transport() {
  const [activeTab, setActiveTab] = useState('live');
  const [buses, setBuses] = useState(DUMMY_BUSES);
  const [selectedBus, setSelectedBus] = useState(null);
  const [myBus, setMyBus] = useState('BUS001');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [expandedRoute, setExpandedRoute] = useState(null);
  const intervalRef = useRef(null);

  // Simulate live location updates
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setBuses(prev => prev.map(bus => ({
        ...bus,
        lat: bus.lat + (Math.random() - 0.5) * 0.002,
        lng: bus.lng + (Math.random() - 0.5) * 0.002,
        eta: `${Math.max(1, parseInt(bus.eta) + Math.floor((Math.random() - 0.5) * 3))} min`,
      })));
      setLastUpdated(new Date());
    }, 5000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const myBusData = buses.find(b => b.id === myBus);
  const occupancyPct = b => Math.round((b.occupied / b.capacity) * 100);
  const occupancyColor = pct => pct > 85 ? '#ef4444' : pct > 60 ? '#f59e0b' : '#22c55e';

  return (
    <div className="transport-page">
      <div className="transport-header">
        <div className="transport-title">
          <span className="transport-icon">🚌</span>
          <div>
            <h1>University Transport</h1>
            <p>Poornima University Bus Service</p>
          </div>
        </div>
        <div className="last-updated">
          <span className="pulse-dot" />
          Live · Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
      </div>

      {/* My Bus Banner */}
      {myBusData && (
        <div className="my-bus-banner">
          <div className="my-bus-left">
            <span className="my-bus-badge">MY BUS</span>
            <div>
              <div className="my-bus-name">{myBusData.route_name}</div>
              <div className="my-bus-info">Driver: {myBusData.driver} · {myBusData.plate}</div>
            </div>
          </div>
          <div className="my-bus-right">
            <div className="my-bus-eta">
              <span className="eta-label">ETA to next stop</span>
              <span className="eta-value">{myBusData.eta}</span>
            </div>
            <span className={`bus-status-badge status-${myBusData.status}`}>
              {STATUS_CONFIG[myBusData.status].emoji} {STATUS_CONFIG[myBusData.status].label}
            </span>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="transport-tabs">
        {[
          { id: 'live',   label: '📍 Live Map',    },
          { id: 'routes', label: '🗺️ Routes',      },
          { id: 'timing', label: '🕐 Timings',     },
          { id: 'track',  label: '🎯 My Bus',      },
        ].map(t => (
          <button
            key={t.id}
            className={`transport-tab ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* LIVE MAP TAB */}
      {activeTab === 'live' && (
        <div className="live-map-section">
          {/* Fake Map */}
          <div className="map-container">
            <div className="map-bg">
              {/* Road lines */}
              <svg className="map-roads" viewBox="0 0 600 400" xmlns="http://www.w3.org/2000/svg">
                <line x1="0" y1="200" x2="600" y2="200" stroke="#334155" strokeWidth="8" />
                <line x1="300" y1="0" x2="300" y2="400" stroke="#334155" strokeWidth="8" />
                <line x1="0" y1="100" x2="600" y2="300" stroke="#1e293b" strokeWidth="5" />
                <line x1="0" y1="300" x2="600" y2="100" stroke="#1e293b" strokeWidth="5" />
                <line x1="150" y1="0" x2="150" y2="400" stroke="#1e293b" strokeWidth="4" opacity="0.5" />
                <line x1="450" y1="0" x2="450" y2="400" stroke="#1e293b" strokeWidth="4" opacity="0.5" />
                {/* University marker */}
                <circle cx="300" cy="200" r="18" fill="#38bdf8" opacity="0.3" />
                <circle cx="300" cy="200" r="10" fill="#38bdf8" />
                <text x="310" y="185" fill="#38bdf8" fontSize="11" fontWeight="bold">PU</text>
              </svg>

              {/* Bus markers */}
              {buses.map((bus, i) => {
                const x = 50 + ((bus.lng - 75.78) / 0.06) * 500;
                const y = 350 - ((bus.lat - 26.82) / 0.10) * 320;
                const cfg = STATUS_CONFIG[bus.status];
                return (
                  <div
                    key={bus.id}
                    className={`bus-marker ${selectedBus?.id === bus.id ? 'selected' : ''}`}
                    style={{ left: `${Math.min(Math.max(x, 20), 560)}px`, top: `${Math.min(Math.max(y, 20), 370)}px` }}
                    onClick={() => setSelectedBus(selectedBus?.id === bus.id ? null : bus)}
                  >
                    <div className="bus-marker-icon" style={{ borderColor: cfg.color }}>
                      🚌
                    </div>
                    <div className="bus-marker-label">{bus.id}</div>
                    {bus.status === 'moving' && <div className="bus-pulse" style={{ background: cfg.color }} />}
                  </div>
                );
              })}

              {/* Map legend */}
              <div className="map-legend">
                <div className="legend-title">Legend</div>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                  <div key={k} className="legend-item">
                    <span>{v.emoji}</span> {v.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Bus info popup */}
            {selectedBus && (
              <div className="bus-popup">
                <button className="popup-close" onClick={() => setSelectedBus(null)}>✕</button>
                <div className="popup-header">
                  <span className="popup-bus-id">{selectedBus.id}</span>
                  <span className={`bus-status-badge status-${selectedBus.status}`}>
                    {STATUS_CONFIG[selectedBus.status].emoji} {STATUS_CONFIG[selectedBus.status].label}
                  </span>
                </div>
                <div className="popup-route">{selectedBus.route_name}</div>
                <div className="popup-grid">
                  <div className="popup-stat">
                    <span className="popup-stat-label">Driver</span>
                    <span className="popup-stat-value">{selectedBus.driver}</span>
                  </div>
                  <div className="popup-stat">
                    <span className="popup-stat-label">ETA Next Stop</span>
                    <span className="popup-stat-value eta-highlight">{selectedBus.eta}</span>
                  </div>
                  <div className="popup-stat">
                    <span className="popup-stat-label">Plate</span>
                    <span className="popup-stat-value">{selectedBus.plate}</span>
                  </div>
                  <div className="popup-stat">
                    <span className="popup-stat-label">Occupancy</span>
                    <span className="popup-stat-value">{selectedBus.occupied}/{selectedBus.capacity}</span>
                  </div>
                </div>
                <div className="occupancy-bar-wrap">
                  <div className="occupancy-bar">
                    <div
                      className="occupancy-fill"
                      style={{ width: `${occupancyPct(selectedBus)}%`, background: occupancyColor(occupancyPct(selectedBus)) }}
                    />
                  </div>
                  <span className="occupancy-label">{occupancyPct(selectedBus)}% full</span>
                </div>
              </div>
            )}
          </div>

          {/* Bus cards below map */}
          <div className="bus-cards-grid">
            {buses.map(bus => (
              <div
                key={bus.id}
                className={`bus-card ${selectedBus?.id === bus.id ? 'selected' : ''}`}
                onClick={() => setSelectedBus(selectedBus?.id === bus.id ? null : bus)}
              >
                <div className="bus-card-top">
                  <span className="bus-card-id">{bus.id}</span>
                  <span className={`bus-status-badge status-${bus.status}`}>
                    {STATUS_CONFIG[bus.status].emoji} {STATUS_CONFIG[bus.status].label}
                  </span>
                </div>
                <div className="bus-card-route">{bus.route_name}</div>
                <div className="bus-card-bottom">
                  <span>⏱ {bus.eta}</span>
                  <span>👤 {bus.occupied}/{bus.capacity}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ROUTES TAB */}
      {activeTab === 'routes' && (
        <div className="routes-section">
          <div className="routes-info">
            <span>🗺️</span> Click any route to see all stops
          </div>
          {buses.map(bus => (
            <div key={bus.id} className="route-card">
              <div
                className="route-card-header"
                onClick={() => setExpandedRoute(expandedRoute === bus.id ? null : bus.id)}
              >
                <div className="route-card-left">
                  <span className="route-bus-icon">🚌</span>
                  <div>
                    <div className="route-name">{bus.route_name}</div>
                    <div className="route-meta">{bus.stops.length} stops · {bus.plate}</div>
                  </div>
                </div>
                <div className="route-card-right">
                  <span className={`bus-status-badge status-${bus.status}`}>
                    {STATUS_CONFIG[bus.status].emoji} {STATUS_CONFIG[bus.status].label}
                  </span>
                  <span className="expand-arrow">{expandedRoute === bus.id ? '▲' : '▼'}</span>
                </div>
              </div>

              {expandedRoute === bus.id && (
                <div className="route-stops">
                  {bus.stops.map((stop, i) => (
                    <div key={i} className={`stop-item ${i === 0 ? 'first' : i === bus.stops.length - 1 ? 'last' : ''}`}>
                      <div className="stop-dot-wrap">
                        <div className={`stop-dot ${i === 0 ? 'start' : i === bus.stops.length - 1 ? 'end' : ''}`} />
                        {i < bus.stops.length - 1 && <div className="stop-line" />}
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

      {/* TIMINGS TAB */}
      {activeTab === 'timing' && (
        <div className="timings-section">
          <div className="timings-notice">
            <span>ℹ️</span> All buses depart from Poornima University Gate
          </div>
          <div className="timings-grid">
            {buses.map(bus => (
              <div key={bus.id} className="timing-card">
                <div className="timing-card-header">
                  <div className="timing-bus-name">{bus.route_name}</div>
                  <span className="timing-driver">🧑‍✈️ {bus.driver}</span>
                </div>
                <div className="timing-slots">
                  <div className="timing-group">
                    <div className="timing-group-label">🌅 Morning</div>
                    <div className="timing-pills">
                      {bus.timings.slice(0, 3).map((t, i) => (
                        <span key={i} className="timing-pill morning">{t}</span>
                      ))}
                    </div>
                  </div>
                  <div className="timing-group">
                    <div className="timing-group-label">🌆 Evening (Return)</div>
                    <div className="timing-pills">
                      {bus.timings.slice(3).map((t, i) => (
                        <span key={i} className="timing-pill evening">{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="timing-stops-preview">
                  {bus.stops.map((s, i) => (
                    <span key={i} className="stop-chip">{s}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MY BUS TAB */}
      {activeTab === 'track' && (
        <div className="track-section">
          <div className="track-header">
            <h2>Select Your Bus</h2>
            <p>Choose the bus assigned to your area</p>
          </div>
          <div className="track-bus-list">
            {buses.map(bus => (
              <div
                key={bus.id}
                className={`track-bus-card ${myBus === bus.id ? 'selected' : ''}`}
                onClick={() => setMyBus(bus.id)}
              >
                <div className="track-bus-radio">
                  <div className={`radio-circle ${myBus === bus.id ? 'checked' : ''}`} />
                </div>
                <div className="track-bus-info">
                  <div className="track-bus-name">{bus.route_name}</div>
                  <div className="track-bus-stops">
                    {bus.stops.slice(1, 4).join(' → ')} {bus.stops.length > 4 ? '...' : ''}
                  </div>
                </div>
                <span className={`bus-status-badge status-${bus.status}`}>
                  {STATUS_CONFIG[bus.status].emoji}
                </span>
              </div>
            ))}
          </div>

          {myBusData && (
            <div className="track-detail-card">
              <h3>🎯 Your Bus — {myBusData.id}</h3>
              <div className="track-detail-grid">
                <div className="track-detail-item">
                  <span className="detail-label">Route</span>
                  <span className="detail-value">{myBusData.route_name}</span>
                </div>
                <div className="track-detail-item">
                  <span className="detail-label">Driver</span>
                  <span className="detail-value">{myBusData.driver}</span>
                </div>
                <div className="track-detail-item">
                  <span className="detail-label">Bus Number</span>
                  <span className="detail-value">{myBusData.plate}</span>
                </div>
                <div className="track-detail-item">
                  <span className="detail-label">Status</span>
                  <span className="detail-value">
                    {STATUS_CONFIG[myBusData.status].emoji} {STATUS_CONFIG[myBusData.status].label}
                  </span>
                </div>
                <div className="track-detail-item">
                  <span className="detail-label">ETA Next Stop</span>
                  <span className="detail-value eta-highlight">{myBusData.eta}</span>
                </div>
                <div className="track-detail-item">
                  <span className="detail-label">Seats Available</span>
                  <span className="detail-value">{myBusData.capacity - myBusData.occupied} free</span>
                </div>
              </div>

              <div className="track-stops-timeline">
                <div className="track-stops-title">Route Stops</div>
                {myBusData.stops.map((stop, i) => (
                  <div key={i} className="track-stop">
                    <div className="track-stop-dot-wrap">
                      <div className={`track-stop-dot ${i === 0 ? 'active' : ''}`} />
                      {i < myBusData.stops.length - 1 && <div className="track-stop-line" />}
                    </div>
                    <span className={`track-stop-name ${i === 0 ? 'active' : ''}`}>{stop}</span>
                  </div>
                ))}
              </div>

              <div className="occupancy-section">
                <div className="occupancy-header">
                  <span>Bus Occupancy</span>
                  <span style={{ color: occupancyColor(occupancyPct(myBusData)) }}>
                    {myBusData.occupied}/{myBusData.capacity} passengers
                  </span>
                </div>
                <div className="occupancy-bar">
                  <div
                    className="occupancy-fill"
                    style={{
                      width: `${occupancyPct(myBusData)}%`,
                      background: occupancyColor(occupancyPct(myBusData))
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
