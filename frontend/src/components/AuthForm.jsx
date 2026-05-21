import React, { useState } from 'react';
import { Link2, ShieldCheck, Mail, Lock, User, Sparkles } from 'lucide-react';

const API_BASE = '/api';

export default function AuthForm({ onAuthSuccess, onBackToHome }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Please fill in all fields');
      return;
    }

    setError('');
    setLoading(true);

    const endpoint = isLogin ? '/auth/login' : '/auth/register';

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      // Success
      localStorage.setItem('auralink_user', JSON.stringify(data.user));
      onAuthSuccess(data.user.username);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="gradient-bg-effect"></div>
      
      {/* Mini Nav */}
      <nav className="navbar" style={{ borderBottom: 'none', background: 'transparent' }}>
        <div className="nav-brand" style={{ cursor: 'pointer' }} onClick={onBackToHome}>
          <Link2 size={24} />
          <span>AuraLink</span>
        </div>
        <button onClick={onBackToHome} className="btn-text">Back to Home</button>
      </nav>

      <div className="auth-wrapper">
        <h2 className="auth-title">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>
        <p className="auth-subtitle">
          {isLogin ? 'Access your dashboard and link analytics' : 'Start building your premium link-in-bio page for free'}
        </p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Choose Username</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>@</span>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                className="input-control" 
                style={{ paddingLeft: '2rem', width: '100%' }}
                placeholder="username"
                required
              />
            </div>
            {!isLogin && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Letters, numbers, and underscores only. Min 3 chars.</span>}
          </div>

          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label>Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-control" 
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Free Page'}
          </button>
        </form>

        <div className="auth-toggle">
          {isLogin ? (
            <span>New to AuraLink? <button onClick={() => { setIsLogin(false); setError(''); }}>Create free page</button></span>
          ) : (
            <span>Already have a page? <button onClick={() => { setIsLogin(true); setError(''); }}>Sign In</button></span>
          )}
        </div>
      </div>
    </div>
  );
}
