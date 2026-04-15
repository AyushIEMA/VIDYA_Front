import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Modal from '../../components/Modal';
import api from '../../api/axios';
import './Dashboard.css';
import './PromoteStudent.css';

const teacherMenuItems = [
  { path: '/teacher/dashboard', label: 'Dashboard' },
  { path: '/teacher/batches', label: 'My Batches' },
  { path: '/teacher/announcements', label: 'Announcements' },
  { path: '/teacher/fees', label: 'Fees Management' },
  { path: '/teacher/attendance', label: 'Attendance' },
  { path: '/teacher/promote', label: 'Promote Student' },
  { path: '/teacher/profile', label: 'Profile' }
];

const PromoteStudent = () => {
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [promoteStudent, setPromoteStudent] = useState(null);
  const [targetBatchId, setTargetBatchId] = useState('');
  const [actionBusy, setActionBusy] = useState(false);
  const [confirm, setConfirm] = useState({ open: false, action: null, student: null });
  const [toast, setToast] = useState({ open: false, message: '', isError: false });

  useEffect(() => {
    fetchBatches();
  }, []);

  useEffect(() => {
    if (selectedBatch) fetchStudents();
  }, [selectedBatch]);

  const fetchBatches = async () => {
    try {
      const { data } = await api.get('/teacher/batch?limit=200');
      setBatches(data.batches || []);
    } catch (error) {
      console.error('Error fetching batches:', error);
    }
  };

  const fetchStudents = async () => {
    setLoadingStudents(true);
    try {
      const { data } = await api.get(`/teacher/batch/${selectedBatch}`);
      setStudents(data.students || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoadingStudents(false);
    }
  };

  const openPromote = (student) => {
    setPromoteStudent(student);
    setTargetBatchId('');
  };

  const openConfirm = (student, action) => {
    setConfirm({ open: true, student, action });
  };

  const runAction = async () => {
    const { student, action } = confirm;
    if (!student || !action || !selectedBatch) return;

    setActionBusy(true);
    try {
      await api.post('/teacher/promote', {
        studentId: student._id,
        batchId: selectedBatch,
        action
      });
      setToast({ open: true, message: action === 'fail' ? 'Student marked as fail (stays in batch).' : 'Student removed from your active enrollments.', isError: false });
      setConfirm({ open: false, action: null, student: null });
      fetchStudents();
    } catch (error) {
      setToast({ open: true, message: error.response?.data?.error || 'Action failed', isError: true });
    } finally {
      setActionBusy(false);
    }
  };

  const submitPromote = async (e) => {
    e.preventDefault();
    if (!promoteStudent || !targetBatchId) {
      setToast({ open: true, message: 'Select a target batch.', isError: true });
      return;
    }
    setActionBusy(true);
    try {
      await api.post('/teacher/promote', {
        studentId: promoteStudent._id,
        batchId: selectedBatch,
        action: 'promote',
        newBatchId: targetBatchId
      });
      setToast({ open: true, message: 'Student moved to the selected batch.', isError: false });
      setPromoteStudent(null);
      setTargetBatchId('');
      fetchStudents();
    } catch (error) {
      setToast({ open: true, message: error.response?.data?.error || 'Promote failed', isError: true });
    } finally {
      setActionBusy(false);
    }
  };

  const otherBatches = batches.filter((b) => b._id !== selectedBatch);

  return (
    <div className="dashboard-layout">
      <Sidebar items={teacherMenuItems} />
      <main className="dashboard-content">
        <div className="page-header">
          <h1>Promote / Manage Students</h1>
        </div>
        <p className="page-subtitle">Choose a batch, then use Promote, Fail, or Leave to manage students.</p>

        <div className="card form-card">
          <div className="form-group">
            <label>Select Batch</label>
            <select value={selectedBatch} onChange={(e) => setSelectedBatch(e.target.value)}>
              <option value="">Choose batch</option>
              {batches.map((b) => (
                <option key={b._id} value={b._id}>{b.batchName}</option>
              ))}
            </select>
          </div>
          <Link to="/teacher/batch/create" className="btn btn-secondary">+ Create new batch</Link>
        </div>

        {loadingStudents && <div className="loading-inline">Loading students…</div>}

        <div className="students-list promote-list">
          {!loadingStudents && students.map((student) => (
            <div key={student._id} className="student-item card promote-card">
              <div>
                <h4>{student.name}</h4>
                <p>Class: {student.class}</p>
              </div>
              <div className="student-actions">
                <button type="button" className="btn btn-primary" onClick={() => openPromote(student)}>Promote</button>
                <button type="button" className="btn btn-warning" onClick={() => openConfirm(student, 'fail')}>Fail</button>
                <button type="button" className="btn btn-danger" onClick={() => openConfirm(student, 'left')}>Leave</button>
              </div>
            </div>
          ))}
        </div>
      </main>

      <Modal open={confirm.open} onClose={() => !actionBusy && setConfirm({ open: false, action: null, student: null })} title="Confirm">
        <p>
          {confirm.action === 'fail' && `Mark ${confirm.student?.name} as failed? They stay in this batch.`}
          {confirm.action === 'left' && `Remove ${confirm.student?.name} from your active enrollments for this batch?`}
        </p>
        <div className="modal-actions-row">
          <button type="button" className="btn btn-secondary" onClick={() => setConfirm({ open: false, action: null, student: null })} disabled={actionBusy}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={runAction} disabled={actionBusy}>{actionBusy ? '…' : 'Confirm'}</button>
        </div>
      </Modal>

      <Modal open={!!promoteStudent} onClose={() => !actionBusy && setPromoteStudent(null)} title="Promote to batch" wide>
        <form onSubmit={submitPromote}>
          <p className="mb-1">Student: <strong>{promoteStudent?.name}</strong></p>
          <div className="form-group">
            <label>Next batch</label>
            <select value={targetBatchId} onChange={(e) => setTargetBatchId(e.target.value)} required>
              <option value="">Select batch</option>
              {otherBatches.map((b) => (
                <option key={b._id} value={b._id}>{b.batchName} — {b.class}</option>
              ))}
            </select>
          </div>
          <p className="hint-text"><Link to="/teacher/batch/create">Create a new batch</Link> if needed, then refresh this page.</p>
          <div className="modal-actions-row">
            <button type="button" className="btn btn-secondary" onClick={() => setPromoteStudent(null)} disabled={actionBusy}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={actionBusy}>{actionBusy ? 'Saving…' : 'Move student'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={toast.open} onClose={() => setToast((t) => ({ ...t, open: false }))} title={toast.isError ? 'Error' : 'Done'}>
        <p>{toast.message}</p>
        <button type="button" className="btn btn-primary btn-full" onClick={() => setToast((t) => ({ ...t, open: false }))}>OK</button>
      </Modal>
    </div>
  );
};

export default PromoteStudent;
