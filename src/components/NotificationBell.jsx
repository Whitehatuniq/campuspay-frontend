import { useState, useEffect, useRef } from 'react';
import { Bell, ShoppingBag, CreditCard } from 'lucide-react';
import API from '../api/axios';
import './NotificationBell.css';

export default function NotificationBell() {
  const [notifs, setNotifs] = useState([]);
  const [open,   setOpen]   = useState(false);
  const unread  = notifs.filter(n => !n.is_read).length;
  const dropRef = useRef(null);

  useEffect(() => {
    loadNotifs();
    const poll = setInterval(loadNotifs, 15000);
    return () => clearInterval(poll);
  }, []);

  useEffect(() => {
    const h = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const loadNotifs = async () => {
    try {
      const res = await API.get('/api/canteen/notifications/my');
      setNotifs(res.data || []);
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
    await Promise.all(unreadList.map(n => API.patch(`/api/canteen/notifications/${n.id}/read`).catch(() => {})));
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const getColor = (type, status) => {
    if (status === 'ready')     return '#22c55e';
    if (status === 'preparing') return '#38bdf8';
    if (status === 'delivered') return '#64748b';
    return '#a78bfa';
  };

  const timeAgo = (iso) => {
    const d = Math.floor((Date.now() - new Date(iso)) / 60000);
    if (d < 1) return 'just now';
    if (d < 60) return d + 'm ago';
    return Math.floor(d/60) + 'h ago';
  };

  return (
    <div className="nb-wrap" ref={dropRef}>
      <button className="nb-btn" onClick={() => setOpen(o => !o)}>
        <Bell size={18} />
        {unread > 0 && <span className="nb-badge">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open && (
        <div className="nb-dropdown">
          <div className="nb-header">
            <span className="nb-title">Notifications</span>
            {unread > 0 && <button className="nb-mark-all" onClick={markAllRead}>Mark all read</button>}
          </div>
          <div className="nb-list">
            {notifs.length === 0 ? (
              <div className="nb-empty"><Bell size={28} color="#334155" /><p>No notifications yet</p></div>
            ) : (
              notifs.map(n => (
                <div key={n.id} className={`nb-item ${!n.is_read ? 'unread' : ''}`} onClick={() => !n.is_read && markRead(n.id)}>
                  <div className="nb-icon-wrap" style={{ background: getColor(n.type, n.status) + '22', color: getColor(n.type, n.status) }}>
                    <ShoppingBag size={14} />
                  </div>
                  <div className="nb-content">
                    <div className="nb-notif-title">{n.title}</div>
                    <div className="nb-notif-msg">{n.message}</div>
                    <div className="nb-notif-time">{timeAgo(n.created_at)}</div>
                  </div>
                  {!n.is_read && <div className="nb-unread-dot" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
