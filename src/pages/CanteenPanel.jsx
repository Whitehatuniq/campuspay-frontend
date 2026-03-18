import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import {
  ShoppingBag, CheckCircle, Clock, Truck, Bell,
  TrendingUp, RefreshCw, ChevronDown, ChevronUp,
  ToggleLeft, ToggleRight, LogOut, Star, Zap,
  AlertCircle, Package, Coffee, Timer
} from 'lucide-react';
import './CanteenPanel.css';

const STATUS = {
  pending:   { label: 'New Order',  color: '#f59e0b', bg: '#f59e0b15', glow: '#f59e0b33', next: 'preparing', nextLabel: '👨‍🍳 Start Preparing', icon: Clock },
  preparing: { label: 'Preparing',  color: '#38bdf8', bg: '#38bdf815', glow: '#38bdf833', next: 'ready',     nextLabel: '✅ Mark Ready',       icon: Timer },
  ready:     { label: 'Ready! 🎉',  color: '#22c55e', bg: '#22c55e15', glow: '#22c55e33', next: 'delivered', nextLabel: '🛵 Mark Delivered',    icon: CheckCircle },
  delivered: { label: 'Delivered',  color: '#64748b', bg: '#64748b15', glow: 'transparent', next: null, nextLabel: null, icon: Truck },
};

// ── Sound engine ────────────────────────────────────────────────────
function playSound(type) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx  = new AudioCtx();
    const gain = ctx.createGain();
    gain.connect(ctx.destination);

    const notes = type === 'newOrder'
      ? [{ f: 523, t: 0 }, { f: 659, t: 0.15 }, { f: 784, t: 0.3 }, { f: 1047, t: 0.45 }]
      : [{ f: 440, t: 0 }, { f: 550, t: 0.12 }];

    notes.forEach(({ f, t }) => {
      const osc = ctx.createOscillator();
      osc.connect(gain);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, ctx.currentTime + t);
      gain.gain.setValueAtTime(0, ctx.currentTime + t);
      gain.gain.linearRampToValueAtTime(0.6, ctx.currentTime + t + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.35);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + 0.4);
    });
  } catch(e) { console.log('Sound error:', e); }
}

