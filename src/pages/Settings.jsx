import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import './Settings.css';

const AVATARS = [
  '👨‍💻', '👩‍💻', '🧑‍💻', '👨‍🎓', '👩‍🎓', '🧑‍🎓',
  '🦊', '🐼', '🐨', '🦁', '🐯', '🦊',
  '🧑‍🚀', '👨‍🎨', '👩‍🎨', '🧙', '🦸', '🧛'
];

export default function Settings() {
  const { user, login } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [status, setStatus] = useState(null);

  // Profile state
  const [avatar, setAvatar] = useState(user?.avatar || '👨‍💻');
  const [phone, setPhone] = useState(user?.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Security state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingPin, setSavingPin] = useState(false);

  // App lock state
  const [appLockEnabled, setAppLockEnabled] = useState(
    localStorage.getItem('appLockEnabled') === 'true'
  );
  const [lockPin, setLockPin] = useState('');
  const [confirmLockPin, setConfirmLockPin] = useState('');

  // Theme state
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const showStatus = (type, msg) => {
    setStatus({ type, msg });
    setTimeout(() => setStatus(null), 3000);
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      await API.patch('/api/auth/update-profile', { phone, avatar });
      const updatedUser = { ...user, phone, avatar };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      login(updatedUser, localStorage.getItem('token'));
      showStatus('success', 'Profile updated successfully!');
    } catch (err) {
      showStatus('error', err.response?.data?.detail || 'Update failed.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setSavingPassword(true);
    try {
      await API.post(`/api/auth/change-password?old_password=${oldPassword}&new_password=${newPassword}`);
      showStatus('success', 'Password changed successfully!');
      setOldPassword(''); setNewPassword('');
    } catch (err) {
      showStatus('error', err.response?.data?.detail || 'Failed to change password.');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleChangePin = async (e) => {
    e.preventDefault();
    setSavingPin(true);
    try {
      await API.post(`/api/wallet/change-pin?old_pin=${oldPin}&new_pin=${newPin}`);
      showStatus('success', 'UPI PIN changed successfully!');
      setOldPin(''); setNewPin('');
    } catch (err) {
      showStatus('error', err.response?.data?.detail || 'Failed to change PIN.');
    } finally {
      setSavingPin(false);
    }
  };

  const handleSetAppLock = (e) => {
    e.preventDefault();
    if (lockPin.length < 4) { showStatus('error', 'PIN must be at least 4 digits'); return; }
    if (lockPin !== confirmLockPin) { showStatus('error', 'PINs do not match'); return; }
    localStorage.setItem('appLockPin', lockPin);
    localStorage.setItem('appLockEnabled', 'true');
    setAppLockEnabled(true);
    setLockPin(''); setConfirmLockPin('');
    showStatus('success', 'App lock enabled!');
  };

  const handleDisableAppLock = () => {
    localStorage.removeItem('appLockPin');
    localStorage.setItem('appLockEnabled', 'false');
    setAppLockEnabled(false);
    showStatus('success', 'App lock disabled.');
  };

  const TABS = [
    { id: 'profile',   label: '👤 Profile' },
    { id: 'security',  label: '🔐 Security' },
    { id: 'applock',   label: '🔒 App Lock' },
    { id: 'theme',     label: '🎨 Appearance' },
  ];

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h2>Settings</h2>
        <p>Manage your account and preferences</p>
      </div>

      {status && (
        <div className={`settings-status ${status.type}`}>
          {status.type === 'success' ? '✅' : '❌'} {status.msg}
        </div>
      )}

      <div className="settings-layout">
        {/* Sidebar */}
        <div className="settings-sidebar">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="settings-content">

          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="settings-section">
              <h3>Profile</h3>

              {/* Current avatar display */}
              <div className="avatar-display">
                <span className="avatar-big">{avatar}</span>
                <div>
                  <div className="avatar-name">{user?.name}</div>
                  <div className="avatar-email">{user?.email}</div>
                  <div className="avatar-enroll">{user?.enrollment_no}</div>
                </div>
              </div>

              {/* Avatar picker */}
              <div className="form-group">
                <label>Choose Avatar</label>
                <div className="avatar-grid">
                  {AVATARS.map((av, i) => (
                    <button
                      key={i}
                      className={`avatar-option ${avatar === av ? 'selected' : ''}`}
                      onClick={() => setAvatar(av)}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="9876543210"
                  maxLength={10}
                />
              </div>

              <button className="save-btn" onClick={handleSaveProfile} disabled={savingProfile}>
                {savingProfile ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          )}

          {/* SECURITY TAB */}
          {activeTab === 'security' && (
            <div className="settings-section">
              <h3>Security</h3>

              <div className="security-info">
                🛡️ Your account is protected with JWT authentication and bcrypt encryption.
              </div>

              {/* Change Password */}
              <div className="sub-section">
                <h4>Change Password</h4>
                <form onSubmit={handleChangePassword}>
                  <div className="form-group">
                    <label>Current Password</label>
                    <input type="password" value={oldPassword}
                      onChange={e => setOldPassword(e.target.value)} required placeholder="Current password" />
                  </div>
                  <div className="form-group">
                    <label>New Password</label>
                    <input type="password" value={newPassword}
                      onChange={e => setNewPassword(e.target.value)} required placeholder="New password (min 8 chars)" minLength={8} />
                  </div>
                  <button type="submit" className="save-btn" disabled={savingPassword}>
                    {savingPassword ? 'Changing...' : 'Change Password'}
                  </button>
                </form>
              </div>

              {/* Change UPI PIN */}
              <div className="sub-section">
                <h4>Change UPI PIN</h4>
                <form onSubmit={handleChangePin}>
                  <div className="form-group">
                    <label>Current PIN</label>
                    <input type="password" value={oldPin}
                      onChange={e => setOldPin(e.target.value)} required placeholder="Current PIN" maxLength={6} />
                  </div>
                  <div className="form-group">
                    <label>New PIN (4-6 digits)</label>
                    <input type="password" value={newPin}
                      onChange={e => setNewPin(e.target.value)} required placeholder="New PIN" maxLength={6} />
                  </div>
                  <button type="submit" className="save-btn" disabled={savingPin}>
                    {savingPin ? 'Changing...' : 'Change UPI PIN'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* APP LOCK TAB */}
          {activeTab === 'applock' && (
            <div className="settings-section">
              <h3>App Lock</h3>
              <p className="section-desc">Set a PIN to lock the app when you leave</p>

              <div className={`lock-status ${appLockEnabled ? 'enabled' : 'disabled'}`}>
                {appLockEnabled ? '🔒 App Lock is ON' : '🔓 App Lock is OFF'}
              </div>

              {!appLockEnabled ? (
                <form onSubmit={handleSetAppLock}>
                  <div className="form-group">
                    <label>Set Lock PIN (4-6 digits)</label>
                    <input type="password" value={lockPin}
                      onChange={e => setLockPin(e.target.value)} placeholder="Enter PIN" maxLength={6} required />
                  </div>
                  <div className="form-group">
                    <label>Confirm PIN</label>
                    <input type="password" value={confirmLockPin}
                      onChange={e => setConfirmLockPin(e.target.value)} placeholder="Confirm PIN" maxLength={6} required />
                  </div>
                  <button type="submit" className="save-btn">Enable App Lock</button>
                </form>
              ) : (
                <button className="danger-btn" onClick={handleDisableAppLock}>
                  Disable App Lock
                </button>
              )}
            </div>
          )}

          {/* THEME TAB */}
          {activeTab === 'theme' && (
            <div className="settings-section">
              <h3>Appearance</h3>
              <p className="section-desc">Choose your preferred theme</p>

              <div className="theme-options">
                {[
                  { value: 'dark',  label: 'Dark Mode',  icon: '🌙', desc: 'Easy on the eyes at night' },
                  { value: 'light', label: 'Light Mode',  icon: '☀️', desc: 'Clean and bright look' },
                ].map(t => (
                  <div
                    key={t.value}
                    className={`theme-card ${theme === t.value ? 'selected' : ''}`}
                    onClick={() => setTheme(t.value)}
                  >
                    <span className="theme-icon">{t.icon}</span>
                    <div>
                      <div className="theme-label">{t.label}</div>
                      <div className="theme-desc">{t.desc}</div>
                    </div>
                    {theme === t.value && <span className="theme-check">✅</span>}
                  </div>
                ))}
              </div>

              <div className="app-info">
                <h4>App Information</h4>
                <div className="info-row"><span>App Name</span><span>CampusPay</span></div>
                <div className="info-row"><span>Version</span><span>1.0.0</span></div>
                <div className="info-row"><span>University</span><span>Poornima University</span></div>
                <div className="info-row"><span>Developer</span><span>Eklavya Jaiswal</span></div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
