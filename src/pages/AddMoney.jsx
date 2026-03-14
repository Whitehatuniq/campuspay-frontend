import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import './Pay.css';

export default function AddMoney() {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('mock_upi');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const quickAmounts = [100, 200, 500, 1000, 2000, 5000];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);
    setLoading(true);
    try {
      const res = await API.post('/api/wallet/add-money', {
        amount: parseFloat(amount),
        method
      });
      setStatus({ type: 'success', msg: res.data.message });
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      setStatus({ type: 'error', msg: err.response?.data?.detail || 'Failed to add money.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pay-page">
      <div className="pay-card">
        <h2>Add Money</h2>
        <p className="pay-sub">Top up your CampusPay wallet</p>

        {status && (
          <div className={`pay-status ${status.type}`}>
            {status.type === 'success' ? '✅' : '❌'} {status.msg}
            {status.type === 'success' && <div className="txn-id">Redirecting to dashboard...</div>}
          </div>
        )}

        <form onSubmit={handleSubmit} className="pay-form">
          {/* Quick amount buttons */}
          <div className="form-group">
            <label>Quick Select</label>
            <div className="quick-amounts">
              {quickAmounts.map(a => (
                <button
                  key={a}
                  type="button"
                 className={`amount-btn ${Number(amount) === a ? 'selected' : ''}`}
                  onClick={() => setAmount(String(a))}
                >
                  ₹{a}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Or Enter Amount (₹)</label>
            <input
              type="number"
              placeholder="Enter amount"
              min="1"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Payment Method</label>
            <select value={method} onChange={e => setMethod(e.target.value)}>
              <option value="mock_upi">Mock UPI</option>
              <option value="mock_card">Mock Card</option>
            </select>
          </div>

          <button type="submit" className="pay-btn" disabled={loading}>
            {loading ? 'Processing...' : `Add ₹${amount || '0'}`}
          </button>
        </form>
      </div>
    </div>
  );
}
