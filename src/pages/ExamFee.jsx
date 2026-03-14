import { useEffect, useState } from 'react';
import API from '../api/axios';
import useRazorpay from '../hooks/useRazorpay';
import { useAuth } from '../context/AuthContext';
import './ExamFee.css';

const FEE_ICONS = {
  exam_fee: '📝',
  back_fee: '📋',
  library_fine: '📚',
  event_fee: '🎪',
  other: '💰'
};

export default function ExamFee() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState(null);
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(null);
  const [status, setStatus] = useState(null);
  const { user } = useAuth();
  const { openPayment } = useRazorpay();

  const fetchFees = async () => {
    try {
      const res = await API.get('/api/fees/pending');
      setData(res.data);
    } catch (err) {
      setStatus({ type: 'error', msg: err.response?.data?.detail || 'Failed to load fees.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFees(); }, []);

  const handlePayWithRazorpay = (fee) => {
    openPayment({
      amount: fee.amount,
      name: user?.name || 'Student',
      description: fee.fee_name,
      onSuccess: async (response) => {
        setShowPin(fee.fee_id);
      },
      onFailure: (msg) => {
        setStatus({ type: 'error', msg: msg || 'Payment cancelled.' });
      }
    });
  };

  const handleConfirmPin = async (fee) => {
    setPayingId(fee.fee_id);
    setStatus(null);
    try {
      const res = await API.post(`/api/fees/pay/${fee.fee_id}?upi_pin=${pin}`);
      setStatus({ type: 'success', msg: res.data.message });
      setShowPin(null);
      setPin('');
      fetchFees();
    } catch (err) {
      setStatus({ type: 'error', msg: err.response?.data?.detail || 'Payment failed.' });
    } finally {
      setPayingId(null);
    }
  };

  if (loading) return <div className="page-loading">Loading your fees...</div>;

  return (
    <div className="fees-page">
      <div className="fees-header">
        <h2>My Pending Fees</h2>
        <p className="fees-sub">
          {data?.enrollment_no && `Enrollment: ${data.enrollment_no}`}
        </p>
      </div>

      {status && (
        <div className={`fee-status ${status.type}`}>
          {status.type === 'success' ? '✅' : '❌'} {status.msg}
        </div>
      )}

      {/* Pending Fees */}
      {data?.pending_fees?.length === 0 ? (
        <div className="no-fees">
          <span>🎉</span>
          <p>No pending fees! You're all clear.</p>
        </div>
      ) : (
        <>
          <div className="fees-total">
            Total Pending: <span>₹{data?.total_pending?.toFixed(2)}</span>
          </div>

          <div className="fees-list">
            {data?.pending_fees?.map(fee => (
              <div key={fee.fee_id} className="fee-card pending">
                <div className="fee-left">
                  <span className="fee-icon">{FEE_ICONS[fee.fee_type] || '💰'}</span>
                  <div>
                    <div className="fee-name">{fee.fee_name}</div>
                    <div className="fee-desc">{fee.description}</div>
                    <div className="fee-due">Due: {fee.due_date}</div>
                  </div>
                </div>
                <div className="fee-right">
                  <div className="fee-amount">₹{fee.amount}</div>
                  {showPin === fee.fee_id ? (
                    <div className="pin-confirm">
                      <input
                        type="password"
                        placeholder="UPI PIN"
                        maxLength={6}
                        value={pin}
                        onChange={e => setPin(e.target.value)}
                      />
                      <button
                        className="confirm-btn"
                        onClick={() => handleConfirmPin(fee)}
                        disabled={payingId === fee.fee_id || !pin}
                      >
                        {payingId === fee.fee_id ? '...' : 'Confirm'}
                      </button>
                      <button className="cancel-btn" onClick={() => setShowPin(null)}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      className="pay-fee-btn"
                      onClick={() => handlePayWithRazorpay(fee)}
                    >
                      Pay Now
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Paid Fees */}
      {data?.paid_fees?.length > 0 && (
        <>
          <div className="section-title" style={{marginTop: '32px'}}>Paid Fees</div>
          <div className="fees-list">
            {data.paid_fees.map(fee => (
              <div key={fee.fee_id} className="fee-card paid">
                <div className="fee-left">
                  <span className="fee-icon">{FEE_ICONS[fee.fee_type] || '💰'}</span>
                  <div>
                    <div className="fee-name">{fee.fee_name}</div>
                    <div className="fee-desc">{fee.description}</div>
                  </div>
                </div>
                <div className="fee-right">
                  <div className="fee-amount paid-amount">₹{fee.amount}</div>
                  <span className="paid-badge">✅ Paid</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
