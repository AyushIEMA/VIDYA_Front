import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Modal from '../../components/Modal';
import api from '../../api/axios';
import './Dashboard.css';
import './MyBatches.css';

function formatSchedule(batch) {
  if (!batch) return '';
  if (batch.schedule?.length) {
    return batch.schedule.map((s) => `${s.day.slice(0, 3)} ${s.startTime}`).join(' · ');
  }
  return `${(batch.days || []).join(', ')} @ ${batch.startTime || ''}`;
}

const teacherMenuItems = [
  { path: '/teacher/dashboard', label: 'Dashboard' },
  { path: '/teacher/batches', label: 'My Batches' },
  { path: '/teacher/announcements', label: 'Announcements' },
  { path: '/teacher/fees', label: 'Fees Management' },
  { path: '/teacher/attendance', label: 'Attendance' },
  { path: '/teacher/promote', label: 'Promote Student' },
  { path: '/teacher/profile', label: 'Profile' }
];

const MyBatches = () => {
  const [batches, setBatches] = useState([]);
  const [filters, setFilters] = useState({ class: '', subject: '', board: '', search: '' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', isError: false });

  useEffect(() => {
    fetchBatches();
  }, [filters, page]);

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ ...filters, page, limit: 9 });
      const { data } = await api.get(`/teacher/batch?${params}`);
      setBatches(data.batches);
      setTotalPages(data.pages);
    } catch (error) {
      console.error('Error fetching batches:', error);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleteBusy(true);
    try {
      await api.delete(`/teacher/batch/${deleteId}`);
      setDeleteId(null);
      setToast({ open: true, message: 'Batch deleted successfully.', isError: false });
      fetchBatches();
    } catch (error) {
      setToast({ open: true, message: error.response?.data?.error || 'Failed to delete batch', isError: true });
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar items={teacherMenuItems} />
      <main className="dashboard-content">
        <div className="page-header">
          <h1>My Batches</h1>
          <Link to="/teacher/batch/create" className="btn btn-primary">
            Create New Batch
          </Link>
        </div>

        <div className="filters-bar">
          <input
            type="text"
            placeholder="🔍 Search batches..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
          <select value={filters.class} onChange={(e) => setFilters({ ...filters, class: e.target.value })}>
            <option value="">All Classes</option>
            {[...Array(12)].map((_, i) => <option key={i} value={`Class ${i + 1}`}>Class {i + 1}</option>)}
          </select>
          <select value={filters.board} onChange={(e) => setFilters({ ...filters, board: e.target.value })}>
            <option value="">All Boards</option>
            <option value="CBSE">CBSE</option>
            <option value="ICSE">ICSE</option>
            <option value="State">State</option>
          </select>
        </div>

        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading batches...</p>
          </div>
        ) : batches.length === 0 ? (
          <div className="empty-state card">
            <div className="empty-icon">📚</div>
            <h3>No batches found</h3>
            <p>Create your first batch to get started!</p>
            <Link to="/teacher/batch/create" className="btn btn-primary">Create Batch</Link>
          </div>
        ) : (
          <>
            <div className="batches-grid">
              {batches.map(batch => (
                <div key={batch._id} className="batch-card card">
                  <div className="batch-header">
                    <h3>{batch.batchName}</h3>
                    <span className="batch-badge">{batch.class}</span>
                  </div>
                  <div className="batch-details">
                    <p><strong>📋 Board:</strong> {batch.board}</p>
                    <p><strong>📖 Subjects:</strong> {batch.subjects.join(', ')}</p>
                    <p><strong>📅 Days:</strong> {batch.days.join(', ')}</p>
                    <p><strong>🕐 Schedule:</strong> {formatSchedule(batch)}</p>
                    <p><strong>💰 Fees:</strong> ₹{batch.fees}</p>
                  </div>
                  <div className="batch-actions">
                    <Link to={`/teacher/batch/${batch._id}`} className="btn btn-primary">View Details</Link>
                    <button type="button" onClick={() => setDeleteId(batch._id)} className="btn btn-danger">Delete</button>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Previous</button>
                <span>Page {page} of {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next →</button>
              </div>
            )}
          </>
        )}

        <Modal open={!!deleteId} onClose={() => !deleteBusy && setDeleteId(null)} title="Delete batch?">
          <p>This cannot be undone. Delete this batch?</p>
          <div className="modal-actions-row">
            <button type="button" className="btn btn-secondary" onClick={() => setDeleteId(null)} disabled={deleteBusy}>Cancel</button>
            <button type="button" className="btn btn-danger" onClick={confirmDelete} disabled={deleteBusy}>{deleteBusy ? '…' : 'Delete'}</button>
          </div>
        </Modal>

        <Modal open={toast.open} onClose={() => setToast((t) => ({ ...t, open: false }))} title={toast.isError ? 'Error' : 'Done'}>
          <p>{toast.message}</p>
          <button type="button" className="btn btn-primary btn-full" onClick={() => setToast((t) => ({ ...t, open: false }))}>OK</button>
        </Modal>
      </main>
    </div>
  );
};

export default MyBatches;
