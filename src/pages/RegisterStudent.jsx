import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import './Auth.css';

const normPhone = (v) => String(v || '').replace(/\D/g, '');

const RegisterStudent = () => {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', address: '',
    mobile: '', whatsapp: '', parentWhatsapp: '', parentCall: '', class: '', board: 'CBSE'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const mStudent = normPhone(formData.mobile);
    const mParent = normPhone(formData.parentWhatsapp);
    if (mStudent && mParent && mStudent === mParent) {
      setError('Parent WhatsApp must be different from your mobile number.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        mobile: '+91' + formData.mobile,
        whatsapp: '+91' + formData.whatsapp,
        parentWhatsapp: '+91' + formData.parentWhatsapp,
        parentCall: '+91' + formData.parentCall
      };

      const { data } = await api.post('/auth/register/student', payload);
      login(data.token, data.user, data.student);
      navigate('/student/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <Link to="/" className="auth-back">← Back to home</Link>
          <h1>Student Registration</h1>
          <p className="subtitle">Create your account</p>

          {error && <div className="error-box">{error}</div>}

          <form onSubmit={handleSubmit} autoComplete="off">
            <div className="form-group">
              <label>Full Name</label>
              <input name="name" value={formData.name} onChange={handleChange} required autoComplete="off" />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required autoComplete="off" />
            </div>
            <div className="form-group">
              <label>Password</label>
              <div className="password-field">
                <input
                  type={showPw ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
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
            <div className="form-group">
              <label>Address</label>
              <input name="address" value={formData.address} onChange={handleChange} required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Class</label>
                <select name="class" value={formData.class} onChange={handleChange} required>
                  <option value="">Select Class</option>
                  {[...Array(12)].map((_, i) => (
                    <option key={i} value={`Class ${i + 1}`}>Class {i + 1}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Board</label>
                <select name="board" value={formData.board} onChange={handleChange} required>
                  <option value="CBSE">CBSE</option>
                  <option value="ICSE">ICSE</option>
                  <option value="State">State</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Mobile</label>
                <input name="mobile" value={formData.mobile} onChange={handleChange} placeholder="9876543210" required autoComplete="off" />
              </div>
              <div className="form-group">
                <label>WhatsApp</label>
                <input name="whatsapp" value={formData.whatsapp} onChange={handleChange} placeholder="9876543210" required autoComplete="off" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Parent WhatsApp</label>
                <input name="parentWhatsapp" value={formData.parentWhatsapp} onChange={handleChange} placeholder="9876543210" required autoComplete="off" />
              </div>
              <div className="form-group">
                <label>Parent Call</label>
                <input name="parentCall" value={formData.parentCall} onChange={handleChange} placeholder="9876543210" required autoComplete="off" />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>

          <p className="auth-footer">
            Already have an account? <Link to="/login">Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterStudent;
