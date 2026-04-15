import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Modal from '../../components/Modal';
import api from '../../api/axios';
import './Dashboard.css';
import './Announcements.css';

const teacherMenuItems = [
  { path: '/teacher/dashboard', label: 'Dashboard' },
  { path: '/teacher/batches', label: 'My Batches' },
  { path: '/teacher/announcements', label: 'Announcements' },
  { path: '/teacher/fees', label: 'Fees Management' },
  { path: '/teacher/attendance', label: 'Attendance' },
  { path: '/teacher/promote', label: 'Promote Student' },
  { path: '/teacher/profile', label: 'Profile' }
];

const Announcements = () => {
  const [formData, setFormData] = useState({
    title: '', message: '', targetType: 'all', batchId: '', studentIds: []
  });
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', isError: false });

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      const { data } = await api.get('/teacher/batch?limit=100');
      setBatches(data.batches);
    } catch (error) {
      console.error('Error fetching batches:', error);
    }
  };

  const fetchStudents = async (batchId) => {
    try {
      const { data } = await api.get(`/teacher/batch/${batchId}`);
      setStudents(data.students || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        title: formData.title.trim(),
        message: formData.message.trim(),
        targetType: formData.targetType,
        batchId: formData.targetType === 'batch' ? formData.batchId : undefined,
        studentIds: formData.targetType === 'students' ? formData.studentIds : undefined
      };
      await api.post('/teacher/announcement', payload);
      setToast({ open: true, message: 'Announcement sent successfully.', isError: false });
      setFormData({ title: '', message: '', targetType: 'all', batchId: '', studentIds: [] });
      setStudents([]);
    } catch (error) {
      setToast({
        open: true,
        message: error.response?.data?.error || 'Failed to send announcement',
        isError: true
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar items={teacherMenuItems} />
      <main className="dashboard-content">
        <div className="page-header">
          <h1>Send Announcement</h1>
        </div>

        <div className="card form-card announcement-form">
          <div className="form-header">
            <h3>Create New Announcement</h3>
            <p>Send notifications to your students via WhatsApp</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Title</label>
              <input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Class Cancelled Tomorrow"
                required
              />
            </div>

            <div className="form-group">
              <label>Message</label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows="6"
                placeholder="Write your announcement here..."
                required
              />
            </div>

            <div className="form-group">
              <label>Target Audience</label>
              <div className="target-options">
                <label className={`target-option ${formData.targetType === 'all' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="targetType"
                    value="all"
                    checked={formData.targetType === 'all'}
                    onChange={(e) => setFormData({ ...formData, targetType: e.target.value })}
                  />
                  <span>All Students</span>
                </label>
                <label className={`target-option ${formData.targetType === 'batch' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="targetType"
                    value="batch"
                    checked={formData.targetType === 'batch'}
                    onChange={(e) => setFormData({ ...formData, targetType: e.target.value })}
                  />
                  <span>Specific Batch</span>
                </label>
                <label className={`target-option ${formData.targetType === 'students' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="targetType"
                    value="students"
                    checked={formData.targetType === 'students'}
                    onChange={(e) => setFormData({ ...formData, targetType: e.target.value })}
                  />
                  <span>Specific Students</span>
                </label>
              </div>
            </div>

            {formData.targetType === 'batch' && (
              <div className="form-group">
                <label>Select Batch</label>
                <select
                  value={formData.batchId}
                  onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
                  required
                >
                  <option value="">Choose batch</option>
                  {batches.map((b) => <option key={b._id} value={b._id}>{b.batchName}</option>)}
                </select>
              </div>
            )}

            {formData.targetType === 'students' && (
              <div className="form-group">
                <label>Select Batch First</label>
                <select
                  onChange={(e) => {
                    const id = e.target.value;
                    if (id) fetchStudents(id);
                  }}
                >
                  <option value="">Choose batch</option>
                  {batches.map((b) => <option key={b._id} value={b._id}>{b.batchName}</option>)}
                </select>
                {students.length > 0 && (
                  <div className="students-checklist">
                    {students.map((s) => (
                      <label key={s._id} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={formData.studentIds.includes(s._id)}
                          onChange={(e) => {
                            const ids = e.target.checked
                              ? [...formData.studentIds, s._id]
                              : formData.studentIds.filter((id) => id !== s._id);
                            setFormData({ ...formData, studentIds: ids });
                          }}
                        />
                        <span>{s.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Sending...' : 'Send Announcement'}
            </button>
          </form>
        </div>

        <p className="hint-text" style={{ marginTop: 16 }}>
          Need a new batch for promotions? <Link to="/teacher/batch/create">Create a batch</Link>
        </p>
      </main>

      <Modal open={toast.open} onClose={() => setToast((t) => ({ ...t, open: false }))} title={toast.isError ? 'Error' : 'Sent'}>
        <p>{toast.message}</p>
        <button type="button" className="btn btn-primary btn-full" onClick={() => setToast((t) => ({ ...t, open: false }))}>OK</button>
      </Modal>
    </div>
  );
};

export default Announcements;
