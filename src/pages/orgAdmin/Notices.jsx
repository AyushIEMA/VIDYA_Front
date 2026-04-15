import React, { useEffect, useMemo, useState } from 'react';
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

export default function OrgAdminNotices() {
  const [batches, setBatches] = useState([]);
  const [targetType, setTargetType] = useState('all');
  const [batchId, setBatchId] = useState('');
  const [students, setStudents] = useState([]);
  const [studentIds, setStudentIds] = useState([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', isError: false });

  useEffect(() => {
    fetchBatches();
  }, []);

  useEffect(() => {
    if ((targetType === 'batch' || targetType === 'students') && batchId) fetchBatchStudents(batchId);
    if (targetType !== 'students') setStudentIds([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetType, batchId]);

  const fetchBatches = async () => {
    try {
      const { data } = await api.get('/org-admin/batch?limit=200');
      setBatches(data.batches || []);
    } catch (e) {
      setToast({ open: true, message: e.response?.data?.error || 'Failed to load batches', isError: true });
    }
  };

  const fetchBatchStudents = async (id) => {
    try {
      const { data } = await api.get(`/org-admin/batch/${id}`);
      setStudents(Array.isArray(data?.students) ? data.students : []);
    } catch (e) {
      setStudents([]);
    }
  };

  const selectedCount = useMemo(() => studentIds.length, [studentIds]);

  const toggleStudent = (id) => {
    setStudentIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const send = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setToast({ open: true, message: 'Title and message are required', isError: true });
      return;
    }
    if (targetType === 'batch' && !batchId) {
      setToast({ open: true, message: 'Please select a batch', isError: true });
      return;
    }
    if (targetType === 'students' && studentIds.length === 0) {
      setToast({ open: true, message: 'Please select at least one student', isError: true });
      return;
    }
    setBusy(true);
    try {
      const payload = {
        title,
        message,
        targetType,
        batchId: targetType === 'batch' ? batchId : undefined,
        studentIds: targetType === 'students' ? studentIds : undefined
      };
      const { data } = await api.post('/org-admin/announcement', payload);
      setToast({ open: true, message: `Notice sent to ${data.sentTo ?? 0} students.`, isError: false });
      setTitle('');
      setMessage('');
      setStudentIds([]);
    } catch (e2) {
      setToast({ open: true, message: e2.response?.data?.error || 'Failed to send notice', isError: true });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar items={orgAdminMenuItems} />
      <main className="dashboard-content">
        <div className="page-header">
          <h1>Notices</h1>
        </div>

        <div className="card form-card">
          <div className="form-header">
            <h3>Send notice</h3>
            <p>Send to all students, a batch, or specific students.</p>
          </div>

          <form onSubmit={send}>
            <div className="form-group">
              <label>Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Message</label>
              <textarea rows={4} value={message} onChange={(e) => setMessage(e.target.value)} required />
            </div>

            <div className="form-group">
              <label>Target</label>
              <select value={targetType} onChange={(e) => setTargetType(e.target.value)}>
                <option value="all">All students (org)</option>
                <option value="batch">One batch</option>
                <option value="students">Selected students</option>
              </select>
            </div>

            {(targetType === 'batch' || targetType === 'students') && (
              <div className="form-group">
                <label>Batch</label>
                <select value={batchId} onChange={(e) => setBatchId(e.target.value)} required={targetType !== 'all'}>
                  <option value="">Select batch</option>
                  {batches.map((b) => (
                    <option key={b._id} value={b._id}>{b.batchName}</option>
                  ))}
                </select>
              </div>
            )}

            {targetType === 'students' && (
              <div className="card" style={{ marginTop: 12 }}>
                <h4 style={{ marginTop: 0, marginBottom: 10 }}>Select students ({selectedCount})</h4>
                {batchId ? (
                  students.length === 0 ? (
                    <p className="hint-text">No students in this batch.</p>
                  ) : (
                    <div className="stack-list">
                      {students.map((s) => (
                        <label key={s._id} className="stack-item" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                          <input type="checkbox" checked={studentIds.includes(s._id)} onChange={() => toggleStudent(s._id)} />
                          <span>{s.name}</span>
                        </label>
                      ))}
                    </div>
                  )
                ) : (
                  <p className="hint-text">Select a batch first.</p>
                )}
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-full" disabled={busy}>
              {busy ? 'Sending…' : 'Send notice'}
            </button>
          </form>
        </div>
      </main>

      <Modal open={toast.open} onClose={() => setToast((t) => ({ ...t, open: false }))} title={toast.isError ? 'Error' : 'Done'}>
        <p className="pre-wrap">{toast.message}</p>
        <button type="button" className="btn btn-primary btn-full" onClick={() => setToast((t) => ({ ...t, open: false }))}>OK</button>
      </Modal>
    </div>
  );
}

