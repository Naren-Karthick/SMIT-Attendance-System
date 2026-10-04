import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AttendanceGauge } from '../../components/common/AttendanceGauge';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  Send,
  CalendarCheck,
  CheckSquare,
  CalendarDays,
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
  FileCheck,
  ArrowRight,
  Clock,
  Sparkles
} from 'lucide-react';

interface StudentDashboardProps {
  onNavigate: (page: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
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
        console.error('Failed to load student dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [user]);

  if (loading || !data) {
    return (
      <div className="page-wrapper">
        <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="text-body">Loading your academic attendance profile...</div>
        </div>
      </div>
    );
  }

  const { student, overall, subjects, recentRequests } = data;

  return (
    <div className="page-wrapper">
      {/* Student Welcome & Profile Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #1e293b 100%)',
          color: '#ffffff',
          padding: '24px 28px',
          marginBottom: '24px',
          border: 'none',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: 'rgba(255,255,255,0.15)' }}>
                {student.year_level === 2 ? '2nd' : (student.year_level === 3 ? '3rd' : '4th')} Year • Sem {student.semester}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#93c5fd' }}>Batch {student.batch_name}</span>
            </div>
            <h1 style={{ color: '#fff', fontSize: '1.6rem', fontWeight: 700, margin: 0 }}>
              {student.full_name}
            </h1>
            <div style={{ fontSize: '0.875rem', color: '#cbd5e1', marginTop: 4 }}>
              Register Number: <strong style={{ color: '#fff' }}>{student.register_number}</strong> • Dept of Information Technology
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={() => onNavigate('student-apply-od')}
              className="btn btn-primary"
              style={{ background: '#2563eb', borderColor: '#3b82f6' }}
            >
              <Send size={15} />
              <span>Apply OD</span>
            </button>
            <button
              onClick={() => onNavigate('student-apply-leave')}
              className="btn btn-outline"
              style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.08)' }}
            >
              <CalendarCheck size={15} />
              <span>Apply Leave</span>
            </button>
          </div>
        </div>
      </div>

      {/* Attendance Hero Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
        {/* Overall Attendance Gauge Card */}
        <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
            <div>
              <h3 style={{ margin: 0 }}>Overall Attendance</h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>Department Policy: 75% Minimum Mandatory</p>
            </div>
            <StatusBadge status={overall.statusText} />
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-around', gap: 16, margin: '8px 0' }}>
            <AttendanceGauge
              percentage={overall.percentage}
              statusBadge={overall.statusBadge}
              statusText={overall.statusText}
              attendedHours={overall.attendedHours}
              applicableTotal={overall.applicableTotal}
              size={150}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 150 }}>
              <div style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ color: '#059669', fontWeight: 600 }}>• Present:</span>
                <strong>{overall.present} hrs</strong>
              </div>
              <div style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ color: '#2563eb', fontWeight: 600 }}>• On-Duty (OD):</span>
                <strong>{overall.od} hrs</strong>
              </div>
              <div style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ color: '#0891b2', fontWeight: 600 }}>• Permission:</span>
                <strong>{overall.permission} hrs</strong>
              </div>
              <div style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ color: '#9333ea', fontWeight: 600 }}>• Approved Leave:</span>
                <strong>{overall.leave} hrs</strong>
              </div>
              <div style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ color: '#dc2626', fontWeight: 600 }}>• Absent:</span>
                <strong>{overall.absent} hrs</strong>
              </div>
            </div>
          </div>

          {/* Actionable Advice Alert */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 8,
              background: overall.statusBadge === 'critical' ? '#fef2f2' : (overall.statusBadge === 'warning' ? '#fffbeb' : '#f0fdf4'),
              border: `1px solid ${overall.statusBadge === 'critical' ? '#fecaca' : (overall.statusBadge === 'warning' ? '#fde68a' : '#bbf7d0')}`,
              display: 'flex',
              alignItems: 'center',
              gap: 10
            }}
          >
            {overall.statusBadge === 'critical' ? (
              <AlertTriangle size={18} color="#dc2626" />
            ) : (
              <ShieldCheck size={18} color="#166534" />
            )}
            <div style={{ fontSize: '0.8rem', color: '#1e293b' }}>
              {overall.statusBadge === 'critical' ? (
                <span>
                  <strong>Critical Alert:</strong> Attendance is below 75%. You need to attend{' '}
                  <strong>{overall.classesNeededToRecover} consecutive classes</strong> to reach the safe margin.
                </span>
              ) : overall.statusBadge === 'warning' ? (
                <span>
                  <strong>Warning Alert:</strong> You are near the minimum margin. You can miss at most{' '}
                  <strong>{overall.classesCanMiss} class(es)</strong> before dropping below 75%.
                </span>
              ) : (
                <span>
                  <strong>Safe & Compliant:</strong> Excellent attendance record. You can safely afford up to{' '}
                  <strong>{overall.classesCanMiss} classes</strong> while remaining above 75%.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick Navigation Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div
            className="card"
            style={{ padding: 18, cursor: 'pointer' }}
            onClick={() => onNavigate('student-attendance')}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 8, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                  <CheckSquare size={20} />
                </div>
                <div>
                  <h4 style={{ margin: 0 }}>Detailed Attendance Breakdown</h4>
                  <p style={{ fontSize: '0.785rem', color: '#64748b', marginTop: 2 }}>Subject timeline, dates, and period history</p>
                </div>
              </div>
              <ArrowRight size={18} color="#94a3b8" />
            </div>
          </div>

          <div
            className="card"
            style={{ padding: 18, cursor: 'pointer' }}
            onClick={() => onNavigate('student-timetable')}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 8, background: '#fdf4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9333ea' }}>
                  <CalendarDays size={20} />
                </div>
                <div>
                  <h4 style={{ margin: 0 }}>Class Weekly Timetable</h4>
                  <p style={{ fontSize: '0.785rem', color: '#64748b', marginTop: 2 }}>Daily periods 1 to 7 with subject faculty</p>
                </div>
              </div>
              <ArrowRight size={18} color="#94a3b8" />
            </div>
          </div>

          <div
            className="card"
            style={{ padding: 18, cursor: 'pointer' }}
            onClick={() => onNavigate('student-od-requests')}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 8, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
                  <FileCheck size={20} />
                </div>
                <div>
                  <h4 style={{ margin: 0 }}>Track OD Requests</h4>
                  <p style={{ fontSize: '0.785rem', color: '#64748b', marginTop: 2 }}>Symposium, hackathons, and sports approvals</p>
                </div>
              </div>
              <ArrowRight size={18} color="#94a3b8" />
            </div>
          </div>
        </div>
      </div>

      {/* Subject-Wise Attendance Overview */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div>
            <h3 style={{ margin: 0 }}>Subject-Wise Attendance</h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>Curriculum subjects for current 3rd/5th/7th Semester</p>
          </div>
          <button
            onClick={() => onNavigate('student-attendance')}
            className="btn btn-outline btn-sm"
          >
            View Full Timeline
          </button>
        </div>

        <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Faculty</th>
                <th>Attended / Total</th>
                <th>OD / Perm</th>
                <th>Attendance %</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((sub: any) => (
                <tr key={sub.subjectId}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{sub.code}</div>
                    <div style={{ fontSize: '0.785rem', color: '#64748b' }}>{sub.name}</div>
                  </td>
                  <td>{sub.facultyName}</td>
                  <td>
                    <strong>{sub.attendedHours}</strong> / {sub.totalClassesConducted} hrs
                  </td>
                  <td>
                    <span style={{ fontSize: '0.785rem', color: '#2563eb' }}>{sub.od} OD</span>
                    {sub.permission > 0 && <span style={{ fontSize: '0.785rem', color: '#0891b2', marginLeft: 6 }}>{sub.permission} Perm</span>}
                  </td>
                  <td style={{ width: 140 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 6, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${Math.min(100, sub.percentage)}%`,
                            height: '100%',
                            background: sub.percentage >= 85 ? '#10b981' : (sub.percentage >= 75 ? '#f59e0b' : '#ef4444')
                          }}
                        />
                      </div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{sub.percentage}%</span>
                    </div>
                  </td>
                  <td>
                    <StatusBadge status={sub.statusText} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Requests Timeline & Tracking */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        {/* Recent OD Requests */}
        <div className="card">
          <div className="card-header">
            <h4 style={{ margin: 0 }}>Recent OD Requests</h4>
            <button
              onClick={() => onNavigate('student-od-requests')}
              className="btn btn-outline btn-sm"
            >
              View All
            </button>
          </div>
          <div className="card-body" style={{ padding: 16 }}>
            {recentRequests.ods.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>
                No recent OD requests submitted.
              </div>
            ) : (
              recentRequests.ods.map((od: any) => (
                <div
                  key={od.id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 8,
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    marginBottom: 10
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{od.event_name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>
                        {od.od_type} • {od.from_date}
                      </div>
                    </div>
                    <StatusBadge status={od.status} size="sm" />
                  </div>
                  {od.hod_remarks && (
                    <div style={{ marginTop: 8, fontSize: '0.75rem', color: '#334155', background: '#fff', padding: '6px 8px', borderRadius: 4, border: '1px solid #e2e8f0' }}>
                      <strong>HOD Remark:</strong> {od.hod_remarks}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Leave Requests */}
        <div className="card">
          <div className="card-header">
            <h4 style={{ margin: 0 }}>Recent Leave Requests</h4>
            <button
              onClick={() => onNavigate('student-leave-requests')}
              className="btn btn-outline btn-sm"
            >
              View All
            </button>
          </div>
          <div className="card-body" style={{ padding: 16 }}>
            {recentRequests.leaves.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>
                No recent leave requests submitted.
              </div>
            ) : (
              recentRequests.leaves.map((lv: any) => (
                <div
                  key={lv.id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 8,
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    marginBottom: 10
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{lv.leave_type}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>
                        {lv.from_date} to {lv.to_date}
                      </div>
                    </div>
                    <StatusBadge status={lv.status} size="sm" />
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: 4 }}>
                    Reason: {lv.reason}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
