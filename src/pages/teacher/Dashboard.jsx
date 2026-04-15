import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import api from '../../api/axios';
import './Dashboard.css';

const teacherMenuItems = [
  { path: '/teacher/dashboard', label: 'Dashboard' },
  { path: '/teacher/batches', label: 'My Batches' },
  { path: '/teacher/announcements', label: 'Announcements' },
  { path: '/teacher/fees', label: 'Fees Management' },
  { path: '/teacher/attendance', label: 'Attendance' },
  { path: '/teacher/promote', label: 'Promote Student' },
  { path: '/teacher/profile', label: 'Profile' }
];

const STAT_CONFIG = [
  { key: 'totalBatches',  label: 'Total Batches',   icon: '📚', format: v => v },
  { key: 'totalStudents', label: 'Total Students',  icon: '👥', format: v => v },
  { key: 'earnings',      label: 'Monthly Earnings', icon: '💰', format: v => `₹${Number(v).toLocaleString()}` },
  { key: 'receivedFees',  label: 'Fees Collected',  icon: '✅', format: v => v },
];

const Dashboard = () => {
  const { profile, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const profileItem = useMemo(() => teacherMenuItems.find(i => i.label === 'Profile'), []);

  useEffect(() => {
    fetchStats();
  }, [month, year]);

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/teacher/dashboard/stats?month=${month}&year=${year}`);
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(stats.teacherCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="dashboard-layout">
      <Sidebar items={teacherMenuItems} />
      <main className="dashboard-content">
        <div className="dashboard-header">
          <div className="dashboard-header-gradient" />
          <div className="greeting-section">
            <h1>Welcome back, {profile?.firstName}</h1>
            <p className="date">{today}</p>
          </div>
          <div className="filter-group">
            <select value={month} onChange={(e) => setMonth(e.target.value)} className="filter-select">
              {[...Array(12)].map((_, i) => (
                <option key={i} value={i + 1}>{new Date(0, i).toLocaleString('en', { month: 'long' })}</option>
              ))}
            </select>
            <select value={year} onChange={(e) => setYear(e.target.value)} className="filter-select">
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
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

        {error && <div className="error-banner">{error}</div>}

        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading your dashboard...</p>
          </div>
        ) : stats ? (
          <>
            <div className="stats-grid">
              {STAT_CONFIG.map((cfg) => (
                <div key={cfg.key} className="stat-card">
                  <div className="stat-icon">{cfg.icon}</div>
                  <div className="stat-label">{cfg.label}</div>
                  <div className="stat-value">{cfg.format(stats[cfg.key])}</div>
                </div>
              ))}
            </div>

            <div className="teacher-code-section">
              <div className="teacher-code-card card">
                <div>
                  <h3>Teacher Code</h3>
                  <div className="code-display">
                    <span className="code">{stats.teacherCode}</span>
                    <button className={`btn btn-secondary ${copied ? 'copied' : ''}`} onClick={copyCode}>
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <p className="hint">Share this code with students to let them join your batches</p>
                </div>
              </div>
            </div>

            {stats.monthlyBreakdown?.length > 0 && (
              <div className="card monthly-earnings-card">
                <h3>Recent monthly earnings (paid fees)</h3>
                <div className="monthly-earnings-table-wrap">
                  <table className="monthly-earnings-table">
                    <thead>
                      <tr>
                        <th>Month</th>
                        <th>Year</th>
                        <th>Collected</th>
                        <th>Receipts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.monthlyBreakdown.map((row, i) => (
                        <tr key={`${row.month}-${row.year}-${i}`}>
                          <td>{row.month}</td>
                          <td>{row.year}</td>
                          <td>₹{Number(row.total || 0).toLocaleString()}</td>
                          <td>{row.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        ) : null}
      </main>
    </div>
  );
};

export default Dashboard;
