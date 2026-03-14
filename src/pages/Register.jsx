import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import './Auth.css';

export default function Register() {
  const [form, setForm] = useState({
    name: '', email: '', password: '', enrollment_no: '', phone: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await API.post('/api/auth/register', { ...form, role: 'student' });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-logo">🎓</span>
          <h1>CampusPay</h1>
          <p>Create your student account</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" placeholder="Eklavya Jaiswal" value={form.name} onChange={set('name')} required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" placeholder="you@poornima.edu" value={form.email} onChange={set('email')} required />
          </div>
          <div className="form-group">
            <label>Enrollment Number</label>
            <input type="text" placeholder="2021BCA001" value={form.enrollment_no} onChange={set('enrollment_no')} />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input type="tel" placeholder="9876543210" value={form.phone} onChange={set('phone')} />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" placeholder="Create a password" value={form.password} onChange={set('password')} required />
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
