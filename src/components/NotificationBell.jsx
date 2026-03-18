import { useState, useEffect, useRef } from 'react';
import { Bell, ShoppingBag, CheckCircle, Clock, Trash2, X, Package, CreditCard } from 'lucide-react';
import API from '../api/axios';
import './NotificationBell.css';

function playNotifSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx  = new AudioCtx();
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    // Rising 3-note chime
    [[523, 0], [659, 0.12], [784, 0.24]].forEach(([freq, delay]) => {
      const osc = ctx.createOscillator();
      osc.connect(gain);
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + delay);
      gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + delay + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.35);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.4);
    });
  } catch(e) {}
}

export default function NotificationBell() {
  const [notifs,   setNotifs]   = useState([]);
  const [open,     setOpen]     = useState(false);
  const [ringing,  setRinging]  = useState(false);
  const prevCount  = useRef(0);
  const dropRef    = useRef(null);
  const unread     = notifs.filter(n => n.is_read === false).length;

  useEffect(() => {
    loadNotifs();
    const poll = setInterval(loadNotifs, 5000);
    return () => clearInterval(poll);
  }, []);

  useEffect(() => {
    const h = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const loadNotifs = async () => {
    try {
      const res  = await API.get('/api/canteen/notifications/my');
      const data = (res.data || []).filter(n => n.is_read === false);
      const newCount = data.length;

      if (newCount > prevCount.current) {
        setRinging(true);
        playNotifSound();
        setTimeout(() => setRinging(false), 1200);
      }
      prevCount.current = newCount;
      setNotifs(data);
    } catch(e) {}
  };

  const markRead = async (id) => {
    try {
      await API.patch(`/api/canteen/notifications/${id}/read`);
      setNotifs(prev => prev.filter(n => n.id !== id));
      prevCount.current = Math.max(0, prevCount.current - 1);
    } catch(e) {}
  };

  const clearAll = async () => {
    await Promise.all(notifs.map(n =>
      API.patch(`/api/canteen/notifications/${n.id}/read`).catch(() => {})
    ));
    setNotifs([]);
    prevCount.current = 0;
  };

  const dismiss = async (id, e) => {
    e.stopPropagation();
    await API.patch(`/api/canteen/notifications/${id}/read`).catch(() => {});
    setNotifs(prev => prev.filter(n => n.id !== id));
    prevCount.current = Math.max(0, prevCount.current - 1);
  };

  const getIcon = (type, status) => {
    if (status === 'ready')      return <CheckCircle size={14} />;
    if (status === 'preparing')  return <Clock size={14} />;
    if (status === 'delivered')  return <Package size={14} />;
    if (type === 'order_placed') return <ShoppingBag size={14} />;
    if (type === 'payment')      return <CreditCard size={14} />;
    return <Bell size={14} />;
  };

  const getColor = (type, status) => {
    if (status === 'ready')      return { color: '#22c55e', bg: '#14532d22' };
    if (status === 'preparing')  return { color: '#38bdf8', bg: '#0c274222' };
    if (status === 'delivered')  return { color: '#64748b', bg: '#1e293b' };
    if (type === 'order_placed') return { color: '#a78bfa', bg: '#4c1d9522' };
    return { color: '#94a3b8', bg: '#1e293b22' };
  };

  const getStatusLabel = (type, status) => {
    if (status === 'ready')      return '🎉 Ready for pickup!';
    if (status === 'preparing')  return '👨‍🍳 Being prepared';
    if (status === 'delivered')  return '✅ Order delivered';
    if (type === 'order_placed') return '📦 Order confirmed';
    return '';
  };

  // Show time the notification was CREATED (when canteen owner acted)
  const timeAgo = (iso) => {
    if (!iso) return '';
    const d = Math.floor((Date.now() - new Date(iso)) / 60000);
    if (d < 1)    return 'just now';
    if (d < 60)   return `${d} min ago`;
    if (d < 1440) return `${Math.floor(d/60)} hr ago`;
    return `${Math.floor(d/1440)} day ago`;
  };

  return (
    <div className="nb-wrap" ref={dropRef}>
      <button
        className={`nb-btn ${ringing ? 'ringing' : ''} ${unread > 0 ? 'has-notif' : ''}`}
        onClick={() => setOpen(o => !o)}
        title="Notifications"
      >
        <Bell size={18} />
        {unread > 0 && <span className="nb-badge">{unread > 9 ? '9+' : unread}</span>}
        {unread > 0 && <span className="nb-pulse" />}
      </button>

      {open && (
        <div className="nb-dropdown">
          <div className="nb-header">
            <div className="nb-header-left">
              <Bell size={14} color="#38bdf8" />
              <span className="nb-title">Notifications</span>
              {unread > 0 && <span className="nb-badge-sm">{unread} new</span>}
            </div>
            {notifs.length > 0 && (
              <button className="nb-clear-btn" onClick={clearAll}>
                <Trash2 size={12} /> Clear all
              </button>
            )}
          </div>

          <div className="nb-list">
            {notifs.length === 0 ? (
              <div className="nb-empty">
                <div className="nb-empty-icon"><Bell size={28} color="#334155" /></div>
                <p>You're all caught up!</p>
                <span>No new notifications</span>
              </div>
            ) : (
              notifs.map((n, i) => {
                const { color, bg } = getColor(n.type, n.status);
                const label = getStatusLabel(n.type, n.status);
                return (
                  <div key={n.id} className="nb-item unread"
                    style={{ animationDelay: `${i * 0.04}s` }}>
                    <div className="nb-accent" style={{ background: color }} />
                    <div className="nb-icon" style={{ background: bg, color }}>
                      {getIcon(n.type, n.status)}
                    </div>
                    <div className="nb-content">
                      <div className="nb-notif-title">{n.title}</div>
                      <div className="nb-notif-msg">{n.message}</div>
                      {label && <div className="nb-status-tag" style={{ color }}>{label}</div>}
                      <div className="nb-time">{timeAgo(n.created_at)}</div>
                    </div>
                    <div className="nb-right">
                      <div className="nb-dot" style={{ background: color }} />
                      <button className="nb-x" onClick={(e) => dismiss(n.id, e)}>
                        <X size={11} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {notifs.length > 0 && (
            <div className="nb-footer">
              <span>{notifs.length} notification{notifs.length !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
