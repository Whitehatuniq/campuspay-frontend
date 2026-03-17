import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import useRazorpay from '../hooks/useRazorpay';
import { Wallet, Plus, ChevronRight, CheckCircle, XCircle } from 'lucide-react';
import './AddMoney.css';

const QUICK_AMOUNTS = [100, 200, 500, 1000, 2000, 5000];

export default function AddMoney() {
  const [amount,  setAmount]  = useState('');
  const [step,    setStep]    = useState('amount');
  const [loading, setLoading] = useState(false);
  const [errMsg,  setErrMsg]  = useState('');
  const { user }  = useAuth();
  const { openPayment } = useRazorpay();
  const navigate  = useNavigate();
  const numAmount = parseFloat(amount) || 0;

  const handlePay = () => {
    if (numAmount <= 0) return;
    setLoading(true);
    openPayment({
      amount: numAmount,
      name: user?.name || 'Student',
      description: `Add ₹${numAmount} to CampusPay Wallet`,
      onSuccess: async (response) => {
        try {
          await API.post('/api/wallet/add-money', {
            amount: numAmount,
            method: 'mock_upi',
          });
          setStep('success');
        } catch (e) {
          setErrMsg('Payment done but wallet update failed. Contact support.');
          setStep('error');
        }
        setLoading(false);
      },
      onFailure: (msg) => {
        setErrMsg(msg || 'Payment cancelled.');
        setStep('error');
        setLoading(false);
      },
    });
  };

  if (step === 'success') return (
    <div className="addmoney-page">
      <div className="addmoney-card">
        <div className="success-section">
          <div className="success-icon"><CheckCircle size={64} color="#22c55e" /></div>
          <h3>Money Added!</h3>
          <div className="success-amount">₹{numAmount.toLocaleString('en-IN')}</div>
          <p>Successfully added to your CampusPay wallet</p>
          <button className="proceed-btn" onClick={() => navigate('/dashboard')}>
            Go to Dashboard <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );

  if (step === 'error') return (
    <div className="addmoney-page">
      <div className="addmoney-card">
        <div className="success-section">
          <div className="success-icon"><XCircle size={64} color="#ef4444" /></div>
          <h3>Payment Failed</h3>
          <p style={{ color: '#ef4444' }}>{errMsg}</p>
          <button className="proceed-btn" style={{ background: '#ef4444' }}
            onClick={() => { setStep('amount'); setErrMsg(''); }}>
            Try Again
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="addmoney-page">
      <div className="addmoney-card">
        <div className="addmoney-header">
          <div className="addmoney-title-row">
            <div className="addmoney-icon"><Wallet size={22} color="#38bdf8" /></div>
            <div>
              <h2>Add Money</h2>
              <p>Top up your CampusPay wallet instantly</p>
            </div>
          </div>
        </div>

        <div className="amount-display">
          <span className="currency-sign">₹</span>
          <input type="number" className="amount-input" placeholder="0"
            min="1" max="50000" value={amount}
            onChange={e => setAmount(e.target.value)} autoFocus />
        </div>

        <div className="quick-label">Quick Select</div>
        <div className="quick-grid">
          {QUICK_AMOUNTS.map(a => (
            <button key={a} type="button"
              className={`quick-btn ${amount === String(a) ? 'active' : ''}`}
              onClick={() => setAmount(String(a))}>
              ₹{a.toLocaleString()}
            </button>
          ))}
        </div>

        <div className="pay-methods-info">
          <div className="pay-method-chip">📱 UPI</div>
          <div className="pay-method-chip">💳 Cards</div>
          <div className="pay-method-chip">🏦 Net Banking</div>
          <div className="pay-method-chip">👛 Wallets</div>
        </div>

        <button className="proceed-btn" onClick={handlePay}
          disabled={loading || numAmount <= 0}>
          {loading ? 'Opening payment...' : <>
            <Plus size={18} /> Add ₹{numAmount > 0 ? numAmount.toLocaleString('en-IN') : '0'} to Wallet
          </>}
        </button>

        <p className="secure-note">🔒 Secured by Razorpay</p>
      </div>
    </div>
  );
}
