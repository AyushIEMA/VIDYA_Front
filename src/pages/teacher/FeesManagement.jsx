import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Modal from '../../components/Modal';
import api from '../../api/axios';
import './Dashboard.css';
import './FeesManagement.css';

const teacherMenuItems = [
  { path: '/teacher/dashboard', label: 'Dashboard' },
  { path: '/teacher/batches', label: 'My Batches' },
  { path: '/teacher/announcements', label: 'Announcements' },
  { path: '/teacher/fees', label: 'Fees Management' },
  { path: '/teacher/attendance', label: 'Attendance' },
  { path: '/teacher/promote', label: 'Promote Student' },
  { path: '/teacher/profile', label: 'Profile' }
];

const FeesManagement = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [summary, setSummary] = useState(null);
  const [filters, setFilters] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    status: ''
  });
  const studentsPerPage = 10;
  const [toast, setToast] = useState({ open: false, message: '', isError: false });

  useEffect(() => {
    fetchStudentsFees();
  }, [filters, currentPage]);

  const fetchStudentsFees = async () => {
    setLoading(true);
    try {
      const query = { page: currentPage, limit: studentsPerPage };
      if (filters.month) query.month = new Date(0, filters.month - 1).toLocaleString('en-US', { month: 'long' });
      if (filters.year) query.year = filters.year;
      if (filters.status) query.status = filters.status;

      const params = new URLSearchParams(query);
      const { data } = await api.get(`/teacher/fees/students?${params}`);
      setStudents(data.students || data);
      setTotalPages(data.pages || 1);
      setTotalStudents(data.total != null ? data.total : (data.students || data).length);
      setSummary(data.summary || null);
    } catch (error) {
      console.error('Error fetching fees:', error);
      setToast({ open: true, message: error.response?.data?.error || 'Failed to load fees', isError: true });
    } finally {
      setLoading(false);
    }
  };

  const currentStudents = Array.isArray(students) ? students : [];

  const totalAmount = summary ? summary.totalAmount : currentStudents.reduce((sum, s) => sum + s.totalAmount, 0);
  const paidAmount = summary ? summary.paidAmount : currentStudents.reduce((sum, s) => sum + s.paidAmount, 0);
  const pendingAmount = summary ? summary.pendingAmount : currentStudents.reduce((sum, s) => sum + s.pendingAmount, 0);
  const totalPaidCount = summary ? summary.paidCount : currentStudents.reduce((sum, s) => sum + s.paidCount, 0);
  const totalPendingCount = summary ? summary.pendingCount : currentStudents.reduce((sum, s) => sum + s.pendingCount, 0);
  const notPaidStudentNames = summary?.unpaidStudentNames?.length
    ? summary.unpaidStudentNames
    : currentStudents
      .filter((s) => s.pendingCount > 0)
      .map((s) => s.student?.name)
      .filter(Boolean);

  const markBatchFeePaid = async (feeId) => {
    try {
      await api.put(`/teacher/fees/${feeId}/mark-paid`);
      fetchStudentsFees();
      setToast({ open: true, message: 'Fee marked as paid!', isError: false });
    } catch (error) {
      setToast({ open: true, message: error.response?.data?.error || 'Failed to mark as paid', isError: true });
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar items={teacherMenuItems} />
      <main className="dashboard-content">
        <div className="page-header">
          <h1>Fees Management</h1>
        </div>

        <div className="fees-summary">
          <div className="summary-card">
            <div className="summary-label">Students (page)</div>
            <div className="summary-value">{totalStudents}</div>
          </div>
          <div className="summary-card paid">
            <div className="summary-label">Paid ({totalPaidCount})</div>
            <div className="summary-value">₹{paidAmount.toLocaleString()}</div>
          </div>
          <div className="summary-card pending">
            <div className="summary-label">Pending ({totalPendingCount})</div>
            <div className="summary-value">₹{pendingAmount.toLocaleString()}</div>
          </div>
        </div>

        <div className="filters-section card">
          <h3>Filter by Period</h3>
          <div className="filters-bar">
            <div className="form-group">
              <label>Month</label>
              <select value={filters.month} onChange={(e) => { setCurrentPage(1); setFilters({ ...filters, month: e.target.value }); }}>
                {[...Array(12)].map((_, i) => (
                  <option key={i} value={i + 1}>{new Date(0, i).toLocaleString('en', { month: 'long' })}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Year</label>
              <select value={filters.year} onChange={(e) => { setCurrentPage(1); setFilters({ ...filters, year: e.target.value }); }}>
                {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select value={filters.status} onChange={(e) => { setCurrentPage(1); setFilters({ ...filters, status: e.target.value }); }}>
                <option value="">All Status</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
        </div>

        {notPaidStudentNames.length > 0 && (
          <div className="unpaid-students card">
            <h3>Not Paid Students</h3>
            <p>{notPaidStudentNames.join(', ')}</p>
          </div>
        )}

        {loading ? (
          <div className="loading-spinner">Loading students...</div>
        ) : currentStudents.length === 0 ? (
          <div className="empty-state card">
            <h3>No students found</h3>
            <p>Students will appear once they enroll in your batches</p>
          </div>
        ) : (
          <>
            <div className="students-fees-list">
              {currentStudents.map(studentData => (
                <div key={studentData.student._id} className="student-fees-card card">
                  <div className="student-header">
                    <div className="student-main-info">
                      <h4>{studentData.student.name}</h4>
                      <span className="enrollment-count">
                        {studentData.batches.length} Batch{studentData.batches.length > 1 ? 'es' : ''}
                      </span>
                    </div>
                    <div className="student-join-meta">
                      <span>Joining Date: {new Date(studentData.joiningDate).toLocaleDateString()}</span>
                      {studentData.notJoinedInSelectedMonth && (
                        <span className="not-joined-note">Not joined in selected month</span>
                      )}
                    </div>
                    <div className="student-contact">
                      <span>Mobile: {studentData.student.mobile}</span>
                      <span>WhatsApp: {studentData.student.whatsapp}</span>
                    </div>
                  </div>

                  {studentData.batches.map(batch => {
                    const currentMonthFee = batch.selectedFee;
                    
                    return (
                      <div key={batch.batchId} className="batch-fee-row">
                        <div className="batch-fee-info">
                          <div className="batch-name-col">
                            <span className="batch-name-label">{batch.batchName}</span>
                            <span className="batch-class">{batch.class}</span>
                          </div>
                          <div className="fee-amounts">
                            <div className="amount-item">
                              <span className="amount-label">Original</span>
                              <span className="amount-value">₹{batch.originalFees}</span>
                            </div>
                            <div className="amount-item">
                              <span className="amount-label">Discount</span>
                              <span className="amount-value discount">- ₹{batch.discount}</span>
                            </div>
                            <div className="amount-item">
                              <span className="amount-label">Final</span>
                              <span className="amount-value final">₹{batch.finalAmount}</span>
                            </div>
                          </div>
                        </div>
                        <div className="batch-fee-actions">
                          {currentMonthFee ? (
                            <>
                              <span className={`status-badge ${currentMonthFee.status}`}>
                                {currentMonthFee.status}
                              </span>
                              {currentMonthFee.status === 'pending' && (
                                <>
                                  <button 
                                    className="btn btn-primary btn-sm" 
                                    onClick={() => markBatchFeePaid(currentMonthFee._id)}
                                  >
                                    Mark Paid
                                  </button>
                                </>
                              )}
                              {currentMonthFee.status === 'paid' && currentMonthFee.paidAt && (
                                <span className="paid-date">
                                  Paid: {new Date(currentMonthFee.paidAt).toLocaleDateString()}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="no-fee-record">No fee record for this month</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <span>Page {currentPage} of {totalPages} ({totalStudents} students)</span>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <Modal open={toast.open} onClose={() => setToast((t) => ({ ...t, open: false }))} title={toast.isError ? 'Error' : 'Done'}>
        <p>{toast.message}</p>
        <button type="button" className="btn btn-primary btn-full" onClick={() => setToast((t) => ({ ...t, open: false }))}>OK</button>
      </Modal>
    </div>
  );
};

export default FeesManagement;
