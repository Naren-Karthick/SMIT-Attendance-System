import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { SegmentedStatusPicker } from '../../components/common/SegmentedStatusPicker';
import { StatusBadge } from '../../components/common/StatusBadge';
import confetti from 'canvas-confetti';
import {
  CheckSquare,
  Users,
  Search,
  Sparkles,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  BookOpen,
  Filter,
  Save,
  RotateCcw
} from 'lucide-react';

interface AttendanceRecordState {
  status: 'PRESENT' | 'ABSENT' | 'OD' | 'PERMISSION' | 'LEAVE';
  autoApplied: boolean;
  autoReason: string | null;
  sourceRequestId: number | null;
  sourceRequestType: string | null;
  remarks: string | null;
}

interface TakeAttendancePageProps {
  initialParams?: {
    batchId?: number;
    subjectId?: number;
    periodNumber?: number;
    date?: string;
  };
  onNavigate: (page: string) => void;
}

export const TakeAttendancePage: React.FC<TakeAttendancePageProps> = ({ initialParams, onNavigate }) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  // Class Selection Parameters
  const [batchId, setBatchId] = useState<number>(initialParams?.batchId || 1);
  const [subjectId, setSubjectId] = useState<number>(initialParams?.subjectId || 1);
  const [periodNumber, setPeriodNumber] = useState<number>(initialParams?.periodNumber || 1);
  const [sessionDate, setSessionDate] = useState<string>(
    initialParams?.date || new Date().toISOString().split('T')[0]
  );
  const [topic, setTopic] = useState<string>('Regular Lecture');

  // Metadata Lists
  const [batches, setBatches] = useState<any[]>([
    { id: 1, name: '2nd Year IT (3rd Sem) — Batch 2025-2029', year: 2 },
    { id: 2, name: '3rd Year IT (5th Sem) — Batch 2024-2028', year: 3 },
    { id: 3, name: '4th Year IT (7th Sem) — Batch 2023-2027', year: 4 }
  ]);
  const [subjects, setSubjects] = useState<any[]>([]);

  // Students & Attendance Records State
  const [students, setStudents] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<number, AttendanceRecordState>>({});

  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Duplicate Check State
  const [sessionCheck, setSessionCheck] = useState<{
    exists: boolean;
    canEdit?: boolean;
    message?: string;
    session?: any;
  } | null>(null);

  // Fetch subjects for chosen batch
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const token = localStorage.getItem('smit_token');
        const chosenBatch = batches.find(b => b.id === batchId);
        const yLevel = chosenBatch ? chosenBatch.year : 2;

        const res = await fetch(`/api/subjects?year_level=${yLevel}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setSubjects(data.subjects);
          if (data.subjects.length > 0 && !initialParams?.subjectId) {
            setSubjectId(data.subjects[0].id);
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchSubjects();
  }, [batchId]);

  // Load students & prefilled status (inspecting approved OD/Permission/Leave)
  const loadClassSession = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('smit_token');

      // 1. Check duplicate session
      const checkRes = await fetch(
        `/api/attendance/check-session?batch_id=${batchId}&subject_id=${subjectId}&date=${sessionDate}&period_number=${periodNumber}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const checkData = await checkRes.json();
      setSessionCheck(checkData);

      // If existing session exists, fetch existing records
      if (checkData.exists && checkData.session) {
        const detailRes = await fetch(`/api/attendance/session/${checkData.session.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (detailRes.ok) {
          const detailData = await detailRes.json();
          setStudents(detailData.records.map((r: any) => ({
            studentId: r.student_id,
            registerNumber: r.register_number,
            fullName: r.student_name
          })));

          const recMap: any = {};
          for (const r of detailData.records) {
            recMap[r.student_id] = {
              status: r.status,
              autoApplied: r.auto_applied === 1,
              autoReason: r.remarks,
              sourceRequestId: r.source_request_id,
              sourceRequestType: r.source_request_type,
              remarks: r.remarks
            };
          }
          setAttendanceRecords(recMap);
          if (checkData.session.topic) setTopic(checkData.session.topic);
          setLoading(false);
          return;
        }
      }

      // 2. Otherwise: fetch prefilled status inspecting approved OD/perm requests
      const prefillRes = await fetch(
        `/api/attendance/prefill-status?batch_id=${batchId}&date=${sessionDate}&period_number=${periodNumber}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (prefillRes.ok) {
        const prefillData = await prefillRes.json();
        setStudents(prefillData.students);

        const initialRecs: any = {};
        for (const st of prefillData.students) {
          initialRecs[st.studentId] = {
            // Default remaining unmarked students to PRESENT for maximum faculty speed!
            status: st.autoApplied ? st.prefilledStatus : 'PRESENT',
            autoApplied: st.autoApplied,
            autoReason: st.autoReason,
            sourceRequestId: st.sourceRequestId,
            sourceRequestType: st.sourceRequestType,
            remarks: st.autoReason || null
          };
        }
        setAttendanceRecords(initialRecs);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to initialize attendance session.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClassSession();
  }, [batchId, subjectId, periodNumber, sessionDate]);

  // Bulk Quick Mark Actions
  const handleMarkAllPresent = () => {
    const updated = { ...attendanceRecords };
    for (const st of students) {
      // Preserve auto-applied OD/Permission
      if (updated[st.studentId]?.autoApplied) continue;
      updated[st.studentId] = {
        ...updated[st.studentId],
        status: 'PRESENT'
      };
    }
    setAttendanceRecords(updated);
    showToast('All non-OD students marked Present', 'info');
  };

  const handleMarkAllAbsent = () => {
    const updated = { ...attendanceRecords };
    for (const st of students) {
      if (updated[st.studentId]?.autoApplied) continue;
      updated[st.studentId] = {
        ...updated[st.studentId],
        status: 'ABSENT'
      };
    }
    setAttendanceRecords(updated);
    showToast('All non-OD students marked Absent', 'info');
  };

  const handleStatusChange = (studentId: number, status: 'PRESENT' | 'ABSENT' | 'OD' | 'PERMISSION' | 'LEAVE') => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status
      }
    }));
  };

  // Submit attendance
  const handleSubmitAttendance = async () => {
    if (sessionCheck?.exists && sessionCheck.canEdit === false) {
      showToast('Attendance edit window elapsed. Contact HOD for corrections.', 'error');
      return;
    }

    const recordsArray = students.map(st => {
      const r = attendanceRecords[st.studentId];
      return {
        student_id: st.studentId,
        status: r?.status || 'PRESENT',
        auto_applied: r?.autoApplied ? 1 : 0,
        source_request_type: r?.sourceRequestType || null,
        source_request_id: r?.sourceRequestId || null,
        remarks: r?.remarks || null
      };
    });

    setSubmitting(true);
    try {
      const token = localStorage.getItem('smit_token');
      const res = await fetch('/api/attendance/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          batch_id: batchId,
          section_id: 1,
          subject_id: subjectId,
          session_date: sessionDate,
          period_number: periodNumber,
          topic,
          records: recordsArray
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit attendance.');
      }

      showToast(data.message || 'Attendance submitted successfully!', 'success');
      try {
        confetti({ particleCount: 50, spread: 50 });
      } catch (e) {}
      loadClassSession();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Summary counts
  let presentCount = 0;
  let absentCount = 0;
  let odCount = 0;
  let permCount = 0;
  let leaveCount = 0;

  for (const st of students) {
    const s = attendanceRecords[st.studentId]?.status || 'PRESENT';
    if (s === 'PRESENT') presentCount++;
    else if (s === 'ABSENT') absentCount++;
    else if (s === 'OD') odCount++;
    else if (s === 'PERMISSION') permCount++;
    else if (s === 'LEAVE') leaveCount++;
  }

  const filteredStudents = students.filter(s =>
    s.fullName.toLowerCase().includes(search.toLowerCase()) ||
    s.registerNumber.includes(search)
  );

  return (
    <div className="page-wrapper">
      {/* Top Banner & Selectors */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header" style={{ background: '#1e3a8a', color: '#fff' }}>
          <div>
            <h2 style={{ color: '#fff', margin: 0, fontSize: '1.25rem' }}>Take Period Attendance</h2>
            <p style={{ color: '#cbd5e1', fontSize: '0.8rem', marginTop: 2 }}>
              Fast faculty entry with automatic OD/Permission detection and duplicate protection
            </p>
          </div>
        </div>

        <div className="card-body" style={{ padding: '20px 24px', background: '#fafbfc' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
            {/* Batch Selector */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label required">Target Batch / Year</label>
              <select
                className="form-control form-select"
                value={batchId}
                onChange={e => setBatchId(parseInt(e.target.value, 10))}
              >
                {batches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            {/* Subject Selector */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label required">Subject</label>
              <select
                className="form-control form-select"
                value={subjectId}
                onChange={e => setSubjectId(parseInt(e.target.value, 10))}
              >
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label required">Session Date</label>
              <input
                type="date"
                className="form-control"
                value={sessionDate}
                onChange={e => setSessionDate(e.target.value)}
              />
            </div>

            {/* Period */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label required">Period</label>
              <select
                className="form-control form-select"
                value={periodNumber}
                onChange={e => setPeriodNumber(parseInt(e.target.value, 10))}
              >
                {[
                  { p: 1, time: '08:45–09:40' },
                  { p: 2, time: '09:40–10:35' },
                  { p: 3, time: '10:50–11:45' },
                  { p: 4, time: '11:45–12:40' },
                  { p: 5, time: '01:25–02:15' },
                  { p: 6, time: '02:15–03:05' },
                  { p: 7, time: '03:05–04:00' }
                ].map(item => (
                  <option key={item.p} value={item.p}>Period {item.p} ({item.time})</option>
                ))}
              </select>
            </div>

            {/* Topic */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Lecture Topic / Notes</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Binary Search Trees & AVL Rotations"
                value={topic}
                onChange={e => setTopic(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Duplicate Session Notice */}
        {sessionCheck?.exists && (
          <div
            style={{
              padding: '12px 24px',
              background: sessionCheck.canEdit ? '#eff6ff' : '#fef2f2',
              borderTop: `1px solid ${sessionCheck.canEdit ? '#bfdbfe' : '#fecaca'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.85rem',
              color: sessionCheck.canEdit ? '#1e40af' : '#991b1b'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={16} />
              <span>
                <strong>Attendance Already Submitted:</strong> {sessionCheck.message}
              </span>
            </div>
            {sessionCheck.canEdit && (
              <span className="badge badge-warning">Edit Mode Active</span>
            )}
          </div>
        )}
      </div>

      {/* Summary KPI Strip & Fast Batch Actions */}
      <div
        className="card"
        style={{
          padding: '14px 20px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16
        }}
      >
        {/* Real-time Counts */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ fontSize: '0.85rem' }}>
            Total: <strong style={{ color: '#0f172a' }}>{students.length}</strong>
          </div>
          <div style={{ fontSize: '0.85rem', color: '#059669' }}>
            Present: <strong>{presentCount}</strong>
          </div>
          <div style={{ fontSize: '0.85rem', color: '#2563eb' }}>
            On-Duty (OD): <strong>{odCount}</strong>
          </div>
          <div style={{ fontSize: '0.85rem', color: '#0891b2' }}>
            Permission: <strong>{permCount}</strong>
          </div>
          <div style={{ fontSize: '0.85rem', color: '#9333ea' }}>
            Leave: <strong>{leaveCount}</strong>
          </div>
          <div style={{ fontSize: '0.85rem', color: '#dc2626' }}>
            Absent: <strong>{absentCount}</strong>
          </div>
        </div>

        {/* Fast Action Buttons */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            type="button"
            onClick={handleMarkAllPresent}
            className="btn btn-outline btn-sm"
            style={{ color: '#059669', borderColor: '#86efac' }}
          >
            Mark All Present
          </button>
          <button
            type="button"
            onClick={handleMarkAllAbsent}
            className="btn btn-outline btn-sm"
            style={{ color: '#dc2626', borderColor: '#fca5a5' }}
          >
            Mark All Absent
          </button>
        </div>
      </div>

      {/* Student List Table */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header" style={{ padding: '12px 20px' }}>
          <div style={{ position: 'relative', width: 280 }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              className="form-control"
              style={{ paddingLeft: 32, padding: '6px 12px 6px 32px', fontSize: '0.825rem' }}
              placeholder="Search by name or reg no..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <button
            onClick={handleSubmitAttendance}
            disabled={submitting || (sessionCheck?.exists && sessionCheck.canEdit === false)}
            className="btn btn-primary"
            style={{ padding: '8px 20px' }}
          >
            <Save size={16} />
            <span>{submitting ? 'Submitting Records...' : (sessionCheck?.exists ? 'Update Attendance' : 'Submit Attendance')}</span>
          </button>
        </div>

        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>
            Loading students and checking approved ODs...
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="desktop-student-table table-container" style={{ border: 'none', borderRadius: 0 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: 60 }}>#</th>
                    <th style={{ width: 160 }}>Register Number</th>
                    <th>Student Name</th>
                    <th style={{ width: 220, textAlign: 'center' }}>Attendance Status Control</th>
                    <th>Request Source</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((st, idx) => {
                    const rec = attendanceRecords[st.studentId] || {
                      status: 'PRESENT',
                      autoApplied: false,
                      autoReason: null
                    };

                    return (
                      <tr
                        key={st.studentId}
                        style={{
                          background: rec.autoApplied ? '#f8faff' : (rec.status === 'ABSENT' ? '#fffdfd' : '#ffffff')
                        }}
                      >
                        <td style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{idx + 1}</td>
                        <td style={{ fontWeight: 700, fontFamily: 'monospace', color: '#0f172a' }}>
                          {st.registerNumber}
                        </td>
                        <td style={{ fontWeight: 600 }}>{st.fullName}</td>
                        <td style={{ textAlign: 'center' }}>
                          <SegmentedStatusPicker
                            currentStatus={rec.status}
                            autoApplied={rec.autoApplied}
                            autoReason={rec.autoReason}
                            onChange={newStatus => handleStatusChange(st.studentId, newStatus)}
                            disabled={sessionCheck?.exists && sessionCheck.canEdit === false}
                          />
                        </td>
                        <td style={{ fontSize: '0.785rem' }}>
                          {rec.autoApplied ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#4f46e5', fontWeight: 600 }}>
                              <Sparkles size={13} />
                              <span>{rec.autoReason}</span>
                            </div>
                          ) : (
                            <span style={{ color: '#94a3b8' }}>Standard attendance</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Touch-Friendly Student Cards View */}
            <div className="mobile-student-cards">
              {filteredStudents.map((st, idx) => {
                const rec = attendanceRecords[st.studentId] || {
                  status: 'PRESENT',
                  autoApplied: false,
                  autoReason: null
                };

                return (
                  <div
                    key={st.studentId}
                    className={`mobile-student-card ${rec.autoApplied ? 'is-auto' : ''}`}
                  >
                    <div className="mobile-student-card-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span className="mobile-student-idx">{idx + 1}</span>
                        <div>
                          <div className="mobile-student-name">{st.fullName}</div>
                          <div className="mobile-student-reg">{st.registerNumber}</div>
                        </div>
                      </div>
                      <StatusBadge status={rec.status} size="sm" />
                    </div>

                    {rec.autoApplied && (
                      <div className="mobile-auto-banner">
                        <Sparkles size={13} color="#4f46e5" />
                        <span>{rec.autoReason}</span>
                      </div>
                    )}

                    <div className="mobile-student-card-actions">
                      <SegmentedStatusPicker
                        currentStatus={rec.status}
                        autoApplied={rec.autoApplied}
                        autoReason={rec.autoReason}
                        onChange={newStatus => handleStatusChange(st.studentId, newStatus)}
                        disabled={sessionCheck?.exists && sessionCheck.canEdit === false}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <div className="card-footer" style={{ justifyContent: 'space-between', padding: '14px 20px' }}>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Showing {filteredStudents.length} of {students.length} students
          </span>

          <button
            onClick={handleSubmitAttendance}
            disabled={submitting || (sessionCheck?.exists && sessionCheck.canEdit === false)}
            className="btn btn-primary"
            style={{ padding: '8px 24px' }}
          >
            <Save size={16} />
            <span>{submitting ? 'Submitting...' : (sessionCheck?.exists ? 'Update Attendance' : 'Submit Attendance')}</span>
          </button>
        </div>
      </div>

      {/* Floating Sticky Quick-Submit Bar for Mobile Phones */}
      <div className="mobile-floating-submit-bar">
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Present: <strong style={{ color: '#059669' }}>{presentCount}</strong> / {students.length}
          </span>
          <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
            OD: {odCount} • Absent: {absentCount}
          </span>
        </div>
        <button
          onClick={handleSubmitAttendance}
          disabled={submitting || (sessionCheck?.exists && sessionCheck.canEdit === false)}
          className="btn btn-primary btn-sm"
          style={{ padding: '8px 18px', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
        >
          <Save size={15} />
          <span>{submitting ? 'Saving...' : (sessionCheck?.exists ? 'Update' : 'Submit')}</span>
        </button>
      </div>
    </div>
  );
};
