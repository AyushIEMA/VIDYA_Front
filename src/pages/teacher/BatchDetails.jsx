import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Modal from '../../components/Modal';
import api from '../../api/axios';
import { normalizeFileUrl } from '../../utils/fileUrl';
import './Dashboard.css';
import './BatchDetails.css';

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

function buildEditForm(b) {
  const dayTimes = {};
  if (b.schedule?.length) {
    b.schedule.forEach((s) => { dayTimes[s.day] = s.startTime; });
    return {
      batchName: b.batchName,
      fees: b.fees,
      subjects: (b.subjects || []).join(', '),
      board: b.board,
      days: b.schedule.map((s) => s.day),
      dayTimes: { ...dayTimes }
    };
  }
  (b.days || []).forEach((d) => { dayTimes[d] = b.startTime || '09:00'; });
  return {
    batchName: b.batchName,
    fees: b.fees,
    subjects: (b.subjects || []).join(', '),
    board: b.board,
    days: [...(b.days || [])],
    dayTimes: { ...dayTimes }
  };
}

function formatSchedule(batch) {
  if (!batch) return '';
  if (batch.schedule?.length) {
    return batch.schedule.map((s) => `${s.day.slice(0, 3)} ${s.startTime}`).join(' · ');
  }
  return `${(batch.days || []).join(', ')} @ ${batch.startTime || ''}`;
}

