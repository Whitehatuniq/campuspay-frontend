import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Send, ClipboardList, FileText,
  Settings, ShieldCheck, LogOut, Bus
} from 'lucide-react';
import NotificationBell from './NotificationBell';
import logo from '../campuspay_logo.png';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  if (!user) return null;

  const navLinks = [
    { path: '/dashboard',    label: 'Dashboard',    icon: LayoutDashboard },
    { path: '/pay',          label: 'Pay',          icon: Send },
    { path: '/transactions', label: 'History',      icon: ClipboardList },
    { path: '/statement',    label: 'Statement',    icon: FileText },
    { path: '/settings',     label: 'Settings',     icon: Settings },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-brand" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
        <img src={logo} alt="CampusPay" className="navbar-logo" />
      </div>

      <div className="navbar-links">
        {navLinks.map(({ path, label, icon: Icon }) => (
          <NavLink key={path} to={path} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Icon size={16} strokeWidth={2} />
            <span>{label}</span>
          </NavLink>
        ))}

        {user?.role === 'admin' && (
          <>
            <NavLink to="/admin-dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <ShieldCheck size={16} strokeWidth={2} />
              <span>Dashboard</span>
            </NavLink>
            <NavLink to="/admin-manage" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Settings size={16} strokeWidth={2} />
              <span>Manage</span>
            </NavLink>
          </>
        )}
      </div>

      <div className="navbar-user">
        {user?.role === 'student' && <NotificationBell />}
        <span className="user-name">{user?.name || 'Student'}</span>
        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={14} strokeWidth={2} />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
}
