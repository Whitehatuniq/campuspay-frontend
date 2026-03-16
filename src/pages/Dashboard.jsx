import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import './Dashboard.css';

export default function Dashboard() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [walletRes, summaryRes] = await Promise.all([
          API.get('/api/wallet/balance'),
          API.get('/api/transaction/summary/monthly'),
        ]);
        setWallet(walletRes.data);
        setSummary(summaryRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="page-loading">Loading...</div>;

  return (
    <div className="dashboard">
      <div className="dash-header">
        <div>
          <h1>Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="sub">{user?.enrollment_no || user?.email}</p>
        </div>
      </div>

      {/* Wallet Card */}
      <div className="wallet-card">
        <div className="wallet-top">
          <span className="wallet-label">Wallet Balance</span>
          <span className="wallet-upi">{wallet?.upi_id}</span>
        </div>
        <div className="wallet-balance">₹{wallet?.balance?.toFixed(2) || '0.00'}</div>
        <Link to="/add-money" className="add-money-btn">+ Add Money</Link>
      </div>

      {/* Quick Actions */}
      <div className="section-title">Quick Actions</div>
      <div className="quick-actions">
        {[
          { label: 'Send Money',  icon: '💸', path: '/pay' },
          { label: 'Transport',    icon: '🚌', path: '/transport' },
          { label: 'Campus Fee',   icon: '📝', path: '/campus-fee' },
          { label: 'Events',  icon: '🎪', path: '/events' },
          { label: 'Canteen',    icon: '🍽️', path: '/canteen' },
          { label: 'History',    icon: '📋', path: '/transactions' },
          { label: 'Add Money',  icon: '💰', path: '/add-money' },
        ].map(action => (
          <Link key={action.path} to={action.path} className="action-card">
            <span className="action-icon">{action.icon}</span>
            <span className="action-label">{action.label}</span>
          </Link>
        ))}
      </div>

      {/* Monthly Summary */}
      {summary && (
        <>
          <div className="section-title">This Month</div>
          <div className="summary-grid">
            <div className="summary-card spent">
              <span className="summary-label">Total Spent</span>
              <span className="summary-amount">₹{summary.total_spent?.toFixed(2)}</span>
            </div>
            <div className="summary-card received">
              <span className="summary-label">Total Received</span>
              <span className="summary-amount">₹{summary.total_received?.toFixed(2)}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
