import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  Users,
  GraduationCap,
  CalendarCheck,
  FileCheck,
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  Clock,
  Sparkles,
  BookOpen,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface HodDashboardProps {
  onNavigate: (page: string, params?: any) => void;
}

export const HodDashboard: React.FC<HodDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [kpis, setKpis] = useState<any>(null);
  const [yearData, setYearData] = useState<any[]>([]);
  const [pendingOds, setPendingOds] = useState<any[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHodData = async () => {
      try {
        const token = localStorage.getItem('smit_token');
        const [kpiRes, yearRes, odRes, leaveRes] = await Promise.all([
          fetch('/api/analytics/kpis', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/analytics/year-comparison', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/od/all?status=PENDING&limit=5', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/leave/all?status=PENDING&limit=5', { headers: { Authorization: `Bearer ${token}` } })
        ]);

        if (kpiRes.ok) setKpis(await kpiRes.json());
        if (yearRes.ok) {
          const yd = await yearRes.json();
          setYearData(yd.comparison);
        }
        if (odRes.ok) {
          const odd = await odRes.json();
          setPendingOds(odd.requests);
        }
        if (leaveRes.ok) {
          const lvd = await leaveRes.json();
          setPendingLeaves(lvd.requests);
        }
      } catch (err) {
        console.error('Failed to load HOD dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHodData();
  }, []);

  if (loading || !kpis) {
    return (
      <div className="page-wrapper">
        <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>
          Initializing Department Control Center...
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      {/* HOD Header Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
          color: '#ffffff',
          padding: '24px 28px',
          marginBottom: '24px',
          border: 'none'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: 'rgba(255,255,255,0.15)' }}>
                Department Control Center
              </span>
              <span style={{ fontSize: '0.75rem', color: '#93c5fd' }}>AY 2026–2027 (Odd Semester)</span>
            </div>
            <h1 style={{ color: '#fff', fontSize: '1.65rem', fontWeight: 800, margin: 0 }}>
              {user?.fullName || 'Dr. S. Anitha'}
            </h1>
            <div style={{ fontSize: '0.875rem', color: '#cbd5e1', marginTop: 4 }}>
              Head of Department • Department of Information Technology • Sri Muthukumaran Institute of Technology
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={() => onNavigate('hod-od-approvals')}
              className="btn btn-primary"
              style={{ background: '#2563eb' }}
            >
              <FileCheck size={16} />
              <span>Pending Approvals ({kpis.pendingODs + kpis.pendingLeaves})</span>
            </button>
            <button
              onClick={() => onNavigate('hod-attendance')}
              className="btn btn-outline"
              style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.08)' }}
            >
              <CheckCircle2 size={16} />
              <span>Attendance Hub</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top KPI Metric Cards (Section 17) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
        <div
          className="stat-card primary"
          style={{ cursor: 'pointer' }}
          onClick={() => onNavigate('hod-students')}
        >
          <div className="stat-label">TOTAL STUDENTS</div>
          <div className="stat-value">{kpis.totalStudents}</div>
          <div className="stat-subtext">2nd, 3rd & 4th Year IT</div>
        </div>

        <div
          className="stat-card info"
          style={{ cursor: 'pointer' }}
          onClick={() => onNavigate('hod-faculty')}
        >
          <div className="stat-label">FACULTY MEMBERS</div>
          <div className="stat-value">{kpis.totalFaculty}</div>
          <div className="stat-subtext">Teaching & Lab Faculty</div>
        </div>

        <div className="stat-card primary">
          <div className="stat-label">TODAY'S CLASSES</div>
          <div className="stat-value">{kpis.todayClasses}</div>
          <div className="stat-subtext">{kpis.completedClassesToday} completed ({kpis.attendanceCompletionRate}%)</div>
        </div>

        <div
          className="stat-card warning"
          style={{ cursor: 'pointer' }}
          onClick={() => onNavigate('hod-od-approvals')}
        >
          <div className="stat-label">PENDING ODs</div>
          <div className="stat-value" style={{ color: '#d97706' }}>{kpis.pendingODs}</div>
          <div className="stat-subtext">Awaiting HOD review</div>
        </div>

        <div
          className="stat-card warning"
          style={{ cursor: 'pointer' }}
          onClick={() => onNavigate('hod-leave-approvals')}
        >
          <div className="stat-label">PENDING LEAVES</div>
          <div className="stat-value" style={{ color: '#d97706' }}>{kpis.pendingLeaves}</div>
          <div className="stat-subtext">Medical & casual requests</div>
        </div>

        <div
          className="stat-card critical"
          style={{ cursor: 'pointer' }}
          onClick={() => onNavigate('hod-analytics')}
        >
          <div className="stat-label">BELOW 75% AT-RISK</div>
          <div className="stat-value" style={{ color: '#dc2626' }}>{kpis.criticalCount}</div>
          <div className="stat-subtext">Requires immediate intervention</div>
        </div>
      </div>

      {/* Year-Wise Attendance Overview & Risk Distribution (Section 17) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20, marginBottom: 24 }}>
        {/* Year Comparison Card */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 style={{ margin: 0 }}>Year-Wise Attendance Breakdown</h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>
                Current academic performance across batches
              </p>
            </div>
            <button onClick={() => onNavigate('hod-analytics')} className="btn btn-outline btn-sm">
              Deep Analytics
            </button>
          </div>

          <div className="card-body" style={{ padding: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {yearData.map((y: any) => (
                <div key={y.year} style={{ padding: 14, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div>
                      <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>{y.label}</strong>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: 8 }}>
                        ({y.studentCount} enrolled students)
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: '1.05rem',
                        fontWeight: 800,
                        color: y.averageAttendance >= 85 ? '#059669' : (y.averageAttendance >= 75 ? '#d97706' : '#dc2626')
                      }}
                    >
                      {y.averageAttendance}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div style={{ height: 8, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden', marginBottom: 10 }}>
                    <div
                      style={{
                        width: `${Math.min(100, y.averageAttendance)}%`,
                        height: '100%',
                        background: y.averageAttendance >= 85 ? '#10b981' : (y.averageAttendance >= 75 ? '#f59e0b' : '#ef4444')
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b' }}>
                    <span style={{ color: '#059669' }}>• Safe (&gt;=85%): <strong>{y.safeCount}</strong></span>
                    <span style={{ color: '#d97706' }}>• Warning (75-84%): <strong>{y.warningCount}</strong></span>
                    <span style={{ color: '#dc2626' }}>• Critical (&lt;75%): <strong>{y.criticalCount}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Department Health & Risk Distribution */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 style={{ margin: 0 }}>Attendance Risk Profile</h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>
                Threshold distribution across all 120 students
              </p>
            </div>
            <StatusBadge status={kpis.criticalCount > 0 ? 'WARNING' : 'SAFE'} />
          </div>

          <div className="card-body" style={{ padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, textAlign: 'center' }}>
              <div style={{ padding: 14, background: '#f0fdf4', borderRadius: 10, border: '1px solid #bbf7d0' }}>
                <ShieldCheck size={24} color="#059669" style={{ margin: '0 auto 6px' }} />
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#166534' }}>{kpis.safeCount}</div>
                <div style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 600 }}>Safe (&gt;=85%)</div>
              </div>

              <div style={{ padding: 14, background: '#fffbeb', borderRadius: 10, border: '1px solid #fde68a' }}>
                <AlertTriangle size={24} color="#d97706" style={{ margin: '0 auto 6px' }} />
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#92400e' }}>{kpis.warningCount}</div>
                <div style={{ fontSize: '0.75rem', color: '#92400e', fontWeight: 600 }}>Warning (75-84%)</div>
              </div>

              <div style={{ padding: 14, background: '#fef2f2', borderRadius: 10, border: '1px solid #fecaca' }}>
                <AlertCircle size={24} color="#dc2626" style={{ margin: '0 auto 6px' }} />
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#991b1b' }}>{kpis.criticalCount}</div>
                <div style={{ fontSize: '0.75rem', color: '#991b1b', fontWeight: 600 }}>Critical (&lt;75%)</div>
              </div>
            </div>

            <div style={{ marginTop: 20, padding: 14, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.825rem', color: '#475569' }}>
              Anna University R2021 Regulation strictly requires a minimum of 75.0% attendance to be eligible for end-semester examinations. Currently, {kpis.criticalCount} student(s) require intervention or mentor counseling.
            </div>
          </div>
        </div>
      </div>

      {/* Pending Approvals Center Preview (OD & Leave) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
        {/* Pending OD Requests */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 style={{ margin: 0 }}>Pending OD Requests</h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>
                Symposium, hackathon, and sports requests requiring verification
              </p>
            </div>
            <button onClick={() => onNavigate('hod-od-approvals')} className="btn btn-outline btn-sm">
              Review Queue ({pendingOds.length})
            </button>
          </div>

          <div className="card-body" style={{ padding: 16 }}>
            {pendingOds.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                ✓ No pending OD requests. All student submissions are cleared.
              </div>
            ) : (
              pendingOds.map(od => (
                <div
                  key={od.id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 8,
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    marginBottom: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f172a' }}>
                      {od.student_name}
                      <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#64748b', marginLeft: 6 }}>
                        ({od.register_number})
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#1e3a8a', fontWeight: 600, marginTop: 2 }}>
                      {od.event_name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>
                      {od.od_type} • {od.from_date}
                    </div>
                  </div>

                  <button
                    onClick={() => onNavigate('hod-od-approvals')}
                    className="btn btn-primary btn-sm"
                  >
                    <span>Inspect</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pending Leave Requests */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 style={{ margin: 0 }}>Pending Leave Applications</h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>
                Medical and emergency absences requiring authorization
              </p>
            </div>
            <button onClick={() => onNavigate('hod-leave-approvals')} className="btn btn-outline btn-sm">
              Review Queue ({pendingLeaves.length})
            </button>
          </div>

          <div className="card-body" style={{ padding: 16 }}>
            {pendingLeaves.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                ✓ No pending leave requests. Queue is fully processed.
              </div>
            ) : (
              pendingLeaves.map(lv => (
                <div
                  key={lv.id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 8,
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    marginBottom: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f172a' }}>
                      {lv.student_name}
                      <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#64748b', marginLeft: 6 }}>
                        ({lv.register_number})
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#9333ea', fontWeight: 600, marginTop: 2 }}>
                      {lv.leave_type}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>
                      {lv.from_date} to {lv.to_date}
                    </div>
                  </div>

                  <button
                    onClick={() => onNavigate('hod-leave-approvals')}
                    className="btn btn-primary btn-sm"
                  >
                    <span>Inspect</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
