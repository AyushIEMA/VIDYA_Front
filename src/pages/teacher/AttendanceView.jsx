import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '../../components/Sidebar';
import Modal from '../../components/Modal';
import api from '../../api/axios';
import './Dashboard.css';
import './AttendanceView.css';

const teacherMenuItems = [
  { path: '/teacher/dashboard', label: 'Dashboard' },
  { path: '/teacher/batches', label: 'My Batches' },
  { path: '/teacher/announcements', label: 'Announcements' },
  { path: '/teacher/fees', label: 'Fees Management' },
  { path: '/teacher/attendance', label: 'Attendance' },
  { path: '/teacher/promote', label: 'Promote Student' },
  { path: '/teacher/profile', label: 'Profile' }
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

const AttendanceView = () => {
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [attendance, setAttendance] = useState([]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [studentSearch, setStudentSearch] = useState('');
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewId, setReviewId] = useState(null);
  const [reviewText, setReviewText] = useState('');
  const [reviewSaving, setReviewSaving] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', isError: false });

  useEffect(() => {
    fetchBatches();
  }, []);

  useEffect(() => {
    if (selectedBatch) fetchAttendance();
  }, [selectedBatch, month, year]);

  const fetchBatches = async () => {
    try {
      const { data } = await api.get('/teacher/batch?limit=100');
      setBatches(data.batches);
    } catch (error) {
      console.error('Error fetching batches:', error);
    }
  };

  const fetchAttendance = async () => {
    try {
      const { data } = await api.get(`/teacher/attendance?batchId=${selectedBatch}&month=${month}&year=${year}`);
      setAttendance(data);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const grouped = useMemo(() => groupByStudent(attendance), [attendance]);

  const filteredGrouped = useMemo(() => {
    if (!studentSearch.trim()) return grouped;
    const q = studentSearch.toLowerCase();
    return grouped.filter(({ student }) =>
      (student?.name || '').toLowerCase().includes(q)
    );
  }, [grouped, studentSearch]);

  const openReview = (id, existing) => {
    setReviewId(id);
    setReviewText(existing || '');
    setReviewOpen(true);
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!reviewId) return;
    setReviewSaving(true);
    try {
      await api.put(`/teacher/attendance/${reviewId}/review`, { review: reviewText });
      setReviewOpen(false);
      fetchAttendance();
      setToast({ open: true, message: 'Review saved.', isError: false });
    } catch (error) {
      setToast({ open: true, message: error.response?.data?.error || 'Failed to save review', isError: true });
    } finally {
      setReviewSaving(false);
    }
  };

  const fmt = (d) => new Date(d).toLocaleDateString();

  return (
    <div className="dashboard-layout">
      <Sidebar items={teacherMenuItems} />
      <main className="dashboard-content attendance-page">
        <div className="page-header">
          <h1>Attendance Report</h1>
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

        {selectedBatch && grouped.length > 0 && (
          <div className="attendance-search-bar">
            <input
              type="text"
              placeholder="Search student by name..."
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
            />
          </div>
        )}

        <div className="attendance-summary-list">
          {filteredGrouped.map(({ student, records }) => {
            const present = records.filter((r) => r.status === 'present');
            const absent = records.filter((r) => r.status === 'absent');
            const denom = records.length;
            const pct = denom ? Math.round((present.length / denom) * 100) : 0;
            return (
              <div key={student?._id || 'unknown'} className="attendance-student-card">
                <div className="attendance-student-head">
                  <div className="attendance-student-info">
                    <h4>{student?.name || 'Student'}</h4>
                    <span className="attendance-pct">{pct}% attendance</span>
                  </div>
                  <span className="attendance-ratio">
                    {present.length}/{denom} present
                  </span>
                </div>
                <div className="attendance-dates">
                  <p><strong>Present:</strong> {present.length ? present.map((r) => fmt(r.date)).join(', ') : '—'}</p>
                  <p><strong>Absent:</strong> {absent.length ? absent.map((r) => fmt(r.date)).join(', ') : '—'}</p>
                </div>
                <div className="attendance-records-table-wrap">
                  <table className="attendance-records-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Review</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((r) => (
                        <tr key={r._id}>
                          <td>{fmt(r.date)}</td>
                          <td><span className={`status-pill ${r.status}`}>{r.status}</span></td>
                          <td className="review-cell">{r.review || '—'}</td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => openReview(r._id, r.review)}
                            >
                              {r.review ? 'Edit' : 'Add'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>

        {selectedBatch && grouped.length === 0 && (
          <div className="empty-state">
            <h3>No records found</h3>
            <p>No attendance data for this batch and period.</p>
          </div>
        )}

        {selectedBatch && grouped.length > 0 && filteredGrouped.length === 0 && (
          <p className="empty-hint">No students match your search.</p>
        )}
      </main>

      <Modal open={reviewOpen} onClose={() => !reviewSaving && setReviewOpen(false)} title="Student review">
        <form onSubmit={submitReview}>
          <div className="form-group">
            <label htmlFor="review-text">Review</label>
            <textarea
              id="review-text"
              rows={4}
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={reviewSaving}>
            {reviewSaving ? 'Saving…' : 'Save review'}
          </button>
        </form>
      </Modal>

      <Modal open={toast.open} onClose={() => setToast((t) => ({ ...t, open: false }))} title={toast.isError ? 'Error' : 'OK'}>
        <p>{toast.message}</p>
        <button type="button" className="btn btn-primary btn-full" onClick={() => setToast((t) => ({ ...t, open: false }))}>OK</button>
      </Modal>
    </div>
  );
};

export default AttendanceView;
