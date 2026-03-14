import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
        <span className="brand-icon">🎓</span>
        <span className="brand-name">CampusPay</span>
      </div>
      <div className="navbar-links">
        <Link to="/dashboard"    className={isActive('/dashboard')}>Dashboard</Link>
        <Link to="/pay"          className={isActive('/pay')}>Pay</Link>
        <Link to="/transactions" className={isActive('/transactions')}>History</Link>
        <Link to="/exam-fee"     className={isActive('/exam-fee')}>Fees</Link>
        <Link to="/event-fee"    className={isActive('/event-fee')}>Events</Link>
        <Link to="/canteen"      className={isActive('/canteen')}>🍽️ Canteen</Link>
        {user.role === 'admin' && (
          <Link to="/admin" className={isActive('/admin')}>Admin</Link>
        )}
      </div>
      <div className="navbar-user">
        <span className="user-name">Hi, {user.name?.split(' ')[0]}</span>
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
}
