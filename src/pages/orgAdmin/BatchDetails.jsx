import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
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

function formatSchedule(batch) {
  if (!batch) return '';
  if (batch.schedule?.length) {
    return batch.schedule.map((s) => `${s.day.slice(0, 3)} ${s.startTime}`).join(' · ');
  }
  return `${(batch.days || []).join(', ')} @ ${batch.startTime || ''}`;
}

export default function OrgAdminBatchDetails() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [toast, setToast] = useState({ open: false, message: '', isError: false });
  const [disc, setDisc] = useState({ open: false, enrollmentId: null, name: '', discount: 0, discountType: 'amount', busy: false });
  const [allTeachers, setAllTeachers] = useState([]);
  const [teacherModal, setTeacherModal] = useState({ open: false, ids: [], busy: false });

  const batch = data?.batch;
  const assignedTeachers = useMemo(() => (Array.isArray(data?.teachers) ? data.teachers : []), [data]);
  const students = useMemo(() => (Array.isArray(data?.students) ? data.students : []), [data]);
  const logs = useMemo(() => (Array.isArray(data?.logs) ? data.logs : []), [data]);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/org-admin/batch/${id}`);
      setData(res.data);
    } catch (e) {
      setToast({ open: true, message: e.response?.data?.error || 'Failed to load batch', isError: true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchOrgTeachers = async () => {
    try {
      const { data: t } = await api.get('/org-admin/teachers?limit=500');
      setAllTeachers(t.teachers || []);
    } catch (e) {
      setToast({ open: true, message: e.response?.data?.error || 'Failed to load teachers', isError: true });
    }
  };

  const openTeacherModal = async () => {
    await fetchOrgTeachers();
    setTeacherModal({
      open: true,
      ids: assignedTeachers.map((t) => t.id),
      busy: false
    });
  };

  const toggleTeacher = (tid) => {
    setTeacherModal((m) => ({
      ...m,
      ids: m.ids.includes(tid) ? m.ids.filter((x) => x !== tid) : [...m.ids, tid]
    }));
  };

  const saveTeachers = async () => {
    setTeacherModal((m) => ({ ...m, busy: true }));
    try {
      await api.put(`/org-admin/batch/${id}/teachers`, { teacherIds: teacherModal.ids });
      setToast({ open: true, message: 'Teachers updated.', isError: false });
      setTeacherModal((m) => ({ ...m, open: false, busy: false }));
      fetchDetails();
    } catch (e) {
      setToast({ open: true, message: e.response?.data?.error || 'Failed to update teachers', isError: true });
      setTeacherModal((m) => ({ ...m, busy: false }));
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar items={orgAdminMenuItems} />
      <main className="dashboard-content">
        <div className="page-header">
          <h1>Batch Details</h1>
        </div>

        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading…</p>
          </div>
        ) : !batch ? (
          <div className="card">
            <p>Batch not found.</p>
          </div>
        ) : (
          <>
            <div className="card" style={{ marginBottom: 16 }}>
              <h3 style={{ marginTop: 0 }}>{batch.batchName}</h3>
              <p><strong>Class:</strong> {batch.class} &nbsp; <strong>Board:</strong> {batch.board}</p>
              <p><strong>Subjects:</strong> {(batch.subjects || []).join(', ') || '—'}</p>
              <p><strong>Schedule:</strong> {formatSchedule(batch) || '—'}</p>
              <p><strong>Fees:</strong> ₹{batch.fees}</p>
            </div>

            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                <h3 style={{ marginTop: 0, marginBottom: 0 }}>Assigned teachers</h3>
                <button type="button" className="btn btn-primary" onClick={openTeacherModal}>
                  Add Teachers
                </button>
              </div>
              {assignedTeachers.length === 0 ? (
                <p className="empty-hint">No teachers assigned.</p>
              ) : (
                <div className="stack-list" style={{ marginTop: 12 }}>
                  {assignedTeachers.map((t) => (
                    <div key={t.id} className="stack-item">
                      <strong>{t.name}</strong> {t.email ? <span className="hint-text">({t.email})</span> : null}
                      <div className="hint-text">{[t.degree, t.experience].filter(Boolean).join(' · ')}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card" style={{ marginBottom: 16 }}>
              <h3 style={{ marginTop: 0 }}>Students ({students.length})</h3>
              {students.length === 0 ? (
                <p className="empty-hint">No active students yet.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="simple-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Mobile</th>
                        <th>WhatsApp</th>
                        <th>Discount</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((s) => (
                        <tr key={s._id}>
                          <td>{s.name}</td>
                          <td>{s.mobile || '—'}</td>
                          <td>{s.whatsapp || '—'}</td>
                          <td>{s.discount ?? 0}</td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => setDisc({
                                open: true,
                                enrollmentId: s.enrollmentId,
                                name: s.name,
                                discount: s.discount ?? 0,
                                discountType: 'amount',
                                busy: false
                              })}
                            >
                              Apply discount
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="card">
              <h3 style={{ marginTop: 0 }}>Class logs ({logs.length})</h3>
              {logs.length === 0 ? (
                <p className="empty-hint">No logs yet.</p>
              ) : (
                <div className="stack-list">
                  {logs.map((l) => (
                    <div key={l._id} className="stack-item">
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                        <strong>{l.title}</strong>
                        <span style={{ opacity: 0.8 }}>{new Date(l.date).toLocaleDateString()}</span>
                      </div>
                      {l.description && <div style={{ marginTop: 6 }}>{l.description}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      <Modal open={toast.open} onClose={() => setToast((t) => ({ ...t, open: false }))} title={toast.isError ? 'Error' : 'Done'}>
        <p className="pre-wrap">{toast.message}</p>
        <button type="button" className="btn btn-primary btn-full" onClick={() => setToast((t) => ({ ...t, open: false }))}>OK</button>
      </Modal>

      <Modal open={disc.open} onClose={() => !disc.busy && setDisc({ open: false, enrollmentId: null, name: '', discount: 0, discountType: 'amount', busy: false })} title="Apply discount">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!disc.enrollmentId) return;
            setDisc((d) => ({ ...d, busy: true }));
            try {
              await api.put(`/org-admin/enrollment/${disc.enrollmentId}/discount`, {
                discount: Number(disc.discount),
                discountType: disc.discountType
              });
              setToast({ open: true, message: 'Discount updated.', isError: false });
              setDisc({ open: false, enrollmentId: null, name: '', discount: 0, discountType: 'amount', busy: false });
              fetchDetails();
            } catch (e2) {
              setToast({ open: true, message: e2.response?.data?.error || 'Failed to update discount', isError: true });
              setDisc((d) => ({ ...d, busy: false }));
            }
          }}
        >
          <p><strong>Student:</strong> {disc.name}</p>
          <div className="form-row" style={{ gap: 12 }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Type</label>
              <select value={disc.discountType} onChange={(e) => setDisc((d) => ({ ...d, discountType: e.target.value }))} disabled={disc.busy}>
                <option value="amount">Amount</option>
                <option value="percentage">Percentage</option>
              </select>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Discount</label>
              <input
                type="number"
                value={disc.discount}
                onChange={(e) => setDisc((d) => ({ ...d, discount: e.target.value }))}
                min="0"
                disabled={disc.busy}
                required
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={disc.busy}>
            {disc.busy ? 'Saving…' : 'Save'}
          </button>
        </form>
      </Modal>

      <Modal open={teacherModal.open} onClose={() => !teacherModal.busy && setTeacherModal((m) => ({ ...m, open: false }))} title="Manage teachers">
        <p className="hint-text">Select teachers to assign to this batch. Unselecting will remove them.</p>
        <div className="chip-grid">
          {allTeachers.map((t) => (
            <button
              type="button"
              key={t.id}
              className={`chip ${teacherModal.ids.includes(t.id) ? 'active' : ''}`}
              onClick={() => toggleTeacher(t.id)}
              disabled={teacherModal.busy}
            >
              {t.name} {t.email ? `(${t.email})` : ''}
            </button>
          ))}
        </div>
        <button type="button" className="btn btn-primary btn-full" disabled={teacherModal.busy} onClick={saveTeachers}>
          {teacherModal.busy ? 'Saving…' : 'Save teachers'}
        </button>
      </Modal>
    </div>
  );
}

