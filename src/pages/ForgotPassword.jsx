import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle, AlertCircle, KeyRound } from 'lucide-react';
import API from '../api/axios';
import logo from '../campuspay_logo.png';
import './Auth.css';

export default function ForgotPassword() {
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await API.post('/api/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong. Please try again.');
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
        {!sent ? (
          <>
            <div className="auth-heading">
              <h1>Forgot Password?</h1>
              <p>Enter your email and we'll send a reset link</p>
            </div>
            {error && <div className="auth-error"><AlertCircle size={15} />{error}</div>}
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-field">
                <label>Email address</label>
                <div className="auth-input-wrap">
                  <Mail size={16} className="auth-input-icon" />
                  <input type="email" placeholder="you@poornima.edu" value={email}
                    onChange={e => setEmail(e.target.value)} required autoFocus />
                </div>
              </div>
              <button type="submit" className="auth-submit-btn" disabled={loading || !email}>
                {loading ? <><span className="auth-spinner" /> Sending...</> : <><Mail size={16} /> Send Reset Link</>}
              </button>
            </form>
            <p className="auth-switch">
              <Link to="/login" style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                <ArrowLeft size={14} /> Back to Sign In
              </Link>
            </p>
          </>
        ) : (
          <div className="forgot-success">
            <CheckCircle size={56} color="#22c55e" style={{ marginBottom: 12 }} />
            <h2 style={{ color: '#f1f5f9', margin: '0 0 8px' }}>Check your email!</h2>
            <p style={{ color: '#64748b', fontSize: 13, margin: '0 0 12px' }}>Password reset link sent to</p>
            <div style={{ background: '#1e293b', borderRadius: 10, padding: '10px 20px', color: '#38bdf8', fontWeight: 600, marginBottom: 16 }}>{email}</div>
            <p style={{ color: '#475569', fontSize: 12, textAlign: 'center', lineHeight: 1.6 }}>Click the link in your email to reset your password. Check spam if you don't see it.</p>
            <Link to="/login" className="auth-submit-btn" style={{ textDecoration: 'none', marginTop: 8 }}>
              <ArrowLeft size={16} /> Back to Sign In
            </Link>
            <button onClick={() => { setSent(false); setError(''); }}
              style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 13, cursor: 'pointer', marginTop: 8 }}>
              Didn't receive it? Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
