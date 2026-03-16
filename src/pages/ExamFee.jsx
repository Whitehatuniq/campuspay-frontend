import { useState, useEffect } from 'react';
import { GraduationCap, Home, AlertCircle, CheckCircle, ChevronDown, ChevronUp, Wallet } from 'lucide-react';
import API from '../api/axios';
import PaymentModal from '../components/PaymentModal';
import './Pay.css';
import './ExamFee.css';

export default function ExamFee() {
  const [fees, setFees]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState('all');
  const [payingFee, setPayingFee] = useState(null);
  const [balance, setBalance]     = useState(0);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [feeRes, walRes] = await Promise.all([
        API.get('/api/fees/my-fees'),
        API.get('/api/wallet/balance'),
      ]);
      const examFees = (feeRes.data.fees || []).map(f => ({ ...f, category: f.category || 'exam' }));
      setBalance(walRes.data.balance || 0);

      // Merge with dummy hostel fees if none exist
      const hasHostel = examFees.some(f => f.category === 'hostel');
      if (!hasHostel) {
        examFees.push(
          { fee_id: 'hos_001', fee_name: 'Hostel Rent — April 2024',     amount: 4500,  status: 'pending', due_date: '2024-04-05', category: 'hostel', room: 'A-204' },
          { fee_id: 'hos_002', fee_name: 'Hostel Mess Fee — April 2024', amount: 3200,  status: 'pending', due_date: '2024-04-05', category: 'hostel', room: 'A-204' },
          { fee_id: 'hos_003', fee_name: 'Hostel Security Deposit',      amount: 10000, status: 'pending', due_date: '2024-03-01', category: 'hostel', room: 'A-204' },
          { fee_id: 'hos_004', fee_name: 'Hostel Rent — March 2024',     amount: 4500,  status: 'paid',    due_date: '2024-03-05', category: 'hostel', room: 'A-204', paid_on: '2024-03-04' },
        );
      }
      setFees(examFees);
    } catch {
      setFees([
        { fee_id: 'fee_001', fee_name: 'Semester 4 Exam Fee',    amount: 1500, status: 'pending', due_date: '2024-04-30', category: 'exam', semester: 4 },
        { fee_id: 'fee_002', fee_name: 'Back Paper - Mathematics', amount: 500, status: 'pending', due_date: '2024-04-15', category: 'exam', semester: 3 },
        { fee_id: 'fee_003', fee_name: 'Library Fine',             amount: 150, status: 'pending', due_date: '2024-04-10', category: 'exam' },
        { fee_id: 'fee_004', fee_name: 'Semester 3 Exam Fee',    amount: 1500, status: 'paid',    due_date: '2024-01-15', category: 'exam', paid_on: '2024-01-10' },
        { fee_id: 'hos_001', fee_name: 'Hostel Rent — April 2024',     amount: 4500,  status: 'pending', due_date: '2024-04-05', category: 'hostel', room: 'A-204' },
        { fee_id: 'hos_002', fee_name: 'Hostel Mess Fee — April 2024', amount: 3200,  status: 'pending', due_date: '2024-04-05', category: 'hostel', room: 'A-204' },
        { fee_id: 'hos_003', fee_name: 'Hostel Security Deposit',      amount: 10000, status: 'pending', due_date: '2024-03-01', category: 'hostel', room: 'A-204' },
        { fee_id: 'hos_004', fee_name: 'Hostel Rent — March 2024',     amount: 4500,  status: 'paid',    due_date: '2024-03-05', category: 'hostel', room: 'A-204', paid_on: '2024-03-04' },
      ]);
      setBalance(500);
    }
    setLoading(false);
  };

  const isOverdue = d => new Date(d) < new Date();

  const allPending = fees.filter(f => f.status === 'pending');
  const totalDue   = allPending.reduce((s, f) => s + f.amount, 0);
  const examDue    = fees.filter(f => f.status === 'pending' && f.category === 'exam').reduce((s, f) => s + f.amount, 0);
  const hostelDue  = fees.filter(f => f.status === 'pending' && f.category === 'hostel').reduce((s, f) => s + f.amount, 0);

  const filtered = filter === 'all'    ? fees
                 : filter === 'exam'   ? fees.filter(f => f.category === 'exam')
                 : filter === 'hostel' ? fees.filter(f => f.category === 'hostel')
                 : fees.filter(f => f.status === 'paid');

  const FILTERS = [
    { id: 'all',    label: `All (${fees.length})`,                                       color: '#94a3b8' },
    { id: 'exam',   label: `Exam (${fees.filter(f=>f.category==='exam').length})`,        color: '#38bdf8' },
    { id: 'hostel', label: `Hostel (${fees.filter(f=>f.category==='hostel').length})`,    color: '#a78bfa' },
    { id: 'paid',   label: `Paid (${fees.filter(f=>f.status==='paid').length})`,          color: '#22c55e' },
  ];

  return (
    <div className="examfee-page">
      {/* Hero */}
      <div className="page-hero" style={{ '--accent': '#38bdf8' }}>
        <div className="page-hero-icon"><GraduationCap size={28} color="#38bdf8" strokeWidth={1.8} /></div>
        <div>
          <h1>Campus Fees</h1>
          <p>Exam fees, hostel dues &amp; fines</p>
        </div>
        <div className="page-hero-balance"><Wallet size={13} color="#64748b" /><span>₹{balance.toLocaleString('en-IN')}</span></div>
      </div>

      {/* Summary */}
      <div className="fee-summary-row">
        <div className="fee-stat-card" style={{ '--c': '#ef4444' }}>
          <AlertCircle size={18} color="#ef4444" />
          <div><div className="fsc-label">Total Due</div><div className="fsc-val" style={{ color: '#ef4444' }}>₹{totalDue.toLocaleString('en-IN')}</div></div>
        </div>
        <div className="fee-stat-card" style={{ '--c': '#38bdf8' }}>
          <GraduationCap size={18} color="#38bdf8" />
          <div><div className="fsc-label">Exam Due</div><div className="fsc-val" style={{ color: '#38bdf8' }}>₹{examDue.toLocaleString('en-IN')}</div></div>
        </div>
        <div className="fee-stat-card" style={{ '--c': '#a78bfa' }}>
          <Home size={18} color="#a78bfa" />
          <div><div className="fsc-label">Hostel Due</div><div className="fsc-val" style={{ color: '#a78bfa' }}>₹{hostelDue.toLocaleString('en-IN')}</div></div>
        </div>
        <div className="fee-stat-card" style={{ '--c': '#22c55e' }}>
          <CheckCircle size={18} color="#22c55e" />
          <div><div className="fsc-label">Paid</div><div className="fsc-val" style={{ color: '#22c55e' }}>{fees.filter(f=>f.status==='paid').length} fees</div></div>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-tabs">
        {FILTERS.map(f => (
          <button key={f.id} className={`filter-tab ${filter === f.id ? 'active' : ''}`}
            style={filter === f.id ? { borderColor: f.color, color: f.color, background: f.color + '15' } : {}}
            onClick={() => setFilter(f.id)}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Fee list */}
      {loading ? <div className="spinner" /> : (
        <div className="fee-list">
          {filtered.map(fee => (
            <div key={fee.fee_id} className={`fee-row ${isOverdue(fee.due_date) && fee.status === 'pending' ? 'overdue' : ''}`}
              style={{ '--cat-color': fee.category === 'hostel' ? '#a78bfa' : '#38bdf8' }}>
              <div className="fee-row-icon">
                {fee.category === 'hostel'
                  ? <Home size={20} color="#a78bfa" strokeWidth={1.8} />
                  : <GraduationCap size={20} color="#38bdf8" strokeWidth={1.8} />}
              </div>
              <div className="fee-row-info">
                <div className="fee-row-name">{fee.fee_name}</div>
                <div className="fee-row-meta">
                  {fee.room && <span className="meta-tag" style={{ color: '#a78bfa', background: '#a78bfa15' }}>Room {fee.room}</span>}
                  {fee.semester && <span className="meta-tag">Sem {fee.semester}</span>}
                  <span className={`meta-tag ${isOverdue(fee.due_date) && fee.status === 'pending' ? 'meta-overdue' : ''}`}>
                    {fee.status === 'paid' ? `Paid ${fee.paid_on}` : `Due ${fee.due_date}`}
                  </span>
                </div>
              </div>
              <div className="fee-row-right">
                <div className="fee-row-amount">₹{fee.amount.toLocaleString('en-IN')}</div>
                {fee.status === 'pending'
                  ? <button className="pay-fee-btn" style={{ background: fee.category === 'hostel' ? '#a78bfa' : '#38bdf8' }}
                      onClick={() => setPayingFee(fee)}>Pay</button>
                  : <span className="pill pill-paid">Paid</span>}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="empty-state"><CheckCircle size={32} /><p>No fees here!</p></div>
          )}
        </div>
      )}

      {/* Payment Modal */}
      {payingFee && (
        <PaymentModal
          open={!!payingFee}
          onClose={() => setPayingFee(null)}
          amount={payingFee.amount}
          title={payingFee.category === 'hostel' ? 'Hostel Fee Payment' : 'Exam Fee Payment'}
          description={payingFee.fee_name}
          toUpi="9667295900-3@ybl"
          accentColor={payingFee.category === 'hostel' ? '#a78bfa' : '#38bdf8'}
          walletBalance={balance}
          apiEndpoint="/api/fees/pay-fee"
          apiPayload={{ fee_id: payingFee.fee_id }}
          onSuccess={() => {
            setFees(prev => prev.map(f => f.fee_id === payingFee.fee_id
              ? { ...f, status: 'paid', paid_on: new Date().toISOString().split('T')[0] } : f));
            setBalance(b => b - payingFee.amount);
            setPayingFee(null);
          }}
        />
      )}
    </div>
  );
}
