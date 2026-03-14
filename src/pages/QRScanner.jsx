import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import API from '../api/axios';
import './QRScanner.css';

export default function QRScanner() {
  const [mode, setMode] = useState('select'); // select | scan | pay | success
  const [scanType, setScanType] = useState(null); // 'upi' | 'canteen'
  const [scannedData, setScannedData] = useState(null);
  const [amount, setAmount] = useState('');
  const [pin, setPin] = useState('');
  const [paymentType, setPaymentType] = useState('other');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [result, setResult] = useState(null);
  const scannerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (mode === 'scan') {
      setTimeout(() => {
        if (document.getElementById('qr-reader')) {
          scannerRef.current = new Html5QrcodeScanner('qr-reader', {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            rememberLastUsedCamera: true,
          });

          scannerRef.current.render(
            (decodedText) => {
              handleScanSuccess(decodedText);
            },
            (error) => {}
          );
        }
      }, 300);
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [mode]);

  const handleScanSuccess = (text) => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(() => {});
      scannerRef.current = null;
    }

    // Parse scanned QR
    if (scanType === 'upi') {
      // UPI QR format: upi://pay?pa=UPI_ID&pn=Name
      // Also handle plain UPI ID like eklavya123@campuspay
      let upiId = text;
      if (text.includes('upi://pay')) {
        const params = new URLSearchParams(text.split('?')[1]);
        upiId = params.get('pa') || text;
      }
      setScannedData({ upi_id: upiId, raw: text });
      setMode('pay');
    } else if (scanType === 'canteen') {
      // Canteen QR format: campuspay://canteen/CANTEEN_ID
      let canteenId = text;
      if (text.includes('campuspay://canteen/')) {
        canteenId = text.replace('campuspay://canteen/', '');
      }
      setScannedData({ canteen_id: canteenId, raw: text });
      setMode('pay');
      navigate(`/canteen`);
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      const res = await API.post('/api/payment/pay', {
        receiver_upi: scannedData.upi_id,
        amount: parseFloat(amount),
        payment_type: paymentType,
        description: `QR Payment to ${scannedData.upi_id}`,
        upi_pin: pin
      });
      setResult(res.data);
      setMode('success');
    } catch (err) {
      setStatus({ type: 'error', msg: err.response?.data?.detail || 'Payment failed.' });
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setMode('select');
    setScanType(null);
    setScannedData(null);
    setAmount('');
    setPin('');
    setStatus(null);
    setResult(null);
  };

  return (
    <div className="qr-page">

      {/* SELECT MODE */}
      {mode === 'select' && (
        <>
          <div className="qr-header">
            <h2>QR Scanner</h2>
            <p>Scan a QR code to pay or order</p>
          </div>
          <div className="qr-options">
            <div className="qr-option-card" onClick={() => { setScanType('upi'); setMode('scan'); }}>
              <span className="qr-option-icon">💸</span>
              <h3>Scan UPI QR</h3>
              <p>Scan any student's UPI QR code to send money instantly</p>
            </div>
            <div className="qr-option-card" onClick={() => { setScanType('canteen'); setMode('scan'); }}>
              <span className="qr-option-icon">🍽️</span>
              <h3>Scan Canteen QR</h3>
              <p>Scan canteen QR code to go directly to their menu</p>
            </div>
          </div>

          {/* Generate your own QR */}
          <div className="my-qr-section">
            <h3>My UPI QR Code</h3>
            <p>Let others scan this to pay you</p>
            <MyQRCode />
          </div>
        </>
      )}

      {/* SCAN MODE */}
      {mode === 'scan' && (
        <>
          <div className="qr-header">
            <button className="back-btn" onClick={reset}>← Back</button>
            <div>
              <h2>{scanType === 'upi' ? '💸 Scan UPI QR' : '🍽️ Scan Canteen QR'}</h2>
              <p>Point your camera at the QR code</p>
            </div>
          </div>
          <div className="scanner-wrap">
            <div id="qr-reader"></div>
          </div>
          <div className="scan-tip">
            📱 Allow camera access when prompted
          </div>
        </>
      )}

      {/* PAY MODE */}
      {mode === 'pay' && scannedData && (
        <>
          <div className="qr-header">
            <button className="back-btn" onClick={reset}>← Back</button>
            <h2>💸 Pay via QR</h2>
          </div>

          <div className="scanned-result">
            <span className="scan-success-icon">✅</span>
            <div>
              <div className="scanned-label">Scanned UPI ID</div>
              <div className="scanned-value">{scannedData.upi_id}</div>
            </div>
          </div>

          {status && (
            <div className={`qr-status ${status.type}`}>
              ❌ {status.msg}
            </div>
          )}

          <form onSubmit={handlePayment} className="qr-pay-form">
            <div className="form-group">
              <label>Amount (₹)</label>
              <input type="number" placeholder="Enter amount" min="1"
                value={amount} onChange={e => setAmount(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Payment Type</label>
              <select value={paymentType} onChange={e => setPaymentType(e.target.value)}>
                <option value="other">Other</option>
                <option value="exam_fee">Exam Fee</option>
                <option value="canteen">Canteen</option>
                <option value="event_fee">Event Fee</option>
              </select>
            </div>
            <div className="form-group">
              <label>UPI PIN</label>
              <input type="password" placeholder="4-6 digit PIN" maxLength={6}
                value={pin} onChange={e => setPin(e.target.value)} required />
            </div>
            <button type="submit" className="qr-pay-btn" disabled={loading}>
              {loading ? 'Processing...' : `Pay ₹${amount || '0'}`}
            </button>
          </form>
        </>
      )}

      {/* SUCCESS MODE */}
      {mode === 'success' && result && (
        <div className="qr-success">
          <span className="success-icon">🎉</span>
          <h2>Payment Successful!</h2>
          <p>{result.message}</p>
          <div className="success-details">
            <div className="success-row">
              <span>Amount</span><span>₹{parseFloat(amount).toFixed(2)}</span>
            </div>
            <div className="success-row">
              <span>To</span><span>{scannedData?.upi_id}</span>
            </div>
            <div className="success-row">
              <span>TXN ID</span><span>{result.transaction_id?.slice(0, 16)}...</span>
            </div>
          </div>
          <button className="qr-pay-btn" onClick={reset}>Scan Another</button>
          <button className="back-home-btn" onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </button>
        </div>
      )}
    </div>
  );
}

// Generate QR for own UPI ID
function MyQRCode() {
  const canvasRef = useRef(null);
  const [upiId, setUpiId] = useState('');

  useEffect(() => {
    API.get('/api/wallet/upi-id').then(res => {
      setUpiId(res.data.upi_id);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (upiId && canvasRef.current) {
      import('html5-qrcode').then(({ Html5Qrcode }) => {
        // Use QRCode library to generate
      });
    }
  }, [upiId]);

  return (
    <div className="my-qr-card">
      <div className="qr-placeholder">
        <span>📱</span>
        <p>Your UPI ID:</p>
        <strong>{upiId || 'Loading...'}</strong>
        <p className="qr-copy-tip">Share your UPI ID with others so they can pay you!</p>
      </div>
    </div>
  );
}
