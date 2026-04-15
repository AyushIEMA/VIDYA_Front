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
  { path: '/org-admin/profile', label: 'Profile' }
];

export default function OrgAdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ open: false, message: '', isError: false });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/org-admin/dashboard/stats');
      setStats(data);
    } catch (e) {
      setToast({ open: true, message: e.response?.data?.error || 'Failed to load dashboard', isError: true });
    } finally {
      setLoading(false);
    }
  };

  const monthly = useMemo(() => (Array.isArray(stats?.monthlyEarnings) ? stats.monthlyEarnings : []), [stats]);

  return (
    <div className="dashboard-layout">
      <Sidebar items={orgAdminMenuItems} />
      <main className="dashboard-content">
        <div className="page-header">
          <h1>Organization Admin</h1>
        </div>
        <div className="card" style={{ marginBottom: 16 }}>
          <strong>Organization Code:</strong> {stats?.organizationCode || '—'}
        </div>

        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading dashboard…</p>
          </div>
        ) : (
          <>
            <div className="fees-summary" style={{ marginBottom: 16 }}>
              <div className="summary-card">
                <div className="summary-label">Total Batches</div>
                <div className="summary-value">{stats?.totalBatches ?? 0}</div>
              </div>
              <div className="summary-card">
                <div className="summary-label">Total Teachers</div>
                <div className="summary-value">{stats?.totalTeachers ?? 0}</div>
              </div>
              <div className="summary-card">
                <div className="summary-label">Total Students</div>
                <div className="summary-value">{stats?.totalStudents ?? 0}</div>
              </div>
              <div className="summary-card paid">
                <div className="summary-label">Total Earnings</div>
                <div className="summary-value">₹{Number(stats?.totalEarnings || 0).toLocaleString()}</div>
              </div>
            </div>

            <div className="card">
              <h3 style={{ marginTop: 0 }}>Monthly earnings (latest)</h3>
              {monthly.length === 0 ? (
                <p className="hint-text">No paid fees yet.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="simple-table">
                    <thead>
                      <tr>
                        <th>Month</th>
                        <th>Year</th>
                        <th>Paid count</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthly.map((m) => (
                        <tr key={`${m._id?.month}-${m._id?.year}`}>
                          <td>{m._id?.month}</td>
                          <td>{m._id?.year}</td>
                          <td>{m.count}</td>
                          <td>₹{Number(m.total || 0).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
    </div>
  );
}

