import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import Modal from '../components/Modal';
import { getGeoPosition } from '../utils/geolocation';
import './Auth.css';
import './Register.css';

const RegisterTeacher = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', password: '',
    address: '', location: { lat: 0, lng: 0 }, profession: '', experience: '',
    education: '', schoolCollege: '', subjects: '', avgFees: '',
    mobile: '', whatsapp: '', gender: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getLocation = () => {
    setLocLoading(true);
    setLocError('');
    (async () => {
      try {
        const position = await getGeoPosition();
        setFormData((prev) => ({
          ...prev,
          location: { lat: position.coords.latitude, lng: position.coords.longitude }
        }));
        setSuccessOpen(true);
      } catch (e) {
        setLocError(e?.message || 'Unable to get location. Enable location permission and try again.');
      } finally {
        setLocLoading(false);
      }
    })();
  };

  const handleNext = async () => {
    if (step === 1) {
      try {
        const { data } = await api.get(`/auth/check-email/${encodeURIComponent(formData.email)}`);
        if (data.exists) {
          setError('Email already exists');
          return;
        }
      } catch (err) {
        setError('Error checking email');
        return;
      }
    }
    setError('');
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        ...formData,
        subjects: formData.subjects.split(',').map(s => s.trim()),
        mobile: '+91' + formData.mobile,
        whatsapp: '+91' + formData.whatsapp
      };

      const { data } = await api.post('/auth/register/teacher', payload);
      login(data.token, data.user, data.teacher);
      navigate('/teacher/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container register-container">
        <div className="auth-card">
          <Link to="/" className="auth-back">← Back to home</Link>
          <h1>Teacher Registration</h1>
          <div className="step-indicator">
            <div className={`step ${step >= 1 ? 'active' : ''}`}>1</div>
            <div className="step-line"></div>
            <div className={`step ${step >= 2 ? 'active' : ''}`}>2</div>
          </div>

          {error && <div className="error-box">{error}</div>}
          {locError && <div className="error-box">{locError}</div>}

          <form onSubmit={handleSubmit} autoComplete="off">
            {step === 1 && (
              <div className="step-content">
                <div className="form-group">
                  <label>First Name</label>
                  <input name="firstName" value={formData.firstName} onChange={handleChange} required autoComplete="off" />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input name="lastName" value={formData.lastName} onChange={handleChange} required autoComplete="off" />
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
                <button type="button" className="btn btn-primary btn-full" onClick={handleNext}>
                  Next
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="step-content">
                <div className="form-group">
                  <label>Address</label>
                  <input name="address" value={formData.address} onChange={handleChange} required autoComplete="street-address" />
                </div>
                <div className="form-group">
                  <label>Location</label>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={getLocation}
                    disabled={locLoading}
                  >
                    {locLoading ? 'Capturing location…' : '📍 Capture GPS Location'}
                  </button>
                  {formData.location.lat !== 0 && <small className="success-text">✓ Location captured</small>}
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Profession</label>
                    <input name="profession" value={formData.profession} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label>Experience</label>
                    <input name="experience" value={formData.experience} onChange={handleChange} required />
                  </div>
                </div>
                <div className="form-group">
                  <label>Education</label>
                  <input name="education" value={formData.education} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>School/College</label>
                  <input name="schoolCollege" value={formData.schoolCollege} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Subjects (comma-separated)</label>
                  <input name="subjects" value={formData.subjects} onChange={handleChange} placeholder="Math, Science, English" required />
                </div>
                <div className="form-group">
                  <label>Average Fees (optional)</label>
                  <input type="number" name="avgFees" value={formData.avgFees} onChange={handleChange} />
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
                <div className="form-group">
                  <label>Gender</label>
                  <select name="gender" value={formData.gender} onChange={handleChange} required>
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-row">
                  <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>
                    Back
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading || locLoading}>
                    {loading ? 'Registering...' : 'Register'}
                  </button>
                </div>
              </div>
            )}
          </form>

          <p className="auth-footer">
            Already have an account? <Link to="/login">Login here</Link>
          </p>
        </div>
      </div>

      <Modal open={successOpen} onClose={() => setSuccessOpen(false)} title="Location captured">
        <p>Your GPS location was saved successfully.</p>
        <button type="button" className="btn btn-primary btn-full" onClick={() => setSuccessOpen(false)}>OK</button>
      </Modal>
    </div>
  );
};

export default RegisterTeacher;
