import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Modal from '../../components/Modal';
import api from '../../api/axios';
import { getGeoPosition } from '../../utils/geolocation';
import { normalizeFileUrl } from '../../utils/fileUrl';
import './Dashboard.css';
import './BatchDetails.css';

const studentMenuItems = [
  { path: '/student/dashboard', label: 'Dashboard' },
  { path: '/student/batches', label: 'My Batches' },
  { path: '/student/enroll', label: 'Enroll in Batch' },
  { path: '/student/org', label: 'Organization' },
  { path: '/student/notices', label: 'Notices' },
  { path: '/student/profile', label: 'Profile' }
];

const StudentBatchDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [batch, setBatch] = useState(null);
  const [logs, setLogs] = useState([]);
  const [tab, setTab] = useState('logs');
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [attBusy, setAttBusy] = useState(false);
  const [leaveBusy, setLeaveBusy] = useState(false);
  const [reviewBusy, setReviewBusy] = useState(false);
  const [modal, setModal] = useState({ open: false, title: '', message: '', isError: false, onOk: null });
  const [leaveConfirm, setLeaveConfirm] = useState(false);

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const fetchDetails = async () => {
    try {
      const { data } = await api.get(`/student/batch/${id}/details`);
      setBatch(data.batch);
      setLogs(data.logs);
    } catch (error) {
      console.error('Error fetching details:', error);
    }
  };

  const markAttendance = () => {
    setAttBusy(true);
    (async () => {
      try {
        const position = await getGeoPosition();
        await api.post('/student/attendance', {
          batchId: id,
          location: { lat: position.coords.latitude, lng: position.coords.longitude }
        });
        setModal({ open: true, title: 'Attendance', message: 'Attendance marked successfully.', isError: false });
      } catch (error) {
        const serverMsg =
          error?.response?.data?.error ||
          error?.response?.data?.message ||
          error?.message ||
          'Unable to mark attendance.';
        setModal({
          open: true,
          title: 'Attendance',
          message: serverMsg,
          isError: true
        });
      } finally {
        setAttBusy(false);
      }
    })();
  };

  const submitReview = async (e) => {
    e.preventDefault();
    setReviewBusy(true);
    try {
      await api.post('/student/review', { batchId: id, ...reviewForm });
      setModal({ open: true, title: 'Thanks', message: 'Review submitted.', isError: false });
      setReviewForm({ rating: 5, comment: '' });
    } catch (error) {
      setModal({ open: true, title: 'Error', message: error.response?.data?.error || 'Failed to submit review', isError: true });
    } finally {
      setReviewBusy(false);
    }
  };

  const leaveBatch = async () => {
    setLeaveBusy(true);
    try {
      await api.post(`/student/batch/${id}/leave`);
      setLeaveConfirm(false);
      setModal({
        open: true,
        title: 'Left batch',
        message: 'You have left this batch.',
        isError: false,
        onOk: () => navigate('/student/batches')
      });
    } catch (error) {
      setModal({ open: true, title: 'Error', message: error.response?.data?.error || 'Could not leave batch', isError: true, onOk: null });
    } finally {
      setLeaveBusy(false);
    }
  };

  if (!batch) return (
    <div className="dashboard-layout">
      <Sidebar items={studentMenuItems} />
      <main className="dashboard-content"><div className="loading-spinner">Loading...</div></main>
    </div>
  );

  return (
    <div className="dashboard-layout">
      <Sidebar items={studentMenuItems} />
      <main className="dashboard-content">
        <div className="page-header">
          <h1>{batch.batchName}</h1>
        </div>

        <div className="card batch-detail-card">
          <div className="batch-detail-grid">
            <div className="detail-item">
              <span className="detail-label">Teacher</span>
              <span className="detail-value">{batch.teacherId?.firstName} {batch.teacherId?.lastName}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Class</span>
              <span className="detail-value">{batch.class}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Board</span>
              <span className="detail-value">{batch.board}</span>
            </div>
          </div>
          <div className="batch-subject-list">
            {batch.subjects.map((s, i) => (
              <span key={i} className="batch-subject-chip">{s}</span>
            ))}
          </div>
          <div className="batch-actions-row">
            <button type="button" className="btn btn-primary" onClick={markAttendance} disabled={attBusy}>
              {attBusy ? 'Marking…' : '📍 Mark Attendance'}
            </button>
            <button type="button" className="btn btn-danger" onClick={() => setLeaveConfirm(true)}>
              Leave Batch
            </button>
          </div>
        </div>

        <div className="tabs">
          <button type="button" className={tab === 'logs' ? 'active' : ''} onClick={() => setTab('logs')}>Class Logs</button>
          <button type="button" className={tab === 'files' ? 'active' : ''} onClick={() => setTab('files')}>Files</button>
          <button type="button" className={tab === 'review' ? 'active' : ''} onClick={() => setTab('review')}>Give Review</button>
        </div>

        {tab === 'logs' && (
          <div className="logs-list">
            {logs.map((log) => (
              <div key={log._id} className="log-item card">
                <h4>{log.title}</h4>
                <p>{log.description}</p>
                <small>{new Date(log.date).toLocaleDateString()}</small>
              </div>
            ))}
          </div>
        )}

        {tab === 'files' && (
          <div className="files-section">
            <h3>Notes</h3>
            {batch.notes?.map((note, i) => (
              <div key={i} className="file-item card">
                <a href={normalizeFileUrl(note.url)} target="_blank" rel="noopener noreferrer">{note.name}</a>
              </div>
            ))}

            <h3>Syllabus</h3>
            {batch.syllabus?.map((syl, i) => (
              <div key={i} className="file-item card">
                <a href={normalizeFileUrl(syl.url)} target="_blank" rel="noopener noreferrer">{syl.name}</a>
              </div>
            ))}
          </div>
        )}

        {tab === 'review' && (
          <form onSubmit={submitReview} className="card form-card">
            <div className="form-group">
              <label>Rating</label>
              <select value={reviewForm.rating} onChange={(e) => setReviewForm({ ...reviewForm, rating: parseInt(e.target.value, 10) })}>
                {[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{r} Stars</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Comment (Optional)</label>
              <textarea
                value={reviewForm.comment}
                onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                rows="4"
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={reviewBusy}>{reviewBusy ? 'Submitting…' : 'Submit Review'}</button>
          </form>
        )}
      </main>

      <Modal open={modal.open} onClose={() => setModal((m) => ({ ...m, open: false }))} title={modal.title}>
        <p>{modal.message}</p>
        <button
          type="button"
          className="btn btn-primary btn-full"
          onClick={() => {
            const fn = modal.onOk;
            setModal((m) => ({ ...m, open: false, onOk: null }));
            if (typeof fn === 'function') fn();
          }}
        >
          OK
        </button>
      </Modal>

      <Modal open={leaveConfirm} onClose={() => !leaveBusy && setLeaveConfirm(false)} title="Leave this batch?">
        <p>You will be removed from this batch for this teacher. Continue?</p>
        <div className="modal-actions-row">
          <button type="button" className="btn btn-secondary" onClick={() => setLeaveConfirm(false)} disabled={leaveBusy}>Cancel</button>
          <button type="button" className="btn btn-danger" onClick={leaveBatch} disabled={leaveBusy}>{leaveBusy ? '…' : 'Leave'}</button>
        </div>
      </Modal>
    </div>
  );
};

export default StudentBatchDetails;
