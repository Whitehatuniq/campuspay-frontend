import { useState, useEffect, useRef } from 'react';
import { X, Wallet, QrCode, CreditCard, CheckCircle, XCircle, ChevronRight, Copy, Check } from 'lucide-react';
import API from '../api/axios';
import useRazorpay from '../hooks/useRazorpay';
import './PaymentModal.css';

const UNIVERSITY_UPI = 'poornima.university@campuspay';
const UNIVERSITY_NAME = 'Poornima University';

// UPI app logos for display only
const UPI_LOGOS = [
  { name: 'PhonePe',    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/PhonePe_Logo.png/120px-PhonePe_Logo.png',    color: '#5f259f' },
  { name: 'Google Pay', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Google_Pay_Logo.svg/120px-Google_Pay_Logo.svg.png', color: '#4285f4' },
  { name: 'Paytm',      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Paytm_Logo_%28standalone%29.svg/120px-Paytm_Logo_%28standalone%29.svg.png', color: '#00baf2' },
  { name: 'BHIM',       logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/BHIM_SVG_logo.svg/120px-BHIM_SVG_logo.svg.png',   color: '#ff6600' },
];

export default function PaymentModal({
  open, onClose, amount, title, description,
  toUpi,
  accentColor = '#38bdf8',
  walletBalance = 0,
  onSuccess,
  apiEndpoint,
  apiPayload = {},
}) {
  const receiverUpi  = apiPayload?.receiver_upi || toUpi || UNIVERSITY_UPI;
  const numAmount = parseFloat(amount) || 0;
  const [step, setStep]           = useState('choose');
  const [paidAmount, setPaidAmount] = useState(0);
  const [pin, setPin]             = useState('');
  const [errMsg, setErrMsg]       = useState('');
  const [copied, setCopied]       = useState(false);
  const [qrLoaded, setQrLoaded]   = useState(false);
  const { openPayment }           = useRazorpay();

  if (!open) return null;

  const reset      = () => { setStep('choose'); setPin(''); setErrMsg(''); setCopied(false); setQrLoaded(false); };
  const handleClose = () => { reset(); onClose(); };
  const canPayWallet = walletBalance >= numAmount;
  const amtStr = numAmount.toFixed(2);

  // UPI string used for QR — standard format
  const upiString = `upi://pay?pa=${encodeURIComponent(receiverUpi)}&pn=${encodeURIComponent(UNIVERSITY_NAME)}&am=${amtStr}&cu=INR&tn=${encodeURIComponent(description || title || 'CampusPay')}`;

  // QR code via Google Charts API (free, no key needed)
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiString)}&bgcolor=0f172a&color=f1f5f9&qzone=2`;

  const copyUPI = () => {
    navigator.clipboard.writeText(receiverUpi);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Wallet pay
  const handleWalletPay = async () => {
    if (pin.length < 4) { setErrMsg('Enter your 4-digit UPI PIN'); return; }
    setStep('processing');
    try {
      await API.post(apiEndpoint, { ...apiPayload, amount: numAmount, upi_pin: pin });
      setPaidAmount(numAmount);
      setStep('success');
      onSuccess?.('wallet');
    } catch (e) {
      setErrMsg(e.response?.data?.detail || 'Incorrect PIN or insufficient balance.');
      setStep('error');
    }
  };

  // After UPI QR payment confirmed by user
  const handleQRConfirm = async () => {
    setStep('processing');
    try {
      await API.post(apiEndpoint, { ...apiPayload, amount: numAmount, upi_pin: '0000' });
      setPaidAmount(amount);
      setStep('success');
      onSuccess?.('upi_qr');
    } catch (e) {
      setErrMsg(e.response?.data?.detail || 'Could not verify. Contact support.');
      setStep('error');
    }
  };

  // Razorpay
  const handleRazorpay = () => {
    setStep('processing');
    openPayment({
      amount, name: title, description,
      onSuccess: async () => {
        try {
          await API.post(apiEndpoint, { ...apiPayload, amount: numAmount, upi_pin: '0000' });
          setPaidAmount(amount);
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
              <div className="pm-amount" style={{ color: accentColor }}>
                ₹{numAmount.toLocaleString('en-IN')}
              </div>
            </div>

            {/* Option 1 — Wallet */}
            <div className="pm-option-block">
              <div className="pm-option-label"><Wallet size={14} /> Pay from Campus Wallet</div>
              <div className={`pm-wallet-box ${!canPayWallet ? 'insufficient' : ''}`}>
                <div className="pm-wallet-balance">
                  <span>Available Balance</span>
                  <span style={{ color: canPayWallet ? '#22c55e' : '#ef4444' }}>
                    ₹{(walletBalance || 0).toLocaleString('en-IN')}
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
                    <button className="pm-pay-btn"
                      style={{ background: accentColor }}
                      onClick={handleWalletPay}
                      disabled={pin.length < 4}>
                      Pay ₹{numAmount.toLocaleString('en-IN')} from Wallet
                    </button>
                  </>
                ) : (
                  <div className="pm-insufficient">
                    Insufficient balance — Add money to wallet first
                  </div>
                )}
              </div>
            </div>

            <div className="pm-divider"><span>or pay via UPI / Cards</span></div>

            {/* Option 2 — UPI QR */}
            <button className="pm-method-row" onClick={() => setStep('qr')}>
              <div className="pm-method-icon" style={{ background: '#0f274422' }}>
                <QrCode size={20} color="#38bdf8" />
              </div>
              <div className="pm-method-info">
                <span className="pm-method-name">Scan QR Code</span>
                <span className="pm-method-sub">Pay via PhonePe, GPay, Paytm, BHIM or any UPI app</span>
              </div>
              <div className="pm-method-logos">
                {UPI_LOGOS.slice(0, 3).map(u => (
                  <img key={u.name} src={u.logo} alt={u.name}
                    style={{ width: 20, height: 20, objectFit: 'contain', borderRadius: 4 }}
                    onError={e => e.target.style.display = 'none'} />
                ))}
              </div>
              <ChevronRight size={16} color="#64748b" />
            </button>

            {/* Option 3 — Razorpay */}
            <button className="pm-method-row" onClick={handleRazorpay} style={{ marginTop: 8 }}>
              <div className="pm-method-icon" style={{ background: '#2d1b6922' }}>
                <CreditCard size={20} color="#a78bfa" />
              </div>
              <div className="pm-method-info">
                <span className="pm-method-name">Cards / Net Banking</span>
                <span className="pm-method-sub">Debit card, credit card, net banking</span>
              </div>
              <ChevronRight size={16} color="#64748b" />
            </button>
          </>
        )}

        {/* ── QR CODE ── */}
        {step === 'qr' && (
          <div className="pm-qr-step">
            <div className="pm-qr-header">
              <h3>Scan & Pay</h3>
              <p>Open any UPI app on your phone and scan this QR code</p>
            </div>

            {/* QR Code */}
            <div className="pm-qr-box" style={{ borderColor: accentColor + '44' }}>
              <div className="pm-qr-logos">
                {UPI_LOGOS.map(u => (
                  <div key={u.name} className="pm-qr-logo-wrap" style={{ background: u.color + '18', border: `1px solid ${u.color}33` }}>
                    <img src={u.logo} alt={u.name}
                      style={{ width: 24, height: 24, objectFit: 'contain' }}
                      onError={e => e.target.style.display = 'none'} />
                  </div>
                ))}
              </div>

              <div className="pm-qr-img-wrap">
                {!qrLoaded && <div className="pm-qr-loading"><div className="pm-spinner" style={{ borderTopColor: accentColor }} /></div>}
                <img
                  src={qrUrl}
                  alt="UPI QR Code"
                  className="pm-qr-img"
                  style={{ display: qrLoaded ? 'block' : 'none' }}
                  onLoad={() => setQrLoaded(true)}
                />
              </div>

              <div className="pm-qr-amount" style={{ color: accentColor }}>
                ₹{numAmount.toLocaleString('en-IN')}
              </div>

              <div className="pm-qr-to">
                <span>Pay to:</span>
                <strong>{UNIVERSITY_NAME}</strong>
              </div>
            </div>

            {/* UPI ID with copy */}
            <div className="pm-upi-copy-row">
              <div className="pm-upi-copy-label">UPI ID</div>
              <div className="pm-upi-copy-box">
                <span className="pm-upi-copy-id">{receiverUpi}</span>
                <button className="pm-copy-btn" onClick={copyUPI}>
                  {copied ? <Check size={14} color="#22c55e" /> : <Copy size={14} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="pm-qr-steps">
              <div className="pm-qr-step-item"><span className="pm-step-num">1</span><span>Open PhonePe, GPay, Paytm or any UPI app</span></div>
              <div className="pm-qr-step-item"><span className="pm-step-num">2</span><span>Tap "Scan QR" and scan the code above</span></div>
              <div className="pm-qr-step-item"><span className="pm-step-num">3</span><span>Enter your UPI PIN and complete payment</span></div>
              <div className="pm-qr-step-item"><span className="pm-step-num">4</span><span>Come back here and tap confirm below</span></div>
            </div>

            <button className="pm-pay-btn" style={{ background: accentColor }} onClick={handleQRConfirm}>
              <CheckCircle size={16} /> I've Completed the Payment
            </button>
            <button className="pm-link-btn" onClick={() => setStep('choose')}>← Back to payment options</button>
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
            <div className="pm-success-amount">₹{parseFloat(paidAmount || amount || 0).toLocaleString('en-IN')}</div>
            <p className="pm-success-desc">{description}</p>
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
