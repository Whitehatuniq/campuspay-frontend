import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Mail, Lock, AlertCircle, GraduationCap, ShieldCheck, UtensilsCrossed, ArrowLeft } from 'lucide-react';
import './Login.css';

const ROLES = [
  {
    id:       'student',
    label:    'Student / Faculty',
    desc:     'Access your campus wallet, fees & services',
    icon:     GraduationCap,
    color:    '#38bdf8',
    bg:       '#0c274422',
    border:   '#38bdf833',
    gradient: 'linear-gradient(135deg, #0c1f35, #0a1628)',
  },
  {
    id:       'admin',
    label:    'Admin Panel',
    desc:     'Manage users, fees, events & canteen',
    icon:     ShieldCheck,
    color:    '#a78bfa',
    bg:       '#4c1d9522',
    border:   '#a78bfa33',
    gradient: 'linear-gradient(135deg, #1a0f35, #120a28)',
  },
  {
    id:       'canteen_owner',
    label:    'Canteen Panel',
    desc:     'View & manage your canteen orders',
    icon:     UtensilsCrossed,
    color:    '#fbbf24',
    bg:       '#78350f22',
    border:   '#fbbf2433',
    gradient: 'linear-gradient(135deg, #1a1008, #120c04)',
  },
];

export default function Login() {
  const [selectedRole, setSelectedRole] = useState(null);
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const { login }  = useAuth();
  const navigate   = useNavigate();

  const role = ROLES.find(r => r.id === selectedRole);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const userData = await login(email, password);
      const userRole = userData?.role || 'student';

      // Validate role matches selection
      if (selectedRole === 'admin' && userRole !== 'admin') {
        setError('This account does not have admin access.');
        setLoading(false);
        return;
      }
      if (selectedRole === 'canteen_owner' && userRole !== 'canteen_owner') {
        setError('This account does not have canteen owner access.');
        setLoading(false);
        return;
      }
      if (selectedRole === 'student' && !['student', 'faculty'].includes(userRole)) {
        setError('Please use the correct login panel for your role.');
        setLoading(false);
        return;
      }

      // Redirect based on role
      if (userRole === 'canteen_owner') navigate('/canteen-panel');
      else if (userRole === 'admin')    navigate('/admin-dashboard');
      else                              navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password');
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      {/* Background */}
      <div className="login-bg">
        <div className="login-bg-glow g1" />
        <div className="login-bg-glow g2" />
        <div className="login-bg-grid" />
      </div>

      <div className="login-container">
        {/* Logo */}
        <div className="login-logo-wrap">
          <div className="login-logo-icon">
            <GraduationCap size={28} color="#38bdf8" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="login-logo-name">CampusPay</h1>
            <p className="login-logo-sub">Poornima University</p>
          </div>
        </div>

        {!selectedRole ? (
          /* ── Role Selection ── */
          <div className="role-select-wrap">
            <div className="role-select-header">
              <h2>Welcome back</h2>
              <p>Choose your login type to continue</p>
            </div>

            <div className="role-cards">
              {ROLES.map(r => {
                const Icon = r.icon;
                return (
                  <button key={r.id} className="role-card"
                    style={{ '--c': r.color, '--bg': r.bg, '--bd': r.border, background: r.gradient }}
                    onClick={() => setSelectedRole(r.id)}>
                    <div className="role-card-icon" style={{ background: r.bg, border: `1px solid ${r.border}` }}>
                      <Icon size={26} color={r.color} strokeWidth={1.5} />
                    </div>
                    <div className="role-card-info">
                      <div className="role-card-label" style={{ color: r.color }}>{r.label}</div>
                      <div className="role-card-desc">{r.desc}</div>
                    </div>
                    <div className="role-card-arrow" style={{ color: r.color }}>›</div>
                  </button>
                );
              })}
            </div>

            <p className="login-register-link">
              New student? <Link to="/register">Create account</Link>
            </p>
          </div>
        ) : (
          /* ── Login Form ── */
          <div className="login-form-wrap">
            <button className="login-back-btn" onClick={() => { setSelectedRole(null); setError(''); setEmail(''); setPassword(''); }}>
              <ArrowLeft size={16} /> Back
            </button>

            <div className="login-form-header">
              <div className="login-role-badge" style={{ background: role.bg, border: `1px solid ${role.border}`, color: role.color }}>
                <role.icon size={14} strokeWidth={1.5} />
                {role.label}
              </div>
              <h2>Sign in</h2>
              <p>Enter your credentials to access {role.label}</p>
            </div>

            {error && (
              <div className="login-error">
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="login-form">
              <div className="login-field">
                <label>Email address</label>
                <div className="login-input-wrap">
                  <Mail size={15} className="login-input-icon" />
                  <input type="email" placeholder={
                    selectedRole === 'admin' ? 'admin@poornima.edu'
                    : selectedRole === 'canteen_owner' ? 'pu.canteen@poornima.edu'
                    : 'you@poornima.edu'
                  }
                    value={email} onChange={e => setEmail(e.target.value)}
                    required autoComplete="email" />
                </div>
              </div>

              <div className="login-field">
                <div className="login-field-top">
                  <label>Password</label>
                  {selectedRole === 'student' && (
                    <Link to="/forgot-password" className="login-forgot">Forgot password?</Link>
                  )}
                </div>
                <div className="login-input-wrap">
                  <Lock size={15} className="login-input-icon" />
                  <input type={showPass ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password} onChange={e => setPassword(e.target.value)}
                    required autoComplete="current-password" />
                  <button type="button" className="login-eye" onClick={() => setShowPass(s => !s)}>
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="login-submit"
                style={{ background: role.color }}
                disabled={loading || !email || !password}>
                {loading ? (
                  <><span className="login-spinner" /> Signing in...</>
                ) : (
                  `Sign in to ${role.label}`
                )}
              </button>
            </form>

            {selectedRole === 'student' && (
              <p className="login-register-link">
                New student? <Link to="/register">Create account</Link>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
