import { useState, useEffect, useRef } from 'react';
import { Bell, ShoppingBag, CreditCard, CheckCircle, Clock, Trash2, X, Package } from 'lucide-react';
import API from '../api/axios';
import './NotificationBell.css';

export default function NotificationBell() {
  const [notifs,  setNotifs]  = useState([]);
  const [open,    setOpen]    = useState(false);
  const [ringing, setRinging] = useState(false);
  const prevCount = useRef(0);
  const dropRef   = useRef(null);

  const unread = notifs.filter(n => !n.is_read).length;

  useEffect(() => {
    loadNotifs();
    const poll = setInterval(loadNotifs, 15000);
    return () => clearInterval(poll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const h = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const loadNotifs = async () => {
    try {
      const res = await API.get('/api/canteen/notifications/my');
      const data = res.data || [];
      const newUnread = data.filter(n => !n.is_read).length;

      // Ring bell if new notifications arrived
      if (newUnread > prevCount.current) {
        setRinging(true);
        setTimeout(() => setRinging(false), 1000);
      }
      prevCount.current = newUnread;
      setNotifs(data.filter(n => n.is_read === false));
    } catch(e) {}
  };

  const markRead = async (id) => {
    try {
      await API.patch(`/api/canteen/notifications/${id}/read`);
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch(e) {}
  };

  const markAllRead = async () => {
    const unreadList = notifs.filter(n => !n.is_read);
    await Promise.all(unreadList.map(n =>
      API.patch(`/api/canteen/notifications/${n.id}/read`).catch(() => {})
    ));
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const clearAll = async () => {
    await Promise.all(notifs.map(n =>
      API.patch(`/api/canteen/notifications/${n.id}/read`).catch(() => {})
    ));
    setNotifs([]);
  };

  const dismiss = async (id, e) => {
    e.stopPropagation();
    await API.patch(`/api/canteen/notifications/${id}/read`).catch(() => {});
    setNotifs(prev => prev.filter(n => n.id !== id));
  };

  const getIcon = (type, status) => {
    if (status === 'ready')     return <CheckCircle size={15} />;
    if (status === 'preparing') return <Clock size={15} />;
    if (type === 'order_placed') return <ShoppingBag size={15} />;
    if (type === 'order_status') return <Package size={15} />;
    if (type === 'payment')     return <CreditCard size={15} />;
    return <Bell size={15} />;
  };

  const getColor = (type, status) => {
    if (status === 'ready')      return { color: '#22c55e', bg: '#14532d22' };
    if (status === 'preparing')  return { color: '#38bdf8', bg: '#0c274222' };
    if (status === 'delivered')  return { color: '#64748b', bg: '#1e293b' };
    if (type === 'order_placed') return { color: '#a78bfa', bg: '#4c1d9522' };
    if (type === 'payment')      return { color: '#fbbf24', bg: '#78350f22' };
    return { color: '#94a3b8', bg: '#1e293b' };
  };

  const timeAgo = (iso) => {
    const d = Math.floor((Date.now() - new Date(iso)) / 60000);
    if (d < 1)    return 'just now';
    if (d < 60)   return `${d}m ago`;
    if (d < 1440) return `${Math.floor(d/60)}h ago`;
    return `${Math.floor(d/1440)}d ago`;
  };

  const getStatusLabel = (type, status) => {
    if (status === 'ready')      return '🎉 Ready for pickup!';
    if (status === 'preparing')  return '👨‍🍳 Being prepared';
    if (status === 'delivered')  return '✅ Delivered';
    if (type === 'order_placed') return '📦 Order placed';
    return '';
  };

  return (
    <div className="nb-wrap" ref={dropRef}>
      {/* Bell button */}
      <button
        className={`nb-btn ${ringing ? 'ringing' : ''} ${unread > 0 ? 'has-notif' : ''}`}
        onClick={() => { setOpen(o => !o); if (unread > 0 && !open) markAllRead(); }}
        title="Notifications"
      >
        <Bell size={18} className={ringing ? 'bell-ring' : ''} />
        {unread > 0 && (
          <span className="nb-badge">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
        {unread > 0 && <span className="nb-pulse" />}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="nb-dropdown">
          {/* Header */}
          <div className="nb-header">
            <div className="nb-header-left">
              <Bell size={15} color="#38bdf8" />
              <span className="nb-title">Notifications</span>
              {unread > 0 && <span className="nb-unread-count">{unread} new</span>}
            </div>
            <div className="nb-header-actions">
              {notifs.length > 0 && (
                <button className="nb-clear-btn" onClick={clearAll} title="Clear all">
                  <Trash2 size={13} />
                  <span>Clear</span>
                </button>
              )}
            </div>
          </div>

          {/* Notification list */}
          <div className="nb-list">
            {notifs.length === 0 ? (
              <div className="nb-empty">
                <div className="nb-empty-icon">
                  <Bell size={32} color="#334155" />
                </div>
                <p>You're all caught up!</p>
                <span>No notifications yet</span>
              </div>
            ) : (
              notifs.map((n, i) => {
                const { color, bg } = getColor(n.type, n.status);
                const statusLabel = getStatusLabel(n.type, n.status);
                return (
                  <div
                    key={n.id}
                    className={`nb-item ${!n.is_read ? 'unread' : ''}`}
                    style={{ animationDelay: `${i * 0.05}s` }}
                    onClick={() => !n.is_read && markRead(n.id)}
                  >
                    {/* Left accent bar */}
                    {!n.is_read && <div className="nb-accent-bar" style={{ background: color }} />}

                    {/* Icon */}
                    <div className="nb-icon-wrap" style={{ background: bg, color }}>
                      {getIcon(n.type, n.status)}
                    </div>

                    {/* Content */}
                    <div className="nb-content">
                      <div className="nb-notif-title">{n.title}</div>
                      <div className="nb-notif-msg">{n.message}</div>
                      {statusLabel && (
                        <div className="nb-status-label" style={{ color }}>
                          {statusLabel}
                        </div>
                      )}
                      <div className="nb-notif-time">{timeAgo(n.created_at)}</div>
                    </div>

                    {/* Right side */}
                    <div className="nb-item-right">
                      {!n.is_read && <div className="nb-dot" style={{ background: color }} />}
                      <button className="nb-dismiss" onClick={(e) => dismiss(n.id, e)}>
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifs.length > 0 && (
            <div className="nb-footer">
              <span>{notifs.length} notification{notifs.length !== 1 ? 's' : ''}</span>
              {unread > 0 && (
                <button className="nb-markall-btn" onClick={markAllRead}>
                  Mark all read
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
