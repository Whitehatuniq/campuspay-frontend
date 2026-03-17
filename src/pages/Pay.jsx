import { useState, useEffect } from 'react';
import { Send, User, ChevronRight, Clock, Wallet } from 'lucide-react';
import API from '../api/axios';
import PaymentModal from '../components/PaymentModal';
import './Pay.css';

const RECENT_CONTACTS = [
  { name: 'Arjun Sharma',  upi: 'arjun164f@campuspay', initial: 'A', color: '#38bdf8' },
  { name: 'Priya Patel',   upi: 'priyabe9a@campuspay', initial: 'P', color: '#a78bfa' },
  { name: 'Rahul Verma',   upi: 'rahul0c33@campuspay', initial: 'R', color: '#34d399' },
  { name: 'Sneha Gupta',   upi: 'sneha244d@campuspay', initial: 'S', color: '#fb923c' },
];

export default function Pay() {
  const [upiId, setUpiId]     = useState('');
  const [amount, setAmount]   = useState('');
  const [note, setNote]       = useState('');
  const [balance, setBalance] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError]     = useState('');

  useEffect(() => {
    API.get('/api/wallet/balance').then(r => setBalance(r.data.balance || 0)).catch(() => {});
  }, []);

  const handleProceed = (e) => {
    e.preventDefault();
    if (!upiId.trim()) { setError('Enter a UPI ID'); return; }
    if (!amount || parseFloat(amount) <= 0) { setError('Enter a valid amount'); return; }
    setError('');
    setModalOpen(true);
  };

  return (
    <div className="pay-page">
      <div className="pay-container">

        {/* Header */}
        <div className="page-hero" style={{ '--accent': '#38bdf8' }}>
          <div className="page-hero-icon"><Send size={28} color="#38bdf8" strokeWidth={1.8} /></div>
          <div>
            <h1>Send Money</h1>
            <p>Transfer to any CampusPay UPI ID</p>
          </div>
          <div className="page-hero-balance">
            <Wallet size={13} color="#64748b" />
            <span>₹{balance.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Recent contacts */}
        <div className="section-label">Recent</div>
        <div className="contacts-row">
          {RECENT_CONTACTS.map(c => (
            <button key={c.upi} className="contact-btn" onClick={() => setUpiId(c.upi)}>
              <div className="contact-avatar" style={{ background: c.color + '22', color: c.color, border: `1px solid ${c.color}44` }}>{c.initial}</div>
              <span className="contact-name">{c.name.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleProceed} className="pay-form">
          <div className="form-field">
            <label><User size={13} /> Recipient UPI ID</label>
            <input
              type="text"
              placeholder="e.g. arjun164f@campuspay"
              value={upiId}
              onChange={e => setUpiId(e.target.value)}
              className="field-input"
            />
          </div>

          <div className="form-field">
            <label>Amount</label>
            <div className="amount-field">
              <span className="currency-sign">₹</span>
              <input
                type="number"
                placeholder="0"
                min="1"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="amount-field-input"
              />
            </div>
          </div>

          <div className="form-field">
            <label>Note (optional)</label>
            <input
              type="text"
              placeholder="What's this for?"
              value={note}
              onChange={e => setNote(e.target.value)}
              className="field-input"
            />
          </div>

          {error && <div className="field-error">{error}</div>}

          <button type="submit" className="proceed-btn" style={{ background: '#38bdf8' }} disabled={!upiId || !amount}>
            Proceed to Pay {amount ? `₹${parseFloat(amount).toLocaleString('en-IN')}` : ''}
            <ChevronRight size={18} />
          </button>
        </form>
      </div>

      <PaymentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        amount={parseFloat(amount) || 0}
        title="Send Money"
        description={`To: ${upiId}${note ? ` · ${note}` : ''}`}
        toUpi={upiId}
        accentColor="#38bdf8"
        walletBalance={balance}
        apiEndpoint="/api/payment/pay"
        apiPayload={{ receiver_upi: upiId, payment_type: 'other', description: note || 'Send Money' }}
        onSuccess={() => { setUpiId(''); setAmount(''); setNote(''); setBalance(b => b - parseFloat(amount)); }}
      />
    </div>
  );
}
