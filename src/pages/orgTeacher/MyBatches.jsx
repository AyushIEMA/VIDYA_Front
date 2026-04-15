import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Modal from '../../components/Modal';
import api from '../../api/axios';
import '../student/Dashboard.css';
import '../teacher/MyBatches.css';
import './OrgTeacher.css';

const orgTeacherMenuItems = [
  { path: '/org-teacher/batches', label: 'Assigned Batches' }
];

function formatSchedule(batch) {
  if (!batch) return '';
  if (batch.schedule?.length) {
    return batch.schedule.map((s) => `${s.day.slice(0, 3)} ${s.startTime}`).join(' · ');
  }
  return `${(batch.days || []).join(', ')} @ ${batch.startTime || ''}`;
}

export default function OrgTeacherBatches() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ open: false, title: 'Error', message: '', isError: false });

  const fetchAssigned = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/org-teacher/batches?limit=50');
      setBatches(data.batches || []);
    } catch (err) {
      setToast({ open: true, title: 'Error', message: err.response?.data?.error || 'Failed to load batches', isError: true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssigned();
  }, []);

  return (
    <div className="dashboard-layout">
      <Sidebar items={orgTeacherMenuItems} />
      <main className="dashboard-content">
        <div className="page-header">
          <h1>Assigned Batches</h1>
        </div>

        {loading ? (
          <div className="loading-spinner">Loading…</div>
        ) : batches.length === 0 ? (
          <div className="empty-state card">
            <h3>No batches assigned</h3>
            <p>Ask your admin to assign you to a batch.</p>
          </div>
        ) : (
          <div className="batches-grid">
            {batches.map((b) => (
              <div key={b._id} className="batch-card card">
                <div className="batch-header">
                  <h3>{b.batchName}</h3>
                  <span className="batch-badge">{b.class}</span>
                </div>
                <div className="batch-details">
                  <p><strong>Board:</strong> {b.board}</p>
                  <p><strong>Subjects:</strong> {(b.subjects || []).join(', ')}</p>
                  <p><strong>Schedule:</strong> {formatSchedule(b)}</p>
                </div>
                <Link to={`/org-teacher/batch/${b._id}`} className="btn btn-primary btn-full">Open</Link>
              </div>
            ))}
          </div>
        )}
      </main>

      <Modal open={toast.open} onClose={() => setToast((t) => ({ ...t, open: false }))} title={toast.title}>
        <p>{toast.message}</p>
        <button type="button" className="btn btn-primary btn-full" onClick={() => setToast((t) => ({ ...t, open: false }))}>OK</button>
      </Modal>
    </div>
  );
}

