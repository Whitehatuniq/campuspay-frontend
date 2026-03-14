import { useState } from 'react';
import API from '../api/axios';
import './Pay.css';

const PAYMENT_TYPES = [
  { value: 'exam_fee',     label: 'Exam Fee' },
  { value: 'back_fee',     label: 'Back Fee' },
  { value: 'event_fee',    label: 'Event Fee' },
  { value: 'canteen',      label: 'Canteen' },
  { value: 'library_fine', label: 'Library Fine' },
  { value: 'other',        label: 'Other' },
];

export default function Pay() {
  const [form, setForm] = useState({
    receiver_upi: '', amount: '', payment_type: 'other',
    description: '', upi_pin: ''
  });
  const [status, setStatus] = useState(null); // { type: 'success'|'error', msg, txn_id }
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handlePay = async (e) => {
    e.preventDefault();
    setStatus(null);
    setLoading(true);
    try {
      const res = await API.post('/api/payment/pay', {
        ...form,
        amount: parseFloat(form.amount),
      });
      setStatus({ type: 'success', msg: res.data.message, txn_id: res.data.transaction_id });
      setForm({ receiver_upi: '', amount: '', payment_type: 'other', description: '', upi_pin: '' });
    } catch (err) {
      setStatus({ type: 'error', msg: err.response?.data?.detail || 'Payment failed.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pay-page">
      <div className="pay-card">
        <h2>Send Money</h2>
        <p className="pay-sub">Transfer via UPI ID</p>

        {status && (
          <div className={`pay-status ${status.type}`}>
            {status.type === 'success' ? '✅' : '❌'} {status.msg}
            {status.txn_id && <div className="txn-id">TXN: {status.txn_id.slice(0, 16)}...</div>}
          </div>
        )}

        <form onSubmit={handlePay} className="pay-form">
          <div className="form-group">
            <label>Receiver UPI ID</label>
            <input type="text" placeholder="name1234@campuspay" value={form.receiver_upi} onChange={set('receiver_upi')} required />
          </div>

          <div className="form-group">
            <label>Amount (₹)</label>
            <input type="number" placeholder="0.00" min="1" step="0.01" value={form.amount} onChange={set('amount')} required />
          </div>

          <div className="form-group">
            <label>Payment Type</label>
            <select value={form.payment_type} onChange={set('payment_type')}>
              {PAYMENT_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Description (optional)</label>
            <input type="text" placeholder="What's this for?" value={form.description} onChange={set('description')} />
          </div>

          <div className="form-group">
            <label>UPI PIN</label>
            <input type="password" placeholder="4-6 digit PIN" maxLength={6} value={form.upi_pin} onChange={set('upi_pin')} required />
          </div>

          <button type="submit" className="pay-btn" disabled={loading}>
            {loading ? 'Processing...' : `Pay ₹${form.amount || '0'}`}
          </button>
        </form>
      </div>
    </div>
  );
}
