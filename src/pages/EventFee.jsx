import { useEffect, useState } from 'react';
import API from '../api/axios';
import useRazorpay from '../hooks/useRazorpay';
import { useAuth } from '../context/AuthContext';
import './EventFee.css';

const BRANCHES = ['BCA', 'BCA Cyber Security', 'B.Tech CSE', 'B.Tech IT', 'B.Com', 'BBA', 'MBA', 'MCA'];
const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

export default function EventFee() {
  const [events, setEvents] = useState([]);
  const [myRegs, setMyRegs] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const { user } = useAuth();
  const { openPayment } = useRazorpay();

  const [form, setForm] = useState({
    name: '', branch: 'BCA Cyber Security',
    year: '1st Year', enrollment_no: '',
    contact_no: '', upi_pin: ''
  });

  const fetchData = async () => {
    try {
      const [eventsRes, regsRes] = await Promise.all([
        API.get('/api/events/list'),
        API.get('/api/events/my-registrations')
      ]);
      setEvents(eventsRes.data);
      setMyRegs(regsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Pre-fill form with user data
    if (user) {
      setForm(f => ({
        ...f,
        name: user.name || '',
        enrollment_no: user.enrollment_no || ''
      }));
    }
  }, [user]);

  const isRegistered = (event_id) =>
    myRegs.some(r => r.event_id === event_id);

  const handleSelectEvent = (event) => {
    if (isRegistered(event.event_id)) return;
    setSelected(event);
    setShowForm(true);
    setStatus(null);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setStatus(null);

    openPayment({
      amount: selected.fee,
      name: form.name,
      description: `Registration: ${selected.event_name}`,
      onSuccess: async (response) => {
        setSubmitting(true);
        try {
          const res = await API.post('/api/events/register', {
            event_id: selected.event_id,
            name: form.name,
            branch: form.branch,
            year: form.year,
            enrollment_no: form.enrollment_no,
            contact_no: form.contact_no,
            upi_pin: form.upi_pin
          });
          setStatus({ type: 'success', msg: res.data.message });
          setShowForm(false);
          setSelected(null);
          fetchData();
        } catch (err) {
          setStatus({ type: 'error', msg: err.response?.data?.detail || 'Registration failed.' });
        } finally {
          setSubmitting(false);
        }
      },
      onFailure: (msg) => {
        setStatus({ type: 'error', msg: msg || 'Payment cancelled.' });
      }
    });
  };

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  if (loading) return <div className="page-loading">Loading events...</div>;

  return (
    <div className="events-page">
      <div className="events-header">
        <h2>Campus Events</h2>
        <p className="events-sub">Register and pay for campus events</p>
      </div>

      {status && (
        <div className={`event-status ${status.type}`}>
          {status.type === 'success' ? '✅' : '❌'} {status.msg}
        </div>
      )}

      {/* Event Registration Form */}
      {showForm && selected && (
        <div className="reg-modal">
          <div className="reg-card">
            <div className="reg-header">
              <h3>Register for {selected.event_name}</h3>
              <button className="close-btn" onClick={() => setShowForm(false)}>✕</button>
            </div>

            <div className="event-summary">
              <span>📅 {selected.date}</span>
              <span>📍 {selected.venue}</span>
              <span className="event-fee-badge">₹{selected.fee}</span>
            </div>

            <form onSubmit={handleRegister} className="reg-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" value={form.name} onChange={set('name')} required placeholder="Your full name" />
                </div>
                <div className="form-group">
                  <label>Enrollment No</label>
                  <input type="text" value={form.enrollment_no} onChange={set('enrollment_no')} required placeholder="2024BCA101" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Branch</label>
                  <select value={form.branch} onChange={set('branch')}>
                    {BRANCHES.map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Year</label>
                  <select value={form.year} onChange={set('year')}>
                    {YEARS.map(y => <option key={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Contact Number</label>
                <input type="tel" value={form.contact_no} onChange={set('contact_no')} required placeholder="9876543210" maxLength={10} />
              </div>

              <div className="form-group">
                <label>UPI PIN (to confirm payment)</label>
                <input type="password" value={form.upi_pin} onChange={set('upi_pin')} required placeholder="4-6 digit PIN" maxLength={6} />
              </div>

              <button type="submit" className="reg-btn" disabled={submitting}>
                {submitting ? 'Processing...' : `Pay ₹${selected.fee} & Register`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Events List */}
      {events.length === 0 ? (
        <div className="no-events">
          <span>🎪</span>
          <p>No events available right now</p>
        </div>
      ) : (
        <div className="events-grid">
          {events.map(event => {
            const registered = isRegistered(event.event_id);
            return (
              <div key={event.event_id} className={`event-card ${registered ? 'registered' : ''}`}>
                <div className="event-card-header">
                  <h3>{event.event_name}</h3>
                  {registered && <span className="reg-badge">✅ Registered</span>}
                </div>
                <p className="event-card-desc">{event.description}</p>
                <div className="event-card-details">
                  <span>📅 {event.date}</span>
                  <span>📍 {event.venue}</span>
                  <span>⏰ Last date: {event.last_date}</span>
                </div>
                <div className="event-card-footer">
                  <span className="event-price">₹{event.fee}</span>
                  {registered ? (
                    <span className="registered-text">Already Registered</span>
                  ) : (
                    <button className="register-btn" onClick={() => handleSelectEvent(event)}>
                      Register Now
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* My Registrations */}
      {myRegs.length > 0 && (
        <div className="my-regs">
          <div className="section-title">My Registrations</div>
          <div className="regs-list">
            {myRegs.map(reg => (
              <div key={reg.registration_id} className="reg-item">
                <div>
                  <div className="reg-event-name">{reg.event_name}</div>
                  <div className="reg-details">{reg.branch} • {reg.year} • {reg.enrollment_no}</div>
                </div>
                <div className="reg-paid">₹{reg.amount_paid} paid</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
