import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Modal from '../../components/Modal';
import api from '../../api/axios';
import { getGeoPosition } from '../../utils/geolocation';
import './Dashboard.css';
import './MyBatches.css';

const teacherMenuItems = [
  { path: '/teacher/dashboard', label: 'Dashboard' },
  { path: '/teacher/batches', label: 'My Batches' },
  { path: '/teacher/announcements', label: 'Announcements' },
  { path: '/teacher/fees', label: 'Fees Management' },
  { path: '/teacher/attendance', label: 'Attendance' },
  { path: '/teacher/promote', label: 'Promote Student' },
  { path: '/teacher/profile', label: 'Profile' }
];

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const CreateBatch = () => {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
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
        subjects: formData.subjects.split(',').map(s => s.trim()),
        fees: parseFloat(formData.fees),
        schedule,
        startTime: schedule[0]?.startTime || '09:00'
      };

      await api.post('/teacher/batch', payload);
      navigate('/teacher/batches');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create batch');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar items={teacherMenuItems} />
      <main className="dashboard-content">
        <div className="page-header">
          <h1>Create New Batch</h1>
        </div>

        <div className="create-batch-container">
          <div className="create-batch-card">
            {error && <div className="error-box">{error}</div>}
            {locErr && <div className="error-box">{locErr}</div>}

            <form onSubmit={handleSubmit}>
              {/* Section: Basic Information */}
              <div className="form-section">
                <div className="form-section-header">
                  <span className="form-section-icon">📋</span>
                  <div>
                    <h3>Basic Information</h3>
                    <p>Name, class, board, and subjects</p>
                  </div>
                </div>

                <div className="form-group">
                  <label>Batch Name</label>
                  <input name="batchName" value={formData.batchName} onChange={handleChange} placeholder="e.g., Science Batch A" required />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Class</label>
                    <select name="class" value={formData.class} onChange={handleChange} required>
                      <option value="">Select class</option>
                      {[...Array(12)].map((_, i) => <option key={i} value={`Class ${i + 1}`}>Class {i + 1}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Board</label>
                    <select name="board" value={formData.board} onChange={handleChange} required>
                      <option value="">Select board</option>
                      <option value="CBSE">CBSE</option>
                      <option value="ICSE">ICSE</option>
                      <option value="State">State</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Subjects (comma-separated)</label>
                  <input name="subjects" value={formData.subjects} onChange={handleChange} placeholder="Math, Science, English" required />
                </div>
              </div>

              {/* Section: Location */}
              <div className="form-section">
                <div className="form-section-header">
                  <span className="form-section-icon">📍</span>
                  <div>
                    <h3>Location</h3>
                    <p>Capture GPS for attendance verification</p>
                  </div>
                </div>

                <div className="form-group">
                  <button type="button" className="btn btn-secondary" onClick={getLocation} disabled={locLoading}>
                    {locLoading ? 'Capturing…' : 'Capture GPS Location'}
                  </button>
                  {formData.location.lat !== 0 && <small className="success-text">Location captured successfully</small>}
                </div>
              </div>

              {/* Section: Schedule */}
              <div className="form-section">
                <div className="form-section-header">
                  <span className="form-section-icon">📅</span>
                  <div>
                    <h3>Schedule</h3>
                    <p>Select days and set start time for each</p>
                  </div>
                </div>

                <div className="form-group">
                  <label>Days</label>
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
                    <div className="day-time-grid">
                      {formData.days.map((day) => (
                        <div key={day} className="day-time-row">
                          <span className="day-time-label">{day}</span>
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
              </div>

              {/* Section: Fees */}
              <div className="form-section">
                <div className="form-section-header">
                  <span className="form-section-icon">💰</span>
                  <div>
                    <h3>Fees</h3>
                    <p>Monthly fee amount for this batch</p>
                  </div>
                </div>

                <div className="form-group">
                  <label>Fees (₹)</label>
                  <input type="number" name="fees" value={formData.fees} onChange={handleChange} placeholder="e.g., 2000" required />
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-full btn-large" disabled={loading || locLoading}>
                {loading ? 'Creating...' : 'Create Batch'}
              </button>
            </form>
          </div>
        </div>
      </main>

      <Modal open={locModal} onClose={() => setLocModal(false)} title="Location saved">
        <p>GPS location was captured successfully.</p>
        <button type="button" className="btn btn-primary btn-full" onClick={() => setLocModal(false)}>OK</button>
      </Modal>
    </div>
  );
};

export default CreateBatch;
