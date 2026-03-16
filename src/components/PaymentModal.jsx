import { useState } from 'react';
import { X, Wallet, Smartphone, CreditCard, CheckCircle, XCircle, ChevronRight, Building2, ExternalLink } from 'lucide-react';
import API from '../api/axios';
import useRazorpay from '../hooks/useRazorpay';
import './PaymentModal.css';

const UPI_APPS = [
  {
    id: 'phonepe',
    name: 'PhonePe',
    color: '#5f259f',
    bg: '#5f259f18',
    border: '#5f259f55',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/PhonePe_Logo.png/120px-PhonePe_Logo.png',
    // Standard UPI deep link — works on Android/iOS to open PhonePe
    getLink: (upi, amt, note) => `phonepe://pay?pa=${encodeURIComponent(upi)}&pn=CampusPay&am=${amt}&cu=INR&tn=${encodeURIComponent(note)}&mc=0000`,
    // Fallback intent URL for Android
    getIntent: (upi, amt, note) => `intent://pay?pa=${encodeURIComponent(upi)}&pn=CampusPay&am=${amt}&cu=INR&tn=${encodeURIComponent(note)}#Intent;scheme=phonepe;package=com.phonepe.app;end`,
  },
  {
    id: 'googlepay',
    name: 'Google Pay',
    color: '#4285f4',
    bg: '#4285f418',
    border: '#4285f455',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Google_Pay_Logo.svg/120px-Google_Pay_Logo.svg.png',
    getLink: (upi, amt, note) => `tez://upi/pay?pa=${encodeURIComponent(upi)}&pn=CampusPay&am=${amt}&cu=INR&tn=${encodeURIComponent(note)}`,
    getIntent: (upi, amt, note) => `intent://upi/pay?pa=${encodeURIComponent(upi)}&pn=CampusPay&am=${amt}&cu=INR&tn=${encodeURIComponent(note)}#Intent;scheme=tez;package=com.google.android.apps.nbu.paisa.user;end`,
  },
  {
    id: 'paytm',
    name: 'Paytm',
    color: '#00baf2',
    bg: '#00baf218',
    border: '#00baf255',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Paytm_Logo_%28standalone%29.svg/120px-Paytm_Logo_%28standalone%29.svg.png',
    getLink: (upi, amt, note) => `paytmmp://upi/pay?pa=${encodeURIComponent(upi)}&pn=CampusPay&am=${amt}&cu=INR&tn=${encodeURIComponent(note)}`,
    getIntent: (upi, amt, note) => `intent://pay?pa=${encodeURIComponent(upi)}&pn=CampusPay&am=${amt}&cu=INR&tn=${encodeURIComponent(note)}#Intent;scheme=paytmmp;package=net.one97.paytm;end`,
  },
  {
    id: 'bhim',
    name: 'BHIM',
    color: '#ff6600',
    bg: '#ff660018',
    border: '#ff660055',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/BHIM_SVG_logo.svg/120px-BHIM_SVG_logo.svg.png',
    getLink: (upi, amt, note) => `upi://pay?pa=${encodeURIComponent(upi)}&pn=CampusPay&am=${amt}&cu=INR&tn=${encodeURIComponent(note)}`,
    getIntent: (upi, amt, note) => `intent://pay?pa=${encodeURIComponent(upi)}&pn=CampusPay&am=${amt}&cu=INR&tn=${encodeURIComponent(note)}#Intent;scheme=upi;package=in.org.npci.upiapp;end`,
  },
];

