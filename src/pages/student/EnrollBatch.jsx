import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../../components/Sidebar';
import Modal from '../../components/Modal';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import './Dashboard.css';
import './EnrollBatch.css';

const studentMenuItems = [
  { path: '/student/dashboard', label: 'Dashboard' },
  { path: '/student/batches', label: 'My Batches' },
  { path: '/student/enroll', label: 'Enroll in Batch' },
  { path: '/student/org', label: 'Organization' },
  { path: '/student/notices', label: 'Notices' },
  { path: '/student/profile', label: 'Profile' }
];

function formatSchedule(batch) {
  if (!batch) return '';
  if (batch.schedule?.length) {
    return batch.schedule.map((s) => `${s.day.slice(0, 3)} ${s.startTime}`).join(' · ');
  }
  return `${(batch.days || []).join(', ')} @ ${batch.startTime || ''}`;
}

const EnrollBatch = () => {
  const { profile } = useAuth();
  const [teacherCode, setTeacherCode] = useState('');
  const [teacher, setTeacher] = useState(null);
  const [batches, setBatches] = useState([]);
  const [enrolledIds, setEnrolledIds] = useState(() => new Set());
  const [filters, setFilters] = useState({ search: '', class: '', subject: '', board: '' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [enrollBusy, setEnrollBusy] = useState(null);
  const [modal, setModal] = useState({ open: false, title: '', message: '', isError: false });
  const [warn, setWarn] = useState({ open: false, batch: null });

  const fetchBatches = useCallback(async (teacherId, p = 1) => {
    if (!teacherId) return;
    setLoadingBatches(true);
    try {
      const params = new URLSearchParams({
        search: filters.search || '',
        class: filters.class || '',
        subject: filters.subject || '',
        board: filters.board || '',
        page: String(p),
        limit: '9'
      });
      const { data } = await api.get(`/student/teacher/${teacherId}/batches?${params}`);
      setBatches(data.batches || []);
      setTotalPages(data.pages || 1);
      setPage(p);
    } catch (error) {
      console.error('Error fetching batches:', error);
    } finally {
      setLoadingBatches(false);
    }
  }, [filters]);

  useEffect(() => {
    if (teacher?._id) fetchBatches(teacher._id, 1);
  }, [filters, teacher?._id, fetchBatches]);

  const fetchEnrolled = useCallback(async () => {
    try {
      const { data } = await api.get('/student/batches');
      const groups = Array.isArray(data) ? data : [];
      const ids = new Set();
      for (const g of groups) {
        const bs = Array.isArray(g?.batches) ? g.batches : [];
        for (const b of bs) {
          if (b?._id) ids.add(String(b._id));
        }
      }
      setEnrolledIds(ids);
    } catch (e) {
      // Non-blocking: enrollment UI still works without this.
      console.error('Error fetching enrolled batches:', e);
    }
  }, []);

  useEffect(() => {
    fetchEnrolled();
  }, [fetchEnrolled]);

  const searchTeacher = async () => {
    try {
      const { data } = await api.post('/student/teacher/search', { teacherCode });
      setTeacher(data);
      setPage(1);
    } catch (error) {
      setModal({
        open: true,
        title: 'Not found',
        message: error.response?.data?.error || 'Teacher not found',
        isError: true
      });
    }
  };

  const tryEnroll = (batch) => {
    const clsMismatch = profile?.class && batch.class && profile.class !== batch.class;
    const boardMismatch = profile?.board && batch.board && profile.board !== batch.board;
    if (clsMismatch || boardMismatch) {
      setWarn({
        open: true,
        batch,
        clsMismatch,
        boardMismatch
      });
      return;
    }
    enrollInBatch(batch._id);
  };

  const enrollInBatch = async (batchId) => {
    setEnrollBusy(batchId);
    setWarn((w) => ({ ...w, open: false }));
    try {
      await api.post('/student/enroll', { batchId });
      setModal({ open: true, title: 'Enrolled', message: 'You have enrolled successfully.', isError: false });
      fetchEnrolled();
      if (teacher?._id) fetchBatches(teacher._id, page);
    } catch (error) {
      const msg = error.response?.data?.error || 'Enrollment failed';
      if (error.response?.status === 409 && error.response?.data?.conflicts) {
        const lines = error.response.data.conflicts.map(
          (c) => `“${c.batchName}” (${c.teacherName}) — ${c.schedule?.length ? c.schedule.map((s) => `${s.day} ${s.startTime}`).join(', ') : `${(c.days || []).join(', ')} @ ${c.startTime}`}`
        );
        setModal({
          open: true,
          title: 'Schedule conflict',
          message: `This batch overlaps with another class at the same day and time:\n${lines.join('\n')}`,
          isError: true
        });
        return;
      }
      if (msg.includes('Already')) {
        setModal({ open: true, title: 'Already enrolled', message: 'You are already enrolled in this batch.', isError: false });
        return;
      }
      setModal({ open: true, title: 'Error', message: msg, isError: true });
    } finally {
      setEnrollBusy(null);
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar items={studentMenuItems} />
      <main className="dashboard-content enroll-page">
        <div className="page-header">
          <h1>Enroll in Batch</h1>
        </div>

        <div className="card form-card">
          <h3>Find Your Teacher</h3>
          <p className="search-hint">Enter the teacher code to view available batches</p>
          <div className="form-group">
            <label>Teacher Code</label>
            <div className="search-input-group">
              <input
                value={teacherCode}
                onChange={(e) => setTeacherCode(e.target.value.toUpperCase())}
                placeholder="Enter 6-digit code"
                maxLength="6"
              />
              <button type="button" className="btn btn-primary" onClick={searchTeacher}>
                Search
              </button>
            </div>
          </div>
        </div>

        {teacher && (
          <div className="card">
            <h3>Teacher Information</h3>
            <div className="teacher-details">
              <p><strong>Name:</strong> {teacher.firstName} {teacher.lastName}</p>
              <p><strong>Subjects:</strong> {teacher.subjects?.join(', ')}</p>
              <p><strong>Experience:</strong> {teacher.experience} years</p>
              <p><strong>Education:</strong> {teacher.education}</p>
            </div>
          </div>
        )}

        {teacher && (
          <>
            <div className="filters-bar enroll-filters">
              <input
                type="text"
                placeholder="Search batches"
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
              <input
                type="text"
                placeholder="Subject filter"
                value={filters.subject}
                onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
              />
            </div>

            <h3>Available Batches</h3>
            {loadingBatches ? (
              <div className="loading-inline">Loading batches…</div>
            ) : (
              <>
                <div className="batches-grid">
                  {batches.map((batch) => (
                    <div key={batch._id} className="batch-card card">
                      <h4>{batch.batchName}</h4>
                      <p><strong>Class:</strong> {batch.class}</p>
                      <p><strong>Board:</strong> {batch.board}</p>
                      <p><strong>Subjects:</strong> {batch.subjects?.join(', ')}</p>
                      <p><strong>Schedule:</strong> {formatSchedule(batch)}</p>
                      <p className="fees-highlight"><strong>Fees:</strong> ₹{batch.fees}/month</p>
                      {(() => {
                        const isEnrolled = enrolledIds.has(String(batch._id));
                        const isBusy = enrollBusy === batch._id;
                        return (
                      <button
                        type="button"
                        className="btn btn-primary btn-full"
                        disabled={isEnrolled || (!!enrollBusy && !isBusy)}
                        onClick={() => !isEnrolled && tryEnroll(batch)}
                      >
                        {isEnrolled ? 'Enrolled' : (isBusy ? 'Please wait…' : 'Enroll Now')}
                      </button>
                        );
                      })()}
                    </div>
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="pagination">
                    <button type="button" className="btn btn-secondary" disabled={page <= 1} onClick={() => fetchBatches(teacher._id, page - 1)}>Previous</button>
                    <span>Page {page} / {totalPages}</span>
                    <button type="button" className="btn btn-secondary" disabled={page >= totalPages} onClick={() => fetchBatches(teacher._id, page + 1)}>Next</button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>

      <Modal open={modal.open} onClose={() => setModal((m) => ({ ...m, open: false }))} title={modal.title} wide={modal.message?.length > 120}>
        <p className="pre-wrap">{modal.message}</p>
        <button type="button" className="btn btn-primary btn-full" onClick={() => setModal((m) => ({ ...m, open: false }))}>OK</button>
      </Modal>

      <Modal open={warn.open} onClose={() => setWarn({ open: false, batch: null })} title="Mismatch warning" wide>
        {warn.batch && (
          <>
            {warn.clsMismatch && (
              <p>Your profile class ({profile?.class}) differs from this batch ({warn.batch.class}).</p>
            )}
            {warn.boardMismatch && (
              <p>Your board ({profile?.board}) differs from this batch ({warn.batch.board}).</p>
            )}
            <p>Do you still want to enroll?</p>
            <div className="modal-actions-row">
              <button type="button" className="btn btn-secondary" onClick={() => setWarn({ open: false, batch: null })}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={() => enrollInBatch(warn.batch._id)} disabled={!!enrollBusy}>Enroll anyway</button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};

export default EnrollBatch;
