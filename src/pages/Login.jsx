import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Mail, Lock, LogIn, AlertCircle } from 'lucide-react';
import logo from '../campuspay_logo.png';
import './Auth.css';

export default function Login() {
  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [showPass,    setShowPass]    = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const { login }     = useAuth();
  const navigate      = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password');
    }
    setLoading(false);
  };

  const handleGoogleLogin = () => {
    // Google OAuth — show info for now
    setError('Google login coming soon! Use email/password for now.');
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-glow" />

      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo-wrap">
          <img src={logo} alt="CampusPay" className="auth-logo" />
        </div>

        <div className="auth-heading">
          <h1>Welcome back</h1>
          <p>Sign in to your CampusPay account</p>
        </div>

        {/* Google login */}
        <button className="google-btn" onClick={handleGoogleLogin} type="button">
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 002.38-5.88c0-.57-.05-.66-.15-1.18z"/>
            <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 01-7.18-2.54H1.83v2.07A8 8 0 008.98 17z"/>
            <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 010-3.04V5.41H1.83a8 8 0 000 7.18l2.67-2.07z"/>
            <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 001.83 5.4L4.5 7.49a4.77 4.77 0 014.48-3.3z"/>
          </svg>
          Continue with Google
        </button>

        <div className="auth-divider"><span>or sign in with email</span></div>

        {error && (
          <div className="auth-error">
            <AlertCircle size={15} />
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="auth-form">
          {/* Email */}
          <div className="auth-field">
            <label>Email address</label>
            <div className="auth-input-wrap">
              <Mail size={16} className="auth-input-icon" />
              <input
                type="email"
                placeholder="you@poornima.edu"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password */}
          <div className="auth-field">
            <div className="auth-field-header">
              <label>Password</label>
              <Link to="/forgot-password" className="auth-forgot">Forgot password?</Link>
            </div>
            <div className="auth-input-wrap">
              <Lock size={16} className="auth-input-icon" />
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button type="button" className="auth-eye-btn" onClick={() => setShowPass(s => !s)}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {/* Show password checkbox */}
            <label className="auth-checkbox">
              <input type="checkbox" checked={showPass} onChange={e => setShowPass(e.target.checked)} />
              <span>Show password</span>
            </label>
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading || !email || !password}>
            {loading ? (
              <><span className="auth-spinner" /> Signing in...</>
            ) : (
              <><LogIn size={16} /> Sign In</>
            )}
          </button>
        </form>

        <p className="auth-switch">
          Don't have an account? <Link to="/register">Create account</Link>
        </p>

        {/* Demo accounts */}
        <div className="auth-demo">
          <div className="auth-demo-title">Demo accounts</div>
          <div className="auth-demo-grid">
            {[
              { label: 'Student',  email: 'eklavya@test.com',        pass: 'test123' },
              { label: 'Admin',    email: 'admin@poornima.edu',       pass: 'Admin@123' },
            ].map(d => (
              <button key={d.label} className="auth-demo-btn"
                onClick={() => { setEmail(d.email); setPassword(d.pass); }}>
                <span className="demo-label">{d.label}</span>
                <span className="demo-email">{d.email}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
