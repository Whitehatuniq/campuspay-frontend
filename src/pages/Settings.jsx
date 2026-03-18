import { useState, useEffect, useRef } from 'react';
import { User, Shield, Lock, Palette, Camera, Upload, Check, Eye, EyeOff, Sun, Moon, Code } from 'lucide-react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import './Pay.css';
import './Settings.css';

const BITMOJIS = [
  { id: 'bm1',  emoji: '🧑‍💻', label: 'Developer' },
  { id: 'bm2',  emoji: '👩‍🎓', label: 'Graduate' },
  { id: 'bm3',  emoji: '🧑‍🎓', label: 'Student' },
  { id: 'bm4',  emoji: '👨‍💼', label: 'Professional' },
  { id: 'bm5',  emoji: '🦸',   label: 'Hero' },
  { id: 'bm6',  emoji: '🧑‍🎨', label: 'Artist' },
  { id: 'bm7',  emoji: '🧑‍🔬', label: 'Scientist' },
  { id: 'bm8',  emoji: '🧑‍🏫', label: 'Teacher' },
  { id: 'bm9',  emoji: '🦊',   label: 'Fox' },
  { id: 'bm10', emoji: '🐼',   label: 'Panda' },
  { id: 'bm11', emoji: '🦁',   label: 'Lion' },
  { id: 'bm12', emoji: '🐯',   label: 'Tiger' },
  { id: 'bm13', emoji: '🤖',   label: 'Robot' },
  { id: 'bm14', emoji: '👾',   label: 'Alien' },
  { id: 'bm15', emoji: '🧙',   label: 'Wizard' },
  { id: 'bm16', emoji: '🥷',   label: 'Ninja' },
];

const TABS = [
  { id: 'profile',    label: 'Profile',    icon: User    },
  { id: 'security',  label: 'Security',   icon: Shield  },
  { id: 'applock',   label: 'App Lock',   icon: Lock    },
  { id: 'appearance',label: 'Appearance', icon: Palette },
  { id: 'developer', label: 'Developer',  icon: Code    },
];

