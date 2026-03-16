import { useState, useEffect } from 'react';
import { CalendarDays, Users, MapPin, Tag, Wallet, ChevronRight, CheckCircle } from 'lucide-react';
import API from '../api/axios';
import PaymentModal from '../components/PaymentModal';
import './Pay.css';
import './EventFee.css';

export default function EventFee() {
  const [events, setEvents]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [balance, setBalance]       = useState(0);
  const [registering, setRegistering] = useState(null); // event being registered
  const [form, setForm]             = useState({ name: '', branch: '', year: '', enrollment: '', phone: '' });
  const [formStep, setFormStep]     = useState('details'); // details | payment
  const [payModal, setPayModal]     = useState(false);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [evRes, walRes] = await Promise.all([
        API.get('/api/events/list'),
        API.get('/api/wallet/balance'),
      ]);
      setEvents(evRes.data || []);
      setBalance(walRes.data.balance || 0);
    } catch {
      setEvents([
        { event_id: 'evt_001', name: 'TechFest 2024',        fee: 200, date: '2024-04-20', venue: 'Main Auditorium',    seats_left: 45, category: 'Tech',     color: '#38bdf8', is_active: true  },
        { event_id: 'evt_002', name: 'Annual Sports Day',     fee: 150, date: '2024-04-25', venue: 'Sports Ground',      seats_left: 80, category: 'Sports',   color: '#34d399', is_active: true  },
        { event_id: 'evt_003', name: 'Cultural Fest 2024',    fee: 100, date: '2024-05-05', venue: 'Open Air Theatre',   seats_left: 12, category: 'Cultural', color: '#fb923c', is_active: true  },
        { event_id: 'evt_004', name: '24Hr Hackathon',        fee: 250, date: '2024-05-10', venue: 'CS Block Lab 3',     seats_left: 0,  category: 'Tech',     color: '#a78bfa', is_active: false },
        { event_id: 'evt_005', name: 'Photography Contest',   fee: 50,  date: '2024-04-18', venue: 'Library Hall',       seats_left: 30, category: 'Arts',     color: '#f472b6', is_active: true  },
      ]);
      setBalance(500);
    }
    setLoading(false);
  };

  const handleRegisterClick = (event) => {
    setRegistering(event);
    setFormStep('details');
    setForm({ name: '', branch: '', year: '', enrollment: '', phone: '' });
  };

  const handleFormNext = (e) => {
    e.preventDefault();
    if (!form.name || !form.enrollment || !form.phone) return;
    setFormStep('payment');
  };

  const EVENT_CATEGORIES = [...new Set(events.map(e => e.category))];

  return (
    <div className="eventfee-page">
      {/* Hero */}
      <div className="page-hero" style={{ '--accent': '#34d399' }}>
        <div className="page-hero-icon"><CalendarDays size={28} color="#34d399" strokeWidth={1.8} /></div>
        <div><h1>Events</h1><p>Register and pay for campus events</p></div>
        <div className="page-hero-balance"><Wallet size={13} color="#64748b" /><span>₹{balance.toLocaleString('en-IN')}</span></div>
      </div>

      {loading ? <div className="spinner" /> : (
        <div className="events-grid">
          {events.map(evt => (
            <div key={evt.event_id} className={`event-card ${!evt.is_active || evt.seats_left === 0 ? 'sold-out' : ''}`}
              style={{ '--evt-color': evt.color }}>
              <div className="event-card-top">
                <span className="event-category-tag" style={{ color: evt.color, background: evt.color + '18', border: `1px solid ${evt.color}44` }}>
                  {evt.category}
                </span>
                {evt.seats_left === 0
                  ? <span className="event-full-tag">Full</span>
                  : evt.seats_left < 20
                  ? <span className="event-few-tag">Only {evt.seats_left} left</span>
                  : null}
              </div>

              <h3 className="event-name">{evt.name}</h3>

              <div className="event-meta">
                <div className="event-meta-item"><CalendarDays size={13} color="#64748b" /><span>{evt.date}</span></div>
                <div className="event-meta-item"><MapPin size={13} color="#64748b" /><span>{evt.venue}</span></div>
                <div className="event-meta-item"><Users size={13} color="#64748b" /><span>{evt.seats_left} seats left</span></div>
              </div>

              <div className="event-card-footer">
                <div className="event-fee-badge">
                  <Tag size={13} color={evt.color} />
                  <span style={{ color: evt.color }}>₹{evt.fee}</span>
                </div>
                <button
                  className="event-register-btn"
                  style={{ background: evt.color }}
                  disabled={!evt.is_active || evt.seats_left === 0}
                  onClick={() => handleRegisterClick(evt)}
                >
                  {evt.seats_left === 0 ? 'Full' : 'Register'}
                  {evt.seats_left > 0 && <ChevronRight size={15} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Registration Drawer */}
      {registering && (
        <div className="drawer-overlay" onClick={() => setRegistering(null)}>
          <div className="drawer" onClick={e => e.stopPropagation()}>
            <div className="drawer-handle" />
            <div className="drawer-header">
              <div>
                <h2>{registering.name}</h2>
                <p style={{ color: registering.color }}>Registration Fee: ₹{registering.fee}</p>
              </div>
              <button className="drawer-close" onClick={() => setRegistering(null)}>✕</button>
            </div>

            {formStep === 'details' && (
              <form onSubmit={handleFormNext} className="reg-form">
                <div className="form-field">
                  <label>Full Name</label>
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
                  <label>Enrollment No.</label>
                  <input className="field-input" placeholder="e.g. 2024BCA101" value={form.enrollment} onChange={e => setForm({...form, enrollment: e.target.value})} required />
                </div>
                <div className="form-field">
                  <label>Phone</label>
                  <input className="field-input" placeholder="10-digit mobile number" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} required />
                </div>
                <button type="submit" className="proceed-btn" style={{ background: registering.color }} disabled={!form.name || !form.enrollment || !form.phone}>
                  Proceed to Pay ₹{registering.fee} <ChevronRight size={18} />
                </button>
              </form>
            )}

            {formStep === 'payment' && (
              <div className="payment-step">
                <div className="reg-summary">
                  <div className="reg-summary-row"><span>Name</span><strong>{form.name}</strong></div>
                  <div className="reg-summary-row"><span>Enrollment</span><strong>{form.enrollment}</strong></div>
                  <div className="reg-summary-row"><span>Event</span><strong>{registering.name}</strong></div>
                  <div className="reg-summary-row"><span>Fee</span><strong style={{ color: registering.color }}>₹{registering.fee}</strong></div>
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

      {/* Payment Modal */}
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
