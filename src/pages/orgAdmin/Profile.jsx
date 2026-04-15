import React from 'react';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
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

export default function OrgAdminProfile() {
  const { profile, user } = useAuth();
  return (
    <div className="dashboard-layout">
      <Sidebar items={orgAdminMenuItems} />
      <main className="dashboard-content">
        <div className="page-header">
          <h1>Organization Profile</h1>
        </div>
        <div className="card">
          <p><strong>Admin Email:</strong> {user?.email}</p>
          <p><strong>Organization:</strong> {profile?.name || '—'}</p>
          <p><strong>Organization Code:</strong> {profile?.organizationCode || '—'}</p>
        </div>
      </main>
    </div>
  );
}

