import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Modal from '../../components/Modal';
import api from '../../api/axios';
import '../teacher/Dashboard.css';
import '../teacher/BatchDetails.css';
import './OrgTeacher.css';

const orgTeacherMenuItems = [
  { path: '/org-teacher/batches', label: 'Assigned Batches' }
];

export default function OrgTeacherBatchDetails() {
  const { id } = useParams();
  const [batch, setBatch] = useState(null);
  const [logs, setLogs] = useState([]);
  const [tab, setTab] = useState('logs');
  const [logForm, setLogForm] = useState({ title: '', description: '' });
  const [file, setFile] = useState(null);
  const [uploadType, setUploadType] = useState('notes');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState({ open: false, title: 'Done', message: '', isError: false });

  const fetchDetails = async () => {
    try {
      const { data } = await api.get(`/org-teacher/batch/${id}`);
      setBatch(data.batch);
      setLogs(data.logs || []);
    } catch (err) {
      setToast({ open: true, title: 'Error', message: err.response?.data?.error || 'Failed to load', isError: true });
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const addLog = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post(`/org-teacher/batch/${id}/classlog`, logForm);
      setLogForm({ title: '', description: '' });
      await fetchDetails();
      setToast({ open: true, title: 'Saved', message: 'Log added.', isError: false });
    } catch (err) {
      setToast({ open: true, title: 'Error', message: err.response?.data?.error || 'Failed to add log', isError: true });
    } finally {
      setBusy(false);
    }
  };

  const upload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('type', uploadType);
      await api.post(`/org-teacher/batch/${id}/upload`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setFile(null);
      await fetchDetails();
      setToast({ open: true, title: 'Uploaded', message: 'File uploaded.', isError: false });
    } catch (err) {
      setToast({ open: true, title: 'Error', message: err.response?.data?.error || 'Upload failed', isError: true });
    } finally {
      setBusy(false);
    }
  };

  if (!batch) {
    return (
      <div className="dashboard-layout">
        <Sidebar items={orgTeacherMenuItems} />
        <main className="dashboard-content"><div className="loading-spinner">Loading…</div></main>
        <Modal open={toast.open} onClose={() => setToast((t) => ({ ...t, open: false }))} title={toast.title}>
          <p>{toast.message}</p>
          <button type="button" className="btn btn-primary btn-full" onClick={() => setToast((t) => ({ ...t, open: false }))}>OK</button>
        </Modal>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <Sidebar items={orgTeacherMenuItems} />
      <main className="dashboard-content">
        <div className="page-header">
          <h1>{batch.batchName}</h1>
        </div>

        <div className="tabs">
          <button type="button" className={tab === 'logs' ? 'active' : ''} onClick={() => setTab('logs')}>Logs</button>
          <button type="button" className={tab === 'files' ? 'active' : ''} onClick={() => setTab('files')}>Files</button>
        </div>

        {tab === 'logs' && (
          <div>
            <form onSubmit={addLog} className="card">
              <h3>Add Class Log</h3>
              <div className="form-group">
                <label>Title</label>
                <input value={logForm.title} onChange={(e) => setLogForm({ ...logForm, title: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={logForm.description} onChange={(e) => setLogForm({ ...logForm, description: e.target.value })} rows="4" />
              </div>
              <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Add Log'}</button>
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
              <form onSubmit={upload} className="upload-form">
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
                <button type="submit" className="btn btn-primary" disabled={!file || busy}>
                  {busy ? 'Uploading…' : file ? `Upload ${file.name}` : 'Select a file'}
                </button>
              </form>
            </div>
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

