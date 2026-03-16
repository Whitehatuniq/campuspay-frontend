import { useState, useEffect } from 'react';
import API from '../api/axios';
import './ExamFee.css';

const FEE_CATEGORIES = {
  exam: { label: 'Exam Fees', emoji: '📝', color: '#38bdf8' },
  hostel: { label: 'Hostel Fees', emoji: '🏠', color: '#a78bfa' },
};

export default function ExamFee() {
  const [fees, setFees] = useState([]);
  const [hostelFees, setHostelFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [processing, setProcessing] = useState(null);
  const [message, setMessage] = useState(null);
  const [payingFee, setPayingFee] = useState(null);
  const [pin, setPin] = useState('');

  useEffect(() => {
    loadFees();
  }, []);

  const loadFees = async () => {
    setLoading(true);
    try {
      const res = await API.get('/api/fees/my-fees');
      setFees(res.data.fees || []);
    } catch (e) {
      // fallback dummy fees
      setFees([
        { fee_id: 'fee_001', fee_name: 'Semester 4 Exam Fee', amount: 1500, status: 'pending', due_date: '2024-04-30', semester: 4, category: 'exam' },
        { fee_id: 'fee_002', fee_name: 'Back Paper - Mathematics', amount: 500, status: 'pending', due_date: '2024-04-15', semester: 3, category: 'exam' },
        { fee_id: 'fee_003', fee_name: 'Library Fine', amount: 150, status: 'pending', due_date: '2024-04-10', category: 'exam' },
        { fee_id: 'fee_004', fee_name: 'Semester 3 Exam Fee', amount: 1500, status: 'paid', due_date: '2024-01-15', semester: 3, paid_on: '2024-01-10', category: 'exam' },
      ]);
    }

    // Hostel fees (dummy for now)
    setHostelFees([
      { fee_id: 'hos_001', fee_name: 'Hostel Rent - April 2024', amount: 4500, status: 'pending', due_date: '2024-04-05', room: 'A-204', category: 'hostel' },
      { fee_id: 'hos_002', fee_name: 'Hostel Mess Fee - April 2024', amount: 3200, status: 'pending', due_date: '2024-04-05', room: 'A-204', category: 'hostel' },
      { fee_id: 'hos_003', fee_name: 'Hostel Security Deposit', amount: 10000, status: 'pending', due_date: '2024-03-01', room: 'A-204', category: 'hostel' },
      { fee_id: 'hos_004', fee_name: 'Hostel Rent - March 2024', amount: 4500, status: 'paid', due_date: '2024-03-05', room: 'A-204', paid_on: '2024-03-04', category: 'hostel' },
      { fee_id: 'hos_005', fee_name: 'Hostel Mess Fee - March 2024', amount: 3200, status: 'paid', due_date: '2024-03-05', room: 'A-204', paid_on: '2024-03-04', category: 'hostel' },
    ]);

    setLoading(false);
  };

  const allFees = [...fees, ...hostelFees];
  const filteredFees = activeCategory === 'all'
    ? allFees
    : activeCategory === 'exam'
    ? fees
    : hostelFees;

  const pendingFees = allFees.filter(f => f.status === 'pending');
  const paidFees = allFees.filter(f => f.status === 'paid');
  const totalDue = pendingFees.reduce((s, f) => s + f.amount, 0);
  const totalPaid = paidFees.reduce((s, f) => s + f.amount, 0);

  const handlePayFee = async () => {
    if (pin.length < 4) { setMessage({ type: 'error', text: 'Enter your 4-digit UPI PIN' }); return; }
    setProcessing(payingFee.fee_id);

    try {
      await API.post('/api/fees/pay-fee', {
        fee_id: payingFee.fee_id,
        amount: payingFee.amount,
        upi_pin: pin,
      });

      // Update local state
      if (payingFee.category === 'exam') {
        setFees(prev => prev.map(f => f.fee_id === payingFee.fee_id ? { ...f, status: 'paid', paid_on: new Date().toISOString().split('T')[0] } : f));
      } else {
        setHostelFees(prev => prev.map(f => f.fee_id === payingFee.fee_id ? { ...f, status: 'paid', paid_on: new Date().toISOString().split('T')[0] } : f));
      }

      setMessage({ type: 'success', text: `✅ ₹${payingFee.amount} paid for "${payingFee.fee_name}"` });
    } catch (err) {
      const errMsg = err.response?.data?.detail || 'Payment failed. Check your PIN or balance.';
      setMessage({ type: 'error', text: errMsg });
    }

    setProcessing(null);
    setPayingFee(null);
    setPin('');
  };

  const isOverdue = (due_date) => new Date(due_date) < new Date();

  if (loading) return (
    <div className="examfee-page">
      <div className="loading-state">
        <div className="spinner" />
        <p>Loading your fees...</p>
      </div>
    </div>
  );

  return (
    <div className="examfee-page">
      <div className="examfee-header">
        <div>
          <h1>📋 My Fees</h1>
          <p>Exam fees, hostel dues & fines</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="fee-summary-grid">
        <div className="fee-summary-card due">
          <div className="summary-icon">⚠️</div>
          <div>
            <div className="summary-label">Total Due</div>
            <div className="summary-amount due-amount">₹{totalDue.toLocaleString()}</div>
            <div className="summary-count">{pendingFees.length} pending fees</div>
          </div>
        </div>
        <div className="fee-summary-card paid">
          <div className="summary-icon">✅</div>
          <div>
            <div className="summary-label">Total Paid</div>
            <div className="summary-amount paid-amount">₹{totalPaid.toLocaleString()}</div>
            <div className="summary-count">{paidFees.length} paid fees</div>
          </div>
        </div>
        <div className="fee-summary-card exam">
          <div className="summary-icon">📝</div>
          <div>
            <div className="summary-label">Exam Dues</div>
            <div className="summary-amount exam-amount">
              ₹{fees.filter(f => f.status === 'pending').reduce((s, f) => s + f.amount, 0).toLocaleString()}
            </div>
            <div className="summary-count">{fees.filter(f => f.status === 'pending').length} pending</div>
          </div>
        </div>
        <div className="fee-summary-card hostel">
          <div className="summary-icon">🏠</div>
          <div>
            <div className="summary-label">Hostel Dues</div>
            <div className="summary-amount hostel-amount">
              ₹{hostelFees.filter(f => f.status === 'pending').reduce((s, f) => s + f.amount, 0).toLocaleString()}
            </div>
            <div className="summary-count">{hostelFees.filter(f => f.status === 'pending').length} pending</div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="fee-category-tabs">
        {[
          { id: 'all',    label: `All (${allFees.length})`,          emoji: '📋' },
          { id: 'exam',   label: `Exam (${fees.length})`,            emoji: '📝' },
          { id: 'hostel', label: `Hostel (${hostelFees.length})`,    emoji: '🏠' },
          { id: 'paid',   label: `Paid (${paidFees.length})`,        emoji: '✅' },
        ].map(tab => (
          <button
            key={tab.id}
            className={`fee-category-tab ${activeCategory === tab.id ? 'active' : ''} ${tab.id}`}
            onClick={() => setActiveCategory(tab.id)}
          >
            {tab.emoji} {tab.label}
          </button>
        ))}
      </div>

      {/* Message */}
      {message && (
        <div className={`fee-message ${message.type}`}>
          {message.text}
          <button onClick={() => setMessage(null)}>✕</button>
        </div>
      )}

      {/* Fee List */}
      <div className="fee-list">
        {(activeCategory === 'paid' ? allFees.filter(f => f.status === 'paid') : filteredFees).length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎉</div>
            <p>No fees in this category!</p>
          </div>
        ) : (
          (activeCategory === 'paid' ? allFees.filter(f => f.status === 'paid') : filteredFees).map(fee => (
            <div key={fee.fee_id} className={`fee-card ${fee.status} ${isOverdue(fee.due_date) && fee.status === 'pending' ? 'overdue' : ''}`}>
              <div className="fee-card-left">
                <div className="fee-emoji">
                  {fee.category === 'hostel' ? '🏠' : '📝'}
                </div>
                <div className="fee-info">
                  <div className="fee-name">{fee.fee_name}</div>
                  <div className="fee-meta">
                    {fee.room && <span className="fee-tag room">Room {fee.room}</span>}
                    {fee.semester && <span className="fee-tag">Sem {fee.semester}</span>}
                    <span className={`fee-tag ${isOverdue(fee.due_date) && fee.status === 'pending' ? 'overdue' : ''}`}>
                      {fee.status === 'paid' ? `Paid on ${fee.paid_on}` : `Due: ${fee.due_date}`}
                    </span>
                    {isOverdue(fee.due_date) && fee.status === 'pending' && (
                      <span className="fee-tag overdue-tag">⚠️ Overdue</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="fee-card-right">
                <div className={`fee-amount ${fee.status}`}>₹{fee.amount.toLocaleString()}</div>
                {fee.status === 'pending' ? (
                  <button
                    className={`pay-btn ${fee.category === 'hostel' ? 'hostel' : 'exam'}`}
                    onClick={() => { setPayingFee(fee); setPin(''); setMessage(null); }}
                    disabled={processing === fee.fee_id}
                  >
                    {processing === fee.fee_id ? '⏳' : 'Pay Now'}
                  </button>
                ) : (
                  <span className="paid-badge">✅ Paid</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pay Now Modal */}
      {payingFee && (
        <div className="modal-overlay" onClick={() => setPayingFee(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className={`modal-header ${payingFee.category}`}>
              <span>{payingFee.category === 'hostel' ? '🏠' : '📝'}</span>
              <div>
                <div className="modal-title">{payingFee.fee_name}</div>
                <div className="modal-subtitle">
                  {payingFee.category === 'hostel' ? 'Hostel Fee' : 'Exam Fee'} · University Account
                </div>
              </div>
            </div>
            <div className="modal-amount">₹{payingFee.amount.toLocaleString()}</div>
            <div className="modal-to">Payment to: <strong>university@campuspay</strong></div>

            <div className="pin-section">
              <label>Enter UPI PIN</label>
              <input
                type="password"
                maxLength={4}
                placeholder="• • • •"
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                className="pin-input"
                autoFocus
              />
            </div>

            {message && <div className={`fee-message ${message.type}`}>{message.text}</div>}

            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => { setPayingFee(null); setMessage(null); }}>Cancel</button>
              <button
                className={`confirm-btn ${payingFee.category}`}
                onClick={handlePayFee}
                disabled={!!processing || pin.length < 4}
              >
                {processing ? 'Processing...' : `Pay ₹${payingFee.amount.toLocaleString()}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
