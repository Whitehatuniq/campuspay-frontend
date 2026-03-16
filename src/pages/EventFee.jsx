import { useState, useEffect } from 'react';
import { CalendarDays, Users, MapPin, Tag, Wallet, ChevronRight, Trophy, Code, Music, Camera } from 'lucide-react';
import API from '../api/axios';
import PaymentModal from '../components/PaymentModal';
import './Pay.css';
import './EventFee.css';

const DUMMY_EVENTS = [
  { event_id: 'evt_001', name: 'TechFest 2024',            fee: 200, date: '20 April 2024',  venue: 'Main Auditorium',    seats_left: 45, category: 'Technology',  color: '#38bdf8', is_active: true,  description: 'Annual technology festival with coding competitions, robotics & more' },
  { event_id: 'evt_002', name: 'Annual Sports Day 2024',   fee: 150, date: '25 April 2024',  venue: 'Sports Ground',      seats_left: 80, category: 'Sports',      color: '#34d399', is_active: true,  description: 'Inter-department sports competition — cricket, football, athletics' },
  { event_id: 'evt_003', name: 'Rang Utsav — Cultural Fest', fee: 100, date: '5 May 2024',  venue: 'Open Air Theatre',   seats_left: 12, category: 'Cultural',    color: '#fb923c', is_active: true,  description: 'Celebrate art, dance, music and drama at our biggest cultural event' },
  { event_id: 'evt_004', name: 'PU Hackathon 2024',        fee: 250, date: '10 May 2024',   venue: 'CS Block Lab 3',     seats_left: 0,  category: 'Technology',  color: '#a78bfa', is_active: false, description: '24-hour hackathon — build, innovate, win prizes worth ₹50,000+' },
  { event_id: 'evt_005', name: 'Lens & Light Photography', fee: 50,  date: '18 April 2024', venue: 'Library Hall',       seats_left: 30, category: 'Arts',        color: '#f472b6', is_active: true,  description: 'Campus photography contest — best shot wins a DSLR camera' },
  { event_id: 'evt_006', name: 'Debate Championship',      fee: 0,   date: '22 April 2024', venue: 'Seminar Hall A',     seats_left: 60, category: 'Academic',    color: '#fbbf24', is_active: true,  description: 'Inter-college debate competition on current affairs & social issues' },
];

const CATEGORY_ICONS = {
  Technology: Code,
  Sports:     Trophy,
  Cultural:   Music,
  Arts:       Camera,
  Academic:   CalendarDays,
};

