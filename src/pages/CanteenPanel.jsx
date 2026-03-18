import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import { ShoppingBag, CheckCircle, Clock, Truck, Bell, TrendingUp, RefreshCw, ChevronDown, ChevronUp, ToggleLeft, ToggleRight, LogOut } from 'lucide-react';
import './CanteenPanel.css';

const STATUS_CONFIG = {
  pending:   { label: 'New Order',  color: '#f59e0b', bg: '#78350f22', next: 'preparing', nextLabel: 'Start Preparing', icon: Clock },
  preparing: { label: 'Preparing',  color: '#38bdf8', bg: '#0c274422', next: 'ready',     nextLabel: 'Mark Ready',      icon: RefreshCw },
  ready:     { label: 'Ready',      color: '#22c55e', bg: '#14532d22', next: 'delivered', nextLabel: 'Delivered',        icon: CheckCircle },
  delivered: { label: 'Delivered',  color: '#64748b', bg: '#1e293b',   next: null,        nextLabel: null,               icon: Truck },
};

export default function CanteenPanel() {
  const { user, logout }        = useAuth();
  const [orders, setOrders]     = useState([]);
  const [menu, setMenu]         = useState([]);
  const [tab, setTab]           = useState('orders');
  const [filter, setFilter]     = useState('all');
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [newCount, setNewCount] = useState(0);
  const [earnings, setEarnings] = useState({ today: 0, count: 0 });
  const [alerting, setAlerting] = useState(false);
  const prevCount               = useRef(0);
  const pollRef                 = useRef(null);
  const canteenId               = user?.canteen_id || '';

  useEffect(() => {
    loadOrders(); loadMenu();
    pollRef.current = setInterval(loadOrders, 5000);
    return () => clearInterval(pollRef.current);
  }, []);

  const playAlert = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      // Louder and longer alert sound
      [0, 0.15, 0.3].forEach(d => {
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.frequency.value = 880;
        g.gain.setValueAtTime(0.8, ctx.currentTime + d);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + d + 0.4);
        o.start(ctx.currentTime + d); o.stop(ctx.currentTime + d + 0.2);
      });
    } catch(e) {}
  };

  const loadOrders = async () => {
    try {
      const res = await API.get(`/api/canteen/orders/canteen/${canteenId}`);
      const data = res.data || [];
      setOrders(data);
      const pending = data.filter(o => o.status === 'pending').length;
      setNewCount(pending);
      if (pending > prevCount.current) { setAlerting(true); playAlert(); setTimeout(() => setAlerting(false), 3000); }
      prevCount.current = pending;
      const today = new Date().toISOString().split('T')[0];
      const todayOrders = data.filter(o => o.created_at?.startsWith(today));
      setEarnings({ today: todayOrders.reduce((s,o) => s + (o.total_amount||0), 0), count: todayOrders.length });
    } catch(e) {}
    setLoading(false);
  };

  const loadMenu = async () => {
    try {
      const res = await API.get(`/api/canteen/${canteenId}/menu`);
      setMenu(res.data?.all_items || []);
    } catch(e) {}
  };

  const updateStatus = async (orderId, status) => {
    try {
      await API.patch(`/api/canteen/orders/${orderId}/status`, { status });
      setOrders(prev => prev.map(o => o.order_id === orderId ? { ...o, status } : o));
      if (status !== 'pending') { prevCount.current = Math.max(0, prevCount.current - 1); setNewCount(c => Math.max(0, c-1)); }
    } catch(e) { alert('Failed'); }
  };

  const toggleMenu = async (itemId, cur) => {
    try {
      await API.patch(`/api/canteen/menu/${itemId}/toggle`);
      setMenu(prev => prev.map(i => i.item_id === itemId ? { ...i, is_available: !cur } : i));
    } catch(e) {}
  };

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);
  const timeAgo = (iso) => {
    const d = Math.floor((Date.now() - new Date(iso)) / 60000);
    if (d < 1) return 'just now'; if (d < 60) return d+'m ago'; return Math.floor(d/60)+'h ago';
  };

  return (
    <div className="cp-page">
      {alerting && <div className="cp-alert-overlay"><div className="cp-alert-box"><Bell size={32} color="#f59e0b" /><span>New Order!</span></div></div>}
      <div className="cp-header">
        <div className="cp-header-left">
          <div className="cp-avatar">🍽️</div>
          <div><h1>{user?.canteen_name || 'Canteen Panel'}</h1><p>{user?.email}</p></div>
        </div>
        <div className="cp-header-right">
          <div className={`cp-live-badge ${newCount > 0 ? 'has-orders' : ''}`}><span className="cp-live-dot" />{newCount > 0 ? `${newCount} New` : 'Live'}</div>
          <button className="cp-refresh-btn" onClick={loadOrders}><RefreshCw size={15} className={loading ? 'spinning' : ''} /></button>
          <button className="cp-logout-btn" onClick={logout}><LogOut size={15} /></button>
        </div>
      </div>

      <div className="cp-stats">
        <div className="cp-stat"><ShoppingBag size={18} color="#38bdf8" /><div><div className="cp-stat-val">{earnings.count}</div><div className="cp-stat-label">Today Orders</div></div></div>
        <div className="cp-stat"><TrendingUp size={18} color="#22c55e" /><div><div className="cp-stat-val">₹{earnings.today}</div><div className="cp-stat-label">Today Earnings</div></div></div>
        <div className="cp-stat"><Clock size={18} color="#f59e0b" /><div><div className="cp-stat-val" style={{ color: newCount > 0 ? '#f59e0b' : '#f1f5f9' }}>{newCount}</div><div className="cp-stat-label">Pending</div></div></div>
        <div className="cp-stat"><CheckCircle size={18} color="#a78bfa" /><div><div className="cp-stat-val">{orders.filter(o => o.status === 'delivered').length}</div><div className="cp-stat-label">Delivered</div></div></div>
      </div>

      <div className="cp-tabs">
        {[{ id:'orders', label:'Orders', badge: newCount }, { id:'menu', label:'Menu' }].map(t => (
          <button key={t.id} className={`cp-tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            {t.label}{t.badge > 0 && <span className="cp-tab-badge">{t.badge}</span>}
          </button>
        ))}
      </div>

      {tab === 'orders' && (
        <div className="cp-orders-section">
          <div className="cp-filter-row">
            {['all','pending','preparing','ready','delivered'].map(f => (
              <button key={f} className={`cp-filter-pill ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                {f === 'all' ? `All (${orders.length})` : `${f.charAt(0).toUpperCase()+f.slice(1)} (${orders.filter(o=>o.status===f).length})`}
              </button>
            ))}
          </div>
          {loading ? <div className="cp-loading"><div className="cp-spinner" /></div>
          : filtered.length === 0 ? <div className="cp-empty"><ShoppingBag size={40} color="#334155" /><p>No orders yet</p></div>
          : <div className="cp-order-list">
              {filtered.map(order => {
                const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                const Icon = cfg.icon;
                return (
                  <div key={order.order_id} className={`cp-order-card ${order.status === 'pending' ? 'new-order' : ''}`} style={{ '--status-color': cfg.color }}>
                    <div className="cp-order-header" onClick={() => setExpanded(expanded === order.order_id ? null : order.order_id)}>
                      <div className="cp-order-id-wrap"><span className="cp-order-id">#{order.order_id}</span><span className="cp-order-time">{timeAgo(order.created_at)}</span></div>
                      <div className="cp-order-header-right">
                        <span className="cp-order-status-pill" style={{ color: cfg.color, background: cfg.bg }}><Icon size={12} /> {cfg.label}</span>
                        <span className="cp-order-amount">₹{order.total_amount}</span>
                        {expanded === order.order_id ? <ChevronUp size={16} color="#64748b" /> : <ChevronDown size={16} color="#64748b" />}
                      </div>
                    </div>
                    <div className="cp-customer-row">
                      <div className="cp-customer-avatar">{(order.user_name||'S').charAt(0).toUpperCase()}</div>
                      <div><div className="cp-customer-name">{order.user_name}</div><div className="cp-customer-email">{order.user_email}</div></div>
                      <div className="cp-payment-badge">✅ Paid</div>
                    </div>
                    {expanded === order.order_id && (
                      <div className="cp-order-items">
                        {(order.items||[]).map((item,i) => (
                          <div key={i} className="cp-order-item">
                            <span className="cp-item-emoji">{item.emoji||'🍽️'}</span>
                            <span className="cp-item-name">{item.name}</span>
                            <span className="cp-item-qty">×{item.qty}</span>
                            <span className="cp-item-price">₹{item.subtotal}</span>
                          </div>
                        ))}
                        <div className="cp-order-total"><span>Total</span><span>₹{order.total_amount}</span></div>
                      </div>
                    )}
                    {cfg.next && <button className="cp-action-btn" style={{ background: cfg.color }} onClick={() => updateStatus(order.order_id, cfg.next)}>{cfg.nextLabel}</button>}
                  </div>
                );
              })}
            </div>}
        </div>
      )}

      {tab === 'menu' && (
        <div className="cp-menu-section">
          <div className="cp-menu-info">Toggle items to enable/disable from student app</div>
          <div className="cp-menu-list">
            {menu.map(item => (
              <div key={item.item_id} className={`cp-menu-item ${!item.is_available ? 'disabled' : ''}`}>
                <span className="cp-menu-emoji">{item.emoji||'🍽️'}</span>
                <div className="cp-menu-info-col"><span className="cp-menu-name">{item.name}</span><span className="cp-menu-cat">{item.category} · ₹{item.price}</span></div>
                <button className="cp-toggle-btn" onClick={() => toggleMenu(item.item_id, item.is_available)}>
                  {item.is_available ? <ToggleRight size={28} color="#22c55e" /> : <ToggleLeft size={28} color="#475569" />}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
