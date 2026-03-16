import { useState } from 'react';
import { X, Wallet, Smartphone, CreditCard, CheckCircle, XCircle, ChevronRight, Building2 } from 'lucide-react';
import API from '../api/axios';
import useRazorpay from '../hooks/useRazorpay';
import './PaymentModal.css';

const UPI_APPS = [
  { id: 'phonepe',   name: 'PhonePe',    color: '#5f259f', bg: '#5f259f18', border: '#5f259f55', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/PhonePe_Logo.png/120px-PhonePe_Logo.png',   deepLink: (upi,amt,note) => `phonepe://pay?pa=${upi}&pn=CampusPay&am=${amt}&cu=INR&tn=${encodeURIComponent(note)}` },
  { id: 'googlepay', name: 'Google Pay', color: '#4285f4', bg: '#4285f418', border: '#4285f455', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Google_Pay_Logo.svg/120px-Google_Pay_Logo.svg.png', deepLink: (upi,amt,note) => `tez://upi/pay?pa=${upi}&pn=CampusPay&am=${amt}&cu=INR&tn=${encodeURIComponent(note)}` },
  { id: 'paytm',     name: 'Paytm',      color: '#00baf2', bg: '#00baf218', border: '#00baf255', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Paytm_Logo_%28standalone%29.svg/120px-Paytm_Logo_%28standalone%29.svg.png', deepLink: (upi,amt,note) => `paytmmp://pay?pa=${upi}&pn=CampusPay&am=${amt}&cu=INR&tn=${encodeURIComponent(note)}` },
  { id: 'bhim',      name: 'BHIM UPI',   color: '#ff6600', bg: '#ff660018', border: '#ff660055', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/BHIM_SVG_logo.svg/120px-BHIM_SVG_logo.svg.png',   deepLink: (upi,amt,note) => `upi://pay?pa=${upi}&pn=CampusPay&am=${amt}&cu=INR&tn=${encodeURIComponent(note)}` },
];

/**
 * PaymentModal — reusable payment sheet for all pages
 *
 * Props:
 *   open         — boolean
 *   onClose      — fn
 *   amount       — number
 *   title        — string  (e.g. "Pay Exam Fee")
 *   description  — string  (e.g. "Semester 4 Exam Fee")
 *   toUpi        — string  (receiver UPI, default: university)
 *   accentColor  — string  (hex)
 *   walletBalance — number
 *   onSuccess    — fn(method)
 *   apiEndpoint  — string  (POST endpoint to call on success)
 *   apiPayload   — object  (extra fields to send)
 */
export default function PaymentModal({
  open, onClose, amount, title, description,
  toUpi = 'university@campuspay',
  accentColor = '#38bdf8',
  walletBalance = 0,
  onSuccess,
  apiEndpoint,
  apiPayload = {},
}) {
  const [step, setStep]           = useState('choose'); // choose | upi_wait | processing | success | error
  const [selectedApp, setSelectedApp] = useState(null);
  const [pin, setPin]             = useState('');
  const [errMsg, setErrMsg]       = useState('');
  const { openPayment }           = useRazorpay();

  if (!open) return null;

  const reset = () => { setStep('choose'); setPin(''); setErrMsg(''); setSelectedApp(null); };
  const handleClose = () => { reset(); onClose(); };

  const canPayWallet = walletBalance >= amount;

  // ── Wallet payment ─────────────────────────────────────────────
  const handleWalletPay = async () => {
    if (pin.length < 4) { setErrMsg('Enter your 4-digit UPI PIN'); return; }
    setStep('processing');
    try {
      await API.post(apiEndpoint, { ...apiPayload, amount, upi_pin: pin, method: 'wallet' });
      setStep('success');
      onSuccess?.('wallet');
    } catch (e) {
      setErrMsg(e.response?.data?.detail || 'Payment failed. Check PIN or balance.');
      setStep('error');
    }
  };

  // ── UPI app deep link ──────────────────────────────────────────
  const handleUPIApp = (app) => {
    setSelectedApp(app);
    const link = app.deepLink(toUpi, amount.toFixed(2), description);
    window.location.href = link;
    setTimeout(() => setStep('upi_wait'), 1800);
  };

  // ── UPI confirmed by user ──────────────────────────────────────
  const handleUPIConfirm = async () => {
    setStep('processing');
    try {
      await API.post(apiEndpoint, { ...apiPayload, amount, method: 'upi' });
      setStep('success');
      onSuccess?.('upi');
    } catch (e) {
      setErrMsg(e.response?.data?.detail || 'Could not update. Contact support.');
      setStep('error');
    }
  };

  // ── Razorpay ───────────────────────────────────────────────────
  const handleRazorpay = () => {
    setStep('processing');
    openPayment({
      amount, name: title, description,
      onSuccess: async () => {
        try {
          await API.post(apiEndpoint, { ...apiPayload, amount, method: 'razorpay' });
          setStep('success');
          onSuccess?.('razorpay');
        } catch (e) {
          setErrMsg('Payment done but update failed.');
          setStep('error');
        }
      },
      onFailure: (msg) => { setErrMsg(msg || 'Payment cancelled.'); setStep('error'); },
    });
  };

  return (
    <div className="pm-overlay" onClick={handleClose}>
      <div className="pm-sheet" onClick={e => e.stopPropagation()} style={{ '--accent': accentColor }}>

        {/* Handle bar */}
        <div className="pm-handle" />

        {/* Close */}
        <button className="pm-close" onClick={handleClose}><X size={18} /></button>

        {/* ── CHOOSE step ── */}
        {step === 'choose' && (
          <>
            <div className="pm-header">
              <div className="pm-title">{title}</div>
              <div className="pm-desc">{description}</div>
              <div className="pm-amount" style={{ color: accentColor }}>₹{amount?.toLocaleString('en-IN')}</div>
              <div className="pm-to">To: <span>{toUpi}</span></div>
            </div>

            {/* Option 1 — Wallet */}
            <div className="pm-option-block">
              <div className="pm-option-label"><Wallet size={14} /> Pay from Campus Wallet</div>
              <div className={`pm-wallet-box ${!canPayWallet ? 'insufficient' : ''}`}>
                <div className="pm-wallet-balance">
                  <span>Available Balance</span>
                  <span style={{ color: canPayWallet ? '#22c55e' : '#ef4444' }}>₹{walletBalance?.toLocaleString('en-IN')}</span>
                </div>
                {canPayWallet ? (
                  <>
                    <input
                      type="password"
                      maxLength={4}
                      placeholder="Enter UPI PIN"
                      value={pin}
                      onChange={e => setPin(e.target.value.replace(/\D/g,''))}
                      className="pm-pin-input"
                    />
                    <button
                      className="pm-pay-btn wallet-btn"
                      style={{ background: accentColor }}
                      onClick={handleWalletPay}
                      disabled={pin.length < 4}
                    >
                      Pay ₹{amount?.toLocaleString('en-IN')} from Wallet
                    </button>
                  </>
                ) : (
                  <div className="pm-insufficient">Insufficient balance — Add money first</div>
                )}
              </div>
            </div>

            <div className="pm-divider"><span>or pay via</span></div>

            {/* Option 2 — UPI Apps */}
            <div className="pm-option-block">
              <div className="pm-option-label"><Smartphone size={14} /> UPI Apps</div>
              <div className="pm-upi-grid">
                {UPI_APPS.map(app => (
                  <button key={app.id} className="pm-upi-btn"
                    style={{ '--c': app.color, '--bg': app.bg, '--bd': app.border }}
                    onClick={() => handleUPIApp(app)}>
                    <img src={app.logo} alt={app.name} onError={e => e.target.style.display='none'} />
                    <span>{app.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Option 3 — Razorpay */}
            <button className="pm-razorpay-btn" onClick={handleRazorpay}>
              <div className="pm-razorpay-left">
                <CreditCard size={18} color="#a78bfa" />
                <div>
                  <span className="pm-razorpay-name">Cards / NetBanking / Wallets</span>
                  <span className="pm-razorpay-sub">Powered by Razorpay</span>
                </div>
              </div>
              <ChevronRight size={16} color="#64748b" />
            </button>
          </>
        )}

        {/* ── UPI WAIT step ── */}
        {step === 'upi_wait' && (
          <div className="pm-center-step">
            <div className="pm-app-icon" style={{ background: selectedApp?.bg, border: `1px solid ${selectedApp?.border}` }}>
              <img src={selectedApp?.logo} alt={selectedApp?.name} style={{ width: 44, height: 44, objectFit: 'contain' }} onError={e => e.target.style.display='none'} />
            </div>
            <h3>Complete in {selectedApp?.name}</h3>
            <p>Pay <strong style={{ color: accentColor }}>₹{amount?.toLocaleString('en-IN')}</strong> to</p>
            <div className="pm-upi-id">{toUpi}</div>
            <p className="pm-hint">After paying, tap below to confirm</p>
            <button className="pm-pay-btn" style={{ background: accentColor }} onClick={handleUPIConfirm}>
              <CheckCircle size={16} /> I've Completed the Payment
            </button>
            <button className="pm-link-btn" onClick={() => setStep('choose')}>Try another method</button>
          </div>
        )}

        {/* ── PROCESSING step ── */}
        {step === 'processing' && (
          <div className="pm-center-step">
            <div className="pm-spinner" style={{ borderTopColor: accentColor }} />
            <h3>Processing...</h3>
            <p>Please wait</p>
          </div>
        )}

        {/* ── SUCCESS step ── */}
        {step === 'success' && (
          <div className="pm-center-step">
            <div className="pm-success-icon"><CheckCircle size={56} color="#22c55e" /></div>
            <h3>Payment Successful!</h3>
            <div className="pm-success-amount">₹{amount?.toLocaleString('en-IN')}</div>
            <p>{description}</p>
            <button className="pm-pay-btn" style={{ background: '#22c55e', color: '#0a0f1e' }} onClick={handleClose}>Done</button>
          </div>
        )}

        {/* ── ERROR step ── */}
        {step === 'error' && (
          <div className="pm-center-step">
            <div className="pm-error-icon"><XCircle size={56} color="#ef4444" /></div>
            <h3>Payment Failed</h3>
            <p className="pm-err-msg">{errMsg}</p>
            <button className="pm-pay-btn" style={{ background: accentColor }} onClick={() => { setStep('choose'); setErrMsg(''); }}>Try Again</button>
          </div>
        )}

      </div>
    </div>
  );
}
