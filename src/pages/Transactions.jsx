import { useEffect, useState } from 'react';
import API from '../api/axios';
import './Transactions.css';

const TYPE_LABELS = {
  exam_fee: 'Exam Fee', back_fee: 'Back Fee', event_fee: 'Event',
  canteen: 'Canteen', library_fine: 'Library', wallet_topup: 'Top-up', other: 'Other'
};

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    API.get('/api/transaction/history?limit=50')
      .then(res => setTransactions(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all'
    ? transactions
    : transactions.filter(t => t.direction === filter);

  return (
    <div className="txn-page">
      <div className="txn-header">
        <h2>Transaction History</h2>
        <div className="txn-filters">
          {['all', 'debit', 'credit'].map(f => (
            <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="page-loading">Loading transactions...</div>
      ) : filtered.length === 0 ? (
        <div className="txn-empty">No transactions found</div>
      ) : (
        <div className="txn-list">
          {filtered.map(txn => (
            <div key={txn.transaction_id} className="txn-item">
              <div className="txn-left">
                <span className={`txn-dot ${txn.direction}`} />
                <div>
                  <div className="txn-type">{TYPE_LABELS[txn.payment_type] || txn.payment_type}</div>
                  <div className="txn-upi">{txn.direction === 'debit' ? `To: ${txn.receiver_upi}` : `From: ${txn.sender_id?.slice(0, 8)}...`}</div>
                  <div className="txn-date">{new Date(txn.timestamp).toLocaleString()}</div>
                </div>
              </div>
              <div className={`txn-amount ${txn.direction}`}>
                {txn.direction === 'debit' ? '-' : '+'}₹{txn.amount?.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
