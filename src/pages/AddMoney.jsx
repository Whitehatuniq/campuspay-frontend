import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import useRazorpay from '../hooks/useRazorpay';
import { Wallet, Plus, ChevronRight, CheckCircle, XCircle, QrCode, Scan, Copy, Check, ArrowLeft } from 'lucide-react';
import './AddMoney.css';

const QUICK_AMOUNTS = [100, 200, 500, 1000, 2000, 5000];
const ADMIN_UPI     = '9667295900-3@ybl';
const ADMIN_NAME    = 'CampusPay Poornima University';

const UPI_APPS = [
  { id: 'phonepe',   name: 'PhonePe',    color: '#5f259f', bg: '#5f259f15', border: '#5f259f44',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/PhonePe_Logo.png/120px-PhonePe_Logo.png' },
  { id: 'googlepay', name: 'Google Pay', color: '#4285f4', bg: '#4285f415', border: '#4285f444',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Google_Pay_Logo.svg/120px-Google_Pay_Logo.svg.png' },
  { id: 'paytm',     name: 'Paytm',      color: '#00baf2', bg: '#00baf215', border: '#00baf244',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Paytm_Logo_%28standalone%29.svg/120px-Paytm_Logo_%28standalone%29.svg.png' },
  { id: 'bhim',      name: 'BHIM',       color: '#ff6600', bg: '#ff660015', border: '#ff660044',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/BHIM_SVG_logo.svg/120px-BHIM_SVG_logo.svg.png' },
];

export default function AddMoney() {
  const [amount,   setAmount]   = useState('');
  const [step,     setStep]     = useState('amount');
  const [loading,  setLoading]  = useState(false);
  const [errMsg,   setErrMsg]   = useState('');
  const [copied,   setCopied]   = useState(false);
  const [qrLoaded, setQrLoaded] = useState(false);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef(null);
  const html5QrRef = useRef(null);
  const { user }   = useAuth();
  const { openPayment } = useRazorpay();
  const navigate   = useNavigate();

  const numAmount = parseFloat(amount) || 0;
  const amtStr    = numAmount.toFixed(2);
  const upiString = `upi://pay?pa=${encodeURIComponent(ADMIN_UPI)}&pn=${encodeURIComponent(ADMIN_NAME)}&am=${amtStr}&cu=INR&tn=AddToWallet`;
  const qrUrl     = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiString)}&bgcolor=0f172a&color=f1f5f9&qzone=2`;

  // Stop scanner on unmount
  useEffect(() => () => stopScanner(), []);

  const updateWallet = async () => {
    await API.post('/api/wallet/add-money', { amount: numAmount, method: 'mock_upi' });
  };

  const copyUPI = () => {
    navigator.clipboard.writeText(ADMIN_UPI);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Open Razorpay with UPI method pre-selected
  const handleUPIApp = (app) => {
    setLoading(true);
    openPayment({
      amount: numAmount,
      name: user?.name || 'Student',
      description: `Add ₹${numAmount} to CampusPay Wallet`,
      // Razorpay handles the UPI collect and detects success/failure automatically
      onSuccess: async () => {
        try {
          await updateWallet();
          setStep('success');
        } catch {
          setErrMsg('Payment done but wallet update failed.');
          setStep('error');
        }
        setLoading(false);
      },
      onFailure: (msg) => {
        setErrMsg(msg || 'Payment failed or cancelled.');
        setStep('error');
        setLoading(false);
      },
    });
  };

  // Start camera QR scanner
  const startScanner = async () => {
    setScanning(true);
    setStep('scanner');
    setTimeout(async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        html5QrRef.current = new Html5Qrcode('am-scanner-box');
        await html5QrRef.current.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          async (decoded) => {
            stopScanner();
            // After scan — open Razorpay to complete payment
            handleUPIApp({ id: 'scanned' });
          },
          () => {}
        );
      } catch (e) {
        setStep('method');
        setScanning(false);
      }
    }, 400);
  };

  const stopScanner = () => {
    if (html5QrRef.current) {
      html5QrRef.current.stop().catch(() => {});
      html5QrRef.current = null;
    }
    setScanning(false);
  };

  const reset = () => { stopScanner(); setStep('amount'); setErrMsg(''); setAmount(''); };

  // ── SUCCESS ──
  if (step === 'success') return (
    <div className="addmoney-page">
      <div className="addmoney-card">
        <div className="am-center">
          <div className="am-result-icon" style={{ background: '#14532d22' }}>
            <CheckCircle size={56} color="#22c55e" />
          </div>
          <h2 style={{ color: '#f1f5f9', margin: '0 0 8px' }}>Payment Successful!</h2>
          <div className="am-success-amount">₹{numAmount.toLocaleString('en-IN')}</div>
          <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 24px' }}>Added to your CampusPay wallet</p>
          <button className="am-proceed-btn" onClick={() => navigate('/dashboard')}>
            Go to Dashboard <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );

  // ── ERROR ──
  if (step === 'error') return (
    <div className="addmoney-page">
      <div className="addmoney-card">
        <div className="am-center">
          <div className="am-result-icon" style={{ background: '#7f1d1d22' }}>
            <XCircle size={56} color="#ef4444" />
          </div>
          <h2 style={{ color: '#f1f5f9', margin: '0 0 8px' }}>Payment Failed</h2>
          <p style={{ color: '#ef4444', fontSize: 13, margin: '0 0 24px', textAlign: 'center' }}>{errMsg}</p>
          <button className="am-proceed-btn" style={{ background: '#ef4444' }} onClick={reset}>Try Again</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="addmoney-page">
      <div className="addmoney-card">

        {/* Header */}
        <div className="am-header">
          {(step === 'method' || step === 'qr' || step === 'scanner') && (
            <button className="am-back" onClick={() => { stopScanner(); setStep(step === 'method' ? 'amount' : 'method'); }}>
              <ArrowLeft size={18} />
            </button>
          )}
          <div className="am-title-row">
            <div className="am-icon-wrap"><Wallet size={22} color="#38bdf8" /></div>
            <div>
              <h2>Add Money</h2>
              <p>Top up your CampusPay wallet</p>
            </div>
          </div>
        </div>

        {/* ── STEP 1: Amount ── */}
        {step === 'amount' && (
          <>
            <div className="am-amount-box">
              <span className="am-currency">₹</span>
              <input type="number" className="am-amount-input" placeholder="0"
                min="1" max="50000" value={amount}
                onChange={e => setAmount(e.target.value)} autoFocus />
            </div>

            <div className="am-quick-label">Quick Select</div>
            <div className="am-quick-grid">
              {QUICK_AMOUNTS.map(a => (
                <button key={a} type="button"
                  className={`am-quick-btn ${amount === String(a) ? 'active' : ''}`}
                  onClick={() => setAmount(String(a))}>
                  ₹{a.toLocaleString()}
                </button>
              ))}
            </div>

            <button className="am-proceed-btn" onClick={() => setStep('method')} disabled={numAmount <= 0}>
              Proceed ₹{numAmount > 0 ? numAmount.toLocaleString('en-IN') : '0'}
              <ChevronRight size={18} />
            </button>
          </>
        )}

        {/* ── STEP 2: Choose UPI App ── */}
        {step === 'method' && (
          <>
            <div className="am-amount-badge">
              Adding <strong style={{ color: '#38bdf8' }}>₹{numAmount.toLocaleString('en-IN')}</strong> to wallet
            </div>

            <div className="am-section-label">Pay via UPI App</div>
            <div className="am-upi-grid">
              {UPI_APPS.map(app => (
                <button key={app.id} className="am-upi-app-btn"
                  style={{ '--c': app.color, '--bg': app.bg, '--bd': app.border }}
                  onClick={() => handleUPIApp(app)}
                  disabled={loading}>
                  <img src={app.logo} alt={app.name}
                    className="am-upi-logo"
                    onError={e => e.target.style.display = 'none'} />
                  <span className="am-upi-name">{app.name}</span>
                </button>
              ))}
            </div>

            {/* QR Scanner */}
            <button className="am-scanner-btn" onClick={startScanner} disabled={loading}>
              <Scan size={20} color="#34d399" />
              <div>
                <span className="am-scanner-title">Scan UPI QR Code</span>
                <span className="am-scanner-sub">Use camera to scan any UPI QR</span>
              </div>
              <ChevronRight size={16} color="#64748b" />
            </button>

            {/* Show QR */}
            <button className="am-showqr-btn" onClick={() => { setQrLoaded(false); setStep('qr'); }}>
              <QrCode size={18} color="#a78bfa" />
              Show Payment QR Code
            </button>
          </>
        )}

        {/* ── STEP 3: Show QR ── */}
        {step === 'qr' && (
          <>
            <div className="am-qr-header">
              <h3>Scan to Pay</h3>
              <p>Open any UPI app → Scan → Enter bank PIN → Done</p>
            </div>

            <div className="am-qr-box">
              {!qrLoaded && (
                <div className="am-qr-loading">
                  <div className="am-spinner" />
                  <span>Generating QR...</span>
                </div>
              )}
              <img src={qrUrl} alt="UPI QR"
                className="am-qr-img"
                style={{ display: qrLoaded ? 'block' : 'none' }}
                onLoad={() => setQrLoaded(true)} />
              <div className="am-qr-amount" style={{ color: '#38bdf8' }}>₹{numAmount.toLocaleString('en-IN')}</div>
              <div className="am-qr-to">{ADMIN_NAME}</div>
            </div>

            <div className="am-upi-copy-row">
              <span className="am-copy-label">UPI ID</span>
              <div className="am-copy-box">
                <span className="am-copy-id">{ADMIN_UPI}</span>
                <button className="am-copy-btn" onClick={copyUPI}>
                  {copied ? <Check size={14} color="#22c55e" /> : <Copy size={14} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="am-steps">
              {['Open PhonePe, GPay, Paytm or BHIM', 'Scan QR code or enter UPI ID above', 'Enter your bank PIN to pay', 'Payment success shows automatically'].map((s, i) => (
                <div key={i} className="am-step">
                  <span className="am-step-num">{i + 1}</span>
                  <span>{s}</span>
                </div>
              ))}
            </div>

            {/* After paying via QR, user clicks this to update wallet */}
            <button className="am-proceed-btn" onClick={async () => {
              setLoading(true);
              try {
                await updateWallet();
                setStep('success');
              } catch { setErrMsg('Could not update wallet.'); setStep('error'); }
              setLoading(false);
            }} disabled={loading}>
              {loading ? 'Updating...' : <><CheckCircle size={16} /> I've Paid — Update Wallet</>}
            </button>
          </>
        )}

        {/* ── STEP 4: Camera Scanner ── */}
        {step === 'scanner' && (
          <div className="am-scanner-section">
            <h3>Point at QR Code</h3>
            <p>Scan any UPI QR code to pay</p>
            <div id="am-scanner-box" className="am-scanner-view" />
            <button className="am-cancel-btn" onClick={() => { stopScanner(); setStep('method'); }}>
              Cancel Scanning
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
