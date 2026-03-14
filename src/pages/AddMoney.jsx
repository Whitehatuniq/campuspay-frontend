import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import useRazorpay from '../hooks/useRazorpay';
import './Pay.css';

export default function AddMoney() {
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { openPayment } = useRazorpay();
  const navigate = useNavigate();

  const quickAmounts = [100, 200, 500, 1000, 2000, 5000];

  const handleAddMoney = async (e) => {
    e.preventDefault();
    if (!amount || amount <= 0) return;
    setLoading(true);
    setStatus(null);

    openPayment({
      amount: parseFloat(amount),
      name: user?.name || 'Student',
      description: `Add Rs.${amount} to CampusPay Wallet`,
      onSuccess: async (response) => {
        try {
          const res = await API.post('/api/wallet/add-money', {
            amount: parseFloat(amount),
            method: 'razorpay',
          });
          setStatus({ type: 'success', msg: res.data.message });
          setTimeout(() => navigate('/dashboard'), 2000);
        } catch (err) {
          setStatus({ type: 'error', msg: 'Payment done but wallet update failed.' });
        } finally {
          setLoading(false);
        }
      },
      onFailure: (msg) => {
        setStatus({ type: 'error', msg: msg || 'Payment cancelled.' });
        setLoading(false);
      }
    });
  };

  return (
    <div className="pay-page">
      <div className="pay-card">
        <h2>Add Money</h2>
        <p className="pay-sub">Top up your CampusPay wallet via Razorpay</p>

        {status && (
          <div className={`pay-status ${status.type}`}>
            {status.type === 'success' ? '✅' : '❌'} {status.msg}
          </div>
        )}

        <form onSubmit={handleAddMoney} className="pay-form">
          <div className="form-group">
            <label>Quick Select</label>
            <div className="quick-amounts">
              {quickAmounts.map(a => (
                <button
                  key={a}
                  type="button"
                  className={`amount-btn ${amount === String(a) ? 'selected' : ''}`}
                  onClick={() => setAmount(String(a))}
                >
                  Rs.{a}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Or Enter Amount</label>
            <input
              type="number"
              placeholder="Enter amount"
              min="1"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="razorpay-info">
            <span>Pay via UPI, Cards, NetBanking or Wallets</span>
          </div>

          <button type="submit" className="pay-btn" disabled={loading || !amount}>
            {loading ? 'Opening payment...' : `Add Rs.${amount || '0'} via Razorpay`}
          </button>
        </form>
      </div>
    </div>
  );
}
