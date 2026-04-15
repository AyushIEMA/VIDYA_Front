import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Modal from '../../components/Modal';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import './Dashboard.css';
import './Profile.css';

const studentMenuItems = [
  { path: '/student/dashboard', label: 'Dashboard' },
  { path: '/student/batches', label: 'My Batches' },
  { path: '/student/enroll', label: 'Enroll in Batch' },
  { path: '/student/org', label: 'Organization' },
  { path: '/student/notices', label: 'Notices' },
  { path: '/student/profile', label: 'Profile' }
];

const Profile = () => {
  const { user, login } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', isError: false });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data } = await api.get('/student/profile');
      setProfile(data);
      setFormData(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put('/student/profile', formData);
      setProfile(data);
      const token = localStorage.getItem('token');
      if (token && user) login(token, user, data);
      setEditing(false);
      setToast({ open: true, message: 'Profile updated.', isError: false });
    } catch (error) {
      setToast({ open: true, message: error.response?.data?.error || 'Failed to update profile', isError: true });
    } finally {
      setSaving(false);
    }
  };

  if (!profile) {
    return (
      <div className="dashboard-layout">
        <Sidebar items={studentMenuItems} />
        <main className="dashboard-content">
          <div className="loading-spinner">Loading...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <Sidebar items={studentMenuItems} />
      <main className="dashboard-content">
        <div className="page-header">
          <h1>Profile</h1>
          {!editing && (
            <button type="button" className="btn btn-primary" onClick={() => setEditing(true)}>
              Edit Profile
            </button>
          )}
        </div>

        <div className="card read-only-email">
          <div className="profile-row">
            <span className="profile-label">Email</span>
            <span className="profile-value">{user?.email}</span>
          </div>
        </div>

        {!editing ? (
          <div className="profile-grid">
            <div className="card">
              <h3 className="section-title">Personal Information</h3>
              <div className="profile-row">
                <span className="profile-label">Name</span>
                <span className="profile-value">{profile.name}</span>
              </div>
              <div className="profile-row">
                <span className="profile-label">Class</span>
                <span className="profile-value">{profile.class}</span>
              </div>
              <div className="profile-row">
                <span className="profile-label">Board</span>
                <span className="profile-value">{profile.board || '—'}</span>
              </div>
              <div className="profile-row">
                <span className="profile-label">Address</span>
                <span className="profile-value">{profile.address}</span>
              </div>
            </div>

            <div className="card">
              <h3 className="section-title">Contact Information</h3>
              <div className="profile-row">
                <span className="profile-label">Mobile</span>
                <span className="profile-value">{profile.mobile}</span>
              </div>
              <div className="profile-row">
                <span className="profile-label">WhatsApp</span>
                <span className="profile-value">{profile.whatsapp}</span>
              </div>
              <div className="profile-row">
                <span className="profile-label">Parent WhatsApp</span>
                <span className="profile-value">{profile.parentWhatsapp}</span>
              </div>
              <div className="profile-row">
                <span className="profile-label">Parent Call</span>
                <span className="profile-value">{profile.parentCall}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="card">
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Name</label>
                  <input value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Class</label>
                  <select
                    value={formData.class || ''}
                    onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                  >
                    {[...Array(12)].map((_, i) => (
                      <option key={i} value={`Class ${i + 1}`}>Class {i + 1}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Board</label>
                  <select
                    value={formData.board || 'CBSE'}
                    onChange={(e) => setFormData({ ...formData, board: e.target.value })}
                  >
                    <option value="CBSE">CBSE</option>
                    <option value="ICSE">ICSE</option>
                    <option value="State">State</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Mobile</label>
                  <input value={formData.mobile || ''} onChange={(e) => setFormData({ ...formData, mobile: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>WhatsApp</label>
                  <input value={formData.whatsapp || ''} onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Parent WhatsApp</label>
                  <input value={formData.parentWhatsapp || ''} onChange={(e) => setFormData({ ...formData, parentWhatsapp: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Parent Call</label>
                  <input value={formData.parentCall || ''} onChange={(e) => setFormData({ ...formData, parentCall: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label>Address</label>
                <input value={formData.address || ''} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
                <button type="button" className="btn btn-secondary" onClick={() => { setEditing(false); fetchProfile(); }}>Cancel</button>
              </div>
            </form>
          </div>
        )}
      </main>

      <Modal open={toast.open} onClose={() => setToast((t) => ({ ...t, open: false }))} title={toast.isError ? 'Error' : 'Saved'}>
        <p>{toast.message}</p>
        <button type="button" className="btn btn-primary btn-full" onClick={() => setToast((t) => ({ ...t, open: false }))}>OK</button>
      </Modal>
    </div>
  );
};

export default Profile;
