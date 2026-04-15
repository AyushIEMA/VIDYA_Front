import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import api from '../../api/axios';
import './Dashboard.css';
import './Notices.css';

const studentMenuItems = [
  { path: '/student/dashboard', label: 'Dashboard' },
  { path: '/student/batches', label: 'My Batches' },
  { path: '/student/enroll', label: 'Enroll in Batch' },
  { path: '/student/org', label: 'Organization' },
  { path: '/student/notices', label: 'Notices' },
  { path: '/student/profile', label: 'Profile' }
];

const Notices = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/student/announcements');
      setAnnouncements(data);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar items={studentMenuItems} />
      <main className="dashboard-content">
        <div className="page-header">
          <h1>Notices & Announcements</h1>
          <span className="notice-count">{announcements.length} Total</span>
        </div>

        {loading ? (
          <div className="loading-spinner">Loading notices...</div>
        ) : announcements.length === 0 ? (
          <div className="empty-state card">
            <h3>No notices yet</h3>
            <p>You'll see announcements from your teachers here</p>
          </div>
        ) : (
          <div className="announcements-list">
            {announcements.map(announcement => (
              <div key={announcement._id} className="announcement-item card">
                <div className="announcement-header">
                  <h3>{announcement.title}</h3>
                  <small>{new Date(announcement.createdAt).toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}</small>
                </div>
                <p className="announcement-message">{announcement.message}</p>
                <div className="announcement-footer">
                  <span className="teacher-name">
                    From: {announcement.teacherId?.firstName} {announcement.teacherId?.lastName}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Notices;
