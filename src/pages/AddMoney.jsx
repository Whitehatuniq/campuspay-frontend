import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import useRazorpay from '../hooks/useRazorpay';
import {
  Wallet, Plus, CheckCircle, XCircle, ChevronRight,
  Smartphone, CreditCard, Building2, ArrowLeft
} from 'lucide-react';
import './AddMoney.css';

const QUICK_AMOUNTS = [100, 200, 500, 1000, 2000, 5000];

// UPI deep links — these open the app directly on mobile
const UPI_APPS = [
  {
    id: 'phonepe',
    name: 'PhonePe',
    color: '#5f259f',
    bg: '#5f259f18',
    border: '#5f259f44',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/PhonePe_Logo.png/120px-PhonePe_Logo.png',
    deepLink: (upiId, amount, note) =>
      `phonepe://pay?pa=${upiId}&pn=CampusPay&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`,
    webLink: (upiId, amount, note) =>
      `https://phon.pe/ru_${upiId.replace('@', '_')}`,
  },
  {
    id: 'googlepay',
    name: 'Google Pay',
    color: '#4285f4',
    bg: '#4285f418',
    border: '#4285f444',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Google_Pay_Logo.svg/120px-Google_Pay_Logo.svg.png',
    deepLink: (upiId, amount, note) =>
      `tez://upi/pay?pa=${upiId}&pn=CampusPay&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`,
    webLink: (upiId, amount, note) =>
      `https://pay.google.com/`,
  },
  {
    id: 'paytm',
    name: 'Paytm',
    color: '#00baf2',
    bg: '#00baf218',
    border: '#00baf244',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Paytm_Logo_%28standalone%29.svg/120px-Paytm_Logo_%28standalone%29.svg.png',
    deepLink: (upiId, amount, note) =>
      `paytmmp://pay?pa=${upiId}&pn=CampusPay&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`,
    webLink: () => `https://paytm.com/`,
  },
  {
    id: 'bhim',
    name: 'BHIM UPI',
    color: '#ff6600',
    bg: '#ff660018',
    border: '#ff660044',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/BHIM_SVG_logo.svg/120px-BHIM_SVG_logo.svg.png',
    deepLink: (upiId, amount, note) =>
      `upi://pay?pa=${upiId}&pn=CampusPay&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`,
    webLink: () => `https://www.bhimupi.org.in/`,
  },
];

// University UPI ID that receives the money
const UNIVERSITY_UPI = 'campuspay.wallet@upi';

