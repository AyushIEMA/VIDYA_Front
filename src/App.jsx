import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import RegisterChoice from './pages/RegisterChoice';
import RegisterTeacher from './pages/RegisterTeacher';
import RegisterStudent from './pages/RegisterStudent';
import ForgotPassword from './pages/ForgotPassword';
import RegisterOrganization from './pages/RegisterOrganization';
import TeacherDashboard from './pages/teacher/Dashboard';
import TeacherBatches from './pages/teacher/MyBatches';
import CreateBatch from './pages/teacher/CreateBatch';
import BatchDetails from './pages/teacher/BatchDetails';
import Announcements from './pages/teacher/Announcements';
import FeesManagement from './pages/teacher/FeesManagement';
import AttendanceView from './pages/teacher/AttendanceView';
import PromoteStudent from './pages/teacher/PromoteStudent';
import TeacherProfile from './pages/teacher/Profile';
import StudentDashboard from './pages/student/Dashboard';
import EnrollBatch from './pages/student/EnrollBatch';
import StudentBatches from './pages/student/MyBatches';
import StudentBatchDetails from './pages/student/BatchDetails';
import StudentNotices from './pages/student/Notices';
import StudentProfile from './pages/student/Profile';
import EnrollOrganization from './pages/student/EnrollOrganization';
import OrgAdminDashboard from './pages/orgAdmin/Dashboard';
import OrgAdminAddTeachers from './pages/orgAdmin/AddTeachers';
import OrgAdminMyBatches from './pages/orgAdmin/MyBatches';
import OrgAdminCreateBatch from './pages/orgAdmin/CreateBatch';
import OrgAdminBatchDetails from './pages/orgAdmin/BatchDetails';
import OrgAdminNotices from './pages/orgAdmin/Notices';
import OrgAdminAttendance from './pages/orgAdmin/Attendance';
import OrgAdminFees from './pages/orgAdmin/Fees';
import OrgAdminSalary from './pages/orgAdmin/Salary';
import OrgAdminProfile from './pages/orgAdmin/Profile';
import OrgTeacherBatches from './pages/orgTeacher/MyBatches';
import OrgTeacherBatchDetails from './pages/orgTeacher/BatchDetails';

const PrivateRoute = ({ children, role }) => {
  const { user } = useAuth();
  const userRole = (user?.role || '').toString().trim().toLowerCase();
  const requiredRole = (role || '').toString().trim().toLowerCase();
  if (!user) return <Navigate to="/login" />;
  if (requiredRole && userRole !== requiredRole) return <Navigate to="/" />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<RegisterChoice />} />
          <Route path="/register/teacher" element={<RegisterTeacher />} />
          <Route path="/register/student" element={<RegisterStudent />} />
          <Route path="/register/organization" element={<RegisterOrganization />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
          <Route path="/teacher/dashboard" element={<PrivateRoute role="teacher"><TeacherDashboard /></PrivateRoute>} />
          <Route path="/teacher/batches" element={<PrivateRoute role="teacher"><TeacherBatches /></PrivateRoute>} />
          <Route path="/teacher/batch/create" element={<PrivateRoute role="teacher"><CreateBatch /></PrivateRoute>} />
          <Route path="/teacher/batch/:id" element={<PrivateRoute role="teacher"><BatchDetails /></PrivateRoute>} />
          <Route path="/teacher/announcements" element={<PrivateRoute role="teacher"><Announcements /></PrivateRoute>} />
          <Route path="/teacher/fees" element={<PrivateRoute role="teacher"><FeesManagement /></PrivateRoute>} />
          <Route path="/teacher/attendance" element={<PrivateRoute role="teacher"><AttendanceView /></PrivateRoute>} />
          <Route path="/teacher/promote" element={<PrivateRoute role="teacher"><PromoteStudent /></PrivateRoute>} />
          <Route path="/teacher/profile" element={<PrivateRoute role="teacher"><TeacherProfile /></PrivateRoute>} />
          
          <Route path="/student/dashboard" element={<PrivateRoute role="student"><StudentDashboard /></PrivateRoute>} />
          <Route path="/student/enroll" element={<PrivateRoute role="student"><EnrollBatch /></PrivateRoute>} />
          <Route path="/student/batches" element={<PrivateRoute role="student"><StudentBatches /></PrivateRoute>} />
          <Route path="/student/batch/:id" element={<PrivateRoute role="student"><StudentBatchDetails /></PrivateRoute>} />
          <Route path="/student/org" element={<PrivateRoute role="student"><EnrollOrganization /></PrivateRoute>} />
          <Route path="/student/notices" element={<PrivateRoute role="student"><StudentNotices /></PrivateRoute>} />
          <Route path="/student/profile" element={<PrivateRoute role="student"><StudentProfile /></PrivateRoute>} />

          <Route path="/org-admin/dashboard" element={<PrivateRoute role="org_admin"><OrgAdminDashboard /></PrivateRoute>} />
          <Route path="/org-admin/batches" element={<PrivateRoute role="org_admin"><OrgAdminMyBatches /></PrivateRoute>} />
          <Route path="/org-admin/batch/create" element={<PrivateRoute role="org_admin"><OrgAdminCreateBatch /></PrivateRoute>} />
          <Route path="/org-admin/batch/:id" element={<PrivateRoute role="org_admin"><OrgAdminBatchDetails /></PrivateRoute>} />
          <Route path="/org-admin/notices" element={<PrivateRoute role="org_admin"><OrgAdminNotices /></PrivateRoute>} />
          <Route path="/org-admin/attendance" element={<PrivateRoute role="org_admin"><OrgAdminAttendance /></PrivateRoute>} />
          <Route path="/org-admin/fees" element={<PrivateRoute role="org_admin"><OrgAdminFees /></PrivateRoute>} />
          <Route path="/org-admin/salary" element={<PrivateRoute role="org_admin"><OrgAdminSalary /></PrivateRoute>} />
          <Route path="/org-admin/profile" element={<PrivateRoute role="org_admin"><OrgAdminProfile /></PrivateRoute>} />
          <Route path="/org-admin/teachers" element={<PrivateRoute role="org_admin"><OrgAdminAddTeachers /></PrivateRoute>} />

          <Route path="/org-teacher/batches" element={<PrivateRoute role="org_teacher"><OrgTeacherBatches /></PrivateRoute>} />
          <Route path="/org-teacher/batch/:id" element={<PrivateRoute role="org_teacher"><OrgTeacherBatchDetails /></PrivateRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
