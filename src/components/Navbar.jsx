import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../campuspay_logo.png';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => { logout(); navigate('/login'); };
  const isActive = (path) => location.pathname === path ? 'active' : '';

  if (!user) return null;

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <img src={logo} alt="CampusPay" className="brand-logo" />
        <span className="brand-name">CampusPay</span>
      </div>
      <div className="navbar-links">
        <Link to="/dashboard"    className={isActive('/dashboard')}>Dashboard</Link>
        <Link to="/pay"          className={isActive('/pay')}>Pay</Link>
        <Link to="/transactions" className={isActive('/transactions')}>History</Link>
        <Link to="/exam-fee"     className={isActive('/exam-fee')}>Fees</Link>
        <Link to="/event-fee"    className={isActive('/event-fee')}>Events</Link>
        <Link to="/canteen"      className={isActive('/canteen')}>🍽️ Canteen</Link>
        <Link to="/qr-scanner" className={isActive("/qr-scanner")}>📷 Scan QR</Link>
        <Link to="/statement" className={isActive("/statement")}>📄 Statement</Link>
        <Link to="/settings"     className={isActive('/settings')}>⚙️ Settings</Link>
        {user.role === 'admin' && (
          <Link to="/admin-dashboard" className={isActive('/admin')}>Admin</Link>
        )}
      </div>
      <div className="navbar-user">
        <span className="user-name">Hi, {user.name?.split(' ')[0]}</span>
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
}
