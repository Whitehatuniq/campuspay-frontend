import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Zap, Copy, Check, ArrowLeft, Flashlight } from 'lucide-react';
import API from '../api/axios';
import './QRScanner.css';

const SCAN_MODES = [
  { id: 'pay',    label: 'Pay',        desc: 'Scan to send money'    },
  { id: 'addmoney', label: 'Add Money', desc: 'Scan to add to wallet' },
];

export default function QRScanner() {
  const [mode,        setMode]        = useState('pay');
  const [scanning,    setScanning]    = useState(false);
  const [scanned,     setScanned]     = useState(null);
  const [step,        setStep]        = useState('idle'); // idle | scanning | result | confirm | success | error
  const [amount,      setAmount]      = useState('');
  const [pin,         setPin]         = useState('');
  const [loading,     setLoading]     = useState(false);
  const [errMsg,      setErrMsg]      = useState('');
  const [copied,      setCopied]      = useState(false);
  const [torchOn,     setTorchOn]     = useState(false);
  const [scanLine,    setScanLine]    = useState(0);
  const html5QrRef    = useRef(null);
  const animRef       = useRef(null);
  const navigate      = useNavigate();

  // Animate scan line
  useEffect(() => {
    if (step === 'scanning') {
      let pos = 0; let dir = 1;
      animRef.current = setInterval(() => {
        pos += dir * 2;
        if (pos >= 100) dir = -1;
        if (pos <= 0)   dir = 1;
        setScanLine(pos);
      }, 16);
    } else {
      clearInterval(animRef.current);
    }
    return () => clearInterval(animRef.current);
  }, [step]);

  useEffect(() => () => stopScanner(), []);

  const startScanner = async () => {
    setStep('scanning');
    setScanning(true);
    setScanned(null);

    setTimeout(async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        html5QrRef.current = new Html5Qrcode('qr-video-box');
        await html5QrRef.current.start(
          { facingMode: 'environment' },
          { fps: 15, qrbox: { width: 260, height: 260 } },
          (decoded) => {
            stopScanner();
            // Parse UPI string
            let upiId = decoded;
            const pa  = decoded.match(/pa=([^&]+)/);
            const pn  = decoded.match(/pn=([^&]+)/);
            const am  = decoded.match(/am=([^&]+)/);
            if (pa) upiId = decodeURIComponent(pa[1]);
            const name = pn ? decodeURIComponent(pn[1]) : '';
            const amt  = am ? decodeURIComponent(am[1]) : '';
            setScanned({ upiId, name, rawAmount: amt, raw: decoded });
            if (amt) setAmount(amt);
            setStep('result');
          },
          () => {}
        );
      } catch (e) {
        setErrMsg('Camera access denied or not available.');
        setStep('error');
        setScanning(false);
      }
    }, 300);
  };

  const stopScanner = () => {
    if (html5QrRef.current) {
      html5QrRef.current.stop().catch(() => {});
      html5QrRef.current = null;
    }
    setScanning(false);
  };

  const handlePay = async () => {
    if (!pin || pin.length < 4) return;
    setLoading(true);
    try {
      await API.post('/api/payment/pay', {
        receiver_upi: scanned.upiId,
        amount: parseFloat(amount),
        payment_type: 'other',
        upi_pin: pin,
        description: `QR Pay to ${scanned.name || scanned.upiId}`,
      });
      setStep('success');
    } catch (e) {
      setErrMsg(e.response?.data?.detail || 'Payment failed. Check PIN or balance.');
      setStep('error');
    }
    setLoading(false);
  };

  const copyUPI = () => {
    navigator.clipboard.writeText(scanned?.upiId || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => { setStep('idle'); setScanned(null); setAmount(''); setPin(''); setErrMsg(''); };

  return (
    <div className="qrs-page">
      {/* Background glow */}
      <div className="qrs-glow" />

      <div className="qrs-container">

        {/* Header */}
        <div className="qrs-header">
          {step !== 'idle' && (
            <button className="qrs-back" onClick={() => { stopScanner(); reset(); }}>
              <ArrowLeft size={18} />
            </button>
          )}
          <div className="qrs-header-text">
            <h1>QR Scanner</h1>
            <p>{step === 'scanning' ? 'Align QR code within the frame' : 'Scan any UPI QR code'}</p>
          </div>
          {step === 'idle' && (
            <button className="qrs-history-btn" onClick={() => navigate('/transactions')}>
              History
            </button>
          )}
        </div>

        {/* ── IDLE: Mode selector + start ── */}
        {step === 'idle' && (
          <div className="qrs-idle">
            {/* Mode tabs */}
            <div className="qrs-mode-tabs">
              {SCAN_MODES.map(m => (
                <button key={m.id}
                  className={`qrs-mode-tab ${mode === m.id ? 'active' : ''}`}
                  onClick={() => setMode(m.id)}>
                  <span className="qrs-mode-label">{m.label}</span>
                  <span className="qrs-mode-desc">{m.desc}</span>
                </button>
              ))}
            </div>

            {/* Big scan button */}
            <div className="qrs-start-wrap">
              <button className="qrs-start-btn" onClick={startScanner}>
                <div className="qrs-start-inner">
                  <div className="qrs-start-icon">
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                      <rect x="4" y="4" width="16" height="16" rx="3" stroke="#38bdf8" strokeWidth="2.5" fill="none"/>
                      <rect x="4" y="28" width="16" height="16" rx="3" stroke="#38bdf8" strokeWidth="2.5" fill="none"/>
                      <rect x="28" y="4" width="16" height="16" rx="3" stroke="#38bdf8" strokeWidth="2.5" fill="none"/>
                      <rect x="8" y="8" width="8" height="8" rx="1" fill="#38bdf8"/>
                      <rect x="8" y="32" width="8" height="8" rx="1" fill="#38bdf8"/>
                      <rect x="32" y="8" width="8" height="8" rx="1" fill="#38bdf8"/>
                      <line x1="28" y1="28" x2="44" y2="28" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round"/>
                      <line x1="36" y1="28" x2="36" y2="44" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round"/>
                      <line x1="28" y1="36" x2="32" y2="36" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round"/>
                      <line x1="40" y1="36" x2="44" y2="36" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <span className="qrs-start-label">Tap to Scan</span>
                  <span className="qrs-start-sub">Camera will open</span>
                </div>
                <div className="qrs-ring qrs-ring-1" />
                <div className="qrs-ring qrs-ring-2" />
                <div className="qrs-ring qrs-ring-3" />
              </button>
            </div>

            {/* Supported apps */}
            <div className="qrs-supported">
              <span className="qrs-supported-label">Works with</span>
              <div className="qrs-app-chips">
                {[
                  { name: 'PhonePe', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/PhonePe_Logo.png/120px-PhonePe_Logo.png' },
                  { name: 'GPay',    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Google_Pay_Logo.svg/120px-Google_Pay_Logo.svg.png' },
                  { name: 'Paytm',   logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Paytm_Logo_%28standalone%29.svg/120px-Paytm_Logo_%28standalone%29.svg.png' },
                  { name: 'BHIM',    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/BHIM_SVG_logo.svg/120px-BHIM_SVG_logo.svg.png' },
                ].map(a => (
                  <div key={a.name} className="qrs-app-chip">
                    <img src={a.logo} alt={a.name} onError={e => e.target.style.display='none'} />
                    <span>{a.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── SCANNING ── */}
        {step === 'scanning' && (
          <div className="qrs-scanning-view">
            <div className="qrs-video-wrap">
              {/* Corner brackets */}
              <div className="qrs-corner tl" />
              <div className="qrs-corner tr" />
              <div className="qrs-corner bl" />
              <div className="qrs-corner br" />

              {/* Animated scan line */}
              <div className="qrs-scan-line" style={{ top: `${scanLine}%` }} />

              {/* Camera feed */}
              <div id="qr-video-box" className="qrs-video-box" />
            </div>

            <div className="qrs-scan-hint">
              <Zap size={14} color="#38bdf8" />
              <span>Hold steady — scanning automatically</span>
            </div>

            <button className="qrs-cancel-btn" onClick={() => { stopScanner(); reset(); }}>
              Cancel
            </button>
          </div>
        )}

        {/* ── RESULT: QR scanned, show details ── */}
        {step === 'result' && scanned && (
          <div className="qrs-result">
            {/* Success scan indicator */}
            <div className="qrs-scan-success">
              <div className="qrs-scan-success-icon">
                <CheckCircle size={28} color="#22c55e" />
              </div>
              <span>QR Scanned Successfully</span>
            </div>

            {/* Receiver card */}
            <div className="qrs-receiver-card">
              <div className="qrs-receiver-avatar">
                {(scanned.name || scanned.upiId).charAt(0).toUpperCase()}
              </div>
              <div className="qrs-receiver-info">
                <div className="qrs-receiver-name">{scanned.name || 'UPI Payment'}</div>
                <div className="qrs-receiver-upi-row">
                  <span className="qrs-receiver-upi">{scanned.upiId}</span>
                  <button className="qrs-copy-btn" onClick={copyUPI}>
                    {copied ? <Check size={12} color="#22c55e" /> : <Copy size={12} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Amount input */}
            <div className="qrs-amount-section">
              <label className="qrs-label">Enter Amount</label>
              <div className="qrs-amount-box">
                <span className="qrs-currency">₹</span>
                <input
                  type="number"
                  className="qrs-amount-input"
                  placeholder="0"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  autoFocus={!scanned.rawAmount}
                />
              </div>
            </div>

            {/* PIN input */}
            <div className="qrs-pin-section">
              <label className="qrs-label">UPI PIN</label>
              <input
                type="password"
                maxLength={4}
                placeholder="• • • •"
                className="qrs-pin-input"
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
              />
            </div>

            <button className="qrs-pay-btn"
              onClick={handlePay}
              disabled={loading || !amount || parseFloat(amount) <= 0 || pin.length < 4}>
              {loading ? (
                <><div className="qrs-btn-spinner" /> Processing...</>
              ) : (
                <>Pay ₹{amount ? parseFloat(amount).toLocaleString('en-IN') : '0'}</>
              )}
            </button>

            <button className="qrs-rescan-btn" onClick={() => { reset(); startScanner(); }}>
              Scan Again
            </button>
          </div>
        )}

        {/* ── SUCCESS ── */}
        {step === 'success' && (
          <div className="qrs-final">
            <div className="qrs-final-icon success">
              <CheckCircle size={52} color="#22c55e" />
            </div>
            <h2>Payment Sent!</h2>
            <div className="qrs-final-amount">₹{parseFloat(amount || 0).toLocaleString('en-IN')}</div>
            <p>Paid to {scanned?.name || scanned?.upiId}</p>
            <button className="qrs-pay-btn" style={{ background: '#22c55e' }} onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </button>
            <button className="qrs-rescan-btn" onClick={reset}>Scan Another</button>
          </div>
        )}

        {/* ── ERROR ── */}
        {step === 'error' && (
          <div className="qrs-final">
            <div className="qrs-final-icon error">
              <XCircle size={52} color="#ef4444" />
            </div>
            <h2>Failed</h2>
            <p className="qrs-err-msg">{errMsg}</p>
            <button className="qrs-pay-btn" style={{ background: '#ef4444' }} onClick={reset}>Try Again</button>
          </div>
        )}

      </div>
    </div>
  );
}
