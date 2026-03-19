import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import API from '../api/axios';
import './AdminManage.css';

const CANTEENS = [
  { id: 'pu_canteen', name: 'PU Canteen' },
  { id: 'cybrus_cafe', name: 'Cybrus Cafe' },
  { id: 'cafegram', name: 'Cafegram' }
];

const FEE_TYPES = ['exam_fee', 'back_fee', 'library_fine', 'event_fee', 'other'];

export default function AdminManage() {
  const { user } = useAuth();
  const [eventRegs, setEventRegs] = useState([]);
  const [eventsData, setEventsData] = useState([]);
  const [activeTab, setActiveTab] = useState('canteen');
  const [selectedCanteen, setSelectedCanteen] = useState('pu_canteen');
  const [menuItems, setMenuItems] = useState([]);
  const [fees, setFees] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);

  // Forms
  const [menuForm, setMenuForm] = useState({ item_id: '', name: '', category: '', price: '', emoji: '🍽️', canteen_id: 'pu_canteen' });
  const [feeForm, setFeeForm] = useState({ fee_id: '', fee_name: '', fee_type: 'exam_fee', amount: '', due_date: '', description: '' });
  const [eventForm, setEventForm] = useState({ event_id: '', event_name: '', description: '', fee: '', date: '', last_date: '', venue: '' });

  useEffect(() => {
    if (user?.role === 'admin') fetchData();
  }, [activeTab, selectedCanteen, user]);

  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;

  const loadEventRegs = async () => {
    setLoading(true);
    try {
      const [regsRes, evRes] = await Promise.all([
        API.get('/api/events/admin/registrations'),
        API.get('/api/events/list'),
      ]);
      setEventRegs(regsRes.data || []);
      setEventsData(evRes.data || []);
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = (eventId) => {
    const rows = eventId === 'all' ? eventRegs : eventRegs.filter(r => r.event_id === eventId);
    const headers = ['Name','Branch','Year','Enrollment No','Contact','Event','Amount Paid','Date'];
    const csv = [headers, ...rows.map(r => [
      r.name, r.branch, r.year, r.enrollment_no,
      r.contact_no, r.event_name, r.amount_paid > 0 ? r.amount_paid : 'FREE',
      r.registered_at ? r.registered_at.split('T')[0] : ''
    ])].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'event_registrations_' + eventId + '.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'canteen') {
        const res = await API.get(`/api/admin-manage/canteen/menu/${selectedCanteen}`);
        setMenuItems(res.data);
      } else if (activeTab === 'fees') {
        const res = await API.get('/api/admin-manage/fees/list');
        setFees(res.data);
      } else if (activeTab === 'events') {
        const res = await API.get('/api/admin-manage/events/list');
        setEvents(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const showStatus = (type, msg) => {
    setStatus({ type, msg });
    setTimeout(() => setStatus(null), 3000);
  };

  // ── CANTEEN ──────────────────────────────────────────────
  const handleAddMenuItem = async (e) => {
    e.preventDefault();
    try {
      await API.post('/api/admin-manage/canteen/menu/add', { ...menuForm, price: parseFloat(menuForm.price), canteen_id: selectedCanteen });
      showStatus('success', `${menuForm.name} added to menu!`);
      setShowForm(false);
      setMenuForm({ item_id: '', name: '', category: '', price: '', emoji: '🍽️', canteen_id: selectedCanteen });
      fetchData();
    } catch (err) {
      showStatus('error', err.response?.data?.detail || 'Failed to add item.');
    }
  };

  const handleUpdateMenuItem = async (e) => {
    e.preventDefault();
    try {
      await API.patch(`/api/admin-manage/canteen/menu/${editItem.item_id}`, {
        name: menuForm.name, price: parseFloat(menuForm.price),
        category: menuForm.category, emoji: menuForm.emoji
      });
      showStatus('success', 'Menu item updated!');
      setEditItem(null); setShowForm(false);
      fetchData();
    } catch (err) {
      showStatus('error', err.response?.data?.detail || 'Failed to update.');
    }
  };

  const handleToggleItem = async (item_id) => {
    try {
      await API.patch(`/api/admin-manage/canteen/menu/${item_id}/toggle`);
      fetchData();
    } catch (err) {
      showStatus('error', 'Failed to toggle item.');
    }
  };

  const handleDeleteMenuItem = async (item_id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try {
      await API.delete(`/api/admin-manage/canteen/menu/${item_id}`);
      showStatus('success', `${name} deleted!`);
      fetchData();
    } catch (err) {
      showStatus('error', 'Failed to delete.');
    }
  };

  // ── FEES ─────────────────────────────────────────────────
  const handleAddFee = async (e) => {
    e.preventDefault();
    try {
      await API.post('/api/admin-manage/fees/add', { ...feeForm, amount: parseFloat(feeForm.amount) });
      showStatus('success', `Fee "${feeForm.fee_name}" added!`);
      setShowForm(false);
      setFeeForm({ fee_id: '', fee_name: '', fee_type: 'exam_fee', amount: '', due_date: '', description: '' });
      fetchData();
    } catch (err) {
      showStatus('error', err.response?.data?.detail || 'Failed to add fee.');
    }
  };

  const handleDeleteFee = async (fee_id, name) => {
    if (!window.confirm(`Delete fee "${name}"?`)) return;
    try {
      await API.delete(`/api/admin-manage/fees/${fee_id}`);
      showStatus('success', 'Fee deleted!');
      fetchData();
    } catch (err) {
      showStatus('error', 'Failed to delete fee.');
    }
  };

  // ── EVENTS ───────────────────────────────────────────────
  const handleAddEvent = async (e) => {
    e.preventDefault();
    try {
      await API.post('/api/admin-manage/events/add', { ...eventForm, fee: parseFloat(eventForm.fee) });
      showStatus('success', `Event "${eventForm.event_name}" added!`);
      setShowForm(false);
      setEventForm({ event_id: '', event_name: '', description: '', fee: '', date: '', last_date: '', venue: '' });
      fetchData();
    } catch (err) {
      showStatus('error', err.response?.data?.detail || 'Failed to add event.');
    }
  };

  const handleToggleEvent = async (event_id) => {
    try {
      await API.patch(`/api/admin-manage/events/${event_id}/toggle`);
      fetchData();
    } catch (err) {
      showStatus('error', 'Failed to toggle event.');
    }
  };

  const handleDeleteEvent = async (event_id, name) => {
    if (!window.confirm(`Delete event "${name}"?`)) return;
    try {
      await API.delete(`/api/admin-manage/events/${event_id}`);
      showStatus('success', 'Event deleted!');
      fetchData();
    } catch (err) {
      showStatus('error', 'Failed to delete event.');
    }
  };

  const setf = (setter, field) => (e) => setter(prev => ({ ...prev, [field]: e.target.value }));

  const downloadCSV = (eventId) => {
    const rows = eventId === 'all' ? eventRegs : eventRegs.filter(r => r.event_id === eventId);
    const headers = ['Name','Branch','Year','Enrollment No','Contact','Event','Amount Paid','Date'];
    const csv = [headers, ...rows.map(r => [r.name,r.branch,r.year,r.enrollment_no,r.contact_no,r.event_name,r.amount_paid||0,r.registered_at?.split('T')[0]])].map(r=>r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `event_registrations_${eventId}.csv`; a.click();
  };
  return (
    <div className="admin-manage-page">
      <div className="admin-header">
        <div>
          <h2>⚙️ Admin Management</h2>
          <p>Manage canteen menu, fees and events</p>
        </div>
      </div>

      {status && (
        <div className={`admin-status ${status.type}`}>
          {status.type === 'success' ? '✅' : '❌'} {status.msg}
        </div>
      )}

      <div className="admin-tabs">
        {[
          { id: 'canteen', label: '🍽️ Canteen Menu' },
          { id: 'fees',    label: '📝 Exam Fees' },
          { id: 'events',  label: '🎪 Events' },
          { id: 'eventregs', label: '📋 Registrations' },
        ].map(tab => (
          <button key={tab.id} className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => { setActiveTab(tab.id); setShowForm(false); setEditItem(null); if(tab.id==='eventregs') loadEventRegs(); }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── CANTEEN TAB ── */}
      {activeTab === 'canteen' && (
        <div>
          <div className="manage-toolbar">
            <div className="canteen-selector">
              {CANTEENS.map(c => (
                <button key={c.id} className={`canteen-btn ${selectedCanteen === c.id ? 'active' : ''}`}
                  onClick={() => { setSelectedCanteen(c.id); setShowForm(false); }}>
                  {c.name}
                </button>
              ))}
            </div>
            <button className="add-btn" onClick={() => { setShowForm(!showForm); setEditItem(null); setMenuForm({ item_id: '', name: '', category: '', price: '', emoji: '🍽️', canteen_id: selectedCanteen }); }}>
              + Add Item
            </button>
          </div>

          {showForm && !editItem && (
            <form onSubmit={handleAddMenuItem} className="manage-form">
              <h4>Add New Menu Item</h4>
              <div className="form-row">
                <div className="form-group"><label>Item ID</label><input value={menuForm.item_id} onChange={setf(setMenuForm, 'item_id')} placeholder="pu_99" required /></div>
                <div className="form-group"><label>Name</label><input value={menuForm.name} onChange={setf(setMenuForm, 'name')} placeholder="Veg Biryani" required /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Category</label><input value={menuForm.category} onChange={setf(setMenuForm, 'category')} placeholder="Meals" required /></div>
                <div className="form-group"><label>Price (₹)</label><input type="number" value={menuForm.price} onChange={setf(setMenuForm, 'price')} placeholder="80" required /></div>
                <div className="form-group"><label>Emoji</label><input value={menuForm.emoji} onChange={setf(setMenuForm, 'emoji')} placeholder="🍛" /></div>
              </div>
              <div className="form-actions">
                <button type="submit" className="save-btn">Add Item</button>
                <button type="button" className="cancel-btn" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          )}

          {editItem && showForm && (
            <form onSubmit={handleUpdateMenuItem} className="manage-form">
              <h4>Edit: {editItem.name}</h4>
              <div className="form-row">
                <div className="form-group"><label>Name</label><input value={menuForm.name} onChange={setf(setMenuForm, 'name')} required /></div>
                <div className="form-group"><label>Category</label><input value={menuForm.category} onChange={setf(setMenuForm, 'category')} required /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Price (₹)</label><input type="number" value={menuForm.price} onChange={setf(setMenuForm, 'price')} required /></div>
                <div className="form-group"><label>Emoji</label><input value={menuForm.emoji} onChange={setf(setMenuForm, 'emoji')} /></div>
              </div>
              <div className="form-actions">
                <button type="submit" className="save-btn">Save Changes</button>
                <button type="button" className="cancel-btn" onClick={() => { setShowForm(false); setEditItem(null); }}>Cancel</button>
              </div>
            </form>
          )}

          <div className="manage-table-wrap">
            <table className="manage-table">
              <thead><tr><th>Item</th><th>Category</th><th>Price</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {menuItems.map(item => (
                  <tr key={item.item_id}>
                    <td><span>{item.emoji} {item.name}</span></td>
                    <td>{item.category}</td>
                    <td>₹{item.price}</td>
                    <td><span className={`status-badge ${item.is_available ? 'active' : 'inactive'}`}>{item.is_available ? '✅ Available' : '❌ Unavailable'}</span></td>
                    <td>
                      <div className="action-btns">
                        <button className="edit-btn" onClick={() => { setEditItem(item); setMenuForm({ name: item.name, category: item.category, price: item.price, emoji: item.emoji }); setShowForm(true); }}>✏️</button>
                        <button className="toggle-btn-sm" onClick={() => handleToggleItem(item.item_id)}>{item.is_available ? '🔴' : '🟢'}</button>
                        <button className="delete-btn" onClick={() => handleDeleteMenuItem(item.item_id, item.name)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── FEES TAB ── */}
      {activeTab === 'eventregs' && (
        <div className="am-section">
          <div className="am-section-header">
            <h2>📋 Event Registrations</h2>
            <button className="am-add-btn" style={{background:'#22c55e'}} onClick={() => downloadCSV('all')}>
              ⬇️ Download All CSV
            </button>
          </div>
          {eventsData.map(ev => {
            const regs = eventRegs.filter(r => r.event_id === ev.event_id);
            return (
              <div key={ev.event_id} className="am-event-reg-card">
                <div className="am-event-reg-header">
                  <div>
                    <span style={{fontSize:20}}>{ev.emoji||'🎯'}</span>
                    <strong style={{marginLeft:10,color:'#f1f5f9'}}>{ev.event_name||ev.name}</strong>
                    <span style={{marginLeft:10,fontSize:12,color:'#64748b'}}>{ev.date}</span>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <span style={{background:'#38bdf822',color:'#38bdf8',padding:'3px 12px',borderRadius:20,fontSize:12,fontWeight:700}}>{regs.length} registered</span>
                    {regs.length > 0 && <button className="am-edit-btn" onClick={() => downloadCSV(ev.event_id)}>⬇️ CSV</button>}
                  </div>
                </div>
                {regs.length > 0 && (
                  <table style={{width:'100%',borderCollapse:'collapse',marginTop:12}}>
                    <thead>
                      <tr style={{background:'#1e293b',fontSize:11,color:'#64748b',textTransform:'uppercase'}}>
                        {['Name','Branch','Year','Enrollment No','Contact','Fee Paid','Date'].map(h=>(
                          <th key={h} style={{padding:'8px 12px',textAlign:'left'}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {regs.map((r,i) => (
                        <tr key={i} style={{borderBottom:'1px solid #1e293b11',fontSize:13}}>
                          <td style={{padding:'10px 12px',color:'#e2e8f0',fontWeight:600}}>{r.name}</td>
                          <td style={{padding:'10px 12px',color:'#94a3b8'}}>{r.branch}</td>
                          <td style={{padding:'10px 12px',color:'#94a3b8'}}>{r.year}</td>
                          <td style={{padding:'10px 12px',color:'#94a3b8'}}>{r.enrollment_no}</td>
                          <td style={{padding:'10px 12px',color:'#94a3b8'}}>{r.contact_no}</td>
                          <td style={{padding:'10px 12px',color:'#22c55e',fontWeight:700}}>{r.amount_paid > 0 ? `₹${r.amount_paid}` : 'FREE'}</td>
                          <td style={{padding:'10px 12px',color:'#475569'}}>{r.registered_at?.split('T')[0]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {regs.length === 0 && <p style={{color:'#475569',fontSize:13,padding:'12px 0',margin:0}}>No registrations yet</p>}
              </div>
            );
          })}
        </div>
      )}
      {activeTab === 'fees' && (
        <div>
          <div className="manage-toolbar">
            <h3>{fees.length} fee types</h3>
            <button className="add-btn" onClick={() => setShowForm(!showForm)}>+ Add Fee</button>
          </div>

          {showForm && (
            <form onSubmit={handleAddFee} className="manage-form">
              <h4>Add New Fee</h4>
              <div className="form-row">
                <div className="form-group"><label>Fee ID</label><input value={feeForm.fee_id} onChange={setf(setFeeForm, 'fee_id')} placeholder="back_science_2024" required /></div>
                <div className="form-group"><label>Fee Name</label><input value={feeForm.fee_name} onChange={setf(setFeeForm, 'fee_name')} placeholder="Back Paper - Science" required /></div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Fee Type</label>
                  <select value={feeForm.fee_type} onChange={setf(setFeeForm, 'fee_type')}>
                    {FEE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Amount (₹)</label><input type="number" value={feeForm.amount} onChange={setf(setFeeForm, 'amount')} placeholder="500" required /></div>
                <div className="form-group"><label>Due Date</label><input type="date" value={feeForm.due_date} onChange={setf(setFeeForm, 'due_date')} required /></div>
              </div>
              <div className="form-group"><label>Description</label><input value={feeForm.description} onChange={setf(setFeeForm, 'description')} placeholder="Description" /></div>
              <div className="form-actions">
                <button type="submit" className="save-btn">Add Fee</button>
                <button type="button" className="cancel-btn" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          )}

          <div className="manage-table-wrap">
            <table className="manage-table">
              <thead><tr><th>Fee Name</th><th>Type</th><th>Amount</th><th>Due Date</th><th>Actions</th></tr></thead>
              <tbody>
                {fees.map(fee => (
                  <tr key={fee.fee_id}>
                    <td>{fee.fee_name}</td>
                    <td><span className="type-pill">{fee.fee_type}</span></td>
                    <td>₹{fee.amount}</td>
                    <td>{fee.due_date}</td>
                    <td>
                      <button className="delete-btn" onClick={() => handleDeleteFee(fee.fee_id, fee.fee_name)}>🗑️ Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── EVENTS TAB ── */}
      {activeTab === 'events' && (
        <div>
          <div className="manage-toolbar">
            <h3>{events.length} events</h3>
            <button className="add-btn" onClick={() => setShowForm(!showForm)}>+ Add Event</button>
          </div>

          {showForm && (
            <form onSubmit={handleAddEvent} className="manage-form">
              <h4>Add New Event</h4>
              <div className="form-row">
                <div className="form-group"><label>Event ID</label><input value={eventForm.event_id} onChange={setf(setEventForm, 'event_id')} placeholder="workshop_2024" required /></div>
                <div className="form-group"><label>Event Name</label><input value={eventForm.event_name} onChange={setf(setEventForm, 'event_name')} placeholder="AI Workshop" required /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Fee (₹)</label><input type="number" value={eventForm.fee} onChange={setf(setEventForm, 'fee')} placeholder="200" required /></div>
                <div className="form-group"><label>Event Date</label><input type="date" value={eventForm.date} onChange={setf(setEventForm, 'date')} required /></div>
                <div className="form-group"><label>Last Date</label><input type="date" value={eventForm.last_date} onChange={setf(setEventForm, 'last_date')} required /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Venue</label><input value={eventForm.venue} onChange={setf(setEventForm, 'venue')} placeholder="Seminar Hall" required /></div>
                <div className="form-group"><label>Description</label><input value={eventForm.description} onChange={setf(setEventForm, 'description')} placeholder="About the event" /></div>
              </div>
              <div className="form-actions">
                <button type="submit" className="save-btn">Add Event</button>
                <button type="button" className="cancel-btn" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          )}

          <div className="manage-table-wrap">
            <table className="manage-table">
              <thead><tr><th>Event Name</th><th>Fee</th><th>Date</th><th>Venue</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {events.map(event => (
                  <tr key={event.event_id}>
                    <td>{event.event_name}</td>
                    <td>₹{event.fee}</td>
                    <td>{event.date}</td>
                    <td>{event.venue}</td>
                    <td><span className={`status-badge ${event.is_active ? 'active' : 'inactive'}`}>{event.is_active ? '✅ Active' : '❌ Inactive'}</span></td>
                    <td>
                      <div className="action-btns">
                        <button className="toggle-btn-sm" onClick={() => handleToggleEvent(event.event_id)}>{event.is_active ? '🔴 Disable' : '🟢 Enable'}</button>
                        <button className="delete-btn" onClick={() => handleDeleteEvent(event.event_id, event.event_name)}>🗑️</button>
                      </div>
                    </td>
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
