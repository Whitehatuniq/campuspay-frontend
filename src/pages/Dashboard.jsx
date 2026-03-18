import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import {
  Wallet, Send, Plus, Clock, GraduationCap, CalendarDays,
  UtensilsCrossed, Bus, TrendingUp, TrendingDown, ArrowUpRight,
  ArrowDownLeft, QrCode, FileText, RefreshCw, ChevronRight,
  ShoppingBag, CreditCard, Zap
} from 'lucide-react';
import './Dashboard.css';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

const TX_ICONS = {
  canteen:   { icon: UtensilsCrossed, color: '#fbbf24', bg: '#78350f22' },
  exam_fee:  { icon: GraduationCap,   color: '#f472b6', bg: '#83185722' },
  event_fee: { icon: CalendarDays,    color: '#34d399', bg: '#06402422' },
  other:     { icon: Send,            color: '#38bdf8', bg: '#0c4a6e22' },
  credit:    { icon: ArrowDownLeft,   color: '#22c55e', bg: '#14532d22' },
};

const getTxMeta = (tx) => {
  if (tx.direction === 'credit') return TX_ICONS.credit;
  return TX_ICONS[tx.payment_type] || TX_ICONS.other;
};

export default function Dashboard() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const [balance,      setBalance]      = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [summary,      setSummary]      = useState({ spent: 0, received: 0 });
  const [loading,      setLoading]      = useState(true);
  const [balanceHidden, setBalanceHidden] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [walletRes, txRes] = await Promise.all([
        API.get('/api/wallet/balance'),
        API.get('/api/transaction/history?limit=6'),
      ]);
      setBalance(walletRes.data.balance || 0);
      const txs = txRes.data.transactions || txRes.data || [];
      setTransactions(txs);
      const spent    = txs.filter(t => t.direction === 'debit').reduce((s, t) => s + t.amount, 0);
      const received = txs.filter(t => t.direction === 'credit').reduce((s, t) => s + t.amount, 0);
      setSummary({ spent, received });
    } catch(e) {}
    setLoading(false);
  };

  const QUICK = [
    { label: 'Add Money',  icon: Plus,            path: '/add-money',  color: '#22c55e', bg: '#14532d22' },
    { label: 'Send Money', icon: Send,            path: '/pay',        color: '#38bdf8', bg: '#0c4a6e22' },
    { label: 'Scan QR',    icon: QrCode,          path: '/qr-scanner', color: '#a78bfa', bg: '#4c1d9522' },
    { label: 'Transport',  icon: Bus,             path: '/transport',  color: '#fb923c', bg: '#7c2d1222' },
    { label: 'Campus Fee', icon: GraduationCap,   path: '/campus-fee', color: '#f472b6', bg: '#83185722' },
    { label: 'Events',     icon: CalendarDays,    path: '/events',     color: '#34d399', bg: '#06402422' },
    { label: 'Canteen',    icon: UtensilsCrossed, path: '/canteen',    color: '#fbbf24', bg: '#78350f22' },
    { label: 'Statement',  icon: FileText,        path: '/statement',  color: '#94a3b8', bg: '#1e293b'   },
  ];

  const formatDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso.endsWith('Z') ? iso : iso + 'Z');
    const now = new Date();
    const diff = Math.floor((now - d) / 86400000);
    if (diff === 0) return 'Today, ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    if (diff === 1) return 'Yesterday';
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const getDesc = (tx) => {
    if (tx.direction === 'credit') return tx.description || 'Money Received';
    const labels = { canteen: 'Canteen Order', exam_fee: 'Campus Fee', event_fee: 'Event Fee', other: tx.description || 'Transfer' };
    return labels[tx.payment_type] || tx.description || 'Payment';
  };

  return (
    <div className="db-page">
      {/* BG glow */}
      <div className="db-bg-glow" />

      {/* Header */}
      <div className="db-header">
        <div className="db-header-left">
          <div className="db-avatar">{user?.name?.charAt(0)?.toUpperCase() || 'S'}</div>
          <div>
            <p className="db-greeting">{getGreeting()}, {user?.name?.split(' ')[0] || 'Student'} 👋</p>
            <p className="db-sub">Here's your campus wallet</p>
          </div>
        </div>
        <button className="db-refresh" onClick={loadData}>
          <RefreshCw size={15} className={loading ? 'spinning' : ''} />
        </button>
      </div>

      {/* Balance Card */}
      <div className="db-balance-card">
        <div className="db-balance-card-bg" />
        <div className="db-balance-top">
          <div className="db-balance-label">
            <Wallet size={15} color="#38bdf8" />
            <span>Campus Wallet</span>
          </div>
          <button className="db-hide-btn" onClick={() => setBalanceHidden(h => !h)}>
            {balanceHidden ? '👁' : '🙈'}
          </button>
        </div>

        <div className="db-balance-amount">
          {loading ? (
            <div className="db-skeleton-amount" />
          ) : balanceHidden ? (
            <span className="db-balance-hidden">₹ ••••••</span>
          ) : (
            <span>₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          )}
        </div>

        {user?.upi_id && <div className="db-upi-id">{user.upi_id}</div>}

        <div className="db-balance-stats">
          <div className="db-stat">
            <div className="db-stat-icon received"><TrendingDown size={13} /></div>
            <div>
              <div className="db-stat-label">Received</div>
              <div className="db-stat-val received">+₹{summary.received.toLocaleString()}</div>
            </div>
          </div>
          <div className="db-stat-divider" />
          <div className="db-stat">
            <div className="db-stat-icon spent"><TrendingUp size={13} /></div>
            <div>
              <div className="db-stat-label">Spent</div>
              <div className="db-stat-val spent">-₹{summary.spent.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Quick pay buttons */}
        <div className="db-quick-pay">
          <button className="db-qp-btn" onClick={() => navigate('/add-money')}>
            <Plus size={16} /> Add Money
          </button>
          <button className="db-qp-btn secondary" onClick={() => navigate('/pay')}>
            <Send size={16} /> Send
          </button>
          <button className="db-qp-btn secondary" onClick={() => navigate('/qr-scanner')}>
            <QrCode size={16} /> Scan
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="db-section-header">
        <span className="db-section-title">Quick Actions</span>
      </div>

      <div className="db-quick-grid">
        {QUICK.map(({ label, icon: Icon, path, color, bg }) => (
          <button key={path} className="db-quick-btn" onClick={() => navigate(path)}
            style={{ '--c': color, '--bg': bg }}>
            <div className="db-quick-icon">
              <Icon size={20} color={color} strokeWidth={1.8} />
            </div>
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Recent Transactions */}
      <div className="db-section-header">
        <span className="db-section-title">Recent Transactions</span>
        <button className="db-see-all" onClick={() => navigate('/transactions')}>
          See all <ChevronRight size={14} />
        </button>
      </div>

      <div className="db-tx-card">
        {loading ? (
          [1,2,3].map(i => <div key={i} className="db-tx-skeleton" />)
        ) : transactions.length === 0 ? (
          <div className="db-tx-empty">
            <div className="db-tx-empty-icon"><Clock size={28} color="#334155" /></div>
            <p>No transactions yet</p>
            <span>Your payments will appear here</span>
          </div>
        ) : (
          transactions.map((tx, i) => {
            const meta = getTxMeta(tx);
            const Icon = meta.icon;
            const isCredit = tx.direction === 'credit';
            return (
              <div key={i} className="db-tx-item" style={{ animationDelay: `${i * 0.06}s` }}>
                <div className="db-tx-icon" style={{ background: meta.bg, color: meta.color }}>
                  <Icon size={16} strokeWidth={1.8} />
                </div>
                <div className="db-tx-info">
                  <div className="db-tx-desc">{getDesc(tx)}</div>
                  <div className="db-tx-meta">
                    {isCredit
                      ? <span className="db-tx-from">from {tx.sender_upi || 'Transfer'}</span>
                      : <span className="db-tx-to">to {tx.receiver_upi || 'Payment'}</span>
                    }
                    <span className="db-tx-dot">·</span>
                    <span className="db-tx-time">{formatDate(tx.created_at || tx.timestamp)}</span>
                  </div>
                </div>
                <div className={`db-tx-amount ${isCredit ? 'credit' : 'debit'}`}>
                  {isCredit ? '+' : '-'}₹{tx.amount?.toLocaleString('en-IN')}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