const BatchDetails = () => {
  const { id } = useParams();
  const [batch, setBatch] = useState(null);
  const [students, setStudents] = useState([]);
  const [studentPage, setStudentPage] = useState(1);
  const [studentPages, setStudentPages] = useState(1);
  const [studentTotal, setStudentTotal] = useState(0);
  const studentLimit = 8;

  const [logs, setLogs] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [tab, setTab] = useState('students');
  const [logForm, setLogForm] = useState({ title: '', description: '' });
  const [file, setFile] = useState(null);
  const [uploadType, setUploadType] = useState('notes');
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [editingStudent, setEditingStudent] = useState(null);
  const [studentDiscount, setStudentDiscount] = useState(0);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [infoModal, setInfoModal] = useState({ open: false, title: '', message: '', isError: false });
  const [logBusy, setLogBusy] = useState(false);

  const showMsg = (title, message, isError = false) => {
    setInfoModal({ open: true, title, message, isError });
  };

  const fetchBatchDetails = useCallback(async (page = 1) => {
    try {
      const { data } = await api.get(`/teacher/batch/${id}?page=${page}&limit=${studentLimit}`);
      setBatch(data.batch);
      setStudents(data.students || []);
      if (data.studentsTotal != null) {
        setStudentTotal(data.studentsTotal);
        setStudentPages(data.studentsPages || 1);
        setStudentPage(data.studentsPage || page);
      } else {
        setStudentTotal((data.students || []).length);
        setStudentPages(1);
      }
      setEditForm(buildEditForm(data.batch));
    } catch (error) {
      console.error('Error fetching batch:', error);
      showMsg('Error', error.response?.data?.error || 'Failed to load batch', true);
    }
  }, [id, studentLimit]);

  useEffect(() => {
    setStudentPage(1);
  }, [id]);

  useEffect(() => {
    fetchBatchDetails(studentPage);
  }, [id, studentPage, fetchBatchDetails]);

  useEffect(() => {
    fetchLogs();
    fetchReviews();
  }, [id]);

  const handleEditBatch = async (e) => {
    e.preventDefault();
    try {
      const schedule = editForm.days.map((day) => ({
        day,
        startTime: editForm.dayTimes[day] || '09:00'
      }));
      await api.put(`/teacher/batch/${id}`, {
        batchName: editForm.batchName,
        fees: parseFloat(String(editForm.fees), 10),
        subjects: editForm.subjects.split(',').map((s) => s.trim()).filter(Boolean),
        board: editForm.board,
        days: editForm.days,
        schedule,
        startTime: schedule[0]?.startTime || '09:00'
      });
      setEditMode(false);
      fetchBatchDetails(studentPage);
      showMsg('Saved', 'Batch updated successfully.');
    } catch (error) {
      showMsg('Error', error.response?.data?.error || 'Failed to update batch', true);
    }
  };

  const handleDayToggle = (day) => {
    const days = editForm.days.includes(day)
      ? editForm.days.filter((d) => d !== day)
      : [...editForm.days, day];
    const dayTimes = { ...editForm.dayTimes };
    if (!editForm.days.includes(day) && !dayTimes[day]) dayTimes[day] = '09:00';
    setEditForm({ ...editForm, days, dayTimes });
  };

  const setTimeForDay = (day, t) => {
    setEditForm({ ...editForm, dayTimes: { ...editForm.dayTimes, [day]: t } });
  };

  const handleEditStudentDiscount = (student) => {
    setEditingStudent(student.enrollmentId);
    setStudentDiscount(student.discount || 0);
  };

  const handleSaveStudentDiscount = async (enrollmentId) => {
    try {
      await api.put(`/teacher/enrollment/${enrollmentId}/discount`, {
        discount: parseFloat(studentDiscount, 10)
      });
      setEditingStudent(null);
      setStudentDiscount(0);
      fetchBatchDetails(studentPage);
      showMsg('Saved', 'Discount updated successfully.');
    } catch (error) {
      showMsg('Error', error.response?.data?.error || 'Failed to update discount', true);
    }
  };

  const handleCancelStudentEdit = () => {
    setEditingStudent(null);
    setStudentDiscount(0);
  };

  const fetchLogs = async () => {
    try {
      const { data } = await api.get(`/teacher/batch/${id}/classlog`);
      setLogs(data);
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  const fetchReviews = async () => {
    try {
      const { data } = await api.get(`/batch/${id}/reviews`);
      setReviews(data.reviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const handleAddLog = async (e) => {
    e.preventDefault();
    setLogBusy(true);
    try {
      await api.post(`/teacher/batch/${id}/classlog`, logForm);
      setLogForm({ title: '', description: '' });
      fetchLogs();
      showMsg('Saved', 'Class log added.');
    } catch (error) {
      showMsg('Error', error.response?.data?.error || 'Failed to add log', true);
    } finally {
      setLogBusy(false);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setUploadBusy(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', uploadType);

      await api.post(`/teacher/batch/${id}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setFile(null);
      fetchBatchDetails(studentPage);
      showMsg('Uploaded', 'File uploaded successfully.');
    } catch (error) {
      showMsg('Upload failed', error.response?.data?.error || 'Could not upload file', true);
    } finally {
      setUploadBusy(false);
    }
  };

  if (!batch) {
    return (
      <div className="dashboard-layout">
        <Sidebar items={teacherMenuItems} />
        <main className="dashboard-content">
          <div className="loading-spinner">Loading...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <Sidebar items={teacherMenuItems} />
      <main className="dashboard-content">
        <div className="page-header">
          <h1>{batch.batchName}</h1>
          <button type="button" className="btn btn-primary" onClick={() => setEditMode(!editMode)}>
            {editMode ? 'Cancel Edit' : 'Edit Batch'}
          </button>
        </div>

        {editMode ? (
          <div className="card">
            <form onSubmit={handleEditBatch}>
              <div className="form-group">
                <label>Batch Name</label>
                <input
                  value={editForm.batchName}
                  onChange={(e) => setEditForm({ ...editForm, batchName: e.target.value })}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Fees (₹)</label>
                  <input
                    type="number"
                    value={editForm.fees}
                    onChange={(e) => setEditForm({ ...editForm, fees: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Board</label>
                  <select
                    value={editForm.board || ''}
                    onChange={(e) => setEditForm({ ...editForm, board: e.target.value })}
                    required
                  >
                    <option value="CBSE">CBSE</option>
                    <option value="ICSE">ICSE</option>
                    <option value="State">State</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Subjects (comma-separated)</label>
                <input
                  value={editForm.subjects || ''}
                  onChange={(e) => setEditForm({ ...editForm, subjects: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Days &amp; time</label>
                <div className="days-selector">
                  {daysOfWeek.map((day) => (
                    <button
                      key={day}
                      type="button"
                      className={`day-btn ${editForm.days?.includes(day) ? 'active' : ''}`}
                      onClick={() => handleDayToggle(day)}
                    >
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>
                {(editForm.days || []).map((day) => (
                  <div key={day} className="form-row" style={{ alignItems: 'center', marginTop: 8 }}>
                    <span style={{ minWidth: 90 }}>{day}</span>
                    <input
                      type="time"
                      value={editForm.dayTimes?.[day] || '09:00'}
                      onChange={(e) => setTimeForDay(day, e.target.value)}
                      required
                    />
                  </div>
                ))}
              </div>
              <button type="submit" className="btn btn-primary">Save Changes</button>
            </form>
          </div>
        ) : (
          <div className="batch-info card">
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Class</span>
                <span className="info-value">{batch.class}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Board</span>
                <span className="info-value">{batch.board}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Fees</span>
                <span className="info-value">₹{batch.fees}/month</span>
              </div>
              <div className="info-item">
                <span className="info-label">Schedule</span>
                <span className="info-value">{formatSchedule(batch)}</span>
              </div>
            </div>
            <div className="info-row">
              <span className="info-label">Subjects:</span>
              <span className="info-value">{batch.subjects.join(', ')}</span>
            </div>
          </div>
        )}

        <div className="tabs">
          <button type="button" className={tab === 'students' ? 'active' : ''} onClick={() => setTab('students')}>Students</button>
          <button type="button" className={tab === 'logs' ? 'active' : ''} onClick={() => setTab('logs')}>Class Logs</button>
          <button type="button" className={tab === 'files' ? 'active' : ''} onClick={() => setTab('files')}>Files</button>
          <button type="button" className={tab === 'reviews' ? 'active' : ''} onClick={() => setTab('reviews')}>Reviews</button>
        </div>

        {tab === 'students' && (
          <div>
            <div className="tab-header">
              <h3>Enrolled Students ({studentTotal})</h3>
            </div>
            {students.length === 0 ? (
              <div className="empty-state card">
                <h3>No students enrolled yet</h3>
                <p>Students will appear here once they enroll using your teacher code</p>
              </div>
            ) : (
              <>
                <div className="students-list">
                  {students.map((student) => {
                    const isMultiBatch = student.enrollmentCount > 1;
                    const isEditing = editingStudent === student.enrollmentId;

                    return (
                      <div key={student._id} className="student-item card">
                        <div className="student-info">
                          <h4>{student.name}</h4>
                          <div className="student-meta">
                            <span>Class: {student.class}</span>
                            <span>Mobile: {student.mobile}</span>
                            <span>WhatsApp: {student.whatsapp}</span>
                          </div>
                          {isMultiBatch && (
                            <div className="student-badges">
                              <span className="badge-multi">
                                Enrolled in {student.enrollmentCount} batches
                              </span>
                            </div>
                          )}
                          <div className="discount-section">
                            {isEditing ? (
                              <div className="discount-edit-row">
                                <label>Discount Amount (₹):</label>
                                <input
                                  type="number"
                                  value={studentDiscount}
                                  onChange={(e) => setStudentDiscount(e.target.value)}
                                  className="discount-input-small"
                                  min="0"
                                  max={batch.fees}
                                />
                                <button type="button" className="btn-save-small" onClick={() => handleSaveStudentDiscount(student.enrollmentId)}>
                                  Save
                                </button>
                                <button type="button" className="btn-cancel-small" onClick={handleCancelStudentEdit}>
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="discount-display">
                                <span className="discount-label">Discount:</span>
                                <span className="discount-value">
                                  {student.discount > 0 ? `₹${student.discount} off` : 'No discount'}
                                </span>
                                <button type="button" className="btn-edit-small" onClick={() => handleEditStudentDiscount(student)}>
                                  Edit
                                </button>
                              </div>
                            )}
                            {student.discount > 0 && (
                              <div className="fee-calculation">
                                <span>Original: ₹{batch.fees}</span>
                                <span>After Discount: ₹{batch.fees - student.discount}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {studentPages > 1 && (
                  <div className="pagination">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      disabled={studentPage <= 1}
                      onClick={() => setStudentPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </button>
                    <span>Page {studentPage} of {studentPages}</span>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      disabled={studentPage >= studentPages}
                      onClick={() => setStudentPage((p) => Math.min(studentPages, p + 1))}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {tab === 'logs' && (
          <div>
            <form onSubmit={handleAddLog} className="card">
              <h3>Add Class Log</h3>
              <div className="form-group">
                <label>Title</label>
                <input value={logForm.title} onChange={(e) => setLogForm({ ...logForm, title: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={logForm.description} onChange={(e) => setLogForm({ ...logForm, description: e.target.value })} rows="4" />
              </div>
              <button type="submit" className="btn btn-primary" disabled={logBusy}>{logBusy ? 'Saving…' : 'Add Log'}</button>
            </form>

            <div className="logs-list">
              {logs.map((log) => (
                <div key={log._id} className="log-item card">
                  <h4>{log.title}</h4>
                  <p>{log.description}</p>
                  <small>{new Date(log.date).toLocaleDateString()}</small>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'files' && (
          <div>
            <div className="card upload-section">
              <h3>Upload Study Materials</h3>
              <form onSubmit={handleFileUpload} className="upload-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Type</label>
                    <select value={uploadType} onChange={(e) => setUploadType(e.target.value)}>
                      <option value="notes">Notes</option>
                      <option value="syllabus">Syllabus</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>File</label>
                    <input type="file" onChange={(e) => setFile(e.target.files[0])} required />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" disabled={!file || uploadBusy}>
                  {uploadBusy ? 'Uploading…' : file ? `Upload ${file.name}` : 'Select a file'}
                </button>
              </form>
            </div>

            <div className="files-grid">
              <div className="files-column">
                <h3>Notes ({batch.notes?.length || 0})</h3>
                {batch.notes?.length > 0 ? (
                  batch.notes.map((note, i) => (
                    <div key={i} className="file-item card">
                      <div className="file-info">
                        <span className="file-name">{note.name}</span>
                        <span className="file-date">{new Date(note.uploadedAt).toLocaleDateString()}</span>
                      </div>
                      <a href={normalizeFileUrl(note.url)} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                        Download
                      </a>
                    </div>
                  ))
                ) : (
                  <p className="no-files">No notes uploaded</p>
                )}
              </div>

              <div className="files-column">
                <h3>Syllabus ({batch.syllabus?.length || 0})</h3>
                {batch.syllabus?.length > 0 ? (
                  batch.syllabus.map((syl, i) => (
                    <div key={i} className="file-item card">
                      <div className="file-info">
                        <span className="file-name">{syl.name}</span>
                        <span className="file-date">{new Date(syl.uploadedAt).toLocaleDateString()}</span>
                      </div>
                      <a href={normalizeFileUrl(syl.url)} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                        Download
                      </a>
                    </div>
                  ))
                ) : (
                  <p className="no-files">No syllabus uploaded</p>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === 'reviews' && (
          <div className="reviews-list">
            {reviews.map((review) => (
              <div key={review._id} className="review-item card">
                <div className="rating">{review.rating}/5</div>
                <p>{review.comment}</p>
                <small>{new Date(review.createdAt).toLocaleDateString()}</small>
              </div>
            ))}
          </div>
        )}
      </main>

      <Modal
        open={infoModal.open}
        onClose={() => setInfoModal((m) => ({ ...m, open: false }))}
        title={infoModal.title}
      >
        <p className={infoModal.isError ? 'error-text' : ''}>{infoModal.message}</p>
        <button type="button" className="btn btn-primary btn-full" onClick={() => setInfoModal((m) => ({ ...m, open: false }))}>OK</button>
      </Modal>
    </div>
  );
};

export default BatchDetails;
