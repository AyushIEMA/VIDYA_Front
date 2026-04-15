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

function groupByStudent(rows) {
  const map = new Map();
  for (const row of rows) {
    const sid = row.studentId?._id || row.studentId;
    const key = sid?.toString?.() || 'unknown';
    if (!map.has(key)) {
      map.set(key, {
        student: row.studentId,
        records: []
      });
    }
    map.get(key).records.push(row);
  }
  return Array.from(map.values());
}

export default function OrgAdminAttendance() {
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [attendance, setAttendance] = useState([]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [toast, setToast] = useState({ open: false, message: '', isError: false });

  useEffect(() => {
    fetchBatches();
  }, []);

  useEffect(() => {
    if (selectedBatch) fetchAttendance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBatch, month, year]);

  const fetchBatches = async () => {
    try {
      const { data } = await api.get('/org-admin/batch?limit=100');
      setBatches(data.batches || []);
    } catch (error) {
      setToast({ open: true, message: error.response?.data?.error || 'Failed to load batches', isError: true });
    }
  };

  const fetchAttendance = async () => {
    try {
      const { data } = await api.get(`/org-admin/attendance?batchId=${selectedBatch}&month=${month}&year=${year}`);
      setAttendance(data || []);
    } catch (error) {
      setToast({ open: true, message: error.response?.data?.error || 'Failed to load attendance', isError: true });
    }
  };

  const grouped = useMemo(() => groupByStudent(attendance), [attendance]);
  const fmt = (d) => new Date(d).toLocaleDateString();

  return (
    <div className="dashboard-layout">
      <Sidebar items={orgAdminMenuItems} />
      <main className="dashboard-content">
        <div className="page-header">
          <h1>Attendance</h1>
        </div>

        <div className="filters-bar">
          <select value={selectedBatch} onChange={(e) => setSelectedBatch(e.target.value)}>
            <option value="">Select Batch</option>
            {batches.map((b) => <option key={b._id} value={b._id}>{b.batchName}</option>)}
          </select>
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {[...Array(12)].map((_, i) => (
              <option key={i} value={i + 1}>{new Date(0, i).toLocaleString('en', { month: 'long' })}</option>
            ))}
          </select>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <div className="attendance-summary-list">
          {grouped.map(({ student, records }) => {
            const present = records.filter((r) => r.status === 'present');
            const absent = records.filter((r) => r.status === 'absent');
            const denom = records.length;
            return (
              <div key={student?._id || 'unknown'} className="attendance-student-card card">
                <div className="attendance-student-head">
                  <h4>{student?.name || 'Student'}</h4>
                  <span className="attendance-ratio">
                    Present {present.length}/{denom || '—'}
                  </span>
                </div>
                <div className="attendance-dates">
                  <p><strong>Present:</strong> {present.length ? present.map((r) => fmt(r.date)).join(', ') : '—'}</p>
                  <p><strong>Absent:</strong> {absent.length ? absent.map((r) => fmt(r.date)).join(', ') : '—'}</p>
                </div>
              </div>
            );
          })}
        </div>

        {selectedBatch && grouped.length === 0 && (
          <p className="empty-hint">No attendance records for this period.</p>
        )}
      </main>

      <Modal open={toast.open} onClose={() => setToast((t) => ({ ...t, open: false }))} title={toast.isError ? 'Error' : 'OK'}>
        <p className="pre-wrap">{toast.message}</p>
        <button type="button" className="btn btn-primary btn-full" onClick={() => setToast((t) => ({ ...t, open: false }))}>OK</button>
      </Modal>
    </div>
  );
}