export default function PaymentModal({
  open, onClose, amount, title, description,
  toUpi = 'university@upi',
  accentColor = '#38bdf8',
  walletBalance = 0,
  onSuccess,
  apiEndpoint,
  apiPayload = {},
}) {
  const [step, setStep]               = useState('choose');
  const [selectedApp, setSelectedApp] = useState(null);
  const [pin, setPin]                 = useState('');
  const [errMsg, setErrMsg]           = useState('');
  const { openPayment }               = useRazorpay();

  if (!open) return null;

  const reset      = () => { setStep('choose'); setPin(''); setErrMsg(''); setSelectedApp(null); };
  const handleClose = () => { reset(); onClose(); };
  const canPayWallet = walletBalance >= amount;
  const amtStr = parseFloat(amount).toFixed(2);

  // ── Open UPI App ─────────────────────────────────────────────────────────
  const handleUPIApp = (app) => {
    setSelectedApp(app);

    const note    = description || title || 'CampusPay';
    const deepLink = app.getLink(toUpi, amtStr, note);
    const intent   = app.getIntent(toUpi, amtStr, note);

    // Try deep link — on mobile this opens the UPI app directly
    // On desktop it does nothing visible, so we show the wait screen either way
    try {
      window.location.href = deepLink;
    } catch (e) {
      // ignore
    }

    // After 1.5s show the confirmation screen
    setTimeout(() => setStep('upi_wait'), 1500);
  };

  // ── Wallet pay ───────────────────────────────────────────────────────────
  const handleWalletPay = async () => {
    if (pin.length < 4) { setErrMsg('Enter your 4-digit UPI PIN'); return; }
    setStep('processing');
    try {
      await API.post(apiEndpoint, { ...apiPayload, amount, upi_pin: pin, method: 'wallet' });
      setStep('success');
      onSuccess?.('wallet');
    } catch (e) {
      setErrMsg(e.response?.data?.detail || 'Incorrect PIN or insufficient balance.');
      setStep('error');
    }
  };

  // ── UPI confirmed ─────────────────────────────────────────────────────────
  const handleUPIConfirm = async () => {
    setStep('processing');
    try {
      await API.post(apiEndpoint, { ...apiPayload, amount, method: 'upi' });
      setStep('success');
      onSuccess?.('upi');
    } catch (e) {
      setErrMsg(e.response?.data?.detail || 'Could not verify payment. Contact support.');
      setStep('error');
    }
  };

  // ── Razorpay ──────────────────────────────────────────────────────────────
  const handleRazorpay = () => {
    setStep('processing');
    openPayment({
      amount, name: title, description,
      onSuccess: async () => {
        try {
          await API.post(apiEndpoint, { ...apiPayload, amount, method: 'razorpay' });
          setStep('success');
          onSuccess?.('razorpay');
        } catch {
          setErrMsg('Payment done but update failed. Contact support.');
          setStep('error');
        }
      },
      onFailure: (msg) => { setErrMsg(msg || 'Payment cancelled.'); setStep('error'); },
    });
  };

  return (
    <div className="pm-overlay" onClick={handleClose}>
      <div className="pm-sheet" onClick={e => e.stopPropagation()} style={{ '--accent': accentColor }}>
        <div className="pm-handle" />
        <button className="pm-close" onClick={handleClose}><X size={18} /></button>

        {/* ── CHOOSE ── */}
        {step === 'choose' && (
          <>
            <div className="pm-header">
              <div className="pm-title">{title}</div>
              <div className="pm-desc">{description}</div>
              <div className="pm-amount" style={{ color: accentColor }}>₹{parseFloat(amount).toLocaleString('en-IN')}</div>
              <div className="pm-to">Paying to: <span>{toUpi}</span></div>
            </div>

            {/* Option 1 — Wallet */}
            <div className="pm-option-block">
              <div className="pm-option-label"><Wallet size={14} /> Pay from Campus Wallet</div>
              <div className={`pm-wallet-box ${!canPayWallet ? 'insufficient' : ''}`}>
                <div className="pm-wallet-balance">
                  <span>Available Balance</span>
                  <span style={{ color: canPayWallet ? '#22c55e' : '#ef4444' }}>
                    ₹{walletBalance?.toLocaleString('en-IN')}
                  </span>
                </div>
                {canPayWallet ? (
                  <>
                    <input
                      type="password" maxLength={4}
                      placeholder="Enter UPI PIN"
                      value={pin}
                      onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                      className="pm-pin-input"
                      autoFocus
                    />
                    <button className="pm-pay-btn wallet-btn"
                      style={{ background: accentColor }}
                      onClick={handleWalletPay}
                      disabled={pin.length < 4}>
                      Pay ₹{parseFloat(amount).toLocaleString('en-IN')} from Wallet
                    </button>
                  </>
                ) : (
                  <div className="pm-insufficient">Insufficient balance — Add money first</div>
                )}
              </div>
            </div>

            <div className="pm-divider"><span>or pay directly via UPI</span></div>

            {/* Option 2 — UPI Apps */}
            <div className="pm-option-block">
              <div className="pm-option-label"><Smartphone size={14} /> UPI Apps — Opens app on your phone</div>
              <div className="pm-upi-grid">
                {UPI_APPS.map(app => (
                  <button key={app.id} className="pm-upi-btn"
                    style={{ '--c': app.color, '--bg': app.bg, '--bd': app.border }}
                    onClick={() => handleUPIApp(app)}>
                    <img src={app.logo} alt={app.name}
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                    <span>{app.name}</span>
                    <ExternalLink size={11} color={app.color} style={{ marginLeft: 'auto' }} />
                  </button>
                ))}
              </div>
              <div className="pm-upi-note">
                💡 Opens the UPI app on your phone. Complete payment there, then tap confirm below.
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

        {/* ── UPI WAIT ── */}
        {step === 'upi_wait' && (
          <div className="pm-center-step">
            <div className="pm-app-icon"
              style={{ background: selectedApp?.bg, border: `1px solid ${selectedApp?.border}` }}>
              <img src={selectedApp?.logo} alt={selectedApp?.name}
                style={{ width: 48, height: 48, objectFit: 'contain', borderRadius: 10 }}
                onError={e => e.target.style.display = 'none'} />
            </div>
            <h3>Complete in {selectedApp?.name}</h3>
            <p>Send <strong style={{ color: accentColor, fontSize: 20 }}>₹{parseFloat(amount).toLocaleString('en-IN')}</strong></p>

            <div className="pm-upi-detail-box">
              <div className="pm-upi-detail-row"><span>UPI ID</span><strong>{toUpi}</strong></div>
              <div className="pm-upi-detail-row"><span>Name</span><strong>CampusPay — Poornima University</strong></div>
              <div className="pm-upi-detail-row"><span>Amount</span><strong style={{ color: accentColor }}>₹{parseFloat(amount).toLocaleString('en-IN')}</strong></div>
              <div className="pm-upi-detail-row"><span>Note</span><strong>{description}</strong></div>
            </div>

            <p className="pm-hint">Enter your bank UPI PIN in {selectedApp?.name} to complete</p>

            <button className="pm-pay-btn" style={{ background: accentColor }} onClick={handleUPIConfirm}>
              <CheckCircle size={16} /> I've Completed the Payment
            </button>
            <button className="pm-link-btn" onClick={() => setStep('choose')}>Try another method</button>
          </div>
        )}

        {/* ── PROCESSING ── */}
        {step === 'processing' && (
          <div className="pm-center-step">
            <div className="pm-spinner" style={{ borderTopColor: accentColor }} />
            <h3>Processing...</h3>
            <p>Please wait</p>
          </div>
        )}

        {/* ── SUCCESS ── */}
        {step === 'success' && (
          <div className="pm-center-step">
            <div className="pm-success-icon"><CheckCircle size={60} color="#22c55e" /></div>
            <h3>Payment Successful!</h3>
            <div className="pm-success-amount">₹{parseFloat(amount).toLocaleString('en-IN')}</div>
            <p className="pm-success-desc">{description}</p>
            <div className="pm-success-upi">Paid to: {toUpi}</div>
            <button className="pm-pay-btn" style={{ background: '#22c55e', color: '#0a0f1e' }} onClick={handleClose}>
              Done
            </button>
          </div>
        )}

        {/* ── ERROR ── */}
        {step === 'error' && (
          <div className="pm-center-step">
            <div className="pm-error-icon"><XCircle size={56} color="#ef4444" /></div>
            <h3>Payment Failed</h3>
            <p className="pm-err-msg">{errMsg}</p>
            <button className="pm-pay-btn" style={{ background: accentColor }}
              onClick={() => { setStep('choose'); setErrMsg(''); }}>
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
