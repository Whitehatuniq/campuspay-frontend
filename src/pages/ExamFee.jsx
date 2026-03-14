import { useState } from 'react';
import API from '../api/axios';
import './Pay.css';

export default function ExamFee() {
  const [feeType, setFeeType] = useState('regular');
  const [pin, setPin] = useState('');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePay = async (e) => {
    e.preventDefault();
    setStatus(null);
    setLoading(true);
    try {
      const res = await API.post(`/api/payment/pay-exam-fee?fee_type=${feeType}&upi_pin=${pin}`);
      setStatus({ type: 'success', msg: res.data.message, txn_id: res.data.transaction_id });
      setPin('');
    } catch (err) {
      setStatus({ type: 'error', msg: err.response?.data?.detail || 'Payment failed.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pay-page">
      <div className="pay-card">
        <h2>Pay Exam Fee</h2>
        <p className="pay-sub">Pay your semester or back paper fee</p>

        {status && (
          <div className={`pay-status ${status.type}`}>
            {status.type === 'success' ? '✅' : '❌'} {status.msg}
            {status.txn_id && <div className="txn-id">TXN: {status.txn_id.slice(0, 16)}...</div>}
          </div>
        )}

        <form onSubmit={handlePay} className="pay-form">
          <div className="fee-options">
            {[
              { value: 'regular', label: 'Regular Exam', icon: '📝' },
              { value: 'back',    label: 'Back Paper',   icon: '📋' },
            ].map(opt => (
              <div
                key={opt.value}
                className={`fee-option ${feeType === opt.value ? 'selected' : ''}`}
                onClick={() => setFeeType(opt.value)}
              >
                <span>{opt.icon}</span>
                <span>{opt.label}</span>
              </div>
            ))}
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
            {loading ? 'Processing...' : 'Pay Fee'}
          </button>
        </form>
      </div>
    </div>
  );
}
