import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import './Statement.css';

const TYPE_LABELS = {
  exam_fee: 'Exam Fee', back_fee: 'Back Fee', event_fee: 'Event Fee',
  canteen: 'Canteen', library_fine: 'Library Fine',
  wallet_topup: 'Wallet Top-up', other: 'Other'
};

export default function Statement() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [filter, setFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    Promise.all([
      API.get('/api/transaction/history?limit=100'),
      API.get('/api/wallet/balance')
    ]).then(([txnRes, walletRes]) => {
      setTransactions(txnRes.data);
      setWallet(walletRes.data);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = transactions.filter(t => {
    if (filter !== 'all' && t.direction !== filter) return false;
    if (fromDate && t.timestamp < fromDate) return false;
    if (toDate && t.timestamp > toDate + 'T23:59:59') return false;
    return true;
  });

  const totalDebit  = filtered.filter(t => t.direction === 'debit').reduce((s, t) => s + t.amount, 0);
  const totalCredit = filtered.filter(t => t.direction === 'credit').reduce((s, t) => s + t.amount, 0);

  const generatePDF = () => {
    setGenerating(true);

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>CampusPay Statement</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 40px; color: #1e293b; }
          .header { text-align: center; margin-bottom: 32px; border-bottom: 3px solid #0f172a; padding-bottom: 20px; }
          .logo { font-size: 32px; font-weight: 900; color: #0f172a; letter-spacing: -1px; }
          .tagline { font-size: 12px; color: #64748b; margin-top: 4px; }
          .title { font-size: 18px; font-weight: 700; margin-top: 12px; color: #0f172a; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
          .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; }
          .info-label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
          .info-value { font-size: 15px; font-weight: 700; color: #0f172a; margin-top: 4px; }
          .summary { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 24px; }
          .summary-box { text-align: center; padding: 14px; border-radius: 8px; }
          .summary-box.balance { background: #eff6ff; border: 1px solid #bfdbfe; }
          .summary-box.debit   { background: #fff1f2; border: 1px solid #fecdd3; }
          .summary-box.credit  { background: #f0fdf4; border: 1px solid #bbf7d0; }
          .summary-label { font-size: 11px; color: #64748b; text-transform: uppercase; }
          .summary-amount { font-size: 20px; font-weight: 800; margin-top: 4px; }
          .balance .summary-amount { color: #1d4ed8; }
          .debit .summary-amount   { color: #dc2626; }
          .credit .summary-amount  { color: #16a34a; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; }
          th { background: #0f172a; color: white; padding: 10px 12px; text-align: left; font-weight: 600; }
          td { padding: 9px 12px; border-bottom: 1px solid #e2e8f0; }
          tr:nth-child(even) { background: #f8fafc; }
          .debit-row  { color: #dc2626; font-weight: 700; }
          .credit-row { color: #16a34a; font-weight: 700; }
          .footer { margin-top: 32px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">🎓 CAMPUSPAY</div>
          <div class="tagline">One Wallet For Every Campus Need</div>
          <div class="title">Payment Statement</div>
        </div>

        <div class="info-grid">
          <div class="info-box">
            <div class="info-label">Student Name</div>
            <div class="info-value">${user?.name || 'N/A'}</div>
          </div>
          <div class="info-box">
            <div class="info-label">Enrollment No</div>
            <div class="info-value">${user?.enrollment_no || 'N/A'}</div>
          </div>
          <div class="info-box">
            <div class="info-label">UPI ID</div>
            <div class="info-value">${wallet?.upi_id || 'N/A'}</div>
          </div>
          <div class="info-box">
            <div class="info-label">Generated On</div>
            <div class="info-value">${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
          </div>
        </div>

        <div class="summary">
          <div class="summary-box balance">
            <div class="summary-label">Current Balance</div>
            <div class="summary-amount">₹${wallet?.balance?.toFixed(2) || '0.00'}</div>
          </div>
          <div class="summary-box debit">
            <div class="summary-label">Total Spent</div>
            <div class="summary-amount">₹${totalDebit.toFixed(2)}</div>
          </div>
          <div class="summary-box credit">
            <div class="summary-label">Total Received</div>
            <div class="summary-amount">₹${totalCredit.toFixed(2)}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Date & Time</th>
              <th>Description</th>
              <th>Type</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map((t, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${new Date(t.timestamp).toLocaleString('en-IN')}</td>
                <td>${t.direction === "credit" ? "Money Received" : (t.description || "Money Sent")}</td>
                <td>${t.direction === "credit" ? "Received" : (TYPE_LABELS[t.payment_type] || t.payment_type)}</td>
                <td class="${t.direction === 'debit' ? 'debit-row' : 'credit-row'}">
                  ${t.direction === 'debit' ? '-' : '+'}₹${t.amount?.toFixed(2)}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          This is a computer-generated statement from CampusPay — Poornima University<br/>
          For queries contact: campuspay@poornima.edu
        </div>
      </body>
      </html>
    `;

    const win = window.open('', '_blank');
    win.document.write(printContent);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      setGenerating(false);
    }, 500);
  };

  if (loading) return <div className="page-loading">Loading transactions...</div>;

  return (
    <div className="statement-page">
      <div className="statement-header">
        <div>
          <h2>Payment Statement</h2>
          <p>Download your transaction history as PDF</p>
        </div>
        <button className="download-btn" onClick={generatePDF} disabled={generating}>
          {generating ? '⏳ Generating...' : '📄 Download PDF'}
        </button>
      </div>

      {/* Filters */}
      <div className="statement-filters">
        <div className="filter-group">
          <label>Type</label>
          <select value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="all">All Transactions</option>
            <option value="debit">Debits Only</option>
            <option value="credit">Credits Only</option>
          </select>
        </div>
        <div className="filter-group">
          <label>From Date</label>
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
        </div>
        <div className="filter-group">
          <label>To Date</label>
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
        </div>
      </div>

      {/* Summary */}
      <div className="statement-summary">
        <div className="summary-card">
          <span className="summary-label">Current Balance</span>
          <span className="summary-val balance">₹{wallet?.balance?.toFixed(2)}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Total Spent</span>
          <span className="summary-val spent">₹{totalDebit.toFixed(2)}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Total Received</span>
          <span className="summary-val received">₹{totalCredit.toFixed(2)}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Transactions</span>
          <span className="summary-val">{filtered.length}</span>
        </div>
      </div>

      {/* Transaction table */}
      {filtered.length === 0 ? (
        <div className="no-txns">No transactions found</div>
      ) : (
        <div className="statement-table-wrap">
          <table className="statement-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Date & Time</th>
                <th>Description</th>
                <th>Type</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, i) => (
                <tr key={t.transaction_id}>
                  <td>{i + 1}</td>
                  <td>{new Date(t.timestamp).toLocaleString('en-IN')}</td>
                  <td>{t.description || t.payment_type}</td>
                  <td><span className="type-badge">{TYPE_LABELS[t.payment_type] || t.payment_type}</span></td>
                  <td className={t.direction === 'debit' ? 'debit' : 'credit'}>
                    {t.direction === 'debit' ? '-' : '+'}₹{t.amount?.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
