import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Mail, Lock, User, Hash, Check, X, AlertCircle, UserPlus, RefreshCw } from 'lucide-react';
import logo from '../campuspay_logo.png';
import './Auth.css';

const RULES = [
  { id: 'length',  label: 'At least 8 characters',        test: p => p.length >= 8 },
  { id: 'upper',   label: 'One uppercase letter (A-Z)',    test: p => /[A-Z]/.test(p) },
  { id: 'lower',   label: 'One lowercase letter (a-z)',    test: p => /[a-z]/.test(p) },
  { id: 'number',  label: 'One number (0-9)',              test: p => /[0-9]/.test(p) },
  { id: 'special', label: 'One special character (!@#$%)', test: p => /[!@#$%^&*()_+\-=]/.test(p) },
];

const SUGGESTED = ['Campus@2024!', 'Poornima#9', 'SecurePass@1', 'MyWallet$7', 'CampusPay!3', 'Student@BCA2'];

function getStrength(pass) {
  const n = RULES.filter(r => r.test(pass)).length;
  if (n <= 1) return { score: n, label: 'Very Weak',   color: '#ef4444' };
  if (n === 2) return { score: n, label: 'Weak',        color: '#f97316' };
  if (n === 3) return { score: n, label: 'Fair',        color: '#eab308' };
  if (n === 4) return { score: n, label: 'Strong',      color: '#22c55e' };
  return              { score: n, label: 'Very Strong', color: '#38bdf8' };
}

export default function Register() {
  const [name,       setName]       = useState('');
  const [email,      setEmail]      = useState('');
  const [enrollment, setEnrollment] = useState('');
  const [password,   setPassword]   = useState('');
  const [showPass,   setShowPass]   = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [suggestion, setSuggestion] = useState('');
  const { register, login } = useAuth();
  const navigate     = useNavigate();

  const strength       = getStrength(password);
  const allPassed      = RULES.every(r => r.test(password));

  useEffect(() => { newSuggestion(); }, []);

  const newSuggestion = () => setSuggestion(SUGGESTED[Math.floor(Math.random() * SUGGESTED.length)]);

  const useSuggestion = () => { setPassword(suggestion); setShowPass(true); newSuggestion(); };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!allPassed) { setError('Please meet all password requirements'); return; }
    setError('');
    setLoading(true);
    try {
      await register({ name, email, password, enrollment_no: enrollment });
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Try again.');
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-glow" />
      <div className="auth-card auth-card-wide">
        <div className="auth-logo-wrap">
          <img src={logo} alt="CampusPay" className="auth-logo" />
        </div>
        <div className="auth-heading">
          <h1>Create account</h1>
          <p>Join CampusPay — your campus wallet</p>
        </div>

        <button className="google-btn" type="button"
          onClick={() => setError('Google signup coming soon! Use email for now.')}>
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 002.38-5.88c0-.57-.05-.66-.15-1.18z"/>
            <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 01-7.18-2.54H1.83v2.07A8 8 0 008.98 17z"/>
            <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 010-3.04V5.41H1.83a8 8 0 000 7.18l2.67-2.07z"/>
            <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 001.83 5.4L4.5 7.49a4.77 4.77 0 014.48-3.3z"/>
          </svg>
          Sign up with Google
        </button>

        <div className="auth-divider"><span>or create with email</span></div>

        {error && <div className="auth-error"><AlertCircle size={15} /> {error}</div>}

        <form onSubmit={handleRegister} className="auth-form">
          <div className="auth-form-grid">
            <div className="auth-field">
              <label>Full Name</label>
              <div className="auth-input-wrap">
                <User size={16} className="auth-input-icon" />
                <input type="text" placeholder="Your full name"
                  value={name} onChange={e => setName(e.target.value)} required />
              </div>
            </div>
            <div className="auth-field">
              <label>Enrollment Number</label>
              <div className="auth-input-wrap">
                <Hash size={16} className="auth-input-icon" />
                <input type="text" placeholder="e.g. 2024BCA101"
                  value={enrollment} onChange={e => setEnrollment(e.target.value)} required />
              </div>
            </div>
          </div>

          <div className="auth-field">
            <label>Email address</label>
            <div className="auth-input-wrap">
              <Mail size={16} className="auth-input-icon" />
              <input type="email" placeholder="you@poornima.edu"
                value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
          </div>

          <div className="auth-field">
            <label>Password</label>
            <div className="auth-input-wrap">
              <Lock size={16} className="auth-input-icon" />
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Create a strong password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <button type="button" className="auth-eye-btn" onClick={() => setShowPass(s => !s)}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <label className="auth-checkbox">
              <input type="checkbox" checked={showPass} onChange={e => setShowPass(e.target.checked)} />
              <span>Show password</span>
            </label>

            {/* Strength meter */}
            {password.length > 0 && (
              <div className="strength-meter">
                <div className="strength-bar-row">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="strength-segment"
                      style={{ background: i <= strength.score ? strength.color : '#1e293b' }} />
                  ))}
                  <span className="strength-label" style={{ color: strength.color }}>
                    {strength.label}
                  </span>
                </div>
                <div className="strength-rules">
                  {RULES.map(rule => {
                    const ok = rule.test(password);
                    return (
                      <div key={rule.id} className={`strength-rule ${ok ? 'passed' : ''}`}>
                        {ok ? <Check size={12} color="#22c55e" /> : <X size={12} color="#475569" />}
                        <span>{rule.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Suggestion */}
            <div className="password-suggestion">
              <div className="suggestion-label">💡 Suggested strong password</div>
              <div className="suggestion-row">
                <code className="suggestion-pass">{suggestion}</code>
                <div className="suggestion-actions">
                  <button type="button" className="suggestion-use-btn" onClick={useSuggestion}>Use this</button>
                  <button type="button" className="suggestion-refresh-btn" onClick={newSuggestion}>
                    <RefreshCw size={12} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <button type="submit" className="auth-submit-btn"
            disabled={loading || !name || !email || !enrollment || !allPassed}>
            {loading
              ? <><span className="auth-spinner" /> Creating account...</>
              : <><UserPlus size={16} /> Create Account</>}
          </button>

          {!allPassed && password.length > 0 && (
            <p className="auth-pass-warning">⚠️ Meet all password requirements above to continue</p>
          )}
        </form>

        <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  );
}
