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

export default function OrgAdminFees() {
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });
  const [toast, setToast] = useState({ open: false, message: '', isError: false });
  const perPage = 20;

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      const { data } = await api.get('/org-admin/batch?limit=200');
      setBatches(data.batches || []);
    } catch (e) {
      setToast({ open: true, message: e.response?.data?.error || 'Failed to load batches', isError: true });
    }
  };

  const fetchBatchFees = async () => {
    if (!selectedBatch) {
      setToast({ open: true, message: 'Select a batch', isError: true });
      return;
    }
    const monthName = new Date(0, filters.month - 1).toLocaleString('en-US', { month: 'long' });
    setLoading(true);
    try {
      const query = {
        batchId: selectedBatch,
        month: monthName,
        year: filters.year,
        page: currentPage,
        limit: perPage
      };
      const params = new URLSearchParams(query);
      const { data } = await api.get(`/org-admin/fees/batch?${params}`);
      setRows(data.students || []);
      setTotalPages(data.pages || 1);
      setTotal(data.total || 0);
    } catch (error) {
      setToast({ open: true, message: error.response?.data?.error || 'Failed to load fees', isError: true });
    } finally {
      setLoading(false);
    }
  };

  const markPaid = async (feeId) => {
    if (!feeId) return;
    try {
      await api.put(`/org-admin/fees/${feeId}/mark-paid`);
      fetchBatchFees();
      setToast({ open: true, message: 'Marked as paid.', isError: false });
    } catch (e) {
      setToast({ open: true, message: e.response?.data?.error || 'Failed to mark paid', isError: true });
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar items={orgAdminMenuItems} />
      <main className="dashboard-content">
        <div className="page-header">
          <h1>Fees Management</h1>
        </div>

        <div className="filters-section card">
          <h3>Select batch + month</h3>
          <div className="filters-bar">
            <div className="form-group">
              <label>Batch</label>
              <select value={selectedBatch} onChange={(e) => { setCurrentPage(1); setSelectedBatch(e.target.value); }}>
                <option value="">Select batch</option>
                {batches.map((b) => (
                  <option key={b._id} value={b._id}>{b.batchName}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Month</label>
              <select value={filters.month} onChange={(e) => { setCurrentPage(1); setFilters({ ...filters, month: Number(e.target.value) }); }}>
                {[...Array(12)].map((_, i) => (
                  <option key={i} value={i + 1}>{new Date(0, i).toLocaleString('en', { month: 'long' })}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Year</label>
              <select value={filters.year} onChange={(e) => { setCurrentPage(1); setFilters({ ...filters, year: Number(e.target.value) }); }}>
                {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <button type="button" className="btn btn-primary" disabled={loading} onClick={fetchBatchFees}>
              {loading ? 'Loading…' : 'Fetch students'}
            </button>
          </div>
          <p className="hint-text">Students load only after you select Batch + Month.</p>
        </div>

        {loading ? (
          <div className="loading-spinner">Loading fees…</div>
        ) : rows.length === 0 ? (
          <div className="empty-state card">
            <h3>No students loaded</h3>
            <p>Select a batch and month, then click “Fetch students”.</p>
          </div>
        ) : (
          <>
            <div className="card" style={{ overflowX: 'auto' }}>
              <table className="simple-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Fee</th>
                    <th>Discount</th>
                    <th>Final</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.enrollmentId}>
                      <td>{r.student?.name || '—'}</td>
                      <td>₹{Number(r.originalAmount || 0).toLocaleString()}</td>
                      <td>₹{Number(r.discount || 0).toLocaleString()}</td>
                      <td>₹{Number(r.finalAmount || 0).toLocaleString()}</td>
                      <td>{r.status}</td>
                      <td>
                        {r.status === 'pending' ? (
                          <button type="button" className="btn btn-primary btn-sm" onClick={() => markPaid(r.feeId)} disabled={!r.feeId}>
                            Mark Paid
                          </button>
                        ) : (
                          <span className="hint-text">{r.paidAt ? new Date(r.paidAt).toLocaleDateString() : '—'}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <span>Page {currentPage} of {totalPages}</span>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <Modal open={toast.open} onClose={() => setToast((t) => ({ ...t, open: false }))} title={toast.isError ? 'Error' : 'Done'}>
        <p className="pre-wrap">{toast.message}</p>
        <button type="button" className="btn btn-primary btn-full" onClick={() => setToast((t) => ({ ...t, open: false }))}>OK</button>
      </Modal>
    </div>
  );
}

