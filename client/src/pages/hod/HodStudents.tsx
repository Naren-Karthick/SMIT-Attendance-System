import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { AttendanceGauge } from '../../components/common/AttendanceGauge';
import { Drawer } from '../../components/common/Drawer';
import { Modal } from '../../components/common/Modal';
import { EmptyState } from '../../components/common/EmptyState';
import {
  GraduationCap,
  Search,
  Filter,
  Download,
  Plus,
  Edit,
  Eye,
  Power,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Calendar,
  Sparkles
} from 'lucide-react';

export const HodStudents: React.FC = () => {
  const { showToast } = useToast();

  const [students, setStudents] = useState<any[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Inspection Drawer
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [studentDetail, setStudentDetail] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Add Student Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newStudent, setNewStudent] = useState({
    register_number: '',
    full_name: '',
    batch_id: 1,
    year_level: 2,
    semester: 3,
    email: '',
    phone: ''
  });

  // Edit Student Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any | null>(null);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('smit_token');
      let url = `/api/students?page=${page}&limit=${pageSize}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (yearFilter) url += `&year_level=${yearFilter}`;
      if (statusFilter !== 'all') url += `&status_filter=${statusFilter}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students);
        setTotalStudents(data.total);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [page, search, yearFilter, statusFilter]);

  const handleOpenStudentDrawer = async (student: any) => {
    setSelectedStudent(student);
    setDetailLoading(true);
    try {
      const token = localStorage.getItem('smit_token');
      const res = await fetch(`/api/students/${student.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const detail = await res.json();
        setStudentDetail(detail);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('smit_token');
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newStudent)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add student');

      showToast(data.message, 'success');
      setAddModalOpen(false);
      fetchStudents();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    try {
      const token = localStorage.getItem('smit_token');
      const res = await fetch(`/api/students/${editingStudent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          full_name: editingStudent.full_name,
          email: editingStudent.email,
          phone: editingStudent.phone
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update student');

      showToast('Student details updated successfully.', 'success');
      setEditModalOpen(false);
      fetchStudents();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleToggleStatus = async (student: any) => {
    try {
      const token = localStorage.getItem('smit_token');
      const res = await fetch(`/api/students/${student.id}/toggle-status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update status');

      showToast(data.message, 'info');
      fetchStudents();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleExportCSV = () => {
    const headers = ['Register Number', 'Student Name', 'Year', 'Semester', 'Batch', 'Attendance %', 'Status', 'Email'];
    const rows = students.map(s => [
      `"${s.register_number}"`,
      `"${s.full_name}"`,
      s.year_level,
      s.semester,
      `"${s.batch_name}"`,
      `"${s.attendance.percentage}%"`,
      `"${s.attendance.statusText}"`,
      `"${s.email || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SMIT_IT_Students_Attendance_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Student attendance records exported as CSV', 'success');
  };

  const totalPages = Math.ceil(totalStudents / pageSize) || 1;

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0 }}>Student Academic Directory</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: 4 }}>
            Official roll of 120 students across 2nd, 3rd & 4th Year Information Technology
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={handleExportCSV} className="btn btn-outline">
            <Download size={15} />
            <span>Export CSV</span>
          </button>
          <button onClick={() => setAddModalOpen(true)} className="btn btn-primary">
            <Plus size={16} />
            <span>Enroll New Student</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div
        className="card"
        style={{
          padding: '14px 20px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12
        }}
      >
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Year Filter */}
          <select
            className="form-control form-select"
            style={{ width: 160, padding: '6px 28px 6px 10px', fontSize: '0.825rem' }}
            value={yearFilter}
            onChange={e => {
              setYearFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Batches (120)</option>
            <option value="2">2nd Year — Sem 3 (55)</option>
            <option value="3">3rd Year — Sem 5 (26)</option>
            <option value="4">4th Year — Sem 7 (39)</option>
          </select>

          {/* Status Filter */}
          <select
            className="form-control form-select"
            style={{ width: 150, padding: '6px 28px 6px 10px', fontSize: '0.825rem' }}
            value={statusFilter}
            onChange={e => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All Thresholds</option>
            <option value="safe">Safe (&gt;=85%)</option>
            <option value="warning">Warning (75-84%)</option>
            <option value="critical">Critical (&lt;75%)</option>
          </select>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', width: 260 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            className="form-control"
            style={{ paddingLeft: 30, padding: '6px 12px 6px 30px', fontSize: '0.825rem' }}
            placeholder="Search name or reg no..."
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Students Data Table */}
      <div className="card">
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>Loading student directory...</div>
        ) : students.length === 0 ? (
          <EmptyState
            title="No Students Matched"
            description="Try changing the search query or status filter."
          />
        ) : (
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 60 }}>#</th>
                  <th>Register Number</th>
                  <th>Student Name</th>
                  <th>Year & Semester</th>
                  <th>Batch</th>
                  <th>Attendance %</th>
                  <th>Compliance</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((st, idx) => (
                  <tr key={st.id} style={{ opacity: st.is_active === 0 ? 0.55 : 1 }}>
                    <td style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{(page - 1) * pageSize + idx + 1}</td>
                    <td style={{ fontWeight: 700, fontFamily: 'monospace', color: '#0f172a' }}>
                      {st.register_number}
                    </td>
                    <td style={{ fontWeight: 600 }}>{st.full_name}</td>
                    <td>
                      <span className="badge" style={{ background: '#f8fafc', color: '#334155' }}>
                        {st.year_level}nd/rd/th Year (Sem {st.semester})
                      </span>
                    </td>
                    <td style={{ fontSize: '0.825rem', color: '#64748b' }}>{st.batch_name}</td>
                    <td style={{ width: 140 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 6, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${Math.min(100, st.attendance.percentage)}%`,
                              height: '100%',
                              background: st.attendance.percentage >= 85 ? '#10b981' : (st.attendance.percentage >= 75 ? '#f59e0b' : '#ef4444')
                            }}
                          />
                        </div>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                          {st.attendance.percentage}%
                        </span>
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={st.attendance.statusText} size="sm" />
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background: st.is_active === 1 ? '#ecfdf5' : '#f1f5f9',
                          color: st.is_active === 1 ? '#047857' : '#64748b'
                        }}
                      >
                        {st.is_active === 1 ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        onClick={() => handleOpenStudentDrawer(st)}
                        className="btn btn-outline btn-sm"
                        style={{ marginRight: 6 }}
                        title="View detailed student profile"
                      >
                        <Eye size={13} />
                        <span>Profile</span>
                      </button>
                      <button
                        onClick={() => {
                          setEditingStudent(st);
                          setEditModalOpen(true);
                        }}
                        className="btn btn-outline btn-sm"
                        style={{ marginRight: 6 }}
                        title="Edit student"
                      >
                        <Edit size={13} />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(st)}
                        className="btn btn-outline btn-sm"
                        style={{ color: st.is_active === 1 ? '#dc2626' : '#059669' }}
                        title={st.is_active === 1 ? 'Deactivate' : 'Activate'}
                      >
                        <Power size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="card-footer" style={{ justifyContent: 'space-between', padding: '12px 20px' }}>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Showing {students.length} of {totalStudents} registered students
          </span>

          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="btn btn-outline btn-sm"
              >
                <ChevronLeft size={14} />
              </button>
              <span style={{ fontSize: '0.8rem', color: '#334155' }}>
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="btn btn-outline btn-sm"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Detailed Student Profile Drawer (Section 19) */}
      <Drawer
        isOpen={!!selectedStudent}
        onClose={() => {
          setSelectedStudent(null);
          setStudentDetail(null);
        }}
        title={selectedStudent?.full_name || 'Student Profile'}
        subtitle={`Reg: ${selectedStudent?.register_number}`}
        width="600px"
      >
        {detailLoading || !studentDetail ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>Loading full attendance profile...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Student Header */}
            <div style={{ padding: 16, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{studentDetail.student.full_name}</h4>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>
                  {studentDetail.student.year_level}nd/rd/th Year IT • Sem {studentDetail.student.semester} • Batch {studentDetail.student.batch_name}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>
                  Email: {studentDetail.student.user_email}
                </div>
              </div>
              <StatusBadge status={studentDetail.overall.statusText} />
            </div>

            {/* Attendance Gauge & Metrics */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '16px 0', borderBottom: '1px solid #f1f5f9' }}>
              <AttendanceGauge
                percentage={studentDetail.overall.percentage}
                statusBadge={studentDetail.overall.statusBadge}
                statusText={studentDetail.overall.statusText}
                attendedHours={studentDetail.overall.attendedHours}
                applicableTotal={studentDetail.overall.applicableTotal}
                size={140}
              />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.8rem' }}>
                <div>Present: <strong style={{ color: '#059669' }}>{studentDetail.overall.present} hrs</strong></div>
                <div>On-Duty: <strong style={{ color: '#2563eb' }}>{studentDetail.overall.od} hrs</strong></div>
                <div>Permission: <strong style={{ color: '#0891b2' }}>{studentDetail.overall.permission} hrs</strong></div>
                <div>Leave: <strong style={{ color: '#9333ea' }}>{studentDetail.overall.leave} hrs</strong></div>
                <div>Absent: <strong style={{ color: '#dc2626' }}>{studentDetail.overall.absent} hrs</strong></div>
              </div>
            </div>

            {/* Subject Breakdown Accordion */}
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>
                Subject Performance
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {studentDetail.subjects.map((sub: any) => (
                  <div key={sub.subjectId} style={{ padding: '10px 14px', borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ fontSize: '0.825rem', color: '#1e3a8a' }}>{sub.code}</strong>
                      <div style={{ fontSize: '0.785rem', color: '#475569' }}>{sub.name}</div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{sub.facultyName}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <strong style={{ fontSize: '0.95rem', color: sub.percentage >= 85 ? '#059669' : (sub.percentage >= 75 ? '#d97706' : '#dc2626') }}>
                        {sub.percentage}%
                      </strong>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                        {sub.attendedHours}/{sub.totalClassesConducted} hrs
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Attendance Timeline (Last 10 sessions) */}
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>
                Recent Class Sessions
              </div>
              <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {studentDetail.timeline.slice(0, 15).map((ses: any, i: number) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: '#fff', border: '1px solid #f1f5f9', borderRadius: 6, fontSize: '0.75rem' }}>
                    <div>
                      <strong>{ses.session_date}</strong> (P{ses.period_number}) • {ses.subject_code}
                    </div>
                    <StatusBadge status={ses.status} size="sm" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Add Student Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Enroll New Student"
        subtitle="Department of Information Technology"
      >
        <form onSubmit={handleCreateStudent}>
          <div className="form-group">
            <label className="form-label required">Register Number</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. 212625205060"
              value={newStudent.register_number}
              onChange={e => setNewStudent({ ...newStudent, register_number: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label required">Full Name</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Anandha Kumar R"
              value={newStudent.full_name}
              onChange={e => setNewStudent({ ...newStudent, full_name: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label required">Year Level</label>
              <select
                className="form-control form-select"
                value={newStudent.year_level}
                onChange={e => {
                  const y = parseInt(e.target.value, 10);
                  setNewStudent({
                    ...newStudent,
                    year_level: y,
                    batch_id: y === 2 ? 1 : (y === 3 ? 2 : 3),
                    semester: y === 2 ? 3 : (y === 3 ? 5 : 7)
                  });
                }}
              >
                <option value={2}>2nd Year (3rd Sem)</option>
                <option value={3}>3rd Year (5th Sem)</option>
                <option value={4}>4th Year (7th Sem)</option>
              </select>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Phone Number</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. 9840123456"
                value={newStudent.phone}
                onChange={e => setNewStudent({ ...newStudent, phone: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <button type="button" onClick={() => setAddModalOpen(false)} className="btn btn-outline">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Enroll Student
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Student Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Student Record"
        subtitle={editingStudent?.register_number}
      >
        {editingStudent && (
          <form onSubmit={handleUpdateStudent}>
            <div className="form-group">
              <label className="form-label required">Full Name</label>
              <input
                type="text"
                className="form-control"
                value={editingStudent.full_name}
                onChange={e => setEditingStudent({ ...editingStudent, full_name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-control"
                value={editingStudent.email || ''}
                onChange={e => setEditingStudent({ ...editingStudent, email: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="text"
                className="form-control"
                value={editingStudent.phone || ''}
                onChange={e => setEditingStudent({ ...editingStudent, phone: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button type="button" onClick={() => setEditModalOpen(false)} className="btn btn-outline">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save Changes
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