export default function EventFee() {
  const [events, setEvents]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [balance, setBalance]     = useState(0);
  const [filter, setFilter]       = useState('All');
  const [registering, setRegistering] = useState(null);
  const [form, setForm]           = useState({ name: '', branch: '', year: '', enrollment: '', phone: '' });
  const [formStep, setFormStep]   = useState('details');
  const [payModal, setPayModal]   = useState(false);

  useEffect(() => {
    Promise.all([
      API.get('/api/events/list'),
      API.get('/api/wallet/balance'),
    ]).then(([eRes, wRes]) => {
      const evts = eRes.data?.length ? eRes.data : DUMMY_EVENTS;
      setEvents(evts);
      setBalance(wRes.data?.balance || 0);
    }).catch(() => {
      setEvents(DUMMY_EVENTS);
      setBalance(500);
    }).finally(() => setLoading(false));
  }, []);

  const categories = ['All', ...new Set(events.map(e => e.category).filter(Boolean))];
  const filtered   = filter === 'All' ? events : events.filter(e => e.category === filter);

  const openRegister = (evt) => {
    setRegistering(evt);
    setFormStep('details');
    setForm({ name: '', branch: '', year: '', enrollment: '', phone: '' });
  };

  const handleFormNext = (e) => {
    e.preventDefault();
    if (!form.name || !form.enrollment || !form.phone) return;
    if (registering.fee === 0) {
      // Free event — no payment needed
      setPayModal(true);
    } else {
      setFormStep('payment');
    }
  };

  return (
    <div className="eventfee-page">
      {/* Hero */}
      <div className="page-hero" style={{ '--accent': '#34d399' }}>
        <div className="page-hero-icon"><CalendarDays size={28} color="#34d399" strokeWidth={1.8} /></div>
        <div><h1>Campus Events</h1><p>Register for upcoming events at Poornima University</p></div>
        <div className="page-hero-balance"><Wallet size={13} color="#64748b" /><span>₹{balance.toLocaleString('en-IN')}</span></div>
      </div>

      {/* Stats */}
      <div className="event-stats-row">
        <div className="event-stat"><span className="estat-num">{events.length}</span><span className="estat-label">Total Events</span></div>
        <div className="event-stat"><span className="estat-num" style={{ color: '#34d399' }}>{events.filter(e => e.is_active && e.seats_left > 0).length}</span><span className="estat-label">Open</span></div>
        <div className="event-stat"><span className="estat-num" style={{ color: '#ef4444' }}>{events.filter(e => !e.is_active || e.seats_left === 0).length}</span><span className="estat-label">Full / Closed</span></div>
        <div className="event-stat"><span className="estat-num" style={{ color: '#fbbf24' }}>{events.filter(e => e.fee === 0).length}</span><span className="estat-label">Free</span></div>
      </div>

      {/* Category filter */}
      <div className="filter-tabs">
        {categories.map(cat => (
          <button key={cat}
            className={`filter-tab ${filter === cat ? 'active' : ''}`}
            style={filter === cat ? { borderColor: '#34d399', color: '#34d399', background: '#34d39918' } : {}}
            onClick={() => setFilter(cat)}>
            {cat}
          </button>
        ))}
      </div>

      {/* Events grid */}
      {loading ? <div className="spinner" /> : (
        <div className="events-grid">
          {filtered.map(evt => {
            const Icon  = CATEGORY_ICONS[evt.category] || CalendarDays;
            const color = evt.color || '#34d399';
            const full  = !evt.is_active || evt.seats_left === 0;
            return (
              <div key={evt.event_id} className={`event-card ${full ? 'event-full' : ''}`} style={{ '--evt-color': color }}>
                <div className="event-card-accent" />

                <div className="event-card-header">
                  <div className="event-icon-wrap" style={{ background: color + '18' }}>
                    <Icon size={22} color={color} strokeWidth={1.8} />
                  </div>
                  <div className="event-badges">
                    <span className="event-category-tag" style={{ color, background: color + '18', border: `1px solid ${color}44` }}>{evt.category}</span>
                    {evt.seats_left === 0 && <span className="badge-full">House Full</span>}
                    {evt.seats_left > 0 && evt.seats_left < 20 && <span className="badge-few">Only {evt.seats_left} left!</span>}
                    {evt.fee === 0 && <span className="badge-free">FREE</span>}
                  </div>
                </div>

                <h3 className="event-name">{evt.name}</h3>
                {evt.description && <p className="event-desc">{evt.description}</p>}

                <div className="event-meta">
                  <div className="event-meta-item"><CalendarDays size={13} color="#64748b" /><span>{evt.date}</span></div>
                  <div className="event-meta-item"><MapPin size={13} color="#64748b" /><span>{evt.venue}</span></div>
                  <div className="event-meta-item"><Users size={13} color="#64748b" /><span>{evt.seats_left > 0 ? `${evt.seats_left} seats available` : 'No seats left'}</span></div>
                </div>

                <div className="event-card-footer">
                  <div className="event-fee-display">
                    <Tag size={13} color={color} />
                    <span style={{ color, fontSize: 20, fontWeight: 800 }}>
                      {evt.fee === 0 ? 'FREE' : `₹${evt.fee}`}
                    </span>
                  </div>
                  <button
                    className="event-register-btn"
                    style={{ background: full ? '#1e293b' : color, color: full ? '#475569' : '#0a0f1e' }}
                    disabled={full}
                    onClick={() => openRegister(evt)}
                  >
                    {full ? 'Closed' : 'Register'} {!full && <ChevronRight size={15} />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Registration Drawer */}
      {registering && (
        <div className="drawer-overlay" onClick={() => setRegistering(null)}>
          <div className="drawer" onClick={e => e.stopPropagation()}>
            <div className="drawer-handle" />

            <div className="drawer-event-header" style={{ '--c': registering.color }}>
              <div className="drawer-event-name">{registering.name}</div>
              <div className="drawer-event-meta">
                <span><CalendarDays size={12} /> {registering.date}</span>
                <span><MapPin size={12} /> {registering.venue}</span>
              </div>
              <div className="drawer-event-fee" style={{ color: registering.color }}>
                Fee: {registering.fee === 0 ? 'FREE' : `₹${registering.fee}`}
              </div>
            </div>

            {formStep === 'details' && (
              <form onSubmit={handleFormNext} className="reg-form">
                <div className="form-field">
                  <label>Full Name *</label>
                  <input className="field-input" placeholder="Your full name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                </div>
                <div className="form-row">
                  <div className="form-field">
                    <label>Branch</label>
                    <input className="field-input" placeholder="e.g. BCA" value={form.branch} onChange={e => setForm({...form, branch: e.target.value})} />
                  </div>
                  <div className="form-field">
                    <label>Year</label>
                    <input className="field-input" placeholder="e.g. 2nd" value={form.year} onChange={e => setForm({...form, year: e.target.value})} />
                  </div>
                </div>
                <div className="form-field">
                  <label>Enrollment No. *</label>
                  <input className="field-input" placeholder="e.g. 2024BCA101" value={form.enrollment} onChange={e => setForm({...form, enrollment: e.target.value})} required />
                </div>
                <div className="form-field">
                  <label>Phone *</label>
                  <input className="field-input" type="tel" placeholder="10-digit mobile number" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} required />
                </div>
                <button type="submit" className="proceed-btn" style={{ background: registering.color }}
                  disabled={!form.name || !form.enrollment || !form.phone}>
                  {registering.fee === 0 ? 'Register for Free' : `Proceed to Pay ₹${registering.fee}`}
                  <ChevronRight size={18} />
                </button>
                <button type="button" className="pm-link-btn" onClick={() => setRegistering(null)}>Cancel</button>
              </form>
            )}

            {formStep === 'payment' && (
              <div className="payment-step">
                <div className="reg-summary">
                  {[['Name', form.name], ['Enrollment', form.enrollment], ['Branch', form.branch || '—'], ['Event', registering.name], ['Venue', registering.venue], ['Date', registering.date]].map(([k, v]) => (
                    <div key={k} className="reg-summary-row"><span>{k}</span><strong>{v}</strong></div>
                  ))}
                  <div className="reg-summary-row">
                    <span>Registration Fee</span>
                    <strong style={{ color: registering.color, fontSize: 16 }}>₹{registering.fee}</strong>
                  </div>
                </div>
                <button className="proceed-btn" style={{ background: registering.color }} onClick={() => setPayModal(true)}>
                  Pay ₹{registering.fee} <ChevronRight size={18} />
                </button>
                <button className="pm-link-btn" onClick={() => setFormStep('details')}>← Edit details</button>
              </div>
            )}
          </div>
        </div>
      )}

      <PaymentModal
        open={payModal}
        onClose={() => setPayModal(false)}
        amount={registering?.fee || 0}
        title="Event Registration"
        description={registering?.name || ''}
        toUpi="events@campuspay"
        accentColor={registering?.color || '#34d399'}
        walletBalance={balance}
        apiEndpoint="/api/events/register"
        apiPayload={{ event_id: registering?.event_id, ...form }}
        onSuccess={() => {
          setBalance(b => b - (registering?.fee || 0));
          setEvents(prev => prev.map(e => e.event_id === registering?.event_id
            ? { ...e, seats_left: Math.max(0, e.seats_left - 1) } : e));
          setPayModal(false);
          setRegistering(null);
        }}
      />
    </div>
  );
}
