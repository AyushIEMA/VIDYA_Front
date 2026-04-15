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

const studentMenuItems = [
  { path: '/student/dashboard', label: 'Dashboard' },
  { path: '/student/batches', label: 'My Batches' },
  { path: '/student/enroll', label: 'Enroll in Batch' },
  { path: '/student/org', label: 'Organization' },
  { path: '/student/notices', label: 'Notices' },
  { path: '/student/profile', label: 'Profile' }
];

const MyBatches = () => {
  const [groupedBatches, setGroupedBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [leaveId, setLeaveId] = useState(null);
  const [leaveBusy, setLeaveBusy] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', isError: false });

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/student/batches');
      setGroupedBatches(data);
    } catch (error) {
      console.error('Error fetching batches:', error);
    } finally {
      setLoading(false);
    }
  };

  const confirmLeave = async () => {
    if (!leaveId) return;
    setLeaveBusy(true);
    try {
      await api.post(`/student/batch/${leaveId}/leave`);
      setToast({ open: true, message: 'You have left the batch.', isError: false });
      setLeaveId(null);
      fetchBatches();
    } catch (error) {
      setToast({ open: true, message: error.response?.data?.error || 'Could not leave batch', isError: true });
    } finally {
      setLeaveBusy(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar items={studentMenuItems} />
      <main className="dashboard-content">
        <div className="page-header">
          <h1>My Batches</h1>
          <Link to="/student/enroll" className="btn btn-primary">
            Enroll in New Batch
          </Link>
        </div>

        {loading ? (
          <div className="loading-spinner">Loading your batches...</div>
        ) : groupedBatches.length === 0 ? (
          <div className="empty-state card">
            <h3>No batches enrolled yet</h3>
            <p>Use a teacher code to enroll in your first batch</p>
            <Link to="/student/enroll" className="btn btn-primary">Enroll Now</Link>
          </div>
        ) : (
          groupedBatches.map(group => (
            <div key={(group.type === 'organization' ? group.organization?._id : group.teacher?._id) || Math.random()} className="teacher-group">
              <div className="teacher-group-header">
                <h3>
                  {group.type === 'organization'
                    ? (group.organization?.name || 'Organization')
                    : `${group.teacher.firstName} ${group.teacher.lastName}`}
                </h3>
                <span className="batch-count">{group.batches.length} Batch{group.batches.length > 1 ? 'es' : ''}</span>
              </div>
              <div className="batches-grid">
                {group.batches.map(batch => (
                  <div key={batch._id} className="batch-card card">
                    <div className="batch-info">
                      <h4>{batch.batchName}</h4>
                      <span className="badge">{batch.class}</span>
                    </div>
                    <div className="batch-meta">
                      <p><strong>Subjects:</strong> {batch.subjects.join(', ')}</p>
                      <p><strong>Schedule:</strong> {formatSchedule(batch)}</p>
                      <div className="fee-info">
                        <p><strong>Original Fees:</strong> ₹{batch.fees}</p>
                        {batch.discount > 0 && (
                          <>
                            <p className="discount-text"><strong>Discount:</strong> - ₹{batch.discount}</p>
                            <p className="final-fee"><strong>Your Fees:</strong> ₹{batch.fees - batch.discount}</p>
                          </>
                        )}
                        {batch.discount === 0 && (
                          <p className="final-fee"><strong>Your Fees:</strong> ₹{batch.fees}</p>
                        )}
                      </div>
                    </div>
                    <Link to={`/student/batch/${batch._id}`} className="btn btn-primary btn-full">
                      View Details
                    </Link>
                    <button
                      type="button"
                      className="btn btn-danger btn-outline btn-full"
                      style={{ marginTop: 8 }}
                      onClick={() => setLeaveId(batch._id)}
                    >
                      Leave Batch
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}

        <Modal open={!!leaveId} onClose={() => !leaveBusy && setLeaveId(null)} title="Leave batch?">
          <p>Remove yourself from this batch?</p>
          <div className="modal-actions-row">
            <button type="button" className="btn btn-secondary" onClick={() => setLeaveId(null)} disabled={leaveBusy}>Cancel</button>
            <button type="button" className="btn btn-danger" onClick={confirmLeave} disabled={leaveBusy}>{leaveBusy ? '…' : 'Leave'}</button>
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
