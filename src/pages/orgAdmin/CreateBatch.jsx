import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Modal from '../../components/Modal';
import api from '../../api/axios';
import { getGeoPosition } from '../../utils/geolocation';
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

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function OrgAdminCreateBatch() {
  const [formData, setFormData] = useState({
    batchName: '', class: '', board: '', location: { lat: 0, lng: 0 },
    subjects: '', days: [], fees: ''
  });
  const [dayTimes, setDayTimes] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [locLoading, setLocLoading] = useState(false);
  const [locModal, setLocModal] = useState(false);
  const [locErr, setLocErr] = useState('');
  const [teachers, setTeachers] = useState([]);
  const [orgTeacherIds, setOrgTeacherIds] = useState([]);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDayToggle = (day) => {
    const days = formData.days.includes(day)
      ? formData.days.filter(d => d !== day)
      : [...formData.days, day];
    setFormData({ ...formData, days });
    if (!formData.days.includes(day) && !dayTimes[day]) {
      setDayTimes({ ...dayTimes, [day]: '09:00' });
    }
  };

  const setTimeForDay = (day, t) => {
    setDayTimes({ ...dayTimes, [day]: t });
  };

  const getLocation = () => {
    setLocLoading(true);
    setLocErr('');
    (async () => {
      try {
        const position = await getGeoPosition();
        setFormData((prev) => ({
          ...prev,
          location: { lat: position.coords.latitude, lng: position.coords.longitude }
        }));
        setLocModal(true);
      } catch (e) {
        setLocErr(e?.message || 'Unable to get location');
      } finally {
        setLocLoading(false);
      }
    })();
  };

  const fetchTeachers = async () => {
    try {
      const { data } = await api.get('/org-admin/teachers?limit=200');
      setTeachers(data.teachers || []);
    } catch (e) {
      // keep silent; will show error on submit if none selected
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const toggleTeacher = (id) => {
    setOrgTeacherIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (orgTeacherIds.length === 0) {
      setError('Select at least 1 organization teacher');
      return;
    }
    if (formData.days.length === 0) {
      setError('Select at least one day');
      return;
    }
    for (const d of formData.days) {
      if (!dayTimes[d]) {
        setError(`Set start time for ${d}`);
        return;
      }
    }
    setLoading(true);

    try {
      const schedule = formData.days.map((day) => ({
        day,
        startTime: dayTimes[day] || '09:00'
      }));
      const payload = {
        ...formData,
        subjects: formData.subjects.split(',').map(s => s.trim()).filter(Boolean),
        fees: parseFloat(String(formData.fees)),
        schedule,
        startTime: schedule[0]?.startTime || '09:00',
        orgTeacherIds
      };

      await api.post('/org-admin/batch', payload);
      navigate('/org-admin/batches');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create batch');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar items={orgAdminMenuItems} />
      <main className="dashboard-content">
        <div className="page-header">
          <h1>Create Batch</h1>
        </div>

        <div className="card form-card">
          <div className="form-header">
            <h3>Batch Information</h3>
            <p>Create an organization-owned batch</p>
          </div>

          {error && <div className="error-box">{error}</div>}
          {locErr && <div className="error-box">{locErr}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Assign Teachers (required)</label>
              <div className="chip-grid">
                {teachers.map((t) => (
                  <button
                    type="button"
                    key={t.id}
                    className={`chip ${orgTeacherIds.includes(t.id) ? 'active' : ''}`}
                    onClick={() => toggleTeacher(t.id)}
                  >
                    {t.name} {t.email ? `(${t.email})` : ''}
                  </button>
                ))}
              </div>
              {teachers.length === 0 && (
                <small className="hint-text">No org teachers found yet. Create teachers first in “Add Teachers”.</small>
              )}
            </div>

            <div className="form-group">
              <label>Batch Name</label>
              <input name="batchName" value={formData.batchName} onChange={handleChange} required />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Class</label>
                <select name="class" value={formData.class} onChange={handleChange} required>
                  <option value="">Select</option>
                  {[...Array(12)].map((_, i) => <option key={i} value={`Class ${i + 1}`}>Class {i + 1}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Board</label>
                <select name="board" value={formData.board} onChange={handleChange} required>
                  <option value="">Select</option>
                  <option value="CBSE">CBSE</option>
                  <option value="ICSE">ICSE</option>
                  <option value="State">State</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Location</label>
              <button type="button" className="btn btn-secondary" onClick={getLocation} disabled={locLoading}>
                {locLoading ? 'Capturing…' : 'Capture GPS Location'}
              </button>
              {formData.location.lat !== 0 && <small className="success-text">Location captured</small>}
            </div>

            <div className="form-group">
              <label>Subjects (comma-separated)</label>
              <input name="subjects" value={formData.subjects} onChange={handleChange} placeholder="Math, Science" required />
            </div>

            <div className="form-group">
              <label>Days &amp; start time per day</label>
              <div className="days-selector">
                {daysOfWeek.map(day => (
                  <button
                    key={day}
                    type="button"
                    className={`day-btn ${formData.days.includes(day) ? 'active' : ''}`}
                    onClick={() => handleDayToggle(day)}
                  >
                    {day.slice(0, 3)}
                  </button>
                ))}
              </div>
              {formData.days.length > 0 && (
                <div className="day-time-grid" style={{ marginTop: 12 }}>
                  {formData.days.map((day) => (
                    <div key={day} className="form-row" style={{ alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ minWidth: 88 }}>{day}</span>
                      <input
                        type="time"
                        value={dayTimes[day] || '09:00'}
                        onChange={(e) => setTimeForDay(day, e.target.value)}
                        required
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Fees (₹)</label>
              <input type="number" name="fees" value={formData.fees} onChange={handleChange} required />
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading || locLoading}>
              {loading ? 'Creating...' : 'Create Batch'}
            </button>
          </form>
        </div>
      </main>

      <Modal open={locModal} onClose={() => setLocModal(false)} title="Location saved">
        <p>GPS location was captured successfully.</p>
        <button type="button" className="btn btn-primary btn-full" onClick={() => setLocModal(false)}>OK</button>
      </Modal>
    </div>
  );
}

