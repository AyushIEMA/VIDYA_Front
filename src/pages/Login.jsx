import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import './Auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await api.post('/auth/login', { email, password });
      const normalizedRole = (data?.user?.role || '').toString().trim().toLowerCase();
      const normalizedUser = { ...data.user, role: normalizedRole };
      login(data.token, normalizedUser, data.profile);

      if (data?.forceReset) {
        navigate(`/forgot-password?email=${encodeURIComponent(email)}`);
        return;
      }

      if (normalizedRole === 'teacher') {
        navigate('/teacher/dashboard');
        return;
      }

      if (normalizedRole === 'student') {
        navigate('/student/dashboard');
        return;
      }

      if (normalizedRole === 'org_admin') {
        navigate('/org-admin/dashboard');
        return;
      }

      if (normalizedRole === 'org_teacher') {
        navigate('/org-teacher/batches');
        return;
      }

      setError(`Role "${normalizedRole || 'unknown'}" is not configured in UI yet.`);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <Link to="/" className="auth-back">← Back to home</Link>
          <h1>Welcome Back</h1>
          <p className="subtitle">Login to your Vidya account</p>

          {error && <div className="error-box">{error}</div>}

          <form onSubmit={handleSubmit} autoComplete="off">
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="off"
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="password-field">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPw(!showPw)}
                >
                  {showPw ? (
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M3 3l18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <path d="M10.6 10.6a3 3 0 004.24 4.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <path d="M9.88 5.1A10.5 10.5 0 0112 4.8c6.6 0 10 7.2 10 7.2a19.6 19.6 0 01-3.4 4.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <path d="M6.1 6.1C3.9 8 2 12 2 12s3.4 7.2 10 7.2c1.5 0 2.8-.3 4-.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M2 12s3.5-7.2 10-7.2S22 12 22 12s-3.5 7.2-10 7.2S2 12 2 12z" stroke="currentColor" strokeWidth="2" />
                      <path d="M12 15.2a3.2 3.2 0 100-6.4 3.2 3.2 0 000 6.4z" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <Link to="/forgot-password" className="forgot-link">Forgot Password?</Link>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <p className="auth-footer">
            Don't have an account? <Link to="/register">Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
