import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import Modal from '../../components/Modal';
import api from '../../api/axios';
import './OrgAdmin.css';

const orgAdminMenuItems = [
  { path: '/org-admin/dashboard', label: 'Org Dashboard' },
  { path: '/org-admin/teachers', label: 'Add Teachers' }
];

export default function AddTeachers() {
  const [org, setOrg] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', whatsapp: '', degree: '', experience: '' });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, title: 'Done', message: '', isError: false });

  useEffect(() => {
    fetchOrgAndBatches();
  }, []);

  const fetchOrgAndBatches = async () => {
    try {
      const { data } = await api.get('/org-admin/profile');
      setOrg(data);
    } catch (err) {
      setToast({ open: true, title: 'Error', message: err.response?.data?.error || 'Failed to load org', isError: true });
    }
  };

  const fetchBatches = async () => {
    // kept for backward compatibility; actual load is in fetchOrgAndBatches
  };

  useEffect(() => {
    fetchBatches();
  }, [org?._id]);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/org-admin/teachers', {
        ...form
      });
      setToast({ open: true, title: 'Created', message: 'Org teacher created and credentials sent.', isError: false });
      setForm({ name: '', email: '', phone: '', whatsapp: '', degree: '', experience: '' });
    } catch (err) {
      setToast({ open: true, title: 'Error', message: err.response?.data?.error || 'Failed', isError: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar items={orgAdminMenuItems} />
      <main className="dashboard-content">
        <div className="page-header">
          <h1>Add Organization Teacher</h1>
        </div>

        <div className="card form-card">
          <form onSubmit={submit}>
            <div className="card" style={{ marginBottom: 12 }}>
              <strong>Organization Code:</strong> {org?.organizationCode || '—'}<br />
              <span className="hint-text">Your org is auto-detected from your login.</span>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Phone</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="form-group">
                <label>WhatsApp</label>
                <input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Degree</label>
                <input value={form.degree} onChange={(e) => setForm({ ...form, degree: e.target.value })} placeholder="B.Ed, M.Sc..." />
              </div>
              <div className="form-group">
                <label>Experience</label>
                <input value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} placeholder="5 years" />
              </div>
            </div>

            <div className="hint-text" style={{ marginTop: 8 }}>
              Teachers are created independently. Assign teachers to batches while creating a batch (multi-select).
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Creating…' : 'Create Org Teacher'}
            </button>
          </form>
        </div>
      </main>

      <Modal open={toast.open} onClose={() => setToast((t) => ({ ...t, open: false }))} title={toast.title}>
        <p>{toast.message}</p>
        <button type="button" className="btn btn-primary btn-full" onClick={() => setToast((t) => ({ ...t, open: false }))}>OK</button>
      </Modal>
    </div>
  );
}

