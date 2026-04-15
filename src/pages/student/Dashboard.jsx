import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import api from '../../api/axios';
import './Dashboard.css';

const studentMenuItems = [
  { path: '/student/dashboard', label: 'Dashboard' },
  { path: '/student/batches', label: 'My Batches' },
  { path: '/student/enroll', label: 'Enroll in Batch' },
  { path: '/student/org', label: 'Organization' },
  { path: '/student/notices', label: 'Notices' },
  { path: '/student/profile', label: 'Profile' }
];

const Dashboard = () => {
  const { profile, logout } = useAuth();
  const [stats, setStats] = useState({ batches: 0, announcements: 0 });
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const profileItem = useMemo(() => studentMenuItems.find(i => i.label === 'Profile'), []);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [batchesRes, noticesRes] = await Promise.all([
        api.get('/student/batches'),
        api.get('/student/announcements')
      ]);
      setStats({
        batches: batchesRes.data.length,
        announcements: noticesRes.data.length
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar items={studentMenuItems} />
      <main className="dashboard-content">
        <div className="dashboard-header">
          <div className="dashboard-header-gradient" />
          <div className="greeting-section">
            <h1>Welcome, {profile?.name}</h1>
            <p className="date">{today}</p>
          </div>

          <button
            type="button"
            className="dashboard-menu-btn"
            aria-label="Open menu"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(v => !v)}
            title="Menu"
          >
            ☰
          </button>
        </div>

        {menuOpen && (
          <div className="dashboard-menu-overlay" role="presentation" onClick={() => setMenuOpen(false)}>
            <div className="dashboard-menu-sheet" role="menu" aria-label="Account menu" onClick={(e) => e.stopPropagation()}>
              <Link to={profileItem.path} className="dashboard-menu-item" role="menuitem" onClick={() => setMenuOpen(false)}>
                My Profile
              </Link>
              <button type="button" className="dashboard-menu-item dashboard-menu-logout" role="menuitem" onClick={logout}>
                Logout
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading your dashboard...</p>
          </div>
        ) : (
          <>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">📚</div>
                <div className="stat-label">My Batches</div>
                <div className="stat-value">{stats.batches}</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📢</div>
                <div className="stat-label">Notices</div>
                <div className="stat-value">{stats.announcements}</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🎓</div>
                <div className="stat-label">Current Class</div>
                <div className="stat-value">{profile?.class || '—'}</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📋</div>
                <div className="stat-label">Board</div>
                <div className="stat-value">{profile?.board || '—'}</div>
              </div>
            </div>

            <div className="quick-actions-grid">
              <Link to="/student/enroll" className="action-card">
                <div className="action-icon">⊞</div>
                <div className="action-text">
                  <h3>Enroll in Batch</h3>
                  <p>Use teacher code to join new batches</p>
                </div>
              </Link>

              <Link to="/student/org" className="action-card">
                <div className="action-icon">◎</div>
                <div className="action-text">
                  <h3>Organization</h3>
                  <p>Enter organization code to view batches</p>
                </div>
              </Link>

              <Link to="/student/batches" className="action-card">
                <div className="action-icon">📖</div>
                <div className="action-text">
                  <h3>My Batches</h3>
                  <p>View materials and mark attendance</p>
                </div>
              </Link>

              <Link to="/student/notices" className="action-card">
                <div className="action-icon">🔔</div>
                <div className="action-text">
                  <h3>Notices</h3>
                  <p>Read announcements from teachers</p>
                </div>
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
