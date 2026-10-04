import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { Drawer } from '../../components/common/Drawer';
import { EmptyState } from '../../components/common/EmptyState';
import {
  CheckSquare,
  Search,
  Filter,
  Calendar,
  History,
  AlertTriangle,
  Edit,
  Eye,
  CheckCircle2,
  ShieldAlert
} from 'lucide-react';

interface HodAttendanceHubProps {
  onNavigate: (page: string, params?: any) => void;
}

export const HodAttendanceHub: React.FC<HodAttendanceHubProps> = ({ onNavigate }) => {
  const { showToast } = useToast();

  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('');
  const [batchFilter, setBatchFilter] = useState('');

  // Selected Session for viewing student records
  const [selectedSession, setSelectedSession] = useState<any | null>(null);
  const [sessionRecords, setSessionRecords] = useState<any[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);

  // Correction Modal State (Section 30)
  const [correctionModal, setCorrectionModal] = useState<{
    isOpen: boolean;
    session: any;
    student: any;
    currentStatus: string;
    newStatus: string;
    reason: string;
  }>({
    isOpen: false,
    session: null,
    student: null,
    currentStatus: 'ABSENT',
    newStatus: 'PRESENT',
    reason: ''
  });
  const [correcting, setCorrecting] = useState(false);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('smit_token');
      let url = '/api/attendance/sessions?limit=50';
      if (dateFilter) url += `&date=${dateFilter}`;
      if (batchFilter) url += `&batch_id=${batchFilter}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [dateFilter, batchFilter]);

  const handleOpenSessionDrawer = async (session: any) => {
    setSelectedSession(session);
    setRecordsLoading(true);
    try {
      const token = localStorage.getItem('smit_token');
      const res = await fetch(`/api/attendance/session/${session.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSessionRecords(data.records);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRecordsLoading(false);
    }
  };

  const handleOpenCorrection = (studentRec: any) => {
    setCorrectionModal({
      isOpen: true,
      session: selectedSession,
      student: studentRec,
      currentStatus: studentRec.status,
      newStatus: studentRec.status === 'ABSENT' ? 'PRESENT' : 'ABSENT',
      reason: ''
    });
  };

  const handleSubmitCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    const { session, student, newStatus, reason } = correctionModal;

    if (!reason.trim()) {
      showToast('Mandatory reason required for official attendance correction.', 'error');
      return;
    }

    setCorrecting(true);
    try {
      const token = localStorage.getItem('smit_token');
      const res = await fetch('/api/attendance/correct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          session_id: session.id,
          student_id: student.student_id,
          new_status: newStatus,
          reason: reason.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to correct attendance.');

      showToast(data.message || 'Attendance corrected and audited.', 'success');
      setCorrectionModal({ isOpen: false, session: null, student: null, currentStatus: '', newStatus: '', reason: '' });

      // Refresh records in drawer
      handleOpenSessionDrawer(session);
      fetchSessions();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setCorrecting(false);
    }
  };

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0 }}>Attendance Control & Correction Hub</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: 4 }}>
            Departmental overview of lecture sessions with authorized audit-tracked corrections
          </p>
        </div>

        <button
          onClick={() => onNavigate('take-attendance')}
          className="btn btn-primary"
        >
          <CheckSquare size={16} />
          <span>Launch Period Attendance</span>
        </button>
      </div>

      {/* Filter Strip */}
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
          <select
            className="form-control form-select"
            style={{ width: 170, padding: '6px 28px 6px 10px', fontSize: '0.825rem' }}
            value={batchFilter}
            onChange={e => setBatchFilter(e.target.value)}
          >
            <option value="">All Years</option>
            <option value="1">2nd Year (3rd Sem)</option>
            <option value="2">3rd Year (5th Sem)</option>
            <option value="3">4th Year (7th Sem)</option>
          </select>

          <input
            type="date"
            className="form-control"
            style={{ width: 150, padding: '6px 10px', fontSize: '0.825rem' }}
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
          />

          {(dateFilter || batchFilter) && (
            <button
              onClick={() => {
                setDateFilter('');
                setBatchFilter('');
              }}
              className="btn btn-outline btn-sm"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Sessions Table */}
      <div className="card">
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>Loading departmental sessions...</div>
        ) : sessions.length === 0 ? (
          <EmptyState
            title="No Attendance Sessions Found"
            description="No sessions match the selected date or batch filters."
          />
        ) : (
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Date & Period</th>
                  <th>Class / Batch</th>
                  <th>Subject</th>
                  <th>Faculty In-Charge</th>
                  <th>Present / Total</th>
                  <th>OD / Perm</th>
                  <th>Absents</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map(ses => (
                  <tr key={ses.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{ses.session_date}</div>
                      <span className="badge" style={{ background: '#f1f5f9', color: '#334155' }}>
                        Period {ses.period_number}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{ses.batch_name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {ses.year_level}nd/rd/th Year (Sem {ses.semester})
                      </div>
                    </td>
                    <td>
                      <strong style={{ color: '#1e3a8a' }}>{ses.subject_code}</strong>
                      <div style={{ fontSize: '0.785rem', color: '#64748b' }}>{ses.subject_name}</div>
                    </td>
                    <td>{ses.faculty_name}</td>
                    <td>
                      <strong style={{ color: '#059669' }}>{ses.present_count}</strong> / {ses.total_students}
                    </td>
                    <td>
                      <span style={{ fontSize: '0.785rem', color: '#2563eb' }}>{ses.od_count} OD</span>
                      {ses.permission_count > 0 && <span style={{ fontSize: '0.785rem', color: '#0891b2', marginLeft: 6 }}>{ses.permission_count} Perm</span>}
                    </td>
                    <td>
                      <strong style={{ color: ses.absent_count > 0 ? '#dc2626' : '#64748b' }}>
                        {ses.absent_count}
                      </strong>
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        onClick={() => handleOpenSessionDrawer(ses)}
                        className="btn btn-outline btn-sm"
                        style={{ marginRight: 6 }}
                      >
                        <Eye size={13} />
                        <span>Inspect / Correct</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Session Records Drawer */}
      <Drawer
        isOpen={!!selectedSession}
        onClose={() => {
          setSelectedSession(null);
          setSessionRecords([]);
        }}
        title={`Session: ${selectedSession?.session_date} (Period ${selectedSession?.period_number})`}
        subtitle={`${selectedSession?.subject_code} - ${selectedSession?.subject_name}`}
        width="650px"
      >
        {recordsLoading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>Loading student records...</div>
        ) : (
          <div>
            <div style={{ padding: 14, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 16 }}>
              <div style={{ fontSize: '0.825rem', color: '#475569' }}>
                Class: <strong>{selectedSession?.batch_name}</strong> • Faculty: <strong>{selectedSession?.faculty_name}</strong> • Room: <strong>{selectedSession?.room || '302'}</strong>
              </div>
              <div style={{ fontSize: '0.785rem', color: '#64748b', marginTop: 4 }}>
                Topic: {selectedSession?.topic || 'Regular lecture'}
              </div>
            </div>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Register No</th>
                    <th>Student Name</th>
                    <th>Status</th>
                    <th>Correction</th>
                  </tr>
                </thead>
                <tbody>
                  {sessionRecords.map((r: any) => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 700, fontFamily: 'monospace' }}>{r.register_number}</td>
                      <td style={{ fontWeight: 600 }}>{r.student_name}</td>
                      <td>
                        <StatusBadge status={r.status} size="sm" />
                        {r.auto_applied === 1 && (
                          <div style={{ fontSize: '0.6875rem', color: '#4f46e5', marginTop: 2 }}>Auto-applied</div>
                        )}
                      </td>
                      <td>
                        <button
                          onClick={() => handleOpenCorrection(r)}
                          className="btn btn-outline btn-sm"
                          style={{ padding: '3px 8px', fontSize: '0.725rem' }}
                        >
                          <Edit size={12} />
                          <span>Correct</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Drawer>

      {/* Attendance Correction Modal with Mandatory Reason (Section 30) */}
      <Modal
        isOpen={correctionModal.isOpen}
        onClose={() => setCorrectionModal({ ...correctionModal, isOpen: false })}
        title="Official Attendance Correction"
        subtitle={`${correctionModal.student?.student_name} (${correctionModal.student?.register_number})`}
      >
        <form onSubmit={handleSubmitCorrection}>
          <div style={{ padding: 12, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, marginBottom: 16, fontSize: '0.8rem', color: '#92400e', display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={18} color="#d97706" />
            <span>
              Every manual attendance correction is permanently recorded in the institutional immutable audit log.
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>CURRENT STATUS</div>
              <div style={{ marginTop: 4 }}>
                <StatusBadge status={correctionModal.currentStatus} />
              </div>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label required">New Corrected Status</label>
              <select
                className="form-control form-select"
                value={correctionModal.newStatus}
                onChange={e => setCorrectionModal({ ...correctionModal, newStatus: e.target.value })}
              >
                <option value="PRESENT">Present</option>
                <option value="ABSENT">Absent</option>
                <option value="OD">On-Duty (OD)</option>
                <option value="PERMISSION">Permission</option>
                <option value="LEAVE">Leave</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label required">Official Reason / Justification</label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="e.g. Student represented college at sports meet; letter submitted subsequently."
              value={correctionModal.reason}
              onChange={e => setCorrectionModal({ ...correctionModal, reason: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <button
              type="button"
              onClick={() => setCorrectionModal({ ...correctionModal, isOpen: false })}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={correcting}
              className="btn btn-primary"
            >
              {correcting ? 'Saving & Auditing...' : 'Confirm & Log Correction'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