export default function Settings() {
  const { user } = useAuth();
  const fileRef  = useRef(null);

  const [tab,           setTab]           = useState('profile');
  const [phone,         setPhone]         = useState(user?.phone || '');
  const [avatar,        setAvatar]        = useState(user?.avatar || '');
  const [photoPreview,  setPhotoPreview]  = useState(user?.photo_url || null);
  const [photoTab,      setPhotoTab]      = useState('bitmoji'); // 'bitmoji' | 'upload'
  const [saving,        setSaving]        = useState(false);
  const [msg,           setMsg]           = useState(null);

  // Security
  const [oldPass,   setOldPass]   = useState('');
  const [newPass,   setNewPass]   = useState('');
  const [showPass,  setShowPass]  = useState(false);
  const [oldPin,    setOldPin]    = useState('');
  const [newPin,    setNewPin]    = useState('');

  // App lock
  const [lockEnabled,  setLockEnabled]  = useState(false);
  const [lockPin,      setLockPin]      = useState('');
  const [confirmPin,   setConfirmPin]   = useState('');

  // Theme
  const [theme, setTheme] = useState('dark');

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3000);
  };

  // Handle real photo upload
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showMsg('error', 'Image too large. Max 5MB.'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPhotoPreview(ev.target.result);
      setAvatar('');  // clear bitmoji when photo is set
    };
    reader.readAsDataURL(file);
  };

  // Select bitmoji
  const handleBitmoji = (bm) => {
    setAvatar(bm.emoji);
    setPhotoPreview(null); // clear photo when bitmoji is selected
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const payload = { phone };
      if (avatar)       payload.avatar    = avatar;
      if (photoPreview && photoPreview.startsWith('data:')) payload.photo_url = photoPreview;
      await API.patch('/api/auth/update-profile', payload);
      showMsg('success', 'Profile updated successfully!');
    } catch {
      showMsg('error', 'Failed to update profile.');
    }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (!oldPass || !newPass) { showMsg('error', 'Fill both fields'); return; }
    if (newPass.length < 6)   { showMsg('error', 'New password must be 6+ chars'); return; }
    setSaving(true);
    try {
      await API.post('/api/auth/change-password', { old_password: oldPass, new_password: newPass });
      showMsg('success', 'Password changed!');
      setOldPass(''); setNewPass('');
    } catch (e) {
      showMsg('error', e.response?.data?.detail || 'Failed to change password.');
    }
    setSaving(false);
  };

  const handleChangePIN = async () => {
    if (!oldPin || !newPin || newPin.length !== 4) { showMsg('error', 'Enter valid 4-digit PINs'); return; }
    setSaving(true);
    try {
      await API.post('/api/wallet/change-pin', { old_pin: oldPin, new_pin: newPin });
      showMsg('success', 'UPI PIN changed!');
      setOldPin(''); setNewPin('');
    } catch (e) {
      showMsg('error', e.response?.data?.detail || 'Failed to change PIN.');
    }
    setSaving(false);
  };

  const handleSetLock = () => {
    if (lockPin.length !== 4) { showMsg('error', 'Enter a 4-digit lock PIN'); return; }
    if (lockPin !== confirmPin) { showMsg('error', 'PINs do not match'); return; }
    localStorage.setItem('app_lock_pin', lockPin);
    setLockEnabled(true);
    showMsg('success', 'App lock set!');
    setLockPin(''); setConfirmPin('');
  };

  const handleRemoveLock = () => {
    localStorage.removeItem('app_lock_pin');
    setLockEnabled(false);
    showMsg('success', 'App lock removed.');
  };

  // Profile photo display
  const renderAvatar = () => {
    if (photoPreview) return <img src={photoPreview} alt="profile" className="profile-photo-img" />;
    if (avatar)       return <span className="profile-bitmoji-display">{avatar}</span>;
    return <User size={40} color="#64748b" />;
  };

  return (
    <div className="settings-page">
      <div className="page-hero" style={{ '--accent': '#94a3b8' }}>
        <div className="page-hero-icon"><User size={28} color="#94a3b8" strokeWidth={1.8} /></div>
        <div><h1>Settings</h1><p>Manage your profile and preferences</p></div>
      </div>

      {msg && (
        <div className={`settings-msg ${msg.type}`}>
          {msg.type === 'success' ? <Check size={15} /> : '✕'} {msg.text}
        </div>
      )}

      <div className="settings-layout">
        {/* Sidebar tabs */}
        <div className="settings-sidebar">
          {TABS.map(t => (
            <button key={t.id} className={`settings-tab ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}>
              <t.icon size={17} strokeWidth={1.8} />
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="settings-content">

          {/* ── PROFILE ── */}
          {tab === 'profile' && (
            <div className="settings-section">
              <h2>Profile</h2>

              {/* Avatar preview */}
              <div className="profile-avatar-center">
                <div className="profile-avatar-wrap">
                  {renderAvatar()}
                  <button className="avatar-edit-btn" onClick={() => fileRef.current?.click()}>
                    <Camera size={14} />
                  </button>
                </div>
                <div className="profile-user-name">{user?.name}</div>
                <div className="profile-user-upi">{user?.upi_id}</div>
              </div>

              {/* Photo source tabs */}
              <div className="photo-source-tabs">
                <button className={`photo-source-tab ${photoTab === 'bitmoji' ? 'active' : ''}`}
                  onClick={() => setPhotoTab('bitmoji')}>
                  😊 Bitmoji / Avatar
                </button>
                <button className={`photo-source-tab ${photoTab === 'upload' ? 'active' : ''}`}
                  onClick={() => setPhotoTab('upload')}>
                  <Upload size={14} /> Upload Photo
                </button>
              </div>

              {/* Bitmoji picker */}
              {photoTab === 'bitmoji' && (
                <div className="bitmoji-section">
                  <div className="section-label" style={{ marginBottom: 12 }}>Choose your avatar</div>
                  <div className="bitmoji-grid">
                    {BITMOJIS.map(bm => (
                      <button key={bm.id}
                        className={`bitmoji-btn ${avatar === bm.emoji && !photoPreview ? 'selected' : ''}`}
                        onClick={() => handleBitmoji(bm)}
                        title={bm.label}>
                        <span className="bitmoji-emoji">{bm.emoji}</span>
                        <span className="bitmoji-label">{bm.label}</span>
                        {avatar === bm.emoji && !photoPreview && (
                          <div className="bitmoji-check"><Check size={10} /></div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Photo upload */}
              {photoTab === 'upload' && (
                <div className="upload-section">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handlePhotoUpload}
                  />
                  {photoPreview ? (
                    <div className="upload-preview">
                      <img src={photoPreview} alt="preview" className="upload-preview-img" />
                      <div className="upload-preview-actions">
                        <button className="upload-change-btn" onClick={() => fileRef.current?.click()}>
                          <Camera size={14} /> Change Photo
                        </button>
                        <button className="upload-remove-btn" onClick={() => setPhotoPreview(null)}>
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="upload-dropzone" onClick={() => fileRef.current?.click()}>
                      <Upload size={32} color="#64748b" />
                      <p>Click to upload your photo</p>
                      <span>JPG, PNG up to 5MB</span>
                    </div>
                  )}
                </div>
              )}

              {/* Phone */}
              <div className="settings-field">
                <label>Phone Number</label>
                <input className="field-input" placeholder="+91 XXXXX XXXXX" value={phone}
                  onChange={e => setPhone(e.target.value)} />
              </div>

              <div className="settings-field readonly">
                <label>Name</label>
                <div className="field-readonly">{user?.name}</div>
              </div>

              <div className="settings-field readonly">
                <label>Email</label>
                <div className="field-readonly">{user?.email}</div>
              </div>

              <div className="settings-field readonly">
                <label>UPI ID</label>
                <div className="field-readonly">{user?.upi_id}</div>
              </div>

              <button className="save-btn" onClick={handleSaveProfile} disabled={saving}>
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          )}

          {/* ── SECURITY ── */}
          {tab === 'security' && (
            <div className="settings-section">
              <h2>Security</h2>

              <div className="security-block">
                <h3>Change Password</h3>
                <div className="settings-field">
                  <label>Current Password</label>
                  <div className="pass-field">
                    <input className="field-input" type={showPass ? 'text' : 'password'} placeholder="Current password"
                      value={oldPass} onChange={e => setOldPass(e.target.value)} />
                    <button className="pass-toggle" onClick={() => setShowPass(s => !s)}>
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="settings-field">
                  <label>New Password</label>
                  <input className="field-input" type="password" placeholder="Min 6 characters"
                    value={newPass} onChange={e => setNewPass(e.target.value)} />
                </div>
                <button className="save-btn" onClick={handleChangePassword} disabled={saving || !oldPass || !newPass}>
                  Update Password
                </button>
              </div>

              <div className="security-block">
                <h3>Change UPI PIN</h3>
                <div className="settings-field">
                  <label>Current PIN</label>
                  <input className="field-input pin-field" type="password" maxLength={4} placeholder="• • • •"
                    value={oldPin} onChange={e => setOldPin(e.target.value.replace(/\D/g, ''))} />
                </div>
                <div className="settings-field">
                  <label>New PIN</label>
                  <input className="field-input pin-field" type="password" maxLength={4} placeholder="• • • •"
                    value={newPin} onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))} />
                </div>
                <button className="save-btn secondary" onClick={handleChangePIN} disabled={saving || !oldPin || newPin.length < 4}>
                  Update PIN
                </button>
              </div>
            </div>
          )}

          {/* ── APP LOCK ── */}
          {tab === 'applock' && (
            <div className="settings-section">
              <h2>App Lock</h2>
              <p className="section-desc">Protect your wallet with a PIN lock</p>

              {lockEnabled ? (
                <div className="lock-enabled-card">
                  <div className="lock-icon-wrap"><Lock size={28} color="#22c55e" /></div>
                  <div><h3>App Lock is ON</h3><p>Your app is protected with a PIN</p></div>
                  <button className="remove-lock-btn" onClick={handleRemoveLock}>Remove Lock</button>
                </div>
              ) : (
                <>
                  <div className="settings-field">
                    <label>Set Lock PIN</label>
                    <input className="field-input pin-field" type="password" maxLength={4} placeholder="• • • •"
                      value={lockPin} onChange={e => setLockPin(e.target.value.replace(/\D/g, ''))} />
                  </div>
                  <div className="settings-field">
                    <label>Confirm PIN</label>
                    <input className="field-input pin-field" type="password" maxLength={4} placeholder="• • • •"
                      value={confirmPin} onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))} />
                  </div>
                  <button className="save-btn" onClick={handleSetLock} disabled={lockPin.length < 4 || confirmPin.length < 4}>
                    Enable App Lock
                  </button>
                </>
              )}
            </div>
          )}

          {/* ── APPEARANCE ── */}
          {tab === 'appearance' && (
            <div className="settings-section">
              <h2>Appearance</h2>

              <div className="theme-row">
                <button className={`theme-btn ${theme === 'dark' ? 'active' : ''}`} onClick={() => setTheme('dark')}>
                  <Moon size={22} color="#38bdf8" />
                  <span>Dark</span>
                  {theme === 'dark' && <Check size={14} color="#38bdf8" className="theme-check" />}
                </button>
                <button className={`theme-btn ${theme === 'light' ? 'active' : ''}`} onClick={() => setTheme('light')}>
                  <Sun size={22} color="#fbbf24" />
                  <span>Light</span>
                  <span className="coming-soon">Coming Soon</span>
                </button>
              </div>

              <div className="app-info-card">
                <div className="app-info-row"><span>App Version</span><strong>2.0.0</strong></div>
                <div className="app-info-row"><span>Platform</span><strong>Web</strong></div>
                <div className="app-info-row"><span>University</span><strong>Poornima University, Jaipur</strong></div>
                <div className="app-info-row"><span>Support</span><strong>campuspay@poornima.edu</strong></div>
              </div>
            </div>
          )}

          {/* ── DEVELOPER ── */}
          {tab === 'developer' && <div className="settings-section dev-section">
            <div className="dev-hero">
              <div className="dev-hero-top">
                <div className="dev-ava">
                  <div className="dev-ava-ring"><div className="dev-ava-inner">EJ</div></div>
                  <div className="dev-ava-status" />
                </div>
                <div className="dev-hero-info">
                  <h2 className="dev-hero-name">Eklavya Jaiswal</h2>
                  <p className="dev-hero-title">Full Stack Developer · Security Researcher</p>
                  <span className="dev-hero-degree">🎓 BCA — Cyber Security</span>
                  <span className="dev-hero-uni">📍 Poornima University, Jaipur</span>
                </div>
              </div>
              <p className="dev-about-text">Passionate about building secure, scalable web applications. CampusPay is a complete campus fintech solution — featuring real-time payments, canteen ordering, event management and transport tracking — built with React.js, FastAPI and Firebase.</p>
            </div>
            <div className="dev-stats">
              <div className="dev-stat-box"><div className="dev-stat-num" style={{color:'#38bdf8'}}>15+</div><div className="dev-stat-lbl">Features Built</div></div>
              <div className="dev-stat-box"><div className="dev-stat-num" style={{color:'#22c55e'}}>3</div><div className="dev-stat-lbl">Canteens Live</div></div>
              <div className="dev-stat-box"><div className="dev-stat-num" style={{color:'#a78bfa'}}>2026</div><div className="dev-stat-lbl">Project Year</div></div>
            </div>
            <div className="dev-skills-card">
              <div className="dev-skills-title">Tech Stack</div>
              <div className="dev-skills-grid">
                {[{icon:'⚛️',name:'React.js'},{icon:'🐍',name:'FastAPI'},{icon:'🔥',name:'Firebase'},{icon:'🔒',name:'Cyber Sec'},{icon:'🎨',name:'UI/UX'},{icon:'☁️',name:'Cloud Deploy'}].map(s => (
                  <div key={s.name} className="dev-skill"><span className="dev-skill-icon">{s.icon}</span><span className="dev-skill-name">{s.name}</span></div>
                ))}
              </div>
            </div>
            <div className="dev-timeline">
              <div className="dev-timeline-title">Project Journey</div>
              {[{label:'Project Kickoff',sub:'Designed architecture & database schema',date:'March 2026',color:'#38bdf8'},{label:'Core Wallet System',sub:'Auth, payments, UPI integration',date:'March 2026',color:'#22c55e'},{label:'Canteen Ordering System',sub:'Real-time orders, owner panel, notifications',date:'March 2026',color:'#fbbf24'},{label:'Production Launch',sub:'Deployed on Vercel + Render',date:'March 2026',color:'#a78bfa'}].map((item,i) => (
                <div key={i} className="dev-timeline-item">
                  <div className="dev-timeline-dot-wrap"><div className="dev-timeline-dot" style={{borderColor:item.color,background:item.color+'33'}} /><div className="dev-timeline-line" /></div>
                  <div className="dev-timeline-content"><div className="dev-timeline-label">{item.label}</div><div className="dev-timeline-sub">{item.sub}</div><div className="dev-timeline-date">{item.date}</div></div>
                </div>
              ))}
            </div>
            <div className="dev-footer-card">
              <div className="dev-footer-heart">❤️</div>
              <div className="dev-footer-text">Made with passion for Poornima University</div>
              <div className="dev-footer-sub">CampusPay v2.0.0 · March 2026</div>
              <div className="dev-footer-chips">
                <span className="dev-footer-chip">⚡ FastAPI Backend</span>
                <span className="dev-footer-chip">🌐 Vercel Frontend</span>
                <span className="dev-footer-chip">🔥 Firebase DB</span>
              </div>
            </div>
          </div>}        </div>
      </div>
    </div>
  );
}
