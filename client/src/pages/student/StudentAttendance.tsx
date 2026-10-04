import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AttendanceGauge } from '../../components/common/AttendanceGauge';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EmptyState } from '../../components/common/EmptyState';
import { Filter, Calendar, BookOpen, Clock, ChevronDown, ChevronUp, Sparkles, CheckCircle2 } from 'lucide-react';

export const StudentAttendance: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    const fetchAttendance = async () => {
      if (!user?.studentId) return;
      try {
        const token = localStorage.getItem('smit_token');
        const res = await fetch(`/api/students/${user.studentId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const result = await res.json();
          setData(result);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, [user]);

  if (loading || !data) {
    return (
      <div className="page-wrapper">
        <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="text-body">Loading comprehensive attendance ledger...</div>
        </div>
      </div>
    );
  }

  const { overall, subjects, timeline } = data;

  // Filter timeline records
  const filteredTimeline = timeline.filter((item: any) => {
    if (selectedSubject && item.subject_id !== selectedSubject && !item.subject_code?.includes(subjects.find((s: any) => s.subjectId === selectedSubject)?.code)) {
      return false;
    }
    if (dateFilter && item.session_date !== dateFilter) {
      return false;
    }
    if (statusFilter !== 'ALL' && item.status !== statusFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className="page-wrapper">
      {/* Page Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>My Attendance Ledger</h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: 4 }}>
          Comprehensive record of conducted lecture hours, approved ODs, permissions, and attendance status
        </p>
      </div>

      {/* Aggregate KPI Summary Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
        <div className="card" style={{ padding: 16, borderLeft: '4px solid #1e3a8a' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>OVERALL ATTENDANCE</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>
            {overall.percentage}%
          </div>
          <StatusBadge status={overall.statusText} size="sm" />
        </div>

        <div className="card" style={{ padding: 16, borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>PRESENT HOURS</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#059669', margin: '4px 0' }}>
            {overall.present}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Regular class lectures</div>
        </div>

        <div className="card" style={{ padding: 16, borderLeft: '4px solid #2563eb' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>APPROVED ON-DUTY (OD)</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#2563eb', margin: '4px 0' }}>
            {overall.od}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Counts toward attendance</div>
        </div>

        <div className="card" style={{ padding: 16, borderLeft: '4px solid #0891b2' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>PERMISSIONS</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0891b2', margin: '4px 0' }}>
            {overall.permission}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Approved period permissions</div>
        </div>

        <div className="card" style={{ padding: 16, borderLeft: '4px solid #9333ea' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>APPROVED LEAVE</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#9333ea', margin: '4px 0' }}>
            {overall.leave}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Excluded from total</div>
        </div>

        <div className="card" style={{ padding: 16, borderLeft: '4px solid #ef4444' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>ABSENT HOURS</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#dc2626', margin: '4px 0' }}>
            {overall.absent}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Missed class hours</div>
        </div>
      </div>

      {/* Subject-Wise Cards Grid */}
      <h3 style={{ marginBottom: 12 }}>Subject Breakdown</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16, marginBottom: 28 }}>
        {subjects.map((sub: any) => {
          const isSelected = selectedSubject === sub.subjectId;
          return (
            <div
              key={sub.subjectId}
              className="card"
              onClick={() => setSelectedSubject(isSelected ? null : sub.subjectId)}
              style={{
                cursor: 'pointer',
                borderColor: isSelected ? '#2563eb' : '#e2e8f0',
                boxShadow: isSelected ? '0 0 0 2px rgba(37, 99, 235, 0.2)' : 'none'
              }}
            >
              <div className="card-header" style={{ padding: '12px 16px', background: isSelected ? '#eff6ff' : '#fff' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563eb' }}>{sub.code}</span>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{sub.name}</div>
                </div>
                <StatusBadge status={sub.statusText} size="sm" />
              </div>

              <div className="card-body" style={{ padding: '14px 16px' }}>
                <div style={{ fontSize: '0.785rem', color: '#64748b', marginBottom: 12 }}>
                  Faculty: <strong style={{ color: '#0f172a' }}>{sub.facultyName}</strong> • {sub.credits} Credits ({sub.type.toUpperCase()})
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Attendance Progress</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: sub.percentage >= 85 ? '#059669' : (sub.percentage >= 75 ? '#d97706' : '#dc2626') }}>
                    {sub.percentage}%
                  </span>
                </div>

                <div style={{ height: 7, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden', marginBottom: 14 }}>
                  <div
                    style={{
                      width: `${Math.min(100, sub.percentage)}%`,
                      height: '100%',
                      background: sub.percentage >= 85 ? '#10b981' : (sub.percentage >= 75 ? '#f59e0b' : '#ef4444')
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', textAlign: 'center', background: '#f8fafc', padding: 8, borderRadius: 6, fontSize: '0.75rem' }}>
                  <div>
                    <div style={{ color: '#059669', fontWeight: 700 }}>{sub.present}</div>
                    <div style={{ color: '#64748b', fontSize: '0.7rem' }}>Pres</div>
                  </div>
                  <div>
                    <div style={{ color: '#2563eb', fontWeight: 700 }}>{sub.od}</div>
                    <div style={{ color: '#64748b', fontSize: '0.7rem' }}>OD</div>
                  </div>
                  <div>
                    <div style={{ color: '#0891b2', fontWeight: 700 }}>{sub.permission}</div>
                    <div style={{ color: '#64748b', fontSize: '0.7rem' }}>Perm</div>
                  </div>
                  <div>
                    <div style={{ color: '#9333ea', fontWeight: 700 }}>{sub.leave}</div>
                    <div style={{ color: '#64748b', fontSize: '0.7rem' }}>Leave</div>
                  </div>
                  <div>
                    <div style={{ color: '#dc2626', fontWeight: 700 }}>{sub.absent}</div>
                    <div style={{ color: '#64748b', fontSize: '0.7rem' }}>Abs</div>
                  </div>
                </div>

                <div style={{ textAlign: 'center', marginTop: 10, fontSize: '0.725rem', color: '#2563eb', fontWeight: 600 }}>
                  {isSelected ? 'Click to deselect filter ▲' : 'Click to filter timeline records ▼'}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Date & Period Timeline */}
      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 style={{ margin: 0 }}>
              Session-Wise Attendance Log {selectedSubject && `(Filtered)`}
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>
              Showing {filteredTimeline.length} verified lecture sessions
            </p>
          </div>

          {/* Timeline Filters */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calendar size={15} color="#64748b" />
              <input
                type="date"
                className="form-control"
                style={{ padding: '6px 10px', fontSize: '0.8rem', width: 140 }}
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
              />
            </div>

            <select
              className="form-control form-select"
              style={{ padding: '6px 28px 6px 10px', fontSize: '0.8rem', width: 130 }}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="PRESENT">Present</option>
              <option value="ABSENT">Absent</option>
              <option value="OD">On-Duty</option>
              <option value="PERMISSION">Permission</option>
              <option value="LEAVE">Leave</option>
            </select>

            {(dateFilter || statusFilter !== 'ALL' || selectedSubject) && (
              <button
                className="btn btn-outline btn-sm"
                onClick={() => {
                  setDateFilter('');
                  setStatusFilter('ALL');
                  setSelectedSubject(null);
                }}
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {filteredTimeline.length === 0 ? (
          <EmptyState
            title="No attendance sessions matched"
            description="Try changing the date filter or status filter to see sessions."
          />
        ) : (
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Period</th>
                  <th>Subject Code & Name</th>
                  <th>Faculty</th>
                  <th>Topic / Hall</th>
                  <th>Status</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {filteredTimeline.map((item: any, idx: number) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap' }}>
                      {item.session_date}
                    </td>
                    <td>
                      <span className="badge" style={{ background: '#f1f5f9', color: '#334155' }}>
                        Period {item.period_number}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: '#2563eb' }}>{item.subject_code}</strong>
                      <div style={{ fontSize: '0.785rem', color: '#64748b' }}>{item.subject_name}</div>
                    </td>
                    <td>{item.faculty_name}</td>
                    <td>
                      <div style={{ fontSize: '0.8rem' }}>{item.topic || 'Regular Lecture'}</div>
                      <div style={{ fontSize: '0.725rem', color: '#94a3b8' }}>{item.room || 'Room-302'}</div>
                    </td>
                    <td>
                      <StatusBadge status={item.status} size="sm" />
                    </td>
                    <td style={{ fontSize: '0.785rem', color: '#64748b' }}>
                      {item.auto_applied === 1 ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#4f46e5' }}>
                          <Sparkles size={11} />
                          <span>{item.remarks || 'Auto-applied from approved request'}</span>
                        </span>
                      ) : (
                        item.remarks || '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
