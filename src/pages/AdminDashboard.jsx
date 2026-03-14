import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import API from '../api/axios';
import './AdminDashboard.css';

const TYPE_LABELS = {
  exam_fee: 'Exam Fee', back_fee: 'Back Fee', event_fee: 'Event Fee',
  canteen: 'Canteen', library_fine: 'Library Fine',
  wallet_topup: 'Top-up', other: 'Other'
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [txnFilter, setTxnFilter] = useState('all');
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (user?.role === 'admin') fetchAll();
  }, [user]);

  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, txnsRes] = await Promise.all([
        API.get('/api/admin/stats'),
        API.get('/api/admin/users'),
        API.get('/api/admin/transactions?limit=100')
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setTransactions(txnsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUser = async (uid, isActive) => {
    try {
      if (isActive) {
        await API.patch(`/api/admin/users/${uid}/deactivate`);
      } else {
        await API.patch(`/api/admin/users/${uid}/activate`);
      }
      setStatus({ type: 'success', msg: `User ${isActive ? 'deactivated' : 'activated'} successfully` });
      fetchAll();
    } catch (err) {
      setStatus({ type: 'error', msg: err.response?.data?.detail || 'Action failed.' });
    }
  };

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.enrollment_no?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredTxns = transactions.filter(t =>
    txnFilter === 'all' || t.payment_type === txnFilter
  );

  const totalRevenue = transactions.reduce((s, t) =>
    t.payment_type !== 'wallet_topup' ? s + t.amount : s, 0
  );

  if (loading) return <div className="page-loading">Loading admin data...</div>;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h2>🛠️ Admin Dashboard</h2>
          <p>Poornima University — CampusPay Management</p>
        </div>
        <button className="refresh-btn" onClick={fetchAll}>🔄 Refresh</button>
      </div>

      {status && (
        <div className={`admin-status ${status.type}`}>
          {status.type === 'success' ? '✅' : '❌'} {status.msg}
        </div>
      )}

      <div className="admin-tabs">
        {[
          { id: 'overview',     label: '📊 Overview' },
          { id: 'users',        label: '👥 Students' },
          { id: 'transactions', label: '💳 Transactions' },
        ].map(tab => (
          <button
            key={tab.id}
            className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && stats && (
        <div className="overview-content">
          <div className="stats-grid">
            {[
              { label: 'Total Students',     value: stats.total_users,             icon: '👥', color: 'blue' },
              { label: 'Total Transactions', value: stats.total_transactions,      icon: '💳', color: 'purple' },
              { label: 'Total Revenue',      value: `₹${totalRevenue.toFixed(2)}`, icon: '💰', color: 'green' },
              { label: 'Pending Payments',   value: stats.pending_payments,        icon: '⏳', color: 'amber' },
            ].map(stat => (
              <div key={stat.label} className={`stat-card ${stat.color}`}>
                <span className="stat-icon">{stat.icon}</span>
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="breakdown-section">
            <h3>Payment Breakdown</h3>
            <div className="breakdown-grid">
              {Object.entries(
                transactions.reduce((acc, t) => {
                  const type = t.payment_type || 'other';
                  acc[type] = (acc[type] || 0) + t.amount;
                  return acc;
                }, {})
              ).map(([type, amount]) => (
                <div key={type} className="breakdown-item">
                  <span className="breakdown-type">{TYPE_LABELS[type] || type}</span>
                  <span className="breakdown-amount">₹{amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="recent-section">
            <h3>Recent Transactions</h3>
            <div className="recent-list">
              {transactions.slice(0, 8).map(t => (
                <div key={t.transaction_id} className="recent-item">
                  <div className="recent-left">
                    <span className="recent-type">{TYPE_LABELS[t.payment_type] || t.payment_type}</span>
                    <span className="recent-desc">{t.description?.slice(0, 40)}</span>
                  </div>
                  <div className="recent-right">
                    <span className="recent-amount">₹{t.amount?.toFixed(2)}</span>
                    <span className="recent-date">{new Date(t.timestamp).toLocaleDateString('en-IN')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="users-content">
          <div className="users-toolbar">
            <input
              type="text"
              placeholder="🔍 Search by name, email or enrollment..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="search-input"
            />
            <span className="user-count">{filteredUsers.length} students</span>
          </div>
          <div className="users-table-wrap">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Student</th><th>Enrollment</th><th>Email</th>
                  <th>Phone</th><th>Status</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.filter(u => u.role === 'student').map(u => (
                  <tr key={u.uid}>
                    <td><div className="user-cell"><span className="user-avatar">{u.avatar || '👨‍🎓'}</span><span>{u.name}</span></div></td>
                    <td>{u.enrollment_no || '—'}</td>
                    <td>{u.email}</td>
                    <td>{u.phone || '—'}</td>
                    <td><span className={`status-badge ${u.is_active ? 'active' : 'inactive'}`}>{u.is_active ? '✅ Active' : '❌ Inactive'}</span></td>
                    <td>
                      <button className={`toggle-btn ${u.is_active ? 'deactivate' : 'activate'}`}
                        onClick={() => handleToggleUser(u.uid, u.is_active)}>
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="txns-content">
          <div className="txns-toolbar">
            <select value={txnFilter} onChange={e => setTxnFilter(e.target.value)} className="txn-filter">
              <option value="all">All Types</option>
              {Object.entries(TYPE_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
            <span className="user-count">{filteredTxns.length} transactions</span>
          </div>
          <div className="users-table-wrap">
            <table className="users-table">
              <thead>
                <tr><th>Date</th><th>From</th><th>To</th><th>Type</th><th>Amount</th><th>Status</th></tr>
              </thead>
              <tbody>
                {filteredTxns.map(t => (
                  <tr key={t.transaction_id}>
                    <td>{new Date(t.timestamp).toLocaleDateString('en-IN')}</td>
                    <td className="upi-cell">{t.sender_upi || t.sender_id?.slice(0, 8)}</td>
                    <td className="upi-cell">{t.receiver_upi}</td>
                    <td><span className="type-pill">{TYPE_LABELS[t.payment_type] || t.payment_type}</span></td>
                    <td className="amount-cell">₹{t.amount?.toFixed(2)}</td>
                    <td><span className="status-badge active">✅ {t.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
