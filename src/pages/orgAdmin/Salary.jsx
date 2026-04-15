import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import Modal from '../../components/Modal';
import api from '../../api/axios';
import './OrgAdmin.css';

const orgAdminMenuItems = [
  { path: '/org-admin/dashboard', label: 'Org Dashboard' },
  { path: '/org-admin/batches', label: 'My Batch' },
  { path: '/org-admin/batch/create', label: 'Create Batch' },
  { path: '/org-admin/notices', label: 'Notices' },
  { path: '/org-admin/attendance', label: 'Attendance' },
  { path: '/org-admin/fees', label: 'Fees Management' },
  { path: '/org-admin/salary', label: 'Teacher Salary' },
  { path: '/org-admin/profile', label: 'Profile' },
  { path: '/org-admin/teachers', label: 'Add Teachers' }
];

export default function OrgAdminSalary() {
  const [salary, setSalary] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [batches, setBatches] = useState([]);
  const [filters, setFilters] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    status: ''
  });
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ orgTeacherId: '', batchId: '', amount: '' });
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', isError: false });

  useEffect(() => {
    fetchMeta();
  }, []);

  useEffect(() => {
    fetchSalary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, page]);

  const fetchMeta = async () => {
    try {
      const t = await api.get('/org-admin/teachers?limit=200');
      setTeachers(t.data?.teachers || []);
      const b = await api.get('/org-admin/batch?limit=200');
      setBatches(b.data?.batches || []);
    } catch (e) {
      // non-blocking
    }
  };

  const fetchSalary = async () => {
    setLoading(true);
    try {
      const query = { page, limit: 20 };
      if (filters.month) query.month = new Date(0, filters.month - 1).toLocaleString('en-US', { month: 'long' });
      if (filters.year) query.year = filters.year;
      if (filters.status) query.status = filters.status;
      const params = new URLSearchParams(query);
      const { data } = await api.get(`/org-admin/salary?${params}`);
      setSalary(data.salary || []);
      setPages(data.pages || 1);
      setSummary(data.summary || null);
    } catch (e) {
      setToast({ open: true, message: e.response?.data?.error || 'Failed to load salary', isError: true });
    } finally {
      setLoading(false);
    }
  };

  const markPaid = async (id) => {
    try {
      await api.put(`/org-admin/salary/${id}/mark-paid`);
      setToast({ open: true, message: 'Marked as paid.', isError: false });
      fetchSalary();
    } catch (e) {
      setToast({ open: true, message: e.response?.data?.error || 'Failed to mark paid', isError: true });
    }
  };

  const createSalary = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = {
        ...createForm,
        amount: Number(createForm.amount),
        month: new Date(0, filters.month - 1).toLocaleString('en-US', { month: 'long' }),
        year: filters.year
      };
      await api.post('/org-admin/salary', payload);
      setCreateOpen(false);
      setCreateForm({ orgTeacherId: '', batchId: '', amount: '' });
      setToast({ open: true, message: 'Salary record created.', isError: false });
      fetchSalary();
    } catch (e2) {
      setToast({ open: true, message: e2.response?.data?.error || 'Failed to create salary record', isError: true });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar items={orgAdminMenuItems} />
      <main className="dashboard-content">
        <div className="page-header">
          <h1>Teacher Salary</h1>
        </div>

        <div className="filters-section card">
          <h3>Filter by Period</h3>
          <div className="filters-bar">
            <div className="form-group">
              <label>Month</label>
              <select value={filters.month} onChange={(e) => { setPage(1); setFilters({ ...filters, month: Number(e.target.value) }); }}>
                {[...Array(12)].map((_, i) => (
                  <option key={i} value={i + 1}>{new Date(0, i).toLocaleString('en', { month: 'long' })}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Year</label>
              <select value={filters.year} onChange={(e) => { setPage(1); setFilters({ ...filters, year: Number(e.target.value) }); }}>
                {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select value={filters.status} onChange={(e) => { setPage(1); setFilters({ ...filters, status: e.target.value }); }}>
                <option value="">All</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <button type="button" className="btn btn-primary" onClick={() => setCreateOpen(true)}>Add salary</button>
          </div>
          {summary && (
            <p className="hint-text">
              Paid: ₹{Number(summary.paid?.total || 0).toLocaleString()} ({summary.paid?.count || 0}) · Pending: ₹{Number(summary.pending?.total || 0).toLocaleString()} ({summary.pending?.count || 0})
            </p>
          )}
        </div>

        {loading ? (
          <div className="loading-spinner">Loading salary…</div>
        ) : salary.length === 0 ? (
          <div className="empty-state card">
            <h3>No salary records</h3>
            <p>Create salary records per teacher + batch for the month.</p>
          </div>
        ) : (
          <>
            <div className="card" style={{ overflowX: 'auto' }}>
              <table className="simple-table">
                <thead>
                  <tr>
                    <th>Teacher</th>
                    <th>Batch</th>
                    <th>Month</th>
                    <th>Year</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {salary.map((s) => (
                    <tr key={s._id}>
                      <td>{s.orgTeacherId?.email || '—'}</td>
                      <td>{s.batchId?.batchName || '—'}</td>
                      <td>{s.month}</td>
                      <td>{s.year}</td>
                      <td>₹{Number(s.amount || 0).toLocaleString()}</td>
                      <td>{s.status}</td>
                      <td>
                        {s.status === 'pending' ? (
                          <button type="button" className="btn btn-primary btn-sm" onClick={() => markPaid(s._id)}>
                            Mark paid
                          </button>
                        ) : (
                          <span className="hint-text">{s.paidAt ? new Date(s.paidAt).toLocaleDateString() : '—'}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pages > 1 && (
              <div className="pagination">
                <button type="button" className="btn btn-secondary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                  Previous
                </button>
                <span>Page {page} of {pages}</span>
                <button type="button" className="btn btn-secondary" onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages}>
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <Modal open={createOpen} onClose={() => !busy && setCreateOpen(false)} title="Add salary record">
        <form onSubmit={createSalary}>
          <div className="form-group">
            <label>Teacher</label>
            <select value={createForm.orgTeacherId} onChange={(e) => setCreateForm((f) => ({ ...f, orgTeacherId: e.target.value }))} required disabled={busy}>
              <option value="">Select</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>{t.name} {t.email ? `(${t.email})` : ''}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Batch</label>
            <select value={createForm.batchId} onChange={(e) => setCreateForm((f) => ({ ...f, batchId: e.target.value }))} required disabled={busy}>
              <option value="">Select</option>
              {batches.map((b) => (
                <option key={b._id} value={b._id}>{b.batchName}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Amount</label>
            <input type="number" value={createForm.amount} onChange={(e) => setCreateForm((f) => ({ ...f, amount: e.target.value }))} required min="0" disabled={busy} />
            <small className="hint-text">Month/year are taken from the selected filters.</small>
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={busy}>
            {busy ? 'Saving…' : 'Create'}
          </button>
        </form>
      </Modal>

      <Modal open={toast.open} onClose={() => setToast((t) => ({ ...t, open: false }))} title={toast.isError ? 'Error' : 'Done'}>
        <p className="pre-wrap">{toast.message}</p>
        <button type="button" className="btn btn-primary btn-full" onClick={() => setToast((t) => ({ ...t, open: false }))}>OK</button>
      </Modal>
    </div>
  );
}

