import { useEffect, useState } from 'react';
import API from '../api/axios';
import './Pay.css';

export default function EventFee() {
  const [events, setEvents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [pin, setPin] = useState('');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    API.get('/api/admin/events')
      .then(res => setEvents(res.data))
      .catch(() => setEvents([]));
  }, []);

  const handlePay = async (e) => {
    e.preventDefault();
    if (!selected) return;
    setStatus(null);
    setLoading(true);
    try {
      const res = await API.post(
        `/api/payment/pay-event-fee?event_id=${selected.event_id}&upi_pin=${pin}`
      );
      setStatus({ type: 'success', msg: res.data.message, txn_id: res.data.transaction_id });
      setPin('');
      setSelected(null);
    } catch (err) {
      setStatus({ type: 'error', msg: err.response?.data?.detail || 'Payment failed.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pay-page">
      <div className="pay-card">
        <h2>Event Fees</h2>
        <p className="pay-sub">Pay for campus events</p>

        {status && (
          <div className={`pay-status ${status.type}`}>
            {status.type === 'success' ? '✅' : '❌'} {status.msg}
            {status.txn_id && <div className="txn-id">TXN: {status.txn_id.slice(0, 16)}...</div>}
          </div>
        )}

        {events.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#64748b', padding: '40px 0' }}>
            🎪 No events available right now
          </div>
        ) : (
          <form onSubmit={handlePay} className="pay-form">
            <div className="form-group">
              <label>Select Event</label>
              <div className="event-list">
                {events.map(event => (
                  <div
                    key={event.event_id}
                    className={`event-item ${selected?.event_id === event.event_id ? 'selected' : ''}`}
                    onClick={() => setSelected(event)}
                  >
                    <div className="event-name">{event.event_name}</div>
                    <div className="event-details">
                      <span>{event.description}</span>
                      <span className="event-amount">₹{event.amount}</span>
                    </div>
                    <div className="event-due">Due: {event.due_date}</div>
                  </div>
                ))}
              </div>
            </div>

            {selected && (
              <>
                <div className="selected-event">
                  Paying ₹{selected.amount} for {selected.event_name}
                </div>
                <div className="form-group">
                  <label>UPI PIN</label>
                  <input
                    type="password"
                    placeholder="4-6 digit PIN"
                    maxLength={6}
                    value={pin}
                    onChange={e => setPin(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="pay-btn" disabled={loading}>
                  {loading ? 'Processing...' : `Pay ₹${selected.amount}`}
                </button>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
