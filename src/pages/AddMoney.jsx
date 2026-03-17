import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import useRazorpay from '../hooks/useRazorpay';
import {
  Wallet, Plus, ChevronRight, CheckCircle, XCircle,
  QrCode, Copy, Check, CreditCard, ArrowLeft, Scan
} from 'lucide-react';
import './AddMoney.css';

// Your real UPI ID — all add money payments come here
const ADMIN_UPI = '9667295900-3@ybl';
const ADMIN_NAME = 'CampusPay — Poornima University';

const QUICK_AMOUNTS = [100, 200, 500, 1000, 2000, 5000];

const UPI_APPS = [
  { id: 'phonepe',   name: 'PhonePe',    color: '#5f259f', bg: '#5f259f18', border: '#5f259f44', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/PhonePe_Logo.png/120px-PhonePe_Logo.png' },
  { id: 'googlepay', name: 'Google Pay', color: '#4285f4', bg: '#4285f418', border: '#4285f444', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Google_Pay_Logo.svg/120px-Google_Pay_Logo.svg.png' },
  { id: 'paytm',     name: 'Paytm',      color: '#00baf2', bg: '#00baf218', border: '#00baf244', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Paytm_Logo_%28standalone%29.svg/120px-Paytm_Logo_%28standalone%29.svg.png' },
  { id: 'bhim',      name: 'BHIM',       color: '#ff6600', bg: '#ff660018', border: '#ff660044', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/BHIM_SVG_logo.svg/120px-BHIM_SVG_logo.svg.png' },
];

export default function AddMoney() {
  const [step, setStep]         = useState('amount'); // amount | method | qr | scanner | confirm | success | error
  const [amount, setAmount]     = useState('');
  const [loading, setLoading]   = useState(false);
  const [copied, setCopied]     = useState(false);
  const [qrLoaded, setQrLoaded] = useState(false);
  const [errMsg, setErrMsg]     = useState('');
  const [scannedUPI, setScannedUPI] = useState('');
  const scannerRef              = useRef(null);
  const html5QrRef              = useRef(null);
  const { user }                = useAuth();
  const { openPayment }         = useRazorpay();
  const navigate                = useNavigate();

  const numAmount = parseFloat(amount) || 0;
  const amtStr    = numAmount.toFixed(2);

  // UPI payment string for QR
  const upiString = `upi://pay?pa=${encodeURIComponent(ADMIN_UPI)}&pn=${encodeURIComponent(ADMIN_NAME)}&am=${amtStr}&cu=INR&tn=${encodeURIComponent('Add to CampusPay Wallet')}`;
  const qrUrl     = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiString)}&bgcolor=0f172a&color=f1f5f9&qzone=2`;

  const copyUPI = () => {
    navigator.clipboard.writeText(ADMIN_UPI);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // After user pays via QR/UPI — update wallet
  const handleConfirmPayment = async () => {
    setLoading(true);
    try {
      await API.post('/api/wallet/add-money', { amount: numAmount, method: 'upi' });
      setStep('success');
    } catch (e) {
      setErrMsg(e.response?.data?.detail || 'Could not update wallet. Contact support.');
      setStep('error');
    }
    setLoading(false);
  };

  // Razorpay
  const handleRazorpay = () => {
    setLoading(true);
    openPayment({
      amount: numAmount,
      name: user?.name || 'Student',
      description: `Add ₹${numAmount} to CampusPay Wallet`,
      onSuccess: async () => {
        try {
          await API.post('/api/wallet/add-money', { amount: numAmount, method: 'razorpay' });
          setStep('success');
        } catch {
          setErrMsg('Payment done but wallet update failed.');
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

  // Start QR Scanner
  const startScanner = async () => {
    setStep('scanner');
    setTimeout(async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        html5QrRef.current = new Html5Qrcode('qr-scanner-div');
        await html5QrRef.current.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            // Parse UPI ID from QR
            let upi = decodedText;
            const paMatch = decodedText.match(/pa=([^&]+)/);
            if (paMatch) upi = decodeURIComponent(paMatch[1]);
            setScannedUPI(upi);
            stopScanner();
            setStep('scanned');
          },
          () => {}
        );
      } catch (e) {
        setStep('method');
      }
    }, 300);
  };

  const stopScanner = () => {
    if (html5QrRef.current) {
      html5QrRef.current.stop().catch(() => {});
      html5QrRef.current = null;
    }
  };

  const reset = () => { setStep('amount'); setAmount(''); setErrMsg(''); setScannedUPI(''); stopScanner(); };

  return (
    <div className="addmoney-page">
      <div className="addmoney-card">

        {/* Header */}
        <div className="addmoney-header">
          {step !== 'amount' && step !== 'success' && (
            <button className="back-btn" onClick={() => { stopScanner(); setStep(step === 'qr' || step === 'scanner' || step === 'scanned' ? 'method' : 'amount'); }}>
              <ArrowLeft size={18} />
            </button>
          )}
          <div className="addmoney-title-row">
            <div className="addmoney-icon"><Wallet size={22} color="#38bdf8" /></div>
            <div>
              <h2>Add Money</h2>
              <p>Top up your CampusPay wallet</p>
            </div>
          </div>
        </div>

        {/* ── STEP 1: Amount ── */}
        {step === 'amount' && (
          <form onSubmit={e => { e.preventDefault(); if (numAmount > 0) setStep('method'); }}>
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
            <button type="submit" className="proceed-btn" disabled={numAmount <= 0}>
              Proceed to Pay ₹{numAmount > 0 ? numAmount.toLocaleString('en-IN') : '0'}
              <ChevronRight size={18} />
            </button>
          </form>
        )}

        {/* ── STEP 2: Choose Method ── */}
        {step === 'method' && (
          <div className="method-section">
            <div className="amount-badge">
              Adding <strong>₹{numAmount.toLocaleString('en-IN')}</strong> to your wallet
            </div>

            {/* QR Code option */}
            <button className="method-row" onClick={() => { setQrLoaded(false); setStep('qr'); }}>
              <div className="method-icon" style={{ background: '#0c274422' }}>
                <QrCode size={22} color="#38bdf8" />
              </div>
              <div className="method-info">
                <span className="method-name">Scan & Pay via UPI</span>
                <span className="method-sub">PhonePe · Google Pay · Paytm · BHIM · Any UPI app</span>
              </div>
              <div className="upi-logos-row">
                {UPI_APPS.slice(0, 3).map(u => (
                  <img key={u.id} src={u.logo} alt={u.name}
                    style={{ width: 20, height: 20, objectFit: 'contain', borderRadius: 4 }}
                    onError={e => e.target.style.display = 'none'} />
                ))}
              </div>
              <ChevronRight size={16} color="#64748b" />
            </button>

            {/* QR Scanner option */}
            <button className="method-row" onClick={startScanner} style={{ marginTop: 8 }}>
              <div className="method-icon" style={{ background: '#34d39918' }}>
                <Scan size={22} color="#34d399" />
              </div>
              <div className="method-info">
                <span className="method-name">Scan UPI QR Code</span>
                <span className="method-sub">Use camera to scan any UPI QR code</span>
              </div>
              <ChevronRight size={16} color="#64748b" />
            </button>

            <div className="method-divider"><span>or pay via</span></div>

            {/* Cards/Razorpay */}
            <button className="method-row" onClick={handleRazorpay} disabled={loading}>
              <div className="method-icon" style={{ background: '#a78bfa18' }}>
                <CreditCard size={22} color="#a78bfa" />
              </div>
              <div className="method-info">
                <span className="method-name">Cards / Net Banking</span>
                <span className="method-sub">Debit card, credit card, net banking</span>
              </div>
              <ChevronRight size={16} color="#64748b" />
            </button>
          </div>
        )}

        {/* ── STEP 3: Show QR Code ── */}
        {step === 'qr' && (
          <div className="qr-section">
            <div className="qr-header">
              <h3>Scan to Pay</h3>
              <p>Open any UPI app → Scan QR → Enter your bank PIN</p>
            </div>

            {/* UPI app logos */}
            <div className="upi-app-logos">
              {UPI_APPS.map(app => (
                <div key={app.id} className="upi-app-logo-pill"
                  style={{ background: app.bg, border: `1px solid ${app.border}` }}>
                  <img src={app.logo} alt={app.name}
                    style={{ width: 22, height: 22, objectFit: 'contain' }}
                    onError={e => e.target.style.display = 'none'} />
                  <span style={{ fontSize: 11, color: app.color, fontWeight: 600 }}>{app.name}</span>
                </div>
              ))}
            </div>

            {/* QR Code */}
            <div className="qr-box">
              {!qrLoaded && (
                <div className="qr-loading">
                  <div className="mini-spinner" />
                  <span>Generating QR...</span>
                </div>
              )}
              <img src={qrUrl} alt="UPI QR" className="qr-img"
                style={{ display: qrLoaded ? 'block' : 'none' }}
                onLoad={() => setQrLoaded(true)} />
              <div className="qr-amount" style={{ color: '#38bdf8' }}>
                ₹{numAmount.toLocaleString('en-IN')}
              </div>
              <div className="qr-name">{ADMIN_NAME}</div>
            </div>

            {/* UPI ID copy */}
            <div className="upi-copy-section">
              <span className="upi-copy-label">Or pay to UPI ID</span>
              <div className="upi-copy-box">
                <span className="upi-copy-id">{ADMIN_UPI}</span>
                <button className="copy-btn" onClick={copyUPI}>
                  {copied ? <Check size={14} color="#22c55e" /> : <Copy size={14} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Steps */}
            <div className="pay-steps">
              {['Open PhonePe, GPay, Paytm or any UPI app', 'Tap "Scan QR" and scan the code above', 'Enter your bank UPI PIN to complete payment', 'Come back here and tap Confirm below'].map((s, i) => (
                <div key={i} className="pay-step">
                  <span className="step-num">{i + 1}</span>
                  <span>{s}</span>
                </div>
              ))}
            </div>

            <button className="proceed-btn" onClick={handleConfirmPayment} disabled={loading}>
              {loading ? 'Updating wallet...' : <><CheckCircle size={16} /> I've Completed the Payment</>}
            </button>
            <button className="cancel-link" onClick={() => setStep('method')}>Try another method</button>
          </div>
        )}

        {/* ── STEP 4: QR Scanner ── */}
        {step === 'scanner' && (
          <div className="scanner-section">
            <h3>Point camera at QR Code</h3>
            <p>Scan any UPI QR code to get the UPI ID</p>
            <div id="qr-scanner-div" ref={scannerRef} className="scanner-box" />
            <button className="cancel-link" onClick={() => { stopScanner(); setStep('method'); }}>Cancel</button>
          </div>
        )}

        {/* ── STEP 5: Scanned Result ── */}
        {step === 'scanned' && (
          <div className="scanned-section">
            <CheckCircle size={48} color="#22c55e" />
            <h3>QR Code Scanned!</h3>
            <div className="scanned-upi">
              <span>UPI ID</span>
              <strong>{scannedUPI}</strong>
            </div>
            <div className="scanned-amount">₹{numAmount.toLocaleString('en-IN')}</div>
            <p>Open your UPI app and pay to the above UPI ID, then confirm below.</p>
            <button className="proceed-btn" onClick={handleConfirmPayment} disabled={loading}>
              {loading ? 'Updating...' : <><CheckCircle size={16} /> I've Paid — Confirm</>}
            </button>
            <button className="cancel-link" onClick={() => setStep('method')}>Go back</button>
          </div>
        )}

        {/* ── SUCCESS ── */}
        {step === 'success' && (
          <div className="success-section">
            <div className="success-icon"><CheckCircle size={60} color="#22c55e" /></div>
            <h3>Money Added!</h3>
            <div className="success-amount">₹{numAmount.toLocaleString('en-IN')}</div>
            <p>has been added to your CampusPay wallet</p>
            <button className="proceed-btn" onClick={() => navigate('/dashboard')}>
              Go to Dashboard <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* ── ERROR ── */}
        {step === 'error' && (
          <div className="success-section">
            <div className="success-icon"><XCircle size={60} color="#ef4444" /></div>
            <h3>Payment Failed</h3>
            <p style={{ color: '#ef4444' }}>{errMsg}</p>
            <button className="proceed-btn" style={{ background: '#ef4444' }} onClick={reset}>
              Try Again
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
