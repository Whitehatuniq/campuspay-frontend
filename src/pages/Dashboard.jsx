import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import {
  Wallet, Send, Plus, Clock, GraduationCap, CalendarDays,
  UtensilsCrossed, Bus, TrendingUp, TrendingDown, ArrowUpRight,
  ArrowDownLeft, QrCode, FileText, RefreshCw
} from 'lucide-react';
import './Dashboard.css';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ spent: 0, received: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [walletRes, txRes] = await Promise.all([
        API.get('/api/wallet/balance'),
        API.get('/api/transaction/history?limit=5'),
      ]);
      setBalance(walletRes.data.balance || 0);
      setTransactions(txRes.data.transactions || []);

      const spent    = (txRes.data.transactions || []).filter(t => t.direction === 'debit').reduce((s, t) => s + t.amount, 0);
      const received = (txRes.data.transactions || []).filter(t => t.direction === 'credit').reduce((s, t) => s + t.amount, 0);
      setSummary({ spent, received });
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const quickActions = [
    { label: 'Add Money',   icon: Plus,            path: '/add-money',   color: '#22c55e', bg: '#14532d22' },
    { label: 'Send Money',  icon: Send,            path: '/pay',         color: '#38bdf8', bg: '#0c4a6e22' },
    { label: 'Scan QR',     icon: QrCode,          path: '/qr-scanner',  color: '#a78bfa', bg: '#4c1d9522' },
    { label: 'Transport',   icon: Bus,             path: '/transport',   color: '#fb923c', bg: '#7c2d1222' },
    { label: 'Campus Fee',  icon: GraduationCap,   path: '/campus-fee',  color: '#f472b6', bg: '#83185722' },
    { label: 'Events',      icon: CalendarDays,    path: '/events',      color: '#34d399', bg: '#06402422' },
    { label: 'Canteen',     icon: UtensilsCrossed, path: '/canteen',     color: '#fbbf24', bg: '#78350f22' },
    { label: 'Statement',   icon: FileText,        path: '/statement',   color: '#94a3b8', bg: '#1e293b' },
  ];

  const txIcon = (type) => type === 'credit'
    ? <ArrowDownLeft size={16} color="#22c55e" />
    : <ArrowUpRight size={16} color="#ef4444" />;

  return (
    <div className="dashboard-page">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <p className="dashboard-greeting">Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋</p>
          <p className="dashboard-sub">Here's your campus wallet overview</p>
        </div>
        <button className="refresh-btn" onClick={loadData}>
          <RefreshCw size={15} className={loading ? 'spinning' : ''} />
        </button>
      </div>

      {/* Balance Card */}
      <div className="balance-card">
        <div className="balance-card-top">
          <div className="balance-label">
            <Wallet size={16} color="#38bdf8" />
            <span>Campus Wallet</span>
          </div>
          <span className="upi-id">{user?.upi_id || '—'}</span>
        </div>
        <div className="balance-amount">
          {loading ? <div className="balance-skeleton" /> : `₹${balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
        </div>
        <div className="balance-stats">
          <div className="balance-stat">
            <TrendingDown size={14} color="#22c55e" />
            <span className="stat-label">Received</span>
            <span className="stat-value received">+₹{summary.received.toLocaleString()}</span>
          </div>
          <div className="balance-stat-divider" />
          <div className="balance-stat">
            <TrendingUp size={14} color="#ef4444" />
            <span className="stat-label">Spent</span>
            <span className="stat-value spent">-₹{summary.spent.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="section-title">Quick Actions</div>
      <div className="quick-actions">
        {quickActions.map(({ label, icon: Icon, path, color, bg }) => (
          <button key={path} className="quick-action-btn" onClick={() => navigate(path)} style={{ '--action-color': color, '--action-bg': bg }}>
            <div className="quick-action-icon">
              <Icon size={22} color={color} strokeWidth={1.8} />
            </div>
            <span className="quick-action-label">{label}</span>
          </button>
        ))}
      </div>

      {/* Recent Transactions */}
      <div className="section-title">Recent Transactions</div>
      {loading ? (
        <div className="tx-skeleton-list">
          {[1,2,3].map(i => <div key={i} className="tx-skeleton" />)}
        </div>
      ) : transactions.length === 0 ? (
        <div className="empty-tx">
          <Clock size={32} color="#334155" />
          <p>No transactions yet</p>
        </div>
      ) : (
        <div className="tx-list">
          {transactions.map((tx, i) => (
            <div key={i} className="tx-item">
              <div className={`tx-icon-wrap ${tx.type}`}>
                {txIcon(tx.type)}
              </div>
              <div className="tx-info">
                <div className="tx-desc">{tx.description || (tx.direction === 'credit' ? 'Money Received' : 'Money Sent')}</div>
                <div className="tx-date">{new Date(tx.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
              </div>
              <div className={`tx-amount ${tx.type}`}>
                {tx.direction === 'credit' ? '+' : '-'}₹{tx.amount.toLocaleString()}
              </div>
            </div>
          ))}
          <button className="view-all-btn" onClick={() => navigate('/transactions')}>
            View All Transactions
          </button>
        </div>
      )}
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
}