export default function AddMoney() {
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState('amount'); // 'amount' | 'method' | 'upi_apps' | 'success'
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const { user } = useAuth();
  const { openPayment } = useRazorpay();
  const navigate = useNavigate();

  const handleAmountNext = (e) => {
    e?.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;
    setStep('method');
  };

  // Open UPI app via deep link
  const handleUPIApp = (app) => {
    setSelectedApp(app);
    const amt = parseFloat(amount).toFixed(2);
    const note = `Add to CampusPay wallet`;
    const deepLink = app.deepLink(UNIVERSITY_UPI, amt, note);

    // Try deep link first (works on mobile)
    window.location.href = deepLink;

    // After 2 seconds, if still on page, show manual confirmation
    setTimeout(() => {
      setStep('upi_apps');
    }, 2000);
  };

  // After user pays via UPI app, they confirm here
  const handleUPIConfirm = async () => {
    setLoading(true);
    try {
      const res = await API.post('/api/wallet/add-money', {
        amount: parseFloat(amount),
        method: 'upi',
      });
      setStatus({ type: 'success', msg: res.data.message || `₹${amount} added to wallet!` });
      setStep('success');
    } catch (err) {
      setStatus({ type: 'error', msg: 'Could not update wallet. Contact support.' });
    }
    setLoading(false);
  };

  // Razorpay flow
  const handleRazorpay = () => {
    setLoading(true);
    openPayment({
      amount: parseFloat(amount),
      name: user?.name || 'Student',
      description: `Add ₹${amount} to CampusPay Wallet`,
      onSuccess: async () => {
        try {
          const res = await API.post('/api/wallet/add-money', {
            amount: parseFloat(amount),
            method: 'razorpay',
          });
          setStatus({ type: 'success', msg: res.data.message || `₹${amount} added successfully!` });
          setStep('success');
        } catch {
          setStatus({ type: 'error', msg: 'Payment done but wallet update failed.' });
        }
        setLoading(false);
      },
      onFailure: (msg) => {
        setStatus({ type: 'error', msg: msg || 'Payment cancelled.' });
        setLoading(false);
      },
    });
  };

  return (
    <div className="addmoney-page">
      <div className="addmoney-card">

        {/* Header */}
        <div className="addmoney-header">
          {step !== 'amount' && step !== 'success' && (
            <button className="back-btn" onClick={() => setStep(step === 'upi_apps' ? 'method' : 'amount')}>
              <ArrowLeft size={18} />
            </button>
          )}
          <div className="addmoney-header-text">
            <div className="addmoney-icon-wrap">
              <Wallet size={22} color="#38bdf8" />
            </div>
            <div>
              <h2>Add Money</h2>
              <p>Top up your CampusPay wallet</p>
            </div>
          </div>
        </div>

        {/* STEP 1 — Enter Amount */}
        {step === 'amount' && (
          <form onSubmit={handleAmountNext}>
            <div className="amount-display">
              <span className="amount-currency">₹</span>
              <input
                type="number"
                className="amount-input"
                placeholder="0"
                min="1"
                max="50000"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                autoFocus
              />
            </div>

            <div className="quick-amounts-label">Quick Select</div>
            <div className="quick-amounts-grid">
              {QUICK_AMOUNTS.map(a => (
                <button
                  key={a}
                  type="button"
                  className={`quick-amt-btn ${amount === String(a) ? 'active' : ''}`}
                  onClick={() => setAmount(String(a))}
                >
                  ₹{a.toLocaleString()}
                </button>
              ))}
            </div>

            <button
              type="submit"
              className="proceed-btn"
              disabled={!amount || parseFloat(amount) <= 0}
            >
              Proceed to Pay ₹{amount ? parseFloat(amount).toLocaleString() : '0'}
              <ChevronRight size={18} />
            </button>
          </form>
        )}

        {/* STEP 2 — Choose Payment Method */}
        {step === 'method' && (
          <div className="method-section">
            <div className="amount-summary">
              Adding <strong>₹{parseFloat(amount).toLocaleString()}</strong> to your wallet
            </div>

            <div className="method-group-label">Pay via UPI Apps</div>
            <div className="upi-apps-grid">
              {UPI_APPS.map(app => (
                <button
                  key={app.id}
                  className="upi-app-btn"
                  style={{ '--app-color': app.color, '--app-bg': app.bg, '--app-border': app.border }}
                  onClick={() => handleUPIApp(app)}
                >
                  <img
                    src={app.logo}
                    alt={app.name}
                    className="upi-app-logo"
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                  <span className="upi-app-name">{app.name}</span>
                </button>
              ))}
            </div>

            <div className="method-divider"><span>or pay via</span></div>

            <div className="other-methods">
              <button className="other-method-btn" onClick={handleRazorpay} disabled={loading}>
                <div className="other-method-icon" style={{ background: '#1a472a22' }}>
                  <CreditCard size={20} color="#22c55e" />
                </div>
                <div className="other-method-info">
                  <span className="other-method-name">Cards / NetBanking</span>
                  <span className="other-method-sub">Debit, Credit, Net Banking</span>
                </div>
                <ChevronRight size={16} color="#64748b" />
              </button>

              <button className="other-method-btn" onClick={handleRazorpay} disabled={loading}>
                <div className="other-method-icon" style={{ background: '#0c4a6e22' }}>
                  <Building2 size={20} color="#38bdf8" />
                </div>
                <div className="other-method-info">
                  <span className="other-method-name">Razorpay</span>
                  <span className="other-method-sub">All payment methods</span>
                </div>
                <ChevronRight size={16} color="#64748b" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 — UPI App opened, waiting for confirmation */}
        {step === 'upi_apps' && (
          <div className="upi-confirm-section">
            <div className="upi-confirm-icon">
              <Smartphone size={40} color="#38bdf8" />
            </div>
            <h3>Complete Payment in {selectedApp?.name}</h3>
            <p>Pay <strong>₹{parseFloat(amount).toLocaleString()}</strong> to</p>
            <div className="upi-id-display">{UNIVERSITY_UPI}</div>
            <p className="upi-note">After completing payment in the app, tap the button below to confirm.</p>

            <button className="proceed-btn" onClick={handleUPIConfirm} disabled={loading}>
              {loading ? 'Updating wallet...' : 'I have completed the payment'}
              {!loading && <CheckCircle size={18} />}
            </button>

            <button className="cancel-link" onClick={() => setStep('method')}>
              Go back / Try another method
            </button>

            {status?.type === 'error' && (
              <div className="status-msg error">
                <XCircle size={16} /> {status.msg}
              </div>
            )}
          </div>
        )}

        {/* STEP 4 — Success */}
        {step === 'success' && (
          <div className="success-section">
            <div className="success-icon">
              <CheckCircle size={56} color="#22c55e" />
            </div>
            <h3>Money Added!</h3>
            <div className="success-amount">₹{parseFloat(amount).toLocaleString()}</div>
            <p>has been added to your CampusPay wallet</p>
            <button className="proceed-btn" onClick={() => navigate('/dashboard')}>
              Go to Dashboard
              <ChevronRight size={18} />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
