import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Flame } from 'lucide-react';

export default function Register() {
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  function set(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) return setError('Passwords do not match.');
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');
    setLoading(true);
    const { error } = await signUp(form.email, form.password, form.fullName);
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 2000);
    }
  }

  if (success) {
    return (
      <div className="auth-page" style={{ alignItems: 'center', textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 20 }}>🎉</div>
        <h2 style={{ fontSize: 24, fontWeight: 700 }}>Account created!</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>Redirecting you to the app…</p>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-logo">
        <div className="auth-logo-icon">
          <Flame size={22} color="white" />
        </div>
        <div className="auth-logo-text">Cal<span>Track</span></div>
      </div>

      <h1 className="auth-heading">Get started</h1>
      <p className="auth-sub">Create your free account and start tracking.</p>

      <form className="auth-form" onSubmit={handleSubmit}>
        {error && <div className="auth-error">{error}</div>}

        <div className="input-group">
          <label className="input-label">Full Name</label>
          <input
            className="input"
            type="text"
            placeholder="Alex Johnson"
            value={form.fullName}
            onChange={set('fullName')}
            required
          />
        </div>

        <div className="input-group">
          <label className="input-label">Email</label>
          <input
            className="input"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={set('email')}
            required
            autoComplete="email"
          />
        </div>

        <div className="input-group">
          <label className="input-label">Password</label>
          <input
            className="input"
            type="password"
            placeholder="Min. 6 characters"
            value={form.password}
            onChange={set('password')}
            required
            autoComplete="new-password"
          />
        </div>

        <div className="input-group">
          <label className="input-label">Confirm Password</label>
          <input
            className="input"
            type="password"
            placeholder="••••••••"
            value={form.confirm}
            onChange={set('confirm')}
            required
          />
        </div>

        <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
          {loading ? 'Creating account…' : 'Create Account'}
        </button>
      </form>

      <div className="auth-footer">
        Already have an account?{' '}
        <Link to="/login">Sign in</Link>
      </div>
    </div>
  );
}
