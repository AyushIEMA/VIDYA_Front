import React, { useCallback, useEffect, useState } from 'react';
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

export default function EnrollOrganization() {
  const { profile } = useAuth();
  const [organizationCode, setOrganizationCode] = useState('');
  const [org, setOrg] = useState(null);
  const [batches, setBatches] = useState([]);
  const [enrolledIds, setEnrolledIds] = useState(() => new Set());
  const [filters, setFilters] = useState({ search: '', class: '', subject: '', board: '' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [enrollBusy, setEnrollBusy] = useState(null);
  const [modal, setModal] = useState({ open: false, title: '', message: '', isError: false });
  const [warn, setWarn] = useState({ open: false, batch: null });

  const fetchBatches = useCallback(async (orgId, p = 1) => {
    if (!orgId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search: filters.search || '',
        class: filters.class || '',
        subject: filters.subject || '',
        board: filters.board || '',
        page: String(p),
        limit: '9'
      });
      const { data } = await api.get(`/organization/${orgId}/batches?${params}`);
      setBatches(data.batches || []);
      setTotalPages(data.pages || 1);
      setPage(p);
    } catch (err) {
      setModal({ open: true, title: 'Error', message: err.response?.data?.error || 'Failed to load batches', isError: true });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (org?._id) fetchBatches(org._id, 1);
  }, [filters, org?._id, fetchBatches]);

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
      console.error('Error fetching enrolled batches:', e);
    }
  }, []);

  useEffect(() => {
    fetchEnrolled();
  }, [fetchEnrolled]);

  const searchOrg = async () => {
    setOrg(null);
    setBatches([]);
    try {
      const { data } = await api.post('/organization/search', { organizationCode });
      setOrg(data);
      setPage(1);
    } catch (err) {
      setModal({ open: true, title: 'Not found', message: err.response?.data?.error || 'Organization not found', isError: true });
    }
  };

  const enrollInBatch = async (batchId) => {
    setEnrollBusy(batchId);
    try {
      await api.post('/student/enroll', { batchId });
      setModal({ open: true, title: 'Enrolled', message: 'You have enrolled successfully.', isError: false });
      fetchEnrolled();
      if (org?._id) fetchBatches(org._id, page);
    } catch (err) {
      const msg = err.response?.data?.error || 'Enrollment failed';
      if (msg.includes('Already')) {
        setModal({ open: true, title: 'Already enrolled', message: 'You are already enrolled in this batch.', isError: false });
      } else {
        setModal({ open: true, title: 'Error', message: msg, isError: true });
      }
    } finally {
      setEnrollBusy(null);
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

  return (
    <div className="dashboard-layout">
      <Sidebar items={studentMenuItems} />
      <main className="dashboard-content enroll-page">
        <div className="page-header">
          <h1>Organization</h1>
        </div>

        <div className="card form-card">
          <h3>Find your Organization</h3>
          <p className="search-hint">Enter the organization code to view available batches</p>
          <div className="form-group">
            <label>Organization Code</label>
            <div className="search-input-group">
              <input
                value={organizationCode}
                onChange={(e) => setOrganizationCode(e.target.value.toUpperCase())}
                placeholder="Enter 6-digit code"
                maxLength="6"
              />
              <button type="button" className="btn btn-primary" onClick={searchOrg}>
                Search
              </button>
            </div>
          </div>
        </div>

        {org && (
          <div className="card">
            <h3>Organization</h3>
            <div className="teacher-details">
              <p><strong>Name:</strong> {org.name}</p>
              {org.address && <p><strong>Address:</strong> {org.address}</p>}
              {org.subjects?.length > 0 && <p><strong>Subjects:</strong> {org.subjects.join(', ')}</p>}
              {org.organizationCode && <p><strong>Code:</strong> {org.organizationCode}</p>}
            </div>
          </div>
        )}

        {org && (
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
            {loading ? (
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
                    <button type="button" className="btn btn-secondary" disabled={page <= 1} onClick={() => fetchBatches(org._id, page - 1)}>Previous</button>
                    <span>Page {page} / {totalPages}</span>
                    <button type="button" className="btn btn-secondary" disabled={page >= totalPages} onClick={() => fetchBatches(org._id, page + 1)}>Next</button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>

      <Modal open={modal.open} onClose={() => setModal((m) => ({ ...m, open: false }))} title={modal.title} wide={String(modal.message || '').length > 120}>
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
}

