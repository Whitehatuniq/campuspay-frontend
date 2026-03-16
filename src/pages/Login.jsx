import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Mail, Lock, LogIn, AlertCircle } from 'lucide-react';
import logo from '../campuspay_logo.png';
import './Auth.css';

export default function Login() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const { login }  = useAuth();
  const navigate   = useNavigate();

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

  return (
    <div className="auth-page">
      <div className="auth-bg-glow" />
      <div className="auth-card">
        <div className="auth-logo-wrap">
          <img src={logo} alt="CampusPay" className="auth-logo" />
        </div>
        <div className="auth-heading">
          <h1>Welcome back</h1>
          <p>Sign in to your CampusPay account</p>
        </div>
        {error && (
          <div className="auth-error">
            <AlertCircle size={15} />
            {error}
          </div>
        )}
        <form onSubmit={handleLogin} className="auth-form">
          <div className="auth-field">
            <label>Email address</label>
            <div className="auth-input-wrap">
              <Mail size={16} className="auth-input-icon" />
              <input type="email" placeholder="you@poornima.edu"
                value={email} onChange={e => setEmail(e.target.value)}
                required autoComplete="email" />
            </div>
          </div>
          <div className="auth-field">
            <div className="auth-field-header">
              <label>Password</label>
              <Link to="/forgot-password" className="auth-forgot">Forgot password?</Link>
            </div>
            <div className="auth-input-wrap">
              <Lock size={16} className="auth-input-icon" />
              <input type={showPass ? 'text' : 'password'} placeholder="Enter your password"
                value={password} onChange={e => setPassword(e.target.value)}
                required autoComplete="current-password" />
              <button type="button" className="auth-eye-btn" onClick={() => setShowPass(s => !s)}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button type="submit" className="auth-submit-btn" disabled={loading || !email || !password}>
            {loading ? <><span className="auth-spinner" /> Signing in...</> : <><LogIn size={16} /> Sign In</>}
          </button>
        </form>
        <p className="auth-switch">
          Don't have an account? <Link to="/register">Create account</Link>
        </p>
      </div>
    </div>
  );
}
