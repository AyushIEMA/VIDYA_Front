import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { getGeoPosition } from '../utils/geolocation';
import './Auth.css';
import './Register.css';

const RegisterOrganization = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    location: { lat: 0, lng: 0 },
    subjects: '',
    gstin: '',
    contact: '',
    whatsapp: '',
    adminName: '',
    avgFees: '',
    nearbyLocation: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [locLoading, setLocLoading] = useState(false);
  const [error, setError] = useState('');
  const [successOpen, setSuccessOpen] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const getLocation = () => {
    setLocLoading(true);
    setError('');
    (async () => {
      try {
        const pos = await getGeoPosition();
        setFormData((prev) => ({
          ...prev,
          location: { lat: pos.coords.latitude, lng: pos.coords.longitude }
        }));
        setSuccessOpen(true);
      } catch (e) {
        setError(e?.message || 'Unable to get location');
      } finally {
        setLocLoading(false);
      }
    })();
  };

  const next = () => {
    setError('');
    setStep(2);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        ...formData,
        subjects: formData.subjects.split(',').map((s) => s.trim()).filter(Boolean),
        avgFees: formData.avgFees === '' ? undefined : Number(formData.avgFees)
      };
      const { data } = await api.post('/auth/register/organization', payload);
      login(data.token, data.user, data.organization);
      navigate('/org-admin/dashboard');
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
          <h1>Organization Registration</h1>
          <div className="step-indicator">
            <div className={`step ${step >= 1 ? 'active' : ''}`}>1</div>
            <div className="step-line"></div>
            <div className={`step ${step >= 2 ? 'active' : ''}`}>2</div>
          </div>

          {error && <div className="error-box">{error}</div>}

          <form onSubmit={submit} autoComplete="off">
            {step === 1 && (
              <div className="step-content">
                <div className="form-group">
                  <label>Organization Name</label>
                  <input name="name" value={formData.name} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <input name="address" value={formData.address} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Location</label>
                  <button type="button" className="btn btn-secondary" onClick={getLocation} disabled={locLoading}>
                    {locLoading ? 'Capturing…' : '📍 Capture GPS Location'}
                  </button>
                  {formData.location.lat !== 0 && <small className="success-text">✓ Location captured</small>}
                </div>
                <div className="form-group">
                  <label>Subjects (comma-separated)</label>
                  <input name="subjects" value={formData.subjects} onChange={handleChange} placeholder="Math, Science" required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>GSTIN (optional)</label>
                    <input name="gstin" value={formData.gstin} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label>Nearby Location</label>
                    <input name="nearbyLocation" value={formData.nearbyLocation} onChange={handleChange} />
                  </div>
                </div>
                <button type="button" className="btn btn-primary btn-full" onClick={next}>
                  Next
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="step-content">
                <div className="form-group">
                  <label>Admin Name</label>
                  <input name="adminName" value={formData.adminName} onChange={handleChange} required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Contact</label>
                    <input name="contact" value={formData.contact} onChange={handleChange} required autoComplete="off" />
                  </div>
                  <div className="form-group">
                    <label>WhatsApp</label>
                    <input name="whatsapp" value={formData.whatsapp} onChange={handleChange} required autoComplete="off" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Average Fees</label>
                  <input type="number" name="avgFees" value={formData.avgFees} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} required autoComplete="off" />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input type="password" name="password" value={formData.password} onChange={handleChange} required autoComplete="new-password" />
                </div>
                <div className="form-row">
                  <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>
                    Back
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Registering…' : 'Register'}
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
        <p>Organization GPS location saved.</p>
        <button type="button" className="btn btn-primary btn-full" onClick={() => setSuccessOpen(false)}>OK</button>
      </Modal>
    </div>
  );
};

export default RegisterOrganization;

