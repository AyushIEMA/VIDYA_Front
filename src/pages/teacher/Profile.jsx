import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Modal from '../../components/Modal';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import './Dashboard.css';
import './Profile.css';

const teacherMenuItems = [
  { path: '/teacher/dashboard', label: 'Dashboard' },
  { path: '/teacher/batches', label: 'My Batches' },
  { path: '/teacher/announcements', label: 'Announcements' },
  { path: '/teacher/fees', label: 'Fees Management' },
  { path: '/teacher/attendance', label: 'Attendance' },
  { path: '/teacher/promote', label: 'Promote Student' },
  { path: '/teacher/profile', label: 'Profile' }
];

const Profile = () => {
  const { user } = useAuth();
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
      const { data } = await api.get('/teacher/profile');
      setProfile(data);
      setFormData({
        ...data,
        subjects: (data.subjects || []).join(', ')
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formData,
        subjects: typeof formData.subjects === 'string'
          ? formData.subjects.split(',').map((s) => s.trim()).filter(Boolean)
          : formData.subjects
      };
      delete payload.teacherCode;
      delete payload.userId;
      delete payload._id;
      delete payload.__v;
      delete payload.createdAt;
      delete payload.updatedAt;

      await api.put('/teacher/profile', payload);
      setEditing(false);
      fetchProfile();
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
        <Sidebar items={teacherMenuItems} />
        <main className="dashboard-content">
          <div className="loading-spinner">Loading...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <Sidebar items={teacherMenuItems} />
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
          <div className="profile-row">
            <span className="profile-label">Teacher Code</span>
            <span className="profile-value code-highlight">{profile.teacherCode}</span>
          </div>
        </div>

        {!editing ? (
          <div className="profile-grid">
            <div className="card">
              <h3 className="section-title">Personal Information</h3>
              <div className="profile-row">
                <span className="profile-label">Name</span>
                <span className="profile-value">{profile.firstName} {profile.lastName}</span>
              </div>
              <div className="profile-row">
                <span className="profile-label">Gender</span>
                <span className="profile-value">{profile.gender}</span>
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
            </div>

            <div className="card">
              <h3 className="section-title">Professional Details</h3>
              <div className="profile-row">
                <span className="profile-label">Profession</span>
                <span className="profile-value">{profile.profession}</span>
              </div>
              <div className="profile-row">
                <span className="profile-label">Experience</span>
                <span className="profile-value">{profile.experience} years</span>
              </div>
              <div className="profile-row">
                <span className="profile-label">Education</span>
                <span className="profile-value">{profile.education}</span>
              </div>
              <div className="profile-row">
                <span className="profile-label">School/College</span>
                <span className="profile-value">{profile.schoolCollege}</span>
              </div>
              <div className="profile-row">
                <span className="profile-label">Subjects</span>
                <span className="profile-value">{profile.subjects?.join(', ')}</span>
              </div>
              <div className="profile-row">
                <span className="profile-label">Average Fees</span>
                <span className="profile-value">₹{profile.avgFees ?? '—'}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="card">
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>First Name</label>
                  <input
                    value={formData.firstName || ''}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    value={formData.lastName || ''}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Gender</label>
                  <select
                    value={formData.gender || ''}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Mobile</label>
                  <input
                    value={formData.mobile || ''}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>WhatsApp</label>
                  <input
                    value={formData.whatsapp || ''}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Average Fees</label>
                  <input
                    type="number"
                    value={formData.avgFees ?? ''}
                    onChange={(e) => setFormData({ ...formData, avgFees: e.target.value === '' ? '' : Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Address</label>
                <input
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Profession</label>
                <input
                  value={formData.profession || ''}
                  onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Experience</label>
                <input
                  value={formData.experience || ''}
                  onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Education</label>
                <input
                  value={formData.education || ''}
                  onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>School/College</label>
                <input
                  value={formData.schoolCollege || ''}
                  onChange={(e) => setFormData({ ...formData, schoolCollege: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Subjects (comma-separated)</label>
                <input
                  value={formData.subjects || ''}
                  onChange={(e) => setFormData({ ...formData, subjects: e.target.value })}
                />
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