export default function CanteenPanel() {
  const { user, logout }          = useAuth();
  const [orders, setOrders]       = useState([]);
  const [menu,   setMenu]         = useState([]);
  const [tab,    setTab]          = useState('orders');
  const [filter, setFilter]       = useState('active');
  const [loading, setLoading]     = useState(true);
  const [expanded, setExpanded]   = useState(null);
  const [newOrders, setNewOrders] = useState([]);
  const [alerting, setAlerting]   = useState(false);
  const [stats, setStats]         = useState({ today: 0, earnings: 0, pending: 0, delivered: 0 });
  const prevIds   = useRef(new Set());
  const pollRef   = useRef(null);
  const canteenId = user?.canteen_id || '';

  const calcStats = useCallback((data) => {
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = data.filter(o => o.created_at?.startsWith(today));
    setStats({
      today:     todayOrders.length,
      earnings:  todayOrders.reduce((s, o) => s + (o.total_amount || 0), 0),
      pending:   data.filter(o => o.status === 'pending').length,
      delivered: data.filter(o => o.status === 'delivered').length,
    });
  }, []);

  const loadOrders = useCallback(async () => {
    try {
      const res  = await API.get(`/api/canteen/orders/today/${canteenId}`);
      const data = res.data || [];

      // Detect truly new orders
      const incoming = data.filter(o => o.status === 'pending' && !prevIds.current.has(o.order_id));
      if (incoming.length > 0) {
        playSound('newOrder');
        setNewOrders(incoming.map(o => o.order_id));
        setAlerting(true);
        incoming.forEach(o => prevIds.current.add(o.order_id));
        setTimeout(() => { setAlerting(false); setNewOrders([]); }, 4000);
      } else {
        data.forEach(o => prevIds.current.add(o.order_id));
      }

      setOrders(data);
      calcStats(data);
    } catch(e) {}
    setLoading(false);
  }, [canteenId, calcStats]);

  useEffect(() => {
    loadOrders();
    loadMenu();
    pollRef.current = setInterval(loadOrders, 5000);
    return () => clearInterval(pollRef.current);
  }, [loadOrders]);

  const loadMenu = async () => {
    try {
      const res = await API.get(`/api/canteen/${canteenId}/menu`);
      setMenu(res.data?.all_items || []);
    } catch(e) {}
  };

  const updateStatus = async (orderId, status) => {
    try {
      await API.patch(`/api/canteen/orders/${orderId}/status`, { status });
      playSound('action');
      setOrders(prev => prev.map(o => o.order_id === orderId ? { ...o, status } : o));
      calcStats(orders.map(o => o.order_id === orderId ? { ...o, status } : o));
    } catch(e) { alert('Failed to update'); }
  };

  const toggleMenu = async (itemId, cur) => {
    try {
      const toggleRes = await API.patch(`/api/canteen/menu/${itemId}/toggle`);
      const newAvail = toggleRes.data?.is_available;
      setMenu(prev => prev.map(i => i.item_id === itemId ? { ...i, is_available: newAvail !== undefined ? newAvail : !cur } : i));
    } catch(e) {}
  };

  const filteredOrders = filter === 'active'
    ? orders.filter(o => ['pending','preparing','ready'].includes(o.status))
    : filter === 'all' ? orders
    : orders.filter(o => o.status === filter);

  const timeAgo = (iso) => {
    if (!iso) return '';
    // Parse UTC time correctly
    const date = new Date(iso.endsWith('Z') ? iso : iso + 'Z');
    const d = Math.floor((Date.now() - date.getTime()) / 60000);
    if (d < 1)    return 'just now';
    if (d < 60)   return d + ' min ago';
    if (d < 1440) return Math.floor(d/60) + ' hr ago';
    return Math.floor(d/1440) + ' day ago';
  };

  const formatTime = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="cp-page">
      {/* New order alert overlay */}
      {alerting && (
        <div className="cp-alert-overlay">
          <div className="cp-alert-box">
            <div className="cp-alert-icon"><Bell size={24} /></div>
            <div>
              <div className="cp-alert-title">New Order!</div>
              <div className="cp-alert-sub">{newOrders.length} order{newOrders.length > 1 ? 's' : ''} waiting</div>
            </div>
            <div className="cp-alert-pulse" />
          </div>
        </div>
      )}

      {/* Header */}
      <div className="cp-header">
        <div className="cp-header-left">
          <div className="cp-logo">🍽️</div>
          <div>
            <h1 className="cp-title">{user?.canteen_name || 'Canteen'}</h1>
            <div className="cp-subtitle">
              <span className="cp-live-dot" />
              <span>Live · Updates every 5s</span>
            </div>
          </div>
        </div>
        <div className="cp-header-right">
          {stats.pending > 0 && (
            <div className="cp-pending-badge">
              <AlertCircle size={13} />
              {stats.pending} pending
            </div>
          )}
          <button className="cp-icon-btn" onClick={loadOrders} title="Refresh">
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
          </button>
          <button className="cp-icon-btn cp-logout" onClick={logout} title="Logout">
            <LogOut size={15} />
          </button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="cp-stats-grid">
        <div className="cp-stat-card" style={{ '--c': '#38bdf8' }}>
          <div className="cp-stat-icon"><ShoppingBag size={20} color="#38bdf8" /></div>
          <div className="cp-stat-val">{stats.today}</div>
          <div className="cp-stat-label">Today's Orders</div>
        </div>
        <div className="cp-stat-card" style={{ '--c': '#22c55e' }}>
          <div className="cp-stat-icon"><TrendingUp size={20} color="#22c55e" /></div>
          <div className="cp-stat-val">₹{stats.earnings.toLocaleString()}</div>
          <div className="cp-stat-label">Today's Revenue</div>
        </div>
        <div className="cp-stat-card" style={{ '--c': '#f59e0b' }}>
          <div className="cp-stat-icon"><Clock size={20} color="#f59e0b" /></div>
          <div className="cp-stat-val" style={{ color: stats.pending > 0 ? '#f59e0b' : '#f1f5f9' }}>{stats.pending}</div>
          <div className="cp-stat-label">Pending</div>
        </div>
        <div className="cp-stat-card" style={{ '--c': '#a78bfa' }}>
          <div className="cp-stat-icon"><CheckCircle size={20} color="#a78bfa" /></div>
          <div className="cp-stat-val">{stats.delivered}</div>
          <div className="cp-stat-label">Delivered</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="cp-tabs">
        <button className={`cp-tab ${tab === 'orders' ? 'active' : ''}`} onClick={() => setTab('orders')}>
          <Package size={15} /> Orders
          {stats.pending > 0 && <span className="cp-tab-badge">{stats.pending}</span>}
        </button>
        <button className={`cp-tab ${tab === 'menu' ? 'active' : ''}`} onClick={() => setTab('menu')}>
          <Coffee size={15} /> Menu
        </button>
      </div>

      {/* ── ORDERS ── */}
      {tab === 'orders' && (
        <div className="cp-orders-wrap">
          <div className="cp-filter-row">
            {[
              { id: 'active',    label: `Active (${orders.filter(o => ['pending','preparing','ready'].includes(o.status)).length})` },
              { id: 'all',       label: `All (${orders.length})` },
              { id: 'delivered', label: `Delivered (${orders.filter(o => o.status === 'delivered').length})` },
            ].map(f => (
              <button key={f.id} className={`cp-filter-pill ${filter === f.id ? 'active' : ''}`}
                onClick={() => setFilter(f.id)}>
                {f.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="cp-spinner-wrap"><div className="cp-spinner" /></div>
          ) : filteredOrders.length === 0 ? (
            <div className="cp-empty">
              <div className="cp-empty-icon"><ShoppingBag size={36} color="#334155" /></div>
              <p>No orders here</p>
              <span>{filter === 'active' ? 'Waiting for new orders...' : 'Nothing to show'}</span>
            </div>
          ) : (
            <div className="cp-order-list">
              {filteredOrders.map(order => {
                const cfg   = STATUS[order.status] || STATUS.pending;
                const Icon  = cfg.icon;
                const isNew = newOrders.includes(order.order_id);
                const isExp = expanded === order.order_id;

                return (
                  <div key={order.order_id}
                    className={`cp-order-card ${isNew ? 'new-flash' : ''}`}
                    style={{ '--status-color': cfg.color, '--status-glow': cfg.glow }}>

                    {/* Status stripe */}
                    <div className="cp-order-stripe" style={{ background: cfg.color }} />

                    {/* Header row */}
                    <div className="cp-order-top" onClick={() => setExpanded(isExp ? null : order.order_id)}>
                      <div className="cp-order-left">
                        <div className="cp-order-id">#{order.order_id}</div>
                        <div className="cp-order-time">
                          <Clock size={11} /> {formatTime(order.created_at)} · {timeAgo(order.created_at)}
                        </div>
                      </div>
                      <div className="cp-order-right">
                        <span className="cp-status-chip" style={{ color: cfg.color, background: cfg.bg }}>
                          <Icon size={11} /> {cfg.label}
                        </span>
                        <span className="cp-order-amt">₹{order.total_amount}</span>
                        {isExp ? <ChevronUp size={15} color="#64748b" /> : <ChevronDown size={15} color="#64748b" />}
                      </div>
                    </div>

                    {/* Customer */}
                    <div className="cp-customer">
                      <div className="cp-avatar-circle">
                        {(order.user_name || 'S').charAt(0).toUpperCase()}
                      </div>
                      <div className="cp-customer-info">
                        <div className="cp-customer-name">{order.user_name}</div>
                        <div className="cp-customer-email">{order.user_email}</div>
                      </div>
                      <div className="cp-paid-chip">✅ Paid</div>
                    </div>

                    {/* Items preview (always visible) */}
                    <div className="cp-items-preview">
                      {(order.items || []).slice(0, 3).map((item, i) => (
                        <span key={i} className="cp-item-chip">
                          {item.emoji || '🍽️'} {item.name} ×{item.qty}
                        </span>
                      ))}
                      {(order.items || []).length > 3 && (
                        <span className="cp-item-chip more">+{order.items.length - 3} more</span>
                      )}
                    </div>

                    {/* Expanded details */}
                    {isExp && (
                      <div className="cp-items-detail">
                        {(order.items || []).map((item, i) => (
                          <div key={i} className="cp-item-row">
                            <span className="cp-item-emoji">{item.emoji || '🍽️'}</span>
                            <span className="cp-item-name">{item.name}</span>
                            <span className="cp-item-qty">×{item.qty}</span>
                            <span className="cp-item-price">₹{item.subtotal || item.price * item.qty}</span>
                          </div>
                        ))}
                        <div className="cp-total-row">
                          <span>Total</span>
                          <span>₹{order.total_amount}</span>
                        </div>
                      </div>
                    )}

                    {/* Action button */}
                    {cfg.next && (
                      <button className="cp-action-btn" style={{ background: cfg.color }}
                        onClick={() => updateStatus(order.order_id, cfg.next)}>
                        {cfg.nextLabel}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── MENU ── */}
      {tab === 'menu' && (
        <div className="cp-menu-wrap">
          <div className="cp-menu-header">
            <span>Toggle items to show/hide in student app</span>
            <span className="cp-menu-count">{menu.filter(i => i.is_available).length}/{menu.length} available</span>
          </div>
          {['Breakfast','Snacks','Meals','Drinks','Fast Food','Coffee'].map(cat => {
            const catItems = menu.filter(i => i.category === cat);
            if (!catItems.length) return null;
            return (
              <div key={cat} className="cp-menu-category">
                <div className="cp-menu-cat-label">{cat}</div>
                {catItems.map(item => (
                  <div key={item.item_id} className={`cp-menu-item ${!item.is_available ? 'off' : ''}`}>
                    <span className="cp-menu-emoji">{item.emoji || '🍽️'}</span>
                    <div className="cp-menu-info">
                      <span className="cp-menu-name">{item.name}</span>
                      <span className="cp-menu-price">₹{item.price}</span>
                    </div>
                    <button className="cp-toggle" onClick={() => toggleMenu(item.item_id, item.is_available)}>
                      {item.is_available
                        ? <ToggleRight size={30} color="#22c55e" />
                        : <ToggleLeft  size={30} color="#334155" />}
                    </button>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
